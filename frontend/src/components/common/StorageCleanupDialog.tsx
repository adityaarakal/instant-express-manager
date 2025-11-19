/**
 * Storage Cleanup Dialog Component
 * 
 * Provides UI for configuring and running storage cleanup operations.
 * Allows users to clean up old data to free up storage space.
 * 
 * @component
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Alert,
  AlertTitle,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Divider,
  CircularProgress,
} from '@mui/material';
import { cleanupStorage, getStorageStatistics, type CleanupOptions, type CleanupResult } from '../../utils/storageCleanup';
import { useToastStore } from '../../store/useToastStore';

interface StorageCleanupDialogProps {
  open: boolean;
  onClose: () => void;
}

export function StorageCleanupDialog({ open, onClose }: StorageCleanupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [stats, setStats] = useState<{
    transactions: number;
    emis: number;
    recurringTemplates: number;
    undoItems: number;
    exportHistoryItems: number;
  } | null>(null);
  const [options, setOptions] = useState<CleanupOptions>({
    deleteExpiredRecurringTemplates: false,
    maxUndoItems: 50,
    maxExportHistoryItems: 100,
  });
  const [result, setResult] = useState<CleanupResult | null>(null);
  const { showSuccess, showError } = useToastStore();

  // Load statistics when dialog opens
  useEffect(() => {
    if (open) {
      loadStatistics();
      setResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const statistics = await getStorageStatistics();
      setStats(statistics);
    } catch (error) {
      showError('Failed to load storage statistics.');
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    setResult(null);
    
    try {
      const cleanupResult = await cleanupStorage(options);
      setResult(cleanupResult);
      
      if (cleanupResult.totalDeleted > 0) {
        showSuccess(
          `Cleanup completed. Deleted ${cleanupResult.totalDeleted} item(s). ` +
          `Transactions: ${cleanupResult.transactionsDeleted}, ` +
          `EMIs: ${cleanupResult.emisDeleted}, ` +
          `Templates: ${cleanupResult.recurringTemplatesDeleted}, ` +
          `Undo: ${cleanupResult.undoItemsDeleted}, ` +
          `Export History: ${cleanupResult.exportHistoryItemsDeleted}`
        );
      } else {
        showSuccess('No items found matching cleanup criteria.');
      }
      
      if (cleanupResult.errors.length > 0) {
        cleanupResult.errors.forEach((error) => {
          showError(error);
        });
      }
      
      // Reload statistics after cleanup
      await loadStatistics();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Cleanup failed: ${errorMessage}`);
      console.error('Cleanup error:', error);
    } finally {
      setCleaning(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setOptions({
      deleteExpiredRecurringTemplates: false,
      maxUndoItems: 50,
      maxExportHistoryItems: 100,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Storage Cleanup</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : stats ? (
            <>
              <Alert severity="info">
                <AlertTitle>Current Storage Statistics</AlertTitle>
                <Typography variant="body2">
                  Transactions: {stats.transactions} | EMIs: {stats.emis} | Recurring Templates: {stats.recurringTemplates} | Undo Items: {stats.undoItems} | Export History: {stats.exportHistoryItems}
                </Typography>
              </Alert>

              <Alert severity="warning">
                <AlertTitle>Warning</AlertTitle>
                <Typography variant="body2">
                  Storage cleanup is irreversible. Make sure to export a backup before cleaning up data. Deleted data cannot be recovered.
                </Typography>
              </Alert>

              <Divider />

              <Stack spacing={2}>
                <Typography variant="h6">Cleanup Options</Typography>

                <TextField
                  label="Delete Transactions Older Than (YYYY-MM-DD)"
                  type="date"
                  value={
                    options.deleteTransactionsOlderThan
                      ? typeof options.deleteTransactionsOlderThan === 'string'
                        ? options.deleteTransactionsOlderThan.split('T')[0]
                        : new Date(options.deleteTransactionsOlderThan).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      deleteTransactionsOlderThan: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  helperText="Delete all transactions (income, expense, savings) older than this date"
                  fullWidth
                />

                <TextField
                  label="Delete Completed EMIs Older Than (YYYY-MM-DD)"
                  type="date"
                  value={
                    options.deleteCompletedEMIsOlderThan
                      ? typeof options.deleteCompletedEMIsOlderThan === 'string'
                        ? options.deleteCompletedEMIsOlderThan.split('T')[0]
                        : new Date(options.deleteCompletedEMIsOlderThan).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      deleteCompletedEMIsOlderThan: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  helperText="Delete completed EMIs with end date older than this date"
                  fullWidth
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={options.deleteExpiredRecurringTemplates || false}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          deleteExpiredRecurringTemplates: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Delete Expired Recurring Templates"
                />
                <Typography variant="caption" color="text.secondary">
                  Delete recurring templates with end date in the past
                </Typography>

                <TextField
                  label="Maximum Undo Items"
                  type="number"
                  value={options.maxUndoItems || ''}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      maxUndoItems: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  helperText={`Current: ${stats.undoItems}. Keep only the newest N items, delete oldest if exceeded.`}
                  fullWidth
                />

                <TextField
                  label="Maximum Export History Items"
                  type="number"
                  value={options.maxExportHistoryItems || ''}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      maxExportHistoryItems: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  helperText={`Current: ${stats.exportHistoryItems}. Keep only the newest N items, delete oldest if exceeded.`}
                  fullWidth
                />
              </Stack>

              {result && (
                <>
                  <Divider />
                  <Alert severity={result.totalDeleted > 0 ? 'success' : 'info'}>
                    <AlertTitle>Cleanup Results</AlertTitle>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        <strong>Total Deleted:</strong> {result.totalDeleted} item(s)
                      </Typography>
                      {result.transactionsDeleted > 0 && (
                        <Typography variant="body2">Transactions: {result.transactionsDeleted}</Typography>
                      )}
                      {result.emisDeleted > 0 && (
                        <Typography variant="body2">EMIs: {result.emisDeleted}</Typography>
                      )}
                      {result.recurringTemplatesDeleted > 0 && (
                        <Typography variant="body2">Recurring Templates: {result.recurringTemplatesDeleted}</Typography>
                      )}
                      {result.undoItemsDeleted > 0 && (
                        <Typography variant="body2">Undo Items: {result.undoItemsDeleted}</Typography>
                      )}
                      {result.exportHistoryItemsDeleted > 0 && (
                        <Typography variant="body2">Export History: {result.exportHistoryItemsDeleted}</Typography>
                      )}
                      {result.errors.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="error">
                            <strong>Errors:</strong>
                          </Typography>
                          {result.errors.map((error, index) => (
                            <Typography key={index} variant="body2" color="error">
                              {error}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Stack>
                  </Alert>
                </>
              )}
            </>
          ) : (
            <Alert severity="error">
              <AlertTitle>Failed to Load Statistics</AlertTitle>
              <Typography variant="body2">
                Could not load storage statistics. Please try again.
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={cleaning}>
          Close
        </Button>
        <Button
          onClick={handleCleanup}
          variant="contained"
          color="warning"
          disabled={cleaning || loading}
          startIcon={cleaning ? <CircularProgress size={16} /> : null}
        >
          {cleaning ? 'Cleaning...' : 'Run Cleanup'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

