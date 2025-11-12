import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { PlannedMonthSnapshot } from '../../types/plannedExpenses';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (months: PlannedMonthSnapshot[]) => void;
}

interface ImportPreview {
  months: PlannedMonthSnapshot[];
  warnings: string[];
  errors: string[];
  totalMonths: number;
  totalAccounts: number;
  refErrorCount: number;
}

export function ImportDialog({ open, onClose, onImport }: ImportDialogProps) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setFileError(null);
      setPreview(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text);

          // Validate data structure
          if (!Array.isArray(data)) {
            throw new Error('Data must be an array of months');
          }

          const months: PlannedMonthSnapshot[] = [];
          const warnings: string[] = [];
          const errors: string[] = [];
          let totalAccounts = 0;
          let refErrorCount = 0;

          for (const item of data) {
            // Basic validation
            if (!item.id || !item.monthStart) {
              errors.push(`Invalid month entry: missing id or monthStart`);
              continue;
            }

            // Check for required fields
            if (!item.accounts || !Array.isArray(item.accounts)) {
              warnings.push(`Month ${item.monthStart} has no accounts`);
            }

            // Count ref errors
            if (item.refErrors && item.refErrors.length > 0) {
              refErrorCount += item.refErrors.length;
              warnings.push(
                `Month ${item.monthStart} has ${item.refErrors.length} reference error(s)`,
              );
            }

            totalAccounts += item.accounts?.length ?? 0;
            months.push(item as PlannedMonthSnapshot);
          }

          if (errors.length > 0) {
            setFileError(errors.join('; '));
            return;
          }

          setPreview({
            months,
            warnings,
            errors,
            totalMonths: months.length,
            totalAccounts,
            refErrorCount,
          });
        } catch (err) {
          setFileError(
            err instanceof Error ? err.message : 'Failed to parse JSON file',
          );
        }
      };

      reader.onerror = () => {
        setFileError('Failed to read file');
      };

      reader.readAsText(file);
    },
    [],
  );

  const handleImport = () => {
    if (preview) {
      onImport(preview.months);
      handleClose();
    }
  };

  const handleClose = () => {
    setPreview(null);
    setFileError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Planned Expenses Data</DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a JSON file exported from the Planned Expenses spreadsheet.
              The file should contain an array of month objects.
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              fullWidth
            >
              Select JSON File
              <input
                type="file"
                hidden
                accept=".json,application/json"
                onChange={handleFileSelect}
              />
            </Button>
          </Box>

          {fileError && (
            <Alert severity="error" onClose={() => setFileError(null)}>
              {fileError}
            </Alert>
          )}

          {preview && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Import Preview
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Summary
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={`${preview.totalMonths} months`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={`${preview.totalAccounts} accounts`}
                      color="primary"
                      variant="outlined"
                    />
                    {preview.refErrorCount > 0 && (
                      <Chip
                        icon={<WarningIcon />}
                        label={`${preview.refErrorCount} ref errors`}
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Box>

                {preview.warnings.length > 0 && (
                  <Alert severity="warning" icon={<WarningIcon />}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Warnings ({preview.warnings.length})
                    </Typography>
                    <Stack spacing={0.5}>
                      {preview.warnings.slice(0, 5).map((warning, idx) => (
                        <Typography key={idx} variant="caption">
                          • {warning}
                        </Typography>
                      ))}
                      {preview.warnings.length > 5 && (
                        <Typography variant="caption" color="text.secondary">
                          ... and {preview.warnings.length - 5} more
                        </Typography>
                      )}
                    </Stack>
                  </Alert>
                )}

                {preview.errors.length > 0 && (
                  <Alert severity="error">
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Errors ({preview.errors.length})
                    </Typography>
                    <Stack spacing={0.5}>
                      {preview.errors.map((error, idx) => (
                        <Typography key={idx} variant="caption">
                          • {error}
                        </Typography>
                      ))}
                    </Stack>
                  </Alert>
                )}

                {preview.errors.length === 0 && (
                  <Alert severity="success">
                    Data looks valid. Ready to import.
                  </Alert>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={!preview || preview.errors.length > 0}
        >
          Import {preview ? `${preview.totalMonths} months` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

