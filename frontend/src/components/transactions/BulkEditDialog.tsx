/**
 * Bulk Edit Dialog for Transactions
 * Allows editing multiple transactions at once
 */

import { useState, useEffect, memo } from 'react';
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
  TextField,
  Typography,
  Box,
} from '@mui/material';
import type { BankAccount } from '../../types/bankAccounts';
import type { IncomeTransaction, ExpenseTransaction, SavingsInvestmentTransaction } from '../../types/transactions';

interface BulkEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (updates: BulkEditUpdates) => void;
  selectedCount: number;
  transactionType: 'income' | 'expense' | 'savings';
  accounts: BankAccount[];
  selectedTransactions: Array<IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction>;
}

export interface BulkEditUpdates {
  accountId?: string;
  category?: string;
  status?: string;
  date?: string;
  amount?: number;
  notes?: string;
}

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Business', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];
const SAVINGS_CATEGORIES = ['Savings', 'Mutual Funds', 'Stocks', 'FD', 'RD', 'Other'];

export const BulkEditDialog = memo(function BulkEditDialog({
  open,
  onClose,
  onSave,
  selectedCount,
  transactionType,
  accounts,
  selectedTransactions,
}: BulkEditDialogProps) {
  const [updates, setUpdates] = useState<BulkEditUpdates>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open) {
      setUpdates({});
      setHasChanges(false);
    }
  }, [open]);

  const handleFieldChange = (field: keyof BulkEditUpdates, value: string | number | undefined) => {
    setUpdates((prev) => {
      const newUpdates = { ...prev, [field]: value };
      setHasChanges(Object.keys(newUpdates).length > 0);
      return newUpdates;
    });
  };

  const handleSave = () => {
    if (hasChanges) {
      onSave(updates);
      onClose();
    }
  };

  const categories = transactionType === 'income' ? INCOME_CATEGORIES : transactionType === 'expense' ? EXPENSE_CATEGORIES : SAVINGS_CATEGORIES;

  // Get unique current values for reference
  const currentAccounts = new Set(selectedTransactions.map((t) => t.accountId));
  const currentCategories = new Set(
    selectedTransactions.map((t) => {
      if (transactionType === 'income') return (t as IncomeTransaction).category;
      if (transactionType === 'expense') return (t as ExpenseTransaction).category;
      return (t as SavingsInvestmentTransaction).type;
    })
  );
  const currentStatuses = new Set(selectedTransactions.map((t) => t.status));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bulk Edit {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Selected transactions will be updated with the values you specify below. Leave fields empty to keep existing values.
            </Typography>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Account</InputLabel>
            <Select
              value={updates.accountId || ''}
              label="Account"
              onChange={(e) => handleFieldChange('accountId', e.target.value || undefined)}
            >
              <MenuItem value="">Keep existing</MenuItem>
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>
                  {acc.name}
                </MenuItem>
              ))}
            </Select>
            {currentAccounts.size > 1 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Currently: {Array.from(currentAccounts).map((id) => accounts.find((a) => a.id === id)?.name).join(', ')}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={updates.category || ''}
              label="Category"
              onChange={(e) => handleFieldChange('category', e.target.value || undefined)}
            >
              <MenuItem value="">Keep existing</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
            {currentCategories.size > 1 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Currently: {Array.from(currentCategories).join(', ')}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={updates.status || ''}
              label="Status"
              onChange={(e) => handleFieldChange('status', e.target.value || undefined)}
            >
              <MenuItem value="">Keep existing</MenuItem>
              {transactionType === 'income' && (
                <>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Received">Received</MenuItem>
                </>
              )}
              {transactionType === 'expense' && (
                <>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                </>
              )}
              {transactionType === 'savings' && (
                <>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </>
              )}
            </Select>
            {currentStatuses.size > 1 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Currently: {Array.from(currentStatuses).join(', ')}
              </Typography>
            )}
          </FormControl>

          <TextField
            label="Date"
            type="date"
            value={updates.date || ''}
            onChange={(e) => handleFieldChange('date', e.target.value || undefined)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Amount"
            type="number"
            value={updates.amount || ''}
            onChange={(e) => handleFieldChange('amount', e.target.value ? parseFloat(e.target.value) : undefined)}
            fullWidth
            inputProps={{ min: 0, step: 0.01 }}
          />

          <TextField
            label="Notes"
            value={updates.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value || undefined)}
            fullWidth
            multiline
            rows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!hasChanges}>
          Apply to {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

