import { useState, useMemo, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useToastStore } from '../store/useToastStore';
import { TransactionFilters, type FilterState } from '../components/transactions/TransactionFilters';
import { TransactionFormDialog } from '../components/transactions/TransactionFormDialog';
import {
  exportIncomeTransactionsToCSV,
  exportExpenseTransactionsToCSV,
  exportSavingsTransactionsToCSV,
  downloadCSV,
} from '../utils/transactionExport';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../types/transactions';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
};

type TabValue = 'income' | 'expense' | 'savings';

export function Transactions() {
  const [activeTab, setActiveTab] = useState<TabValue>('income');
  const { transactions: incomeTransactions, createTransaction: createIncome, updateTransaction: updateIncome, deleteTransaction: deleteIncome } = useIncomeTransactionsStore();
  const { transactions: expenseTransactions, createTransaction: createExpense, updateTransaction: updateExpense, deleteTransaction: deleteExpense } = useExpenseTransactionsStore();
  const { transactions: savingsTransactions, createTransaction: createSavings, updateTransaction: updateSavings, deleteTransaction: deleteSavings } = useSavingsInvestmentTransactionsStore();
  const { accounts } = useBankAccountsStore();
  const { showSuccess, showError } = useToastStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<
    IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction | null
  >(null);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    accountId: '',
    category: '',
    status: '',
    searchTerm: '',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clear selection when tab changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  const accountsMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((acc) => map.set(acc.id, acc.name));
    return map;
  }, [accounts]);

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    let transactions: (IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction)[] = [];

    if (activeTab === 'income') {
      transactions = incomeTransactions;
    } else if (activeTab === 'expense') {
      transactions = expenseTransactions;
    } else {
      transactions = savingsTransactions;
    }

    return transactions.filter((t) => {
      // Date range filter
      if (filters.dateFrom && t.date < filters.dateFrom) return false;
      if (filters.dateTo && t.date > filters.dateTo) return false;

      // Account filter
      if (filters.accountId && t.accountId !== filters.accountId) return false;

      // Category filter
      if (filters.category) {
        if (activeTab === 'income' && (t as IncomeTransaction).category !== filters.category) return false;
        if (activeTab === 'expense' && (t as ExpenseTransaction).category !== filters.category) return false;
        if (activeTab === 'savings' && (t as SavingsInvestmentTransaction).type !== filters.category) return false;
      }

      // Status filter
      if (filters.status && t.status !== filters.status) return false;

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const description = 'description' in t ? (t.description || '') : (t.destination || '');
        const matchesDescription = description.toLowerCase().includes(searchLower);
        const matchesAccount = (accountsMap.get(t.accountId) || '').toLowerCase().includes(searchLower);
        if (!matchesDescription && !matchesAccount) return false;
      }

      return true;
    });
  }, [activeTab, incomeTransactions, expenseTransactions, savingsTransactions, filters, accountsMap]);

  const handleOpenDialog = (transactionId?: string) => {
    if (transactionId) {
      if (activeTab === 'income') {
        const t = incomeTransactions.find((t) => t.id === transactionId);
        setEditingTransaction(t || null);
      } else if (activeTab === 'expense') {
        const t = expenseTransactions.find((t) => t.id === transactionId);
        setEditingTransaction(t || null);
      } else {
        const t = savingsTransactions.find((t) => t.id === transactionId);
        setEditingTransaction(t || null);
      }
    } else {
      setEditingTransaction(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleDelete = (id: string, type: TabValue) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        if (type === 'income') deleteIncome(id);
        else if (type === 'expense') deleteExpense(id);
        else deleteSavings(id);
        showSuccess('Transaction deleted successfully');
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to delete transaction');
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} transaction(s)?`)) {
      try {
        const count = selectedIds.size;
        selectedIds.forEach((id) => {
          if (activeTab === 'income') deleteIncome(id);
          else if (activeTab === 'expense') deleteExpense(id);
          else deleteSavings(id);
        });
        setSelectedIds(new Set());
        showSuccess(`${count} transaction(s) deleted successfully`);
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to delete transactions');
      }
    }
  };

  const handleBulkStatusUpdate = (newStatus: string) => {
    if (selectedIds.size === 0) return;
    try {
      const count = selectedIds.size;
      selectedIds.forEach((id) => {
        if (activeTab === 'income') {
          updateIncome(id, { status: newStatus as 'Pending' | 'Received' });
        } else if (activeTab === 'expense') {
          updateExpense(id, { status: newStatus as 'Pending' | 'Paid' });
        } else {
          updateSavings(id, { status: newStatus as 'Pending' | 'Completed' });
        }
      });
      setSelectedIds(new Set());
      showSuccess(`${count} transaction(s) updated successfully`);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update transactions');
    }
  };

  const handleExport = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'income') {
      csvContent = exportIncomeTransactionsToCSV(filteredTransactions as IncomeTransaction[], accounts);
      filename = `income-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeTab === 'expense') {
      csvContent = exportExpenseTransactionsToCSV(filteredTransactions as ExpenseTransaction[], accounts);
      filename = `expense-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      csvContent = exportSavingsTransactionsToCSV(filteredTransactions as SavingsInvestmentTransaction[], accounts);
      filename = `savings-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    }

    downloadCSV(csvContent, filename);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const handleSelectTransaction = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <Stack spacing={3}>
      {accounts.length === 0 && (
        <Alert severity="info">
          <AlertTitle>No Bank Accounts</AlertTitle>
          Please create at least one bank account before adding transactions. Go to <strong>Banks</strong> page to create a bank and account.
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Transactions</Typography>
        <Stack direction="row" spacing={2}>
          {selectedIds.size > 0 && (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  if (activeTab === 'income') {
                    handleBulkStatusUpdate('Received');
                  } else if (activeTab === 'expense') {
                    handleBulkStatusUpdate('Paid');
                  } else {
                    handleBulkStatusUpdate('Completed');
                  }
                }}
              >
                Mark as {activeTab === 'income' ? 'Received' : activeTab === 'expense' ? 'Paid' : 'Completed'} ({selectedIds.size})
              </Button>
              <Button variant="outlined" color="error" onClick={handleBulkDelete}>
                Delete ({selectedIds.size})
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={filteredTransactions.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={accounts.length === 0}
            title={accounts.length === 0 ? 'Please create at least one bank account first' : ''}
          >
            Add Transaction
          </Button>
        </Stack>
      </Box>

      <TransactionFilters type={activeTab} accounts={accounts} onFilterChange={setFilters} />

      <Paper>
        <Tabs
          value={activeTab}
          onChange={(_, v) => {
            setActiveTab(v);
            setSelectedIds(new Set());
          }}
        >
          <Tab label="Income" value="income" />
          <Tab label="Expense" value="expense" />
          <Tab label="Savings/Investment" value="savings" />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <IconButton size="small" onClick={handleSelectAll}>
                    {selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0 ? (
                      <CheckBoxIcon fontSize="small" />
                    ) : (
                      <CheckBoxOutlineBlankIcon fontSize="small" />
                    )}
                  </IconButton>
                </TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Account</TableCell>
                {activeTab === 'income' && <TableCell>Category</TableCell>}
                {activeTab === 'expense' && (
                  <>
                    <TableCell>Category</TableCell>
                    <TableCell>Bucket</TableCell>
                  </>
                )}
                {activeTab === 'savings' && (
                  <>
                    <TableCell>Type</TableCell>
                    <TableCell>Destination</TableCell>
                  </>
                )}
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeTab === 'income' && (
                <>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          {incomeTransactions.length === 0
                            ? 'No income transactions found.'
                            : 'No transactions match the current filters.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (filteredTransactions as IncomeTransaction[])
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              onClick={() => handleSelectTransaction(transaction.id)}
                            >
                              {selectedIds.has(transaction.id) ? (
                                <CheckBoxIcon fontSize="small" />
                              ) : (
                                <CheckBoxOutlineBlankIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{accountsMap.get(transaction.accountId) || '—'}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell align="right">{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.status}
                              size="small"
                              color={transaction.status === 'Received' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleOpenDialog(transaction.id)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(transaction.id, 'income')} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </>
              )}

              {activeTab === 'expense' && (
                <>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          {expenseTransactions.length === 0
                            ? 'No expense transactions found.'
                            : 'No transactions match the current filters.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (filteredTransactions as ExpenseTransaction[])
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              onClick={() => handleSelectTransaction(transaction.id)}
                            >
                              {selectedIds.has(transaction.id) ? (
                                <CheckBoxIcon fontSize="small" />
                              ) : (
                                <CheckBoxOutlineBlankIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{accountsMap.get(transaction.accountId) || '—'}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>{transaction.bucket}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell align="right">{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.status}
                              size="small"
                              color={transaction.status === 'Paid' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleOpenDialog(transaction.id)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(transaction.id, 'expense')} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </>
              )}

              {activeTab === 'savings' && (
                <>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          {savingsTransactions.length === 0
                            ? 'No savings/investment transactions found.'
                            : 'No transactions match the current filters.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (filteredTransactions as SavingsInvestmentTransaction[])
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              onClick={() => handleSelectTransaction(transaction.id)}
                            >
                              {selectedIds.has(transaction.id) ? (
                                <CheckBoxIcon fontSize="small" />
                              ) : (
                                <CheckBoxOutlineBlankIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{accountsMap.get(transaction.accountId) || '—'}</TableCell>
                          <TableCell>{transaction.type}</TableCell>
                          <TableCell>{transaction.destination}</TableCell>
                          <TableCell>{('description' in transaction ? transaction.description : transaction.destination) || '—'}</TableCell>
                          <TableCell align="right">{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.status}
                              size="small"
                              color={transaction.status === 'Completed' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleOpenDialog(transaction.id)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(transaction.id, 'savings')} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <TransactionFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        type={activeTab}
        accounts={accounts}
        editingTransaction={editingTransaction}
        onSave={(data: any) => {
          try {
            if (activeTab === 'income') {
              if (editingTransaction) {
                updateIncome(editingTransaction.id, data);
                showSuccess('Income transaction updated successfully');
              } else {
                createIncome(data);
                showSuccess('Income transaction created successfully');
              }
            } else if (activeTab === 'expense') {
              if (editingTransaction) {
                updateExpense(editingTransaction.id, data);
                showSuccess('Expense transaction updated successfully');
              } else {
                createExpense(data);
                showSuccess('Expense transaction created successfully');
              }
            } else {
              if (editingTransaction) {
                updateSavings(editingTransaction.id, data);
                showSuccess('Savings transaction updated successfully');
              } else {
                createSavings(data);
                showSuccess('Savings transaction created successfully');
              }
            }
            handleCloseDialog();
          } catch (error) {
            showError(error instanceof Error ? error.message : 'Failed to save transaction');
          }
        }}
      />
    </Stack>
  );
}

