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
  TablePagination,
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
  CircularProgress,
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
import { getUserFriendlyError } from '../utils/errorHandling';
import { useUndoStore } from '../store/useUndoStore';
import { restoreDeletedItem } from '../utils/undoRestore';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { ButtonWithLoading } from '../components/common/ButtonWithLoading';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'expense' || tabParam === 'savings') {
      return tabParam;
    }
    return 'income';
  });
  const { transactions: incomeTransactions, createTransaction: createIncome, updateTransaction: updateIncome, deleteTransaction: deleteIncome } = useIncomeTransactionsStore();
  const { transactions: expenseTransactions, createTransaction: createExpense, updateTransaction: updateExpense, deleteTransaction: deleteExpense } = useExpenseTransactionsStore();
  const { transactions: savingsTransactions, createTransaction: createSavings, updateTransaction: updateSavings, deleteTransaction: deleteSavings } = useSavingsInvestmentTransactionsStore();
  const { accounts } = useBankAccountsStore();
  const { showSuccess, showError, showToast } = useToastStore();

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', activeTab);
    setSearchParams(newParams, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  // Clear selection when tab changes
  useEffect(() => {
    setSelectedIds(new Set());
    setPage(0); // Reset to first page when tab changes
  }, [activeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + N - Open new transaction dialog
      if ((event.ctrlKey || event.metaKey) && event.key === 'n' && !dialogOpen) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          event.preventDefault();
          if (accounts.length > 0) {
            handleOpenDialog();
          }
        }
      }

      // Ctrl/Cmd + K - Focus search input
      if ((event.ctrlKey || event.metaKey) && event.key === 'k' && !dialogOpen) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          event.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, accounts.length]);

  const accountsMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((acc) => map.set(acc.id, acc.name));
    return map;
  }, [accounts]);

  // Filter transactions based on current filters
  const filteredAndSortedTransactions = useMemo(() => {
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

    // Sort by date (newest first)
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }, [activeTab, incomeTransactions, expenseTransactions, savingsTransactions, filters, accountsMap]);

  // Pagination
  const paginatedTransactions = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredAndSortedTransactions.slice(start, end);
  }, [filteredAndSortedTransactions, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    setSelectedIds(new Set()); // Clear selection when changing page
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSelectedIds(new Set()); // Clear selection when changing page size
  };

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

  const handleDelete = async (id: string, type: TabValue) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setDeletingIds(new Set([id]));
      try {
        // Store the transaction data for undo before deleting
        let transaction: IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction | undefined;
        let entityType: 'IncomeTransaction' | 'ExpenseTransaction' | 'SavingsInvestmentTransaction';
        
        if (type === 'income') {
          transaction = incomeTransactions.find((t) => t.id === id);
          entityType = 'IncomeTransaction';
        } else if (type === 'expense') {
          transaction = expenseTransactions.find((t) => t.id === id);
          entityType = 'ExpenseTransaction';
        } else {
          transaction = savingsTransactions.find((t) => t.id === id);
          entityType = 'SavingsInvestmentTransaction';
        }

        if (!transaction) {
          showError('Transaction not found');
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
        if (type === 'income') deleteIncome(id);
        else if (type === 'expense') deleteExpense(id);
        else deleteSavings(id);

        // Store in undo store and show undo button
        const deletedItemId = useUndoStore.getState().addDeletedItem(entityType, transaction);
        
        showToast(
          'Transaction deleted successfully',
          'success',
          8000,
          {
            label: 'Undo',
            onClick: () => {
              restoreDeletedItem(deletedItemId);
            },
          }
        );
      } catch (error) {
        showError(getUserFriendlyError(error, 'delete transaction'));
      } finally {
        setDeletingIds(new Set());
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} transaction(s)?`)) {
      setIsBulkOperating(true);
      setDeletingIds(new Set(selectedIds));
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const count = selectedIds.size;
        selectedIds.forEach((id) => {
          if (activeTab === 'income') deleteIncome(id);
          else if (activeTab === 'expense') deleteExpense(id);
          else deleteSavings(id);
        });
        setSelectedIds(new Set());
        showSuccess(`${count} transaction(s) deleted successfully`);
      } catch (error) {
        showError(getUserFriendlyError(error, 'delete transactions'));
      } finally {
        setIsBulkOperating(false);
        setDeletingIds(new Set());
      }
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    setIsBulkOperating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
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
      showError(getUserFriendlyError(error, 'update transactions'));
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleExport = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'income') {
      csvContent = exportIncomeTransactionsToCSV(filteredAndSortedTransactions as IncomeTransaction[], accounts);
      filename = `income-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeTab === 'expense') {
      csvContent = exportExpenseTransactionsToCSV(filteredAndSortedTransactions as ExpenseTransaction[], accounts);
      filename = `expense-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      csvContent = exportSavingsTransactionsToCSV(filteredAndSortedTransactions as SavingsInvestmentTransaction[], accounts);
      filename = `savings-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    }

    downloadCSV(csvContent, filename);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedTransactions.length && paginatedTransactions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedTransactions.map((t) => t.id)));
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
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0,
        }}
      >
        <Typography variant="h4">Transactions</Typography>
        <Stack 
          direction={isMobile ? 'column' : 'row'} 
          spacing={2}
          sx={{ width: isMobile ? '100%' : 'auto' }}
        >
          {selectedIds.size > 0 && (
            <>
              <ButtonWithLoading
                variant="outlined"
                loading={isBulkOperating}
                disabled={isBulkOperating}
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
              </ButtonWithLoading>
              <ButtonWithLoading
                variant="outlined"
                color="error"
                loading={isBulkOperating}
                disabled={isBulkOperating}
                onClick={handleBulkDelete}
              >
                Delete ({selectedIds.size})
              </ButtonWithLoading>
            </>
          )}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={filteredAndSortedTransactions.length === 0}
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

      <TransactionFilters ref={searchInputRef} type={activeTab} accounts={accounts} onFilterChange={setFilters} />

      <Paper>
        <Tabs
          value={activeTab}
          onChange={(_, v) => {
            setActiveTab(v);
            setSelectedIds(new Set());
          }}
          aria-label="Transaction type tabs"
        >
          <Tab label="Income" value="income" aria-controls="income-tabpanel" />
          <Tab label="Expense" value="expense" aria-controls="expense-tabpanel" />
          <Tab label="Savings/Investment" value="savings" aria-controls="savings-tabpanel" />
        </Tabs>

        <TableContainer
          sx={{
            overflowX: 'auto',
            '& .MuiTableCell-root': {
              whiteSpace: 'nowrap',
              minWidth: 100,
            },
          }}
        >
          <Table aria-label={`${activeTab} transactions table`} sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <IconButton 
                    size="small" 
                    onClick={handleSelectAll}
                    aria-label="Select all transactions on this page"
                  >
                    {selectedIds.size === paginatedTransactions.length && paginatedTransactions.length > 0 ? (
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
              {isLoading ? (
                <TableSkeleton 
                  rows={5} 
                  columns={activeTab === 'income' ? 8 : activeTab === 'expense' ? 9 : 9} 
                />
              ) : activeTab === 'income' && (
                <>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          {incomeTransactions.length === 0
                            ? 'No income transactions found.'
                            : filteredAndSortedTransactions.length === 0
                            ? 'No transactions match the current filters.'
                            : 'No transactions on this page.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (paginatedTransactions as IncomeTransaction[])
                      .map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              onClick={() => handleSelectTransaction(transaction.id)}
                              aria-label={`Select transaction ${transaction.description || transaction.id}`}
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
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(transaction.id)}
                              disabled={isBulkOperating || deletingIds.has(transaction.id)}
                              aria-label={`Edit transaction ${transaction.description || transaction.id}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(transaction.id, 'income')} 
                              color="error"
                              disabled={isBulkOperating || deletingIds.has(transaction.id)}
                              aria-label={`Delete transaction ${transaction.description || transaction.id}`}
                            >
                              {deletingIds.has(transaction.id) ? (
                                <CircularProgress size={16} aria-label="Deleting" />
                              ) : (
                                <DeleteIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </>
              )}

              {activeTab === 'expense' && (
                <>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          {expenseTransactions.length === 0
                            ? 'No expense transactions found.'
                            : filteredAndSortedTransactions.length === 0
                            ? 'No transactions match the current filters.'
                            : 'No transactions on this page.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (paginatedTransactions as ExpenseTransaction[])
                      .map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              onClick={() => handleSelectTransaction(transaction.id)}
                              aria-label={`Select transaction ${transaction.description || transaction.id}`}
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
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(transaction.id)}
                              disabled={isBulkOperating || deletingIds.has(transaction.id)}
                              aria-label={`Edit transaction ${transaction.description || transaction.id}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(transaction.id, 'expense')} 
                              color="error"
                              disabled={isBulkOperating || deletingIds.has(transaction.id)}
                              aria-label={`Delete transaction ${transaction.description || transaction.id}`}
                            >
                              {deletingIds.has(transaction.id) ? (
                                <CircularProgress size={16} aria-label="Deleting" />
                              ) : (
                                <DeleteIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </>
              )}

              {activeTab === 'savings' && (
                <>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          {savingsTransactions.length === 0
                            ? 'No savings/investment transactions found.'
                            : filteredAndSortedTransactions.length === 0
                            ? 'No transactions match the current filters.'
                            : 'No transactions on this page.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (paginatedTransactions as SavingsInvestmentTransaction[])
                      .map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              onClick={() => handleSelectTransaction(transaction.id)}
                              aria-label={`Select transaction ${('description' in transaction ? transaction.description : transaction.destination) || transaction.id}`}
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
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(transaction.id)}
                              disabled={isBulkOperating || deletingIds.has(transaction.id)}
                              aria-label={`Edit transaction ${('description' in transaction ? transaction.description : transaction.destination) || transaction.id}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(transaction.id, 'savings')} 
                              color="error"
                              disabled={isBulkOperating || deletingIds.has(transaction.id)}
                              aria-label={`Delete transaction ${('description' in transaction ? transaction.description : transaction.destination) || transaction.id}`}
                            >
                              {deletingIds.has(transaction.id) ? (
                                <CircularProgress size={16} aria-label="Deleting" />
                              ) : (
                                <DeleteIcon fontSize="small" />
                              )}
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
        {!isLoading && filteredAndSortedTransactions.length > 0 && (
          <TablePagination
            component="div"
            count={filteredAndSortedTransactions.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={isMobile ? [10, 25] : [10, 25, 50, 100]}
            labelRowsPerPage={isMobile ? 'Rows:' : 'Rows per page:'}
            labelDisplayedRows={({ from, to, count }) =>
              isMobile 
                ? `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
                : `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
            }
            sx={{
              '& .MuiTablePagination-toolbar': {
                flexWrap: isMobile ? 'wrap' : 'nowrap',
              },
            }}
          />
        )}
      </Paper>

        <TransactionFormDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          type={activeTab}
          accounts={accounts}
          editingTransaction={editingTransaction}
          isSaving={isSaving}
        onSave={async (data: any) => {
          setIsSaving(true);
          try {
            await new Promise((resolve) => setTimeout(resolve, 200));
            
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
            showError(getUserFriendlyError(error, 'save transaction'));
          } finally {
            setIsSaving(false);
          }
        }}
      />
    </Stack>
  );
}

