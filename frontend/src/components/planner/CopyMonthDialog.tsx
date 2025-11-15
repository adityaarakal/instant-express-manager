import { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useIncomeTransactionsStore } from '../../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../../store/useSavingsInvestmentTransactionsStore';
import { useToastStore } from '../../store/useToastStore';
import { useAggregatedPlannedMonthsStore } from '../../store/useAggregatedPlannedMonthsStore';

interface CopyMonthDialogProps {
  open: boolean;
  onClose: () => void;
  sourceMonthId: string;
  sourceMonthStart: string;
}

const formatMonthDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const getMonthId = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getMonthStartDate = (monthId: string): string => {
  return `${monthId}-01`;
};

const getMonthEndDate = (monthId: string): string => {
  const [year, month] = monthId.split('-');
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  return `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
};

const adjustDateToMonth = (dateString: string, targetMonthId: string): string => {
  const date = new Date(dateString);
  const [year, month] = targetMonthId.split('-');
  const day = date.getDate();
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const adjustedDay = Math.min(day, lastDay);
  return `${year}-${month}-${String(adjustedDay).padStart(2, '0')}`;
};

export function CopyMonthDialog({ open, onClose, sourceMonthId, sourceMonthStart }: CopyMonthDialogProps) {
  const { getAvailableMonths } = useAggregatedPlannedMonthsStore();
  const { showSuccess, showError } = useToastStore();

  const availableMonths = getAvailableMonths();
  // Sort months in descending order (latest first) to prioritize current/recent months
  const targetMonthOptions = availableMonths
    .filter((monthId) => monthId !== sourceMonthId)
    .sort((a, b) => b.localeCompare(a)) // Latest first
    .map((monthId) => ({
      id: monthId,
      label: formatMonthDate(getMonthStartDate(monthId)),
    }));
  
  const [targetMonthId, setTargetMonthId] = useState<string>('');
  const [isCopying, setIsCopying] = useState(false);
  
  // Reset to default (current/latest month) when dialog opens - prioritize latest/future
  useEffect(() => {
    if (open && targetMonthOptions.length > 0) {
      const now = new Date();
      const currentMonthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentOption = targetMonthOptions.find((opt) => opt.id === currentMonthId);
      const defaultMonth = currentOption ? currentOption.id : targetMonthOptions[0]?.id || '';
      setTargetMonthId(defaultMonth);
    } else if (!open) {
      setTargetMonthId('');
    }
  }, [open, targetMonthOptions]);

  const handleCopy = async () => {
    if (!targetMonthId) {
      showError('Please select a target month');
      return;
    }

    setIsCopying(true);
    try {
      // Get source month date range
      const sourceStart = getMonthStartDate(sourceMonthId);
      const sourceEnd = getMonthEndDate(sourceMonthId);

      // Get all transactions from source month
      const incomeTransactions = useIncomeTransactionsStore
        .getState()
        .getTransactionsByDateRange(sourceStart, sourceEnd);
      const expenseTransactions = useExpenseTransactionsStore
        .getState()
        .getTransactionsByDateRange(sourceStart, sourceEnd);
      const savingsTransactions = useSavingsInvestmentTransactionsStore
        .getState()
        .getTransactionsByDateRange(sourceStart, sourceEnd);

      // Copy income transactions
      let copiedCount = 0;
      for (const transaction of incomeTransactions) {
        const newDate = adjustDateToMonth(transaction.date, targetMonthId);
        useIncomeTransactionsStore.getState().createTransaction({
          accountId: transaction.accountId,
          amount: transaction.amount,
          date: newDate,
          description: transaction.description,
          category: transaction.category,
          status: transaction.status,
          clientName: transaction.clientName,
          projectName: transaction.projectName,
          notes: transaction.notes,
          // Don't copy recurringTemplateId - these should be new standalone transactions
        });
        copiedCount++;
      }

      // Copy expense transactions
      for (const transaction of expenseTransactions) {
        const newDate = adjustDateToMonth(transaction.date, targetMonthId);
        useExpenseTransactionsStore.getState().createTransaction({
          accountId: transaction.accountId,
          amount: transaction.amount,
          date: newDate,
          description: transaction.description,
          category: transaction.category,
          bucket: transaction.bucket,
          status: transaction.status,
          dueDate: transaction.dueDate ? adjustDateToMonth(transaction.dueDate, targetMonthId) : undefined,
          notes: transaction.notes,
          // Don't copy recurringTemplateId or emiId - these should be new standalone transactions
        });
        copiedCount++;
      }

      // Copy savings/investment transactions
      for (const transaction of savingsTransactions) {
        const newDate = adjustDateToMonth(transaction.date, targetMonthId);
        useSavingsInvestmentTransactionsStore.getState().createTransaction({
          accountId: transaction.accountId,
          amount: transaction.amount,
          date: newDate,
          description: transaction.description,
          type: transaction.type,
          destination: transaction.destination,
          sipNumber: transaction.sipNumber,
          status: transaction.status,
          notes: transaction.notes,
          // Don't copy recurringTemplateId or emiId - these should be new standalone transactions
        });
        copiedCount++;
      }

      showSuccess(`Successfully copied ${copiedCount} transaction${copiedCount !== 1 ? 's' : ''} to ${formatMonthDate(getMonthStartDate(targetMonthId))}`);
      onClose();
      setTargetMonthId('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to copy month';
      showError(errorMessage);
    } finally {
      setIsCopying(false);
    }
  };

  if (targetMonthOptions.length === 0) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Copy Month</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            No other months available to copy to. Add transactions to create more months.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <ContentCopyIcon />
          <Typography variant="h6">Copy Month</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Alert severity="info">
            This will copy all transactions (income, expenses, and savings/investments) from{' '}
            <strong>{formatMonthDate(sourceMonthStart)}</strong> to the selected target month. Dates will be adjusted
            to match the target month.
          </Alert>

          <FormControl fullWidth>
            <InputLabel id="target-month-label">Target Month</InputLabel>
            <Select
              labelId="target-month-label"
              value={targetMonthId}
              label="Target Month"
              onChange={(e) => setTargetMonthId(e.target.value)}
              disabled={isCopying}
            >
              {targetMonthOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {targetMonthId && (
            <Alert severity="warning">
              <Typography variant="body2">
                This will create new transactions in <strong>{formatMonthDate(getMonthStartDate(targetMonthId))}</strong>.
                Existing transactions in that month will not be affected.
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isCopying}>
          Cancel
        </Button>
        <Button
          onClick={handleCopy}
          variant="contained"
          startIcon={isCopying ? <CircularProgress size={16} /> : <ContentCopyIcon />}
          disabled={!targetMonthId || isCopying}
        >
          {isCopying ? 'Copying...' : 'Copy Month'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

