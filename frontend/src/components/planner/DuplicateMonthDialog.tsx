/**
 * Duplicate Month Dialog
 * Allows users to duplicate a month's allocations and statuses to a new month
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
  TextField,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { getAvailableMonthsForDuplication, duplicateMonth } from '../../utils/monthDuplication';
import { useToastStore } from '../../store/useToastStore';
import { usePlannerStore } from '../../store/usePlannerStore';

interface DuplicateMonthDialogProps {
  open: boolean;
  onClose: () => void;
  sourceMonthId: string;
}

export function DuplicateMonthDialog({
  open,
  onClose,
  sourceMonthId,
}: DuplicateMonthDialogProps) {
  const [targetMonthId, setTargetMonthId] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<Array<{ monthId: string; label: string }>>([]);
  const [customMonthId, setCustomMonthId] = useState<string>('');
  const [useCustomMonth, setUseCustomMonth] = useState<boolean>(false);
  const { showSuccess, showError } = useToastStore();
  const { setActiveMonth } = usePlannerStore();

  useEffect(() => {
    if (open) {
      const months = getAvailableMonthsForDuplication(sourceMonthId);
      setAvailableMonths(months);
      setTargetMonthId('');
      setCustomMonthId('');
      setUseCustomMonth(false);
    }
  }, [open, sourceMonthId]);

  const handleDuplicate = () => {
    try {
      const monthToUse = useCustomMonth ? customMonthId : targetMonthId;
      
      if (!monthToUse) {
        showError('Please select or enter a target month');
        return;
      }

      // Validate custom month format (YYYY-MM)
      if (useCustomMonth) {
        if (!/^\d{4}-\d{2}$/.test(customMonthId)) {
          showError('Invalid month format. Please use YYYY-MM format (e.g., 2024-03)');
          return;
        }
      }

      duplicateMonth(sourceMonthId, monthToUse);
      showSuccess(`Month duplicated successfully to ${formatMonthLabel(monthToUse)}`);
      setActiveMonth(monthToUse);
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to duplicate month');
    }
  };

  const formatMonthLabel = (monthId: string): string => {
    const [year, month] = monthId.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  const formatSourceMonth = (): string => {
    return formatMonthLabel(sourceMonthId);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <ContentCopyIcon color="primary" />
          <Typography variant="h6">Duplicate Month</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Alert severity="info">
            This will copy all allocations, statuses, and transactions from{' '}
            <strong>{formatSourceMonth()}</strong> to the target month.
          </Alert>

          <FormControl fullWidth>
            <InputLabel>Copy From</InputLabel>
            <Select value={sourceMonthId} disabled>
              <MenuItem value={sourceMonthId}>{formatSourceMonth()}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Copy To</InputLabel>
            <Select
              value={useCustomMonth ? 'custom' : targetMonthId}
              label="Copy To"
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setUseCustomMonth(true);
                } else {
                  setUseCustomMonth(false);
                  setTargetMonthId(e.target.value);
                }
              }}
            >
              <MenuItem value="custom">
                <Typography variant="body2" color="text.secondary">
                  Enter custom month...
                </Typography>
              </MenuItem>
              {availableMonths.map(({ monthId, label }) => (
                <MenuItem key={monthId} value={monthId}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {useCustomMonth && (
            <TextField
              label="Target Month (YYYY-MM)"
              value={customMonthId}
              onChange={(e) => setCustomMonthId(e.target.value)}
              placeholder="2024-03"
              helperText="Enter month in YYYY-MM format"
              fullWidth
            />
          )}

          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Note:</strong> This will create new transactions in the target month based on the source month.
              Existing transactions in the target month will not be affected, but duplicate transactions may be created.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleDuplicate}
          variant="contained"
          startIcon={<ContentCopyIcon />}
          disabled={!useCustomMonth && !targetMonthId}
        >
          Duplicate
        </Button>
      </DialogActions>
    </Dialog>
  );
}

