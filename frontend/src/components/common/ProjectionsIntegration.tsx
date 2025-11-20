import { useState, useRef, useMemo } from 'react';
import {
  Paper,
  Stack,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useProjectionsStore } from '../../store/useProjectionsStore';
import { useToastStore } from '../../store/useToastStore';
import {
  importProjectionsFromCSV,
  importProjectionsFromExcel,
  autoPopulateInflowFromProjections,
  getSavingsProgress,
} from '../../utils/projectionsIntegration';

const formatMonth = (monthId: string): string => {
  const [year, month] = monthId.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const formatCurrency = (value: number | null): string => {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function ProjectionsIntegration() {
  const { projections, clearAll, importProjections } = useProjectionsStore();
  const { showSuccess, showError } = useToastStore();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedProjections = useMemo(() => {
    return [...projections].sort((a, b) => a.monthId.localeCompare(b.monthId));
  }, [projections]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      let importResult;

      if (file.name.endsWith('.csv')) {
        importResult = await importProjectionsFromCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        importResult = await importProjectionsFromExcel(file);
      } else {
        showError('Unsupported file format. Please use CSV or Excel (.xlsx, .xls)');
        setIsImporting(false);
        return;
      }

      const { projections: importedProjections, validation } = importResult;

      // Show validation warnings/errors
      if (validation.errors.length > 0) {
        showError(`Import failed: ${validation.errors.slice(0, 3).join('; ')}${validation.errors.length > 3 ? '...' : ''}`);
        setIsImporting(false);
        return;
      }

      if (validation.warnings.length > 0) {
        const warningMessage = validation.warnings.slice(0, 5).join('; ');
        showError(`Import warnings: ${warningMessage}${validation.warnings.length > 5 ? '...' : ''}`);
      }

      if (validation.duplicateMonths.length > 0) {
        showError(`Duplicate months found: ${validation.duplicateMonths.join(', ')}. Last value will be used.`);
      }

      if (importedProjections.length === 0) {
        showError('No valid projections found in file');
        setIsImporting(false);
        return;
      }

      // Convert to MonthProjection format
      const projectionsToImport = importedProjections.map((p) => ({
        monthId: p.month,
        inflowTotal: p.inflowTotal,
        savingsTarget: p.savingsTarget,
      }));

      importProjections(projectionsToImport);
      showSuccess(`Imported ${importedProjections.length} projection(s)${validation.duplicateMonths.length > 0 ? ' (duplicates resolved)' : ''}`);
      setImportDialogOpen(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      showError(error instanceof Error ? error.message : 'Failed to import projections');
    } finally {
      setIsImporting(false);
    }
  };

  const handleAutoPopulate = (monthId: string) => {
    try {
      autoPopulateInflowFromProjections(monthId);
    } catch (error) {
      console.error('Auto-populate error:', error);
      showError('Failed to auto-populate inflow');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all projections? This cannot be undone.')) {
      clearAll();
      showSuccess('All projections cleared');
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <TrendingUpIcon color="action" />
            <Typography variant="subtitle2" fontWeight="bold">
              Projections Integration
            </Typography>
            <Chip label={`${projections.length} months`} size="small" variant="outlined" />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadIcon />}
              onClick={() => setImportDialogOpen(true)}
            >
              Import
            </Button>
            {projections.length > 0 && (
              <Tooltip title="Clear all projections">
                <IconButton
                  size="small"
                  onClick={handleClearAll}
                  aria-label="Clear all projections"
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        <Alert severity="info">
          <Typography variant="caption">
            Import projections from CSV or Excel files. Expected format: Month (YYYY-MM), Inflow Total, Savings Target (optional).
            Use "Auto-Populate" to create income transactions from projected inflow totals.
          </Typography>
        </Alert>

        {projections.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TrendingUpIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No projections imported
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Import a CSV or Excel file to get started
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Projected Inflow</TableCell>
                  <TableCell align="right">Savings Target</TableCell>
                  <TableCell align="right">Savings Progress</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedProjections.map((projection) => {
                  const progress = getSavingsProgress(projection.monthId);
                  return (
                    <TableRow key={projection.monthId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatMonth(projection.monthId)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(projection.inflowTotal)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(projection.savingsTarget)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {progress.target !== null ? (
                          <Box sx={{ minWidth: 100 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ flexGrow: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={progress.progress}
                                  color={progress.progress >= 100 ? 'success' : 'primary'}
                                  sx={{ height: 8, borderRadius: 1 }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ minWidth: 60 }}>
                                {progress.progress.toFixed(0)}%
                              </Typography>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(progress.actual)} / {formatCurrency(progress.target)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {projection.inflowTotal !== null && (
                          <Tooltip title="Auto-populate inflow from projection">
                            <IconButton
                              size="small"
                              onClick={() => handleAutoPopulate(projection.monthId)}
                              aria-label="Auto-populate inflow"
                            >
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Dialog open={importDialogOpen} onClose={() => !isImporting && setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Projections</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              <Typography variant="body2">
                Expected file format:
              </Typography>
              <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                <strong>CSV/Excel columns:</strong>
                <br />
                1. Month (format: YYYY-MM, MM/YYYY, or date)
                <br />
                2. Inflow Total (number)
                <br />
                3. Savings Target (number, optional)
              </Typography>
            </Alert>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              fullWidth
            >
              {isImporting ? 'Importing...' : 'Select File'}
            </Button>
            {isImporting && <LinearProgress />}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)} disabled={isImporting}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

