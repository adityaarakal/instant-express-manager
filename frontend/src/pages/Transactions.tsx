import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useTransferTransactionsStore } from '../store/useTransferTransactionsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useToastStore } from '../store/useToastStore';
import { getUserFriendlyError } from '../utils/errorHandling';
import { useUndoStore } from '../store/useUndoStore';
import { restoreDeletedItem } from '../utils/undoRestore';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { ButtonWithLoading } from '../components/common/ButtonWithLoading';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { TransactionFilters, type FilterState } from '../components/transactions/TransactionFilters';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SavingsIcon from '@mui/icons-material/Savings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { TransactionFormDialog } from '../components/transactions/TransactionFormDialog';
import { TransferFormDialog } from '../components/transactions/TransferFormDialog';
import {
  exportIncomeTransactionsToCSV,
  exportExpenseTransactionsToCSV,
  exportSavingsTransactionsToCSV,
  exportTransferTransactionsToCSV,
  exportIncomeTransactionsToExcel,
  exportExpenseTransactionsToExcel,
  exportSavingsTransactionsToExcel,
  exportTransferTransactionsToExcel,
  exportIncomeTransactionsToPDF,
  exportExpenseTransactionsToPDF,
  exportSavingsTransactionsToPDF,
  exportTransferTransactionsToPDF,
  downloadCSV,
  downloadExcel,
  type ExportFormat,
} from '../utils/transactionExport';
import { useExportHistoryStore } from '../store/useExportHistoryStore';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
  TransferTransaction,
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

import type { TabValue } from '../components/transactions/TransactionFormDialog';
type ExtendedTabValue = TabValue | 'transfers';

