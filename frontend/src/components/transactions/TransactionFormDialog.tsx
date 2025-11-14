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
  AlertTitle,
} from '@mui/material';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../../types/transactions';
import type { BankAccount } from '../../types/bankAccounts';
import {
  validateTransaction,
  validateAmount,
  validateDate,
  validateDateRange,
} from '../../utils/validation';
import { useIncomeTransactionsStore } from '../../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../../store/useSavingsInvestmentTransactionsStore';

type TabValue = 'income' | 'expense' | 'savings';

interface TransactionFormDialogProps {
  open: boolean;
  onClose: () => void;
  type: TabValue;
  accounts: BankAccount[];
  editingTransaction?: IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction | null;
  onSave: (data: any) => void | Promise<void>;
  isSaving?: boolean;
}

export function TransactionFormDialog({
  open,
  onClose,
  type,
  accounts,
  editingTransaction,
  onSave,
  isSaving = false,
}: TransactionFormDialogProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    accountId: accounts[0]?.id || '',
    amount: 0,
    description: '',
    status: 'Pending' as 'Pending' | 'Paid' | 'Received' | 'Completed',
    // Income specific
    category: 'Salary' as IncomeTransaction['category'],
    clientName: '',
    projectName: '',
    // Expense specific
    expenseCategory: 'Other' as ExpenseTransaction['category'],
    bucket: 'Expense' as ExpenseTransaction['bucket'],
    dueDate: '',
    // Savings specific
    savingsType: 'SIP' as SavingsInvestmentTransaction['type'],
    destination: '',
    sipNumber: '',
    notes: '',
  });

  // Get all transactions for validation
  const incomeTransactions = useIncomeTransactionsStore((state) => state.transactions);
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const savingsTransactions = useSavingsInvestmentTransactionsStore((state) => state.transactions);

  // Real-time validation
  const validation = useMemo(() => {
    const selectedAccount = accounts.find((a) => a.id === formData.accountId);
    if (!selectedAccount) {
      return { isValid: false, errors: ['Please select an account'], warnings: [] };
    }

    const allTransactions = [...incomeTransactions, ...expenseTransactions, ...savingsTransactions];
    const transactionData: Partial<IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction> = {
      accountId: formData.accountId,
      amount: formData.amount,
      date: formData.date,
      ...(type === 'expense' && formData.dueDate ? { dueDate: formData.dueDate } : {}),
      ...(type === 'expense' ? { status: formData.status as 'Pending' | 'Paid' } : {}),
      ...(type === 'savings' ? { status: formData.status as 'Pending' | 'Completed' } : {}),
    };

    return validateTransaction(transactionData, selectedAccount, allTransactions);
  }, [formData, accounts, type, incomeTransactions, expenseTransactions, savingsTransactions]);

  useEffect(() => {
    if (editingTransaction) {
      if (type === 'income') {
        const t = editingTransaction as IncomeTransaction;
        setFormData({
          date: t.date,
          accountId: t.accountId,
          amount: t.amount,
          description: t.description,
          status: t.status,
          category: t.category,
          clientName: t.clientName || '',
          projectName: t.projectName || '',
          expenseCategory: 'Other',
          bucket: 'Expense',
          dueDate: '',
          savingsType: 'SIP',
          destination: '',
          sipNumber: '',
          notes: t.notes || '',
        });
      } else if (type === 'expense') {
        const t = editingTransaction as ExpenseTransaction;
        setFormData({
          date: t.date,
          accountId: t.accountId,
          amount: t.amount,
          description: t.description,
          status: t.status,
          category: 'Salary',
          clientName: '',
          projectName: '',
          expenseCategory: t.category,
          bucket: t.bucket,
          dueDate: t.dueDate || '',
          savingsType: 'SIP',
          destination: '',
          sipNumber: '',
          notes: t.notes || '',
        });
      } else {
        const t = editingTransaction as SavingsInvestmentTransaction;
        setFormData({
          date: t.date,
          accountId: t.accountId,
          amount: t.amount,
          description: ('description' in t ? t.description : '') || '',
          status: t.status,
          category: 'Salary',
          clientName: '',
          projectName: '',
          expenseCategory: 'Other',
          bucket: 'Expense',
          dueDate: '',
          savingsType: t.type,
          destination: t.destination,
          sipNumber: t.sipNumber || '',
          notes: t.notes || '',
        });
      }
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        accountId: accounts[0]?.id || '',
        amount: 0,
        description: '',
        status: 'Pending',
        category: 'Salary',
        clientName: '',
        projectName: '',
        expenseCategory: 'Other',
        bucket: 'Expense',
        dueDate: '',
        savingsType: 'SIP',
        destination: '',
        sipNumber: '',
        notes: '',
      });
    }
  }, [editingTransaction, type, accounts]);

  const handleSave = () => {
    if (!formData.accountId || formData.amount <= 0) return;
    
    // Check validation before saving
    if (!validation.isValid) {
      // Show errors but allow saving with warnings
      console.warn('Validation errors:', validation.errors);
    }

    if (type === 'income') {
      onSave({
        date: formData.date,
        accountId: formData.accountId,
        amount: formData.amount,
        category: formData.category,
        description: formData.description,
        clientName: formData.clientName || undefined,
        projectName: formData.projectName || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
      });
    } else if (type === 'expense') {
      onSave({
        date: formData.date,
        accountId: formData.accountId,
        amount: formData.amount,
        category: formData.expenseCategory,
        description: formData.description,
        bucket: formData.bucket,
        dueDate: formData.dueDate || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
      });
    } else {
      onSave({
        date: formData.date,
        accountId: formData.accountId,
        amount: formData.amount,
        destination: formData.destination,
        type: formData.savingsType,
        sipNumber: formData.sipNumber || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingTransaction
          ? 'Edit Transaction'
          : `Add ${type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'Savings/Investment'} Transaction`}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Validation Errors */}
          {validation.errors.length > 0 && (
            <Alert severity="error">
              <AlertTitle>Validation Errors</AlertTitle>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validation.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          {/* Validation Warnings */}
          {validation.warnings.length > 0 && (
            <Alert severity="warning">
              <AlertTitle>Warnings</AlertTitle>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validation.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </Alert>
          )}

          <TextField
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth required>
            <InputLabel>Account</InputLabel>
            <Select
              value={formData.accountId}
              label="Account"
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            >
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            fullWidth
            required
            InputProps={{
              startAdornment: <span style={{ marginRight: 8 }}>₹</span>,
            }}
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            required
          />

          {type === 'income' && (
            <>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as IncomeTransaction['category'] })}
                >
                  <MenuItem value="Salary">Salary</MenuItem>
                  <MenuItem value="Bonus">Bonus</MenuItem>
                  <MenuItem value="Freelancing">Freelancing</MenuItem>
                  <MenuItem value="Tutoring">Tutoring</MenuItem>
                  <MenuItem value="Project">Project</MenuItem>
                  <MenuItem value="Business">Business</MenuItem>
                  <MenuItem value="LendingReturns">Lending Returns</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              {(formData.category === 'Freelancing' || formData.category === 'Tutoring') && (
                <TextField
                  label="Client Name"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  fullWidth
                />
              )}
              {formData.category === 'Project' && (
                <TextField
                  label="Project Name"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  fullWidth
                />
              )}
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Pending' | 'Received' })}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Received">Received</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          {type === 'expense' && (
            <>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.expenseCategory}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, expenseCategory: e.target.value as ExpenseTransaction['category'] })}
                >
                  <MenuItem value="Utilities">Utilities</MenuItem>
                  <MenuItem value="Responsibilities">Responsibilities</MenuItem>
                  <MenuItem value="STRResidency">STR Residency</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="CCBill">CC Bill</MenuItem>
                  <MenuItem value="Unplanned">Unplanned</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Bucket</InputLabel>
                <Select
                  value={formData.bucket}
                  label="Bucket"
                  onChange={(e) => setFormData({ ...formData, bucket: e.target.value as ExpenseTransaction['bucket'] })}
                >
                  <MenuItem value="Balance">Balance</MenuItem>
                  <MenuItem value="Savings">Savings</MenuItem>
                  <MenuItem value="MutualFunds">Mutual Funds</MenuItem>
                  <MenuItem value="CCBill">CC Bill</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Expense">Expense</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Pending' | 'Paid' })}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          {type === 'savings' && (
            <>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.savingsType}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, savingsType: e.target.value as SavingsInvestmentTransaction['type'] })}
                >
                  <MenuItem value="SIP">SIP</MenuItem>
                  <MenuItem value="LumpSum">Lump Sum</MenuItem>
                  <MenuItem value="Withdrawal">Withdrawal</MenuItem>
                  <MenuItem value="Return">Return</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                fullWidth
                required
                placeholder="e.g., Mutual Fund Name, SIP Name"
              />
              {formData.savingsType === 'SIP' && (
                <TextField
                  label="SIP Number"
                  value={formData.sipNumber}
                  onChange={(e) => setFormData({ ...formData, sipNumber: e.target.value })}
                  fullWidth
                />
              )}
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Pending' | 'Completed' })}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          <TextField
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!formData.accountId || formData.amount <= 0 || validation.errors.length > 0 || isSaving}
          startIcon={isSaving ? <CircularProgress size={16} /> : undefined}
        >
          {editingTransaction ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

