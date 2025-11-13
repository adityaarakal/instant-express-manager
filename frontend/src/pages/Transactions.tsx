import { useState, useMemo } from 'react';
import {
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
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);

  const accountsMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((acc) => map.set(acc.id, acc.name));
    return map;
  }, [accounts]);

  const handleOpenDialog = (transactionId?: string) => {
    setEditingTransaction(transactionId || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleDelete = (id: string, type: TabValue) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      if (type === 'income') deleteIncome(id);
      else if (type === 'expense') deleteExpense(id);
      else deleteSavings(id);
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Transactions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={accounts.length === 0}
        >
          Add Transaction
        </Button>
      </Box>

      <Paper>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Income" value="income" />
          <Tab label="Expense" value="expense" />
          <Tab label="Savings/Investment" value="savings" />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
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
                  {incomeTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          No income transactions found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    incomeTransactions
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((transaction) => (
                        <TableRow key={transaction.id} hover>
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
                  {expenseTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          No expense transactions found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenseTransactions
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((transaction) => (
                        <TableRow key={transaction.id} hover>
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
                  {savingsTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          No savings/investment transactions found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    savingsTransactions
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{accountsMap.get(transaction.accountId) || '—'}</TableCell>
                          <TableCell>{transaction.type}</TableCell>
                          <TableCell>{transaction.destination}</TableCell>
                          <TableCell>{transaction.description || '—'}</TableCell>
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

      {/* Transaction Dialog - will be implemented in next step */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTransaction ? 'Edit Transaction' : `Add ${activeTab === 'income' ? 'Income' : activeTab === 'expense' ? 'Expense' : 'Savings/Investment'} Transaction`}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Transaction form will be implemented next.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

