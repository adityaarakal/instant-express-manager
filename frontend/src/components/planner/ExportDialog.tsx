import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import type { PlannedMonthSnapshot } from '../../types/plannedExpenses';
import { exportToJSON, exportToCSV, downloadFile } from '../../utils/export';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  months: PlannedMonthSnapshot[];
}

type ExportFormat = 'json' | 'csv';

export function ExportDialog({ open, onClose, months }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('json');

  const handleExport = () => {
    if (months.length === 0) {
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = exportToJSON(months);
      filename = `planned-expenses-${timestamp}.json`;
      mimeType = 'application/json';
    } else {
      content = exportToCSV(months);
      filename = `planned-expenses-${timestamp}.csv`;
      mimeType = 'text/csv';
    }

    downloadFile(content, filename, mimeType);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Data</DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Export your planned expenses data for backup or offline storage.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={format}
                label="Export Format"
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
              >
                <MenuItem value="json">JSON (Recommended)</MenuItem>
                <MenuItem value="csv">CSV (Spreadsheet)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Alert severity="info">
            <Typography variant="body2">
              <strong>{months.length}</strong> month{months.length !== 1 ? 's' : ''} will be
              exported.
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              {format === 'json'
                ? 'JSON format preserves all data including formulas and metadata.'
                : 'CSV format is suitable for viewing in spreadsheet applications.'}
            </Typography>
          </Alert>

          {format === 'json' && (
            <Alert severity="success">
              <Typography variant="body2">
                JSON exports can be re-imported using the Import Data feature.
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={months.length === 0}
        >
          Export {format.toUpperCase()}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

