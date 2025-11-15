import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import type { TransferTransaction } from '../../types/transactions';
import type { BankAccount } from '../../types/bankAccounts';
import { validateAmount, validateDate } from '../../utils/validation';
import { useTransferTransactionsStore } from '../../store/useTransferTransactionsStore';
import { useToastStore } from '../../store/useToastStore';
import { useBanksStore } from '../../store/useBanksStore';

interface TransferFormDialogProps {
  open: boolean;
  onClose: () => void;
  accounts: BankAccount[];
  editingTransfer?: TransferTransaction | null;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function TransferFormDialog({
  open,
  onClose,
  accounts,
  editingTransfer,
}: TransferFormDialogProps) {
  const { getBank } = useBanksStore();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fromAccountId: '',
    toAccountId: '',
    amount: 0,
    category: 'AccountMaintenance' as TransferTransaction['category'],
    description: '',
    status: 'Pending' as 'Pending' | 'Completed',
    notes: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const { createTransfer, updateTransfer } = useTransferTransactionsStore();
  const { showSuccess, showError } = useToastStore();

  // Filter accounts - exclude Credit Cards from From Account options
  const fromAccountOptions = useMemo(() => {
    return accounts.filter((acc) => acc.accountType !== 'CreditCard');
  }, [accounts]);

  const toAccountOptions = useMemo(() => {
    // If fromAccountId is selected, exclude it from toAccountOptions
    if (formData.fromAccountId) {
      return accounts.filter((acc) => acc.id !== formData.fromAccountId);
    }
    return accounts;
  }, [accounts, formData.fromAccountId]);

  // Get account details for display
  const fromAccount = accounts.find((acc) => acc.id === formData.fromAccountId);

  // Field-level validation
  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    // Date validation
    if (!formData.date) {
      errors.date = 'Date is required';
    } else {
      const dateValidation = validateDate(formData.date, 'Date');
      if (!dateValidation.isValid) {
        errors.date = dateValidation.errors[0] || '';
      }
    }

    // From Account validation
    if (!formData.fromAccountId) {
      errors.fromAccountId = 'From Account is required';
    }

    // To Account validation
    if (!formData.toAccountId) {
      errors.toAccountId = 'To Account is required';
    } else if (formData.fromAccountId === formData.toAccountId) {
      errors.toAccountId = 'To Account must be different from From Account';
    }

    // Amount validation
    if (formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else {
      const amountValidation = validateAmount(formData.amount, 'Amount');
      if (!amountValidation.isValid) {
        errors.amount = amountValidation.errors[0] || '';
      }
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    // Balance validation (warning only, not blocking)
    if (
      formData.status === 'Completed' &&
      fromAccount &&
      fromAccount.accountType !== 'CreditCard' &&
      formData.amount > fromAccount.currentBalance
    ) {
      // This is a warning, not an error - we'll show it as an alert
    }

    return errors;
  }, [formData, fromAccount]);

  const hasErrors = Object.keys(fieldErrors).length > 0;
  const hasInsufficientBalance =
    formData.status === 'Completed' &&
    fromAccount &&
    fromAccount.accountType !== 'CreditCard' &&
    formData.amount > fromAccount.currentBalance;

  // Initialize form data when dialog opens or editingTransfer changes
  useEffect(() => {
    if (open) {
      if (editingTransfer) {
        setFormData({
          date: editingTransfer.date.split('T')[0],
          fromAccountId: editingTransfer.fromAccountId,
          toAccountId: editingTransfer.toAccountId,
          amount: editingTransfer.amount,
          category: editingTransfer.category,
          description: editingTransfer.description,
          status: editingTransfer.status,
          notes: editingTransfer.notes || '',
        });
      } else {
        // Reset to defaults for new transfer
        setFormData({
          date: new Date().toISOString().split('T')[0],
          fromAccountId: fromAccountOptions[0]?.id || '',
          toAccountId: '',
          amount: 0,
          category: 'AccountMaintenance',
          description: '',
          status: 'Pending',
          notes: '',
        });
      }
    }
  }, [open, editingTransfer, fromAccountOptions]);

  const handleSave = async () => {
    if (hasErrors) {
      showError('Please fix the errors in the form');
      return;
    }

    setIsSaving(true);
    try {
      const transferData = {
        date: formData.date,
        fromAccountId: formData.fromAccountId,
        toAccountId: formData.toAccountId,
        amount: formData.amount,
        category: formData.category,
        description: formData.description.trim(),
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      };

      if (editingTransfer) {
        updateTransfer(editingTransfer.id, transferData);
        showSuccess('Transfer updated successfully');
      } else {
        createTransfer(transferData);
        showSuccess('Transfer created successfully');
      }

      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save transfer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <SwapHorizIcon color="primary" />
          <Typography variant="h6">
            {editingTransfer ? 'Edit Transfer' : 'Transfer Money'}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {hasInsufficientBalance && (
            <Alert severity="warning">
              <Typography variant="body2">
                Transfer amount ({formatCurrency(formData.amount)}) exceeds from account balance (
                {formatCurrency(fromAccount?.currentBalance || 0)}). This will result in a negative balance.
              </Typography>
            </Alert>
          )}

          <TextField
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
            error={!!fieldErrors.date}
            helperText={fieldErrors.date}
            required
          />

          <FormControl fullWidth error={!!fieldErrors.fromAccountId} required>
            <InputLabel>From Account</InputLabel>
            <Select
              value={formData.fromAccountId}
              label="From Account"
              onChange={(e) => {
                const newFromAccountId = e.target.value;
                setFormData({
                  ...formData,
                  fromAccountId: newFromAccountId,
                  // Reset toAccountId if it's the same as the new fromAccountId
                  toAccountId: formData.toAccountId === newFromAccountId ? '' : formData.toAccountId,
                });
              }}
            >
              {fromAccountOptions.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                    <Box>
                      <Typography variant="body1">{account.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getBank(account.bankId)?.name || 'Unknown Bank'} • {account.accountType}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(account.currentBalance)}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
            {fieldErrors.fromAccountId && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                {fieldErrors.fromAccountId}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth error={!!fieldErrors.toAccountId} required>
            <InputLabel>To Account</InputLabel>
            <Select
              value={formData.toAccountId}
              label="To Account"
              onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
              disabled={!formData.fromAccountId}
            >
              {toAccountOptions.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                    <Box>
                      <Typography variant="body1">{account.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getBank(account.bankId)?.name || 'Unknown Bank'} • {account.accountType}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(account.currentBalance)}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
            {fieldErrors.toAccountId && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                {fieldErrors.toAccountId}
              </Typography>
            )}
          </FormControl>

          <TextField
            label="Amount"
            type="number"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            fullWidth
            error={!!fieldErrors.amount}
            helperText={fieldErrors.amount}
            required
            inputProps={{ min: 0, step: 0.01 }}
          />

          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              label="Category"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as TransferTransaction['category'],
                })
              }
            >
              <MenuItem value="AccountMaintenance">Account Maintenance</MenuItem>
              <MenuItem value="CreditCardPayment">Credit Card Payment</MenuItem>
              <MenuItem value="FundRebalancing">Fund Rebalancing</MenuItem>
              <MenuItem value="LoanRepayment">Loan Repayment</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            error={!!fieldErrors.description}
            helperText={fieldErrors.description}
            required
            multiline
            rows={2}
          />

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'Pending' | 'Completed',
                })
              }
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Notes (Optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={hasErrors || isSaving}
          startIcon={isSaving ? <CircularProgress size={16} /> : null}
        >
          {isSaving ? 'Saving...' : editingTransfer ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

