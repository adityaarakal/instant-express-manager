import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Alert,
  IconButton,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { PlannedMonthSnapshot, ManualAdjustment } from '../../types/plannedExpenses';
import { usePlannedMonthsStore } from '../../store/usePlannedMonthsStore';
import { toNumber } from '../../utils/formulas';

interface ManualAdjustmentsDialogProps {
  open: boolean;
  onClose: () => void;
  month: PlannedMonthSnapshot;
}

export function ManualAdjustmentsDialog({
  open,
  onClose,
  month,
}: ManualAdjustmentsDialogProps) {
  const { appendAdjustments } = usePlannedMonthsStore();
  const [adjustments, setAdjustments] = useState<Omit<ManualAdjustment, 'id' | 'createdAt'>[]>(
    [],
  );
  const [errors, setErrors] = useState<Record<number, string>>({});

  const handleAddAdjustment = () => {
    setAdjustments([
      ...adjustments,
      {
        description: '',
        amount: 0,
        accountId: undefined,
        bucketId: undefined,
      },
    ]);
  };

  const handleRemoveAdjustment = (index: number) => {
    setAdjustments(adjustments.filter((_, i) => i !== index));
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const handleUpdateAdjustment = (
    index: number,
    field: keyof Omit<ManualAdjustment, 'id' | 'createdAt'>,
    value: string | number | undefined,
  ) => {
    const updated = [...adjustments];
    updated[index] = { ...updated[index], [field]: value };
    setAdjustments(updated);

    // Clear error for this field
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const handleSave = () => {
    const validationErrors: Record<number, string> = {};

    adjustments.forEach((adj, index) => {
      if (!adj.description.trim()) {
        validationErrors[index] = 'Description is required';
      } else if (adj.amount === 0 || adj.amount === null || adj.amount === undefined) {
        validationErrors[index] = 'Amount must be non-zero';
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const adjustmentsToSave: ManualAdjustment[] = adjustments.map((adj) => ({
      id: crypto.randomUUID?.() || `adj_${Math.random().toString(36).slice(2)}`,
      ...adj,
      amount: toNumber(adj.amount),
      createdAt: new Date().toISOString(),
    }));

    appendAdjustments(month.id, adjustmentsToSave);
    handleClose();
  };

  const handleClose = () => {
    setAdjustments([]);
    setErrors({});
    onClose();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const totalAdjustments = adjustments.reduce((sum, adj) => sum + toNumber(adj.amount), 0);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Manual Adjustments</DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add manual adjustments to account for one-time expenses or income that affect
              remaining cash calculations.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Adjustments are added to the remaining cash calculation: Remaining = Inflow - Fixed -
              Savings + Adjustments
            </Alert>
          </Box>

          <Stack spacing={2}>
            {adjustments.map((adjustment, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: errors[index] ? 'error.main' : 'divider',
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">Adjustment {index + 1}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveAdjustment(index)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  <TextField
                    label="Description"
                    value={adjustment.description}
                    onChange={(e) =>
                      handleUpdateAdjustment(index, 'description', e.target.value)
                    }
                    fullWidth
                    size="small"
                    error={!!errors[index] && !adjustment.description.trim()}
                    helperText={errors[index] && !adjustment.description.trim() ? errors[index] : ''}
                    required
                  />

                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Amount"
                      type="number"
                      value={adjustment.amount || ''}
                      onChange={(e) =>
                        handleUpdateAdjustment(index, 'amount', toNumber(e.target.value))
                      }
                      fullWidth
                      size="small"
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                      }}
                      error={!!errors[index] && (adjustment.amount === 0 || !adjustment.amount)}
                      helperText={
                        errors[index] && (adjustment.amount === 0 || !adjustment.amount)
                          ? errors[index]
                          : 'Positive for income, negative for expenses'
                      }
                      required
                    />

                    <FormControl fullWidth size="small">
                      <InputLabel>Account (Optional)</InputLabel>
                      <Select
                        value={adjustment.accountId || ''}
                        label="Account (Optional)"
                        onChange={(e) =>
                          handleUpdateAdjustment(
                            index,
                            'accountId',
                            e.target.value || undefined,
                          )
                        }
                      >
                        <MenuItem value="">All Accounts</MenuItem>
                        {month.accounts.map((account) => (
                          <MenuItem key={account.id} value={account.id}>
                            {account.accountName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Stack>
              </Box>
            ))}

            {adjustments.length === 0 && (
              <Alert severity="info">No adjustments added yet. Click "Add Adjustment" to start.</Alert>
            )}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddAdjustment}
              fullWidth
            >
              Add Adjustment
            </Button>

            {adjustments.length > 0 && (
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">Total Adjustments:</Typography>
                  <Chip
                    label={formatCurrency(totalAdjustments)}
                    color={totalAdjustments >= 0 ? 'success' : 'error'}
                    size="medium"
                  />
                </Stack>
              </Box>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={adjustments.length === 0 || Object.keys(errors).length > 0}
        >
          Save Adjustments
        </Button>
      </DialogActions>
    </Dialog>
  );
}