export function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ExtendedTabValue>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'expense' || tabParam === 'savings' || tabParam === 'transfers') {
      return tabParam;
    }
    return 'income';
  });
  const { transactions: incomeTransactions, createTransaction: createIncome, updateTransaction: updateIncome, deleteTransaction: deleteIncome } = useIncomeTransactionsStore();
  const { transactions: expenseTransactions, createTransaction: createExpense, updateTransaction: updateExpense, deleteTransaction: deleteExpense } = useExpenseTransactionsStore();
  const { transactions: savingsTransactions, createTransaction: createSavings, updateTransaction: updateSavings, deleteTransaction: deleteSavings } = useSavingsInvestmentTransactionsStore();
  const { transfers: transferTransactions, deleteTransfer } = useTransferTransactionsStore();
  const { accounts } = useBankAccountsStore();
  const { showSuccess, showError, showToast } = useToastStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<
    IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction | null
  >(null);
  const [editingTransfer, setEditingTransfer] = useState<TransferTransaction | null>(null);
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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<{ id: string; type: ExtendedTabValue } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
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

  const accountsMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((acc) => map.set(acc.id, acc.name));
    return map;
  }, [accounts]);

  // Filter transactions based on current filters
  const filteredAndSortedTransactions = useMemo(() => {
    let transactions: Array<IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction | TransferTransaction> = [];

    if (activeTab === 'income') {
      transactions = incomeTransactions;
    } else if (activeTab === 'expense') {
      transactions = expenseTransactions;
    } else if (activeTab === 'savings') {
      transactions = savingsTransactions;
    } else {
      // transfers tab
      transactions = transferTransactions;
    }

    const filtered = transactions.filter((t) => {
      // Date range filter
      if (filters.dateFrom && t.date < filters.dateFrom) return false;
      if (filters.dateTo && t.date > filters.dateTo) return false;

      // Account filter
      if (filters.accountId) {
        if (activeTab === 'transfers') {
          const transfer = t as TransferTransaction;
          if (transfer.fromAccountId !== filters.accountId && transfer.toAccountId !== filters.accountId) {
            return false;
          }
        } else {
          const transaction = t as IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction;
          if (transaction.accountId !== filters.accountId) return false;
        }
      }

      // Category filter
      if (filters.category) {
        if (activeTab === 'income' && (t as IncomeTransaction).category !== filters.category) return false;
        if (activeTab === 'expense' && (t as ExpenseTransaction).category !== filters.category) return false;
        if (activeTab === 'savings' && (t as SavingsInvestmentTransaction).type !== filters.category) return false;
        if (activeTab === 'transfers' && (t as TransferTransaction).category !== filters.category) return false;
      }

      // Status filter
      if (filters.status && t.status !== filters.status) return false;

      // Full-text search across all fields
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const searchFields: string[] = [];
        
        if (activeTab === 'transfers') {
          const transfer = t as TransferTransaction;
          const fromAccount = accountsMap.get(transfer.fromAccountId) || '';
          const toAccount = accountsMap.get(transfer.toAccountId) || '';
          
          // Search across all transfer fields
          searchFields.push(
            transfer.description.toLowerCase(),
            fromAccount.toLowerCase(),
            toAccount.toLowerCase(),
            transfer.category.toLowerCase(),
            transfer.status.toLowerCase(),
            transfer.amount.toString(),
            transfer.date,
            (transfer.notes || '').toLowerCase()
          );
        } else if (activeTab === 'income') {
          const transaction = t as IncomeTransaction;
          const account = accountsMap.get(transaction.accountId) || '';
          
          // Search across all income transaction fields
          searchFields.push(
            transaction.description.toLowerCase(),
            account.toLowerCase(),
            transaction.category.toLowerCase(),
            transaction.status.toLowerCase(),
            transaction.amount.toString(),
            transaction.date,
            (transaction.clientName || '').toLowerCase(),
            (transaction.projectName || '').toLowerCase(),
            (transaction.notes || '').toLowerCase()
          );
        } else if (activeTab === 'expense') {
          const transaction = t as ExpenseTransaction;
          const account = accountsMap.get(transaction.accountId) || '';
          
          // Search across all expense transaction fields
          searchFields.push(
            transaction.description.toLowerCase(),
            account.toLowerCase(),
            transaction.category.toLowerCase(),
            transaction.bucket.toLowerCase(),
            transaction.status.toLowerCase(),
            transaction.amount.toString(),
            transaction.date,
            (transaction.dueDate || '').toLowerCase(),
            (transaction.notes || '').toLowerCase()
          );
        } else if (activeTab === 'savings') {
          const transaction = t as SavingsInvestmentTransaction;
          const account = accountsMap.get(transaction.accountId) || '';
          
          // Search across all savings transaction fields
          searchFields.push(
            (transaction.description || '').toLowerCase(),
            account.toLowerCase(),
            transaction.type.toLowerCase(),
            transaction.destination.toLowerCase(),
            transaction.status.toLowerCase(),
            transaction.amount.toString(),
            transaction.date,
            (transaction.sipNumber || '').toLowerCase(),
            (transaction.notes || '').toLowerCase()
          );
        }
        
        // Check if search term matches any field
        const matches = searchFields.some(field => field.includes(searchLower));
        if (!matches) return false;
      }

      return true;
    });

    // Sort by date (newest first)
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }, [activeTab, incomeTransactions, expenseTransactions, savingsTransactions, transferTransactions, filters, accountsMap]);

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

  const handleOpenDialog = useCallback((transactionId?: string) => {
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
  }, [activeTab, incomeTransactions, expenseTransactions, savingsTransactions]);

  // Keyboard shortcuts - moved after handleOpenDialog declaration
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
  }, [dialogOpen, accounts.length, handleOpenDialog]);

  const handleOpenTransferDialog = (transferId?: string) => {
    if (transferId) {
      const t = transferTransactions.find((t) => t.id === transferId);
      setEditingTransfer(t || null);
    } else {
      setEditingTransfer(null);
    }
    setTransferDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleCloseTransferDialog = () => {
    setTransferDialogOpen(false);
    setEditingTransfer(null);
  };

  const handleDeleteClick = (id: string, type: ExtendedTabValue) => {
    setTransactionToDelete({ id, type });
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;
    
    const { id, type } = transactionToDelete;
    setConfirmDeleteOpen(false);
    setDeletingIds(new Set([id]));
    try {
      // Store the transaction data for undo before deleting
      if (type === 'transfers') {
        const transfer = transferTransactions.find((t) => t.id === id);
        if (!transfer) {
          showError('Transfer not found');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
        deleteTransfer(id);
        // Transfers don't support undo yet (can be added later)
        showSuccess('Transfer deleted successfully');
        setDeletingIds(new Set());
        return;
      }

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
      setTransactionToDelete(null);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setConfirmBulkDeleteOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return;
    
    setConfirmBulkDeleteOpen(false);
    setIsBulkOperating(true);
    setDeletingIds(new Set(selectedIds));
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const count = selectedIds.size;
      selectedIds.forEach((id) => {
        if (activeTab === 'income') deleteIncome(id);
        else if (activeTab === 'expense') deleteExpense(id);
        else if (activeTab === 'savings') deleteSavings(id);
        else if (activeTab === 'transfers') deleteTransfer(id);
      });
      setSelectedIds(new Set());
      showSuccess(`${count} transaction(s) deleted successfully`);
    } catch (error) {
      showError(getUserFriendlyError(error, 'delete transactions'));
    } finally {
      setIsBulkOperating(false);
      setDeletingIds(new Set());
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

  // Determine which status buttons to show based on selected transactions
  const getBulkStatusButtonConfig = () => {
    if (selectedIds.size === 0 || activeTab === 'transfers') {
      return { showReceivedPaidCompleted: false, showPending: false };
    }

    // Check all filtered transactions, not just paginated ones
    const selectedTransactions = filteredAndSortedTransactions.filter((t) => selectedIds.has(t.id));
    
    if (selectedTransactions.length === 0) {
      return { showReceivedPaidCompleted: false, showPending: false };
    }

    const hasPending = selectedTransactions.some((t) => {
      if (activeTab === 'income') {
        return (t as IncomeTransaction).status === 'Pending';
      } else if (activeTab === 'expense') {
        return (t as ExpenseTransaction).status === 'Pending';
      } else {
        return (t as SavingsInvestmentTransaction).status === 'Pending';
      }
    });
    const hasNonPending = selectedTransactions.some((t) => {
      if (activeTab === 'income') {
        return (t as IncomeTransaction).status === 'Received';
      } else if (activeTab === 'expense') {
        return (t as ExpenseTransaction).status === 'Paid';
      } else {
        return (t as SavingsInvestmentTransaction).status === 'Completed';
      }
    });

    return {
      showReceivedPaidCompleted: hasPending, // Show if any are Pending
      showPending: hasNonPending, // Show if any are non-Pending
    };
  };

  const { addExport } = useExportHistoryStore();

  // Get transactions to export (selected if any, otherwise filtered)
  const getTransactionsToExport = () => {
    if (selectedIds.size > 0) {
      // Export selected transactions only
      return filteredAndSortedTransactions.filter((t) => selectedIds.has(t.id));
    }
    // Export all filtered transactions
    return filteredAndSortedTransactions;
  };

  const handleExport = (format: ExportFormat = 'csv') => {
    setExportMenuAnchor(null);
    
    const transactionsToExport = getTransactionsToExport();
    if (transactionsToExport.length === 0) {
      showError('No transactions to export');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const isSelected = selectedIds.size > 0;
    const suffix = isSelected ? `-selected-${selectedIds.size}` : '';
    let filename = '';
    let exportType: 'income' | 'expense' | 'savings' | 'transfers' = 'income';

    if (activeTab === 'income') {
      exportType = 'income';
      if (format === 'csv') {
        const csvContent = exportIncomeTransactionsToCSV(transactionsToExport as IncomeTransaction[], accounts);
        filename = `income-transactions${suffix}-${dateStr}.csv`;
        downloadCSV(csvContent, filename);
      } else if (format === 'xlsx') {
        const excelData = exportIncomeTransactionsToExcel(transactionsToExport as IncomeTransaction[], accounts);
        filename = `income-transactions${suffix}-${dateStr}.xlsx`;
        downloadExcel(excelData, filename);
      } else if (format === 'pdf') {
        filename = `income-transactions${suffix}-${dateStr}.pdf`;
        exportIncomeTransactionsToPDF(transactionsToExport as IncomeTransaction[], accounts, filename);
      }
    } else if (activeTab === 'expense') {
      exportType = 'expense';
      if (format === 'csv') {
        const csvContent = exportExpenseTransactionsToCSV(transactionsToExport as ExpenseTransaction[], accounts);
        filename = `expense-transactions${suffix}-${dateStr}.csv`;
        downloadCSV(csvContent, filename);
      } else if (format === 'xlsx') {
        const excelData = exportExpenseTransactionsToExcel(transactionsToExport as ExpenseTransaction[], accounts);
        filename = `expense-transactions${suffix}-${dateStr}.xlsx`;
        downloadExcel(excelData, filename);
      } else if (format === 'pdf') {
        filename = `expense-transactions${suffix}-${dateStr}.pdf`;
        exportExpenseTransactionsToPDF(transactionsToExport as ExpenseTransaction[], accounts, filename);
      }
    } else if (activeTab === 'savings') {
      exportType = 'savings';
      if (format === 'csv') {
        const csvContent = exportSavingsTransactionsToCSV(transactionsToExport as SavingsInvestmentTransaction[], accounts);
        filename = `savings-transactions${suffix}-${dateStr}.csv`;
        downloadCSV(csvContent, filename);
      } else if (format === 'xlsx') {
        const excelData = exportSavingsTransactionsToExcel(transactionsToExport as SavingsInvestmentTransaction[], accounts);
        filename = `savings-transactions${suffix}-${dateStr}.xlsx`;
        downloadExcel(excelData, filename);
      } else if (format === 'pdf') {
        filename = `savings-transactions${suffix}-${dateStr}.pdf`;
        exportSavingsTransactionsToPDF(transactionsToExport as SavingsInvestmentTransaction[], accounts, filename);
      }
    } else if (activeTab === 'transfers') {
      exportType = 'transfers';
      if (format === 'csv') {
        const csvContent = exportTransferTransactionsToCSV(transactionsToExport as TransferTransaction[], accounts);
        filename = `transfers${suffix}-${dateStr}.csv`;
        downloadCSV(csvContent, filename);
      } else if (format === 'xlsx') {
        const excelData = exportTransferTransactionsToExcel(transactionsToExport as TransferTransaction[], accounts);
        filename = `transfers${suffix}-${dateStr}.xlsx`;
        downloadExcel(excelData, filename);
      } else if (format === 'pdf') {
        filename = `transfers${suffix}-${dateStr}.pdf`;
        exportTransferTransactionsToPDF(transactionsToExport as TransferTransaction[], accounts, filename);
      }
    }

    // Track export history
    addExport({
      type: exportType,
      filename,
      transactionCount: transactionsToExport.length,
    });

    showSuccess(
      `Exported ${transactionsToExport.length} transaction${transactionsToExport.length !== 1 ? 's' : ''} ` +
      `(${isSelected ? 'selected' : 'filtered'}) to ${format.toUpperCase()}`
    );
  };

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
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
              {selectedIds.size > 0 && activeTab !== 'transfers' && (() => {
                const { showReceivedPaidCompleted, showPending } = getBulkStatusButtonConfig();
                return (
                  <>
                    {showReceivedPaidCompleted && (
                      <ButtonWithLoading
                        variant="outlined"
                        color="success"
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
                    )}
                    {showPending && (
                      <ButtonWithLoading
                        variant="outlined"
                        color="warning"
                        loading={isBulkOperating}
                        disabled={isBulkOperating}
                        onClick={() => {
                          handleBulkStatusUpdate('Pending');
                        }}
                      >
                        Mark as Pending ({selectedIds.size})
                      </ButtonWithLoading>
                    )}
                    <ButtonWithLoading
                      variant="outlined"
                      color="error"
                      loading={isBulkOperating}
                      disabled={isBulkOperating}
                      onClick={handleBulkDeleteClick}
                    >
                      Delete ({selectedIds.size})
                    </ButtonWithLoading>
                  </>
                );
              })()}
          <Box sx={{ position: 'relative' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              endIcon={<ArrowDropDownIcon />}
              onClick={handleExportMenuOpen}
              disabled={filteredAndSortedTransactions.length === 0 && selectedIds.size === 0}
              aria-label="Export transactions"
              aria-haspopup="true"
              aria-expanded={Boolean(exportMenuAnchor)}
              fullWidth={isMobile}
              size={isMobile ? 'medium' : 'large'}
            >
              {selectedIds.size > 0 
                ? `Export Selected (${selectedIds.size})`
                : `Export${filteredAndSortedTransactions.length > 0 ? ` (${filteredAndSortedTransactions.length})` : ''}`
              }
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleExportMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem 
                onClick={() => handleExport('csv')}
                disabled={filteredAndSortedTransactions.length === 0 && selectedIds.size === 0}
              >
                Export as CSV
              </MenuItem>
              <MenuItem 
                onClick={() => handleExport('xlsx')}
                disabled={filteredAndSortedTransactions.length === 0 && selectedIds.size === 0}
              >
                Export as Excel (.xlsx)
              </MenuItem>
              <MenuItem 
                onClick={() => handleExport('pdf')}
                disabled={filteredAndSortedTransactions.length === 0 && selectedIds.size === 0}
              >
                Export as PDF
              </MenuItem>
            </Menu>
          </Box>
          {activeTab === 'transfers' ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenTransferDialog()}
              disabled={accounts.length === 0}
              title={accounts.length === 0 ? 'Please create at least one bank account first' : ''}
              aria-label={accounts.length === 0 ? 'Add transfer (requires at least one bank account)' : 'Add new transfer'}
              fullWidth={isMobile}
              size={isMobile ? 'medium' : 'large'}
            >
              Add Transfer
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              disabled={accounts.length === 0}
              title={accounts.length === 0 ? 'Please create at least one bank account first' : ''}
              aria-label={accounts.length === 0 ? 'Add transaction (requires at least one bank account)' : 'Add new transaction'}
              fullWidth={isMobile}
              size={isMobile ? 'medium' : 'large'}
            >
              Add Transaction
            </Button>
          )}
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
          <Tab label="Transfers" value="transfers" aria-controls="transfers-tabpanel" />
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
                {activeTab !== 'transfers' && <TableCell>Account</TableCell>}
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
                  columns={activeTab === 'income' ? 8 : activeTab === 'expense' ? 9 : activeTab === 'savings' ? 9 : 10} 
                />
              ) : activeTab === 'income' && (
                <>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ border: 'none', py: 4 }}>
                        <EmptyState
                          icon={<AttachMoneyIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />}
                          title={
                            incomeTransactions.length === 0
                              ? 'No Income Transactions Yet'
                              : filteredAndSortedTransactions.length === 0
                              ? 'No Transactions Match Filters'
                              : 'No Transactions on This Page'
                          }
                          description={
                            incomeTransactions.length === 0
                              ? 'Start tracking your income by adding your first income transaction. Record salaries, bonuses, freelancing, and other income sources.'
                              : filteredAndSortedTransactions.length === 0
                              ? 'Try adjusting your search or filter criteria to find the transactions you\'re looking for.'
                              : 'Navigate to a different page to see more transactions.'
                          }
                          action={
                            incomeTransactions.length === 0 && accounts.length > 0
                              ? {
                                  label: 'Add Income Transaction',
                                  onClick: () => handleOpenDialog('income'),
                                  icon: <AddIcon />,
                                }
                              : undefined
                          }
                        />
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
                              onClick={() => handleDeleteClick(transaction.id, 'income')} 
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
                      <TableCell colSpan={9} align="center" sx={{ border: 'none', py: 4 }}>
                        <EmptyState
                          icon={<ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />}
                          title={
                            expenseTransactions.length === 0
                              ? 'No Expense Transactions Yet'
                              : filteredAndSortedTransactions.length === 0
                              ? 'No Transactions Match Filters'
                              : 'No Transactions on This Page'
                          }
                          description={
                            expenseTransactions.length === 0
                              ? 'Start tracking your expenses by adding your first expense transaction. Record bills, utilities, responsibilities, and other expenses.'
                              : filteredAndSortedTransactions.length === 0
                              ? 'Try adjusting your search or filter criteria to find the transactions you\'re looking for.'
                              : 'Navigate to a different page to see more transactions.'
                          }
                          action={
                            expenseTransactions.length === 0 && accounts.length > 0
                              ? {
                                  label: 'Add Expense Transaction',
                                  onClick: () => handleOpenDialog('expense'),
                                  icon: <AddIcon />,
                                }
                              : undefined
                          }
                        />
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
                              onClick={() => handleDeleteClick(transaction.id, 'expense')} 
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
                      <TableCell colSpan={9} align="center" sx={{ border: 'none', py: 4 }}>
                        <EmptyState
                          icon={<SavingsIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />}
                          title={
                            savingsTransactions.length === 0
                              ? 'No Savings/Investment Transactions Yet'
                              : filteredAndSortedTransactions.length === 0
                              ? 'No Transactions Match Filters'
                              : 'No Transactions on This Page'
                          }
                          description={
                            savingsTransactions.length === 0
                              ? 'Start tracking your savings and investments by adding your first transaction. Record SIPs, lump sum investments, withdrawals, and returns.'
                              : filteredAndSortedTransactions.length === 0
                              ? 'Try adjusting your search or filter criteria to find the transactions you\'re looking for.'
                              : 'Navigate to a different page to see more transactions.'
                          }
                          action={
                            savingsTransactions.length === 0 && accounts.length > 0
                              ? {
                                  label: 'Add Savings/Investment Transaction',
                                  onClick: () => handleOpenDialog('savings'),
                                  icon: <AddIcon />,
                                }
                              : undefined
                          }
                        />
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
                              onClick={() => handleDeleteClick(transaction.id, 'savings')} 
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

              {activeTab === 'transfers' && (
                <>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ border: 'none', py: 4 }}>
                        <EmptyState
                          icon={<SwapHorizIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />}
                          title={
                            transferTransactions.length === 0
                              ? 'No Transfers Yet'
                              : filteredAndSortedTransactions.length === 0
                              ? 'No Transfers Match Filters'
                              : 'No Transfers on This Page'
                          }
                          description={
                            transferTransactions.length === 0
                              ? 'Start tracking transfers between your accounts. Record money movements from one account to another.'
                              : filteredAndSortedTransactions.length === 0
                              ? 'Try adjusting your search or filter criteria to find the transfers you\'re looking for.'
                              : 'Navigate to a different page to see more transfers.'
                          }
                          action={
                            transferTransactions.length === 0 && accounts.length > 0
                              ? {
                                  label: 'Add Transfer',
                                  onClick: () => handleOpenTransferDialog(),
                                  icon: <AddIcon />,
                                }
                              : undefined
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    (paginatedTransactions as TransferTransaction[])
                      .map((transfer) => (
                        <TableRow key={transfer.id} hover>
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              onClick={() => handleSelectTransaction(transfer.id)}
                              aria-label={`Select transfer ${transfer.description || transfer.id}`}
                            >
                              {selectedIds.has(transfer.id) ? (
                                <CheckBoxIcon fontSize="small" />
                              ) : (
                                <CheckBoxOutlineBlankIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell>{formatDate(transfer.date)}</TableCell>
                          <TableCell>{accountsMap.get(transfer.fromAccountId) || '—'}</TableCell>
                          <TableCell>{accountsMap.get(transfer.toAccountId) || '—'}</TableCell>
                          <TableCell>{transfer.category}</TableCell>
                          <TableCell>{transfer.description}</TableCell>
                          <TableCell align="right">{formatCurrency(transfer.amount)}</TableCell>
                          <TableCell>
                            <Chip
                              label={transfer.status}
                              size="small"
                              color={transfer.status === 'Completed' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenTransferDialog(transfer.id)}
                              disabled={isBulkOperating || deletingIds.has(transfer.id)}
                              aria-label={`Edit transfer ${transfer.description || transfer.id}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteClick(transfer.id, 'transfers')} 
                              color="error"
                              disabled={isBulkOperating || deletingIds.has(transfer.id)}
                              aria-label={`Delete transfer ${transfer.description || transfer.id}`}
                            >
                              {deletingIds.has(transfer.id) ? (
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
          type={activeTab === 'transfers' ? 'income' : activeTab}
          accounts={accounts}
          editingTransaction={editingTransaction}
          isSaving={isSaving}
        onSave={async (data: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> | Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> | Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
          setIsSaving(true);
          try {
            await new Promise((resolve) => setTimeout(resolve, 200));
            
            if (activeTab === 'income') {
              if (editingTransaction) {
                // For updates, pass data as Partial<Omit<IncomeTransaction, 'id' | 'createdAt'>>
                updateIncome(editingTransaction.id, data as Partial<Omit<IncomeTransaction, 'id' | 'createdAt'>>);
                showSuccess('Income transaction updated successfully');
              } else {
                // For creates, pass data as Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'>
                createIncome(data as Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'>);
                showSuccess('Income transaction created successfully');
              }
            } else if (activeTab === 'expense') {
              if (editingTransaction) {
                updateExpense(editingTransaction.id, data as Partial<Omit<ExpenseTransaction, 'id' | 'createdAt'>>);
                showSuccess('Expense transaction updated successfully');
              } else {
                createExpense(data as Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'>);
                showSuccess('Expense transaction created successfully');
              }
            } else if (activeTab === 'savings') {
              if (editingTransaction) {
                updateSavings(editingTransaction.id, data as Partial<Omit<SavingsInvestmentTransaction, 'id' | 'createdAt'>>);
                showSuccess('Savings transaction updated successfully');
              } else {
                createSavings(data as Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'>);
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

      <TransferFormDialog
        open={transferDialogOpen}
        onClose={handleCloseTransferDialog}
        accounts={accounts}
        editingTransfer={editingTransfer}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone, but you can use the undo option in the notification."
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setTransactionToDelete(null);
        }}
      />

      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        title="Delete Transactions"
        message={`Are you sure you want to delete ${selectedIds.size} transaction(s)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => {
          setConfirmBulkDeleteOpen(false);
        }}
      />
    </Stack>
  );
}

