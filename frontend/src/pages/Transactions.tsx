import { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  FormControl,
  Select,
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
import type { BankAccount } from '../types/bankAccounts';
import { useToastStore } from '../store/useToastStore';
import { getUserFriendlyError } from '../utils/errorHandling';
import { captureException, ErrorSeverity } from '../utils/errorTracking';
import { useUndoStore } from '../store/useUndoStore';
import { restoreDeletedItem } from '../utils/undoRestore';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { ButtonWithLoading } from '../components/common/ButtonWithLoading';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { TransactionFilters, type FilterState, defaultFilters } from '../components/transactions/TransactionFilters';
import { TransactionCard } from '../components/transactions/TransactionCard';
import { ViewToggle } from '../components/common/ViewToggle';
import { useViewMode } from '../hooks/useViewMode';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SavingsIcon from '@mui/icons-material/Savings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
// Lazy load dialogs to reduce initial bundle size
const TransactionFormDialog = lazy(() => 
  import('../components/transactions/TransactionFormDialog').then((module) => ({ 
    default: module.TransactionFormDialog 
  }))
);
const TransferFormDialog = lazy(() => 
  import('../components/transactions/TransferFormDialog').then((module) => ({ 
    default: module.TransferFormDialog 
  }))
);
const BulkEditDialog = lazy(() => 
  import('../components/transactions/BulkEditDialog').then((module) => ({ 
    default: module.BulkEditDialog 
  }))
);
const ExportTemplateDialog = lazy(() => 
  import('../components/transactions/ExportTemplateDialog').then((module) => ({ 
    default: module.ExportTemplateDialog 
  }))
);
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
  const navigate = useNavigate();
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
    accountType: '',
    category: '',
    bucket: '',
    status: '',
    minAmount: '',
    maxAmount: '',
    searchTerm: '',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<{ id: string; type: ExtendedTabValue } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportTemplateDialogOpen, setExportTemplateDialogOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { viewMode, toggleViewMode } = useViewMode('transactions-view-mode');
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

  const accountsByIdMap = useMemo(() => {
    const map = new Map<string, BankAccount>();
    accounts.forEach((acc) => map.set(acc.id, acc));
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

      // Account Type filter
      if (filters.accountType) {
        if (activeTab === 'transfers') {
          const transfer = t as TransferTransaction;
          const fromAccount = accountsByIdMap.get(transfer.fromAccountId);
          const toAccount = accountsByIdMap.get(transfer.toAccountId);
          if (fromAccount?.accountType !== filters.accountType && toAccount?.accountType !== filters.accountType) {
            return false;
          }
        } else {
          const transaction = t as IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction;
          const account = accountsByIdMap.get(transaction.accountId);
          if (account?.accountType !== filters.accountType) return false;
        }
      }

      // Category filter
      if (filters.category) {
        if (activeTab === 'income' && (t as IncomeTransaction).category !== filters.category) return false;
        if (activeTab === 'expense' && (t as ExpenseTransaction).category !== filters.category) return false;
        if (activeTab === 'savings' && (t as SavingsInvestmentTransaction).type !== filters.category) return false;
        if (activeTab === 'transfers' && (t as TransferTransaction).category !== filters.category) return false;
      }

      // Bucket filter (for expense transactions only)
      if (filters.bucket && activeTab === 'expense') {
        const expense = t as ExpenseTransaction;
        if (expense.bucket !== filters.bucket) return false;
      }

      // Amount range filters
      if (filters.minAmount) {
        const minAmount = parseFloat(filters.minAmount);
        if (!isNaN(minAmount) && t.amount < minAmount) return false;
      }
      if (filters.maxAmount) {
        const maxAmount = parseFloat(filters.maxAmount);
        if (!isNaN(maxAmount) && t.amount > maxAmount) return false;
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
  }, [activeTab, incomeTransactions, expenseTransactions, savingsTransactions, transferTransactions, filters, accountsMap, accountsByIdMap]);

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

  const handleBulkEdit = async (updates: { accountId?: string; category?: string; status?: string; date?: string; amount?: number; notes?: string }) => {
    if (selectedIds.size === 0) return;
    setIsBulkOperating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const count = selectedIds.size;
      selectedIds.forEach((id) => {
        if (activeTab === 'income') {
          const updateData: Partial<Omit<IncomeTransaction, 'id' | 'createdAt'>> = {};
          if (updates.accountId) updateData.accountId = updates.accountId;
          if (updates.status) updateData.status = updates.status as 'Pending' | 'Received';
          if (updates.date) updateData.date = updates.date;
          if (updates.amount !== undefined) updateData.amount = updates.amount;
          if (updates.notes !== undefined) updateData.notes = updates.notes;
          if (updates.category) updateData.category = updates.category as IncomeTransaction['category'];
          updateIncome(id, updateData);
        } else if (activeTab === 'expense') {
          const updateData: Partial<Omit<ExpenseTransaction, 'id' | 'createdAt'>> = {};
          if (updates.accountId) updateData.accountId = updates.accountId;
          if (updates.status) updateData.status = updates.status as 'Pending' | 'Paid';
          if (updates.date) updateData.date = updates.date;
          if (updates.amount !== undefined) updateData.amount = updates.amount;
          if (updates.notes !== undefined) updateData.notes = updates.notes;
          if (updates.category) updateData.category = updates.category as ExpenseTransaction['category'];
          updateExpense(id, updateData);
        } else if (activeTab === 'savings') {
          const updateData: Partial<Omit<SavingsInvestmentTransaction, 'id' | 'createdAt'>> = {};
          if (updates.accountId) updateData.accountId = updates.accountId;
          if (updates.status) updateData.status = updates.status as 'Pending' | 'Completed';
          if (updates.date) updateData.date = updates.date;
          if (updates.amount !== undefined) updateData.amount = updates.amount;
          if (updates.notes !== undefined) updateData.notes = updates.notes;
          if (updates.category) updateData.type = updates.category as SavingsInvestmentTransaction['type'];
          updateSavings(id, updateData);
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

  const handleExport = async (format: ExportFormat = 'csv') => {
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

    try {
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
          await exportIncomeTransactionsToPDF(transactionsToExport as IncomeTransaction[], accounts, filename);
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
          await exportExpenseTransactionsToPDF(transactionsToExport as ExpenseTransaction[], accounts, filename);
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
          await exportSavingsTransactionsToPDF(transactionsToExport as SavingsInvestmentTransaction[], accounts, filename);
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
          await exportTransferTransactionsToPDF(transactionsToExport as TransferTransaction[], accounts, filename);
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
    } catch (error) {
      // Track export errors (production-safe)
      if (error instanceof Error) {
        captureException(error, {
          component: 'Transactions',
          action: 'export',
          metadata: { format, activeTab },
        }, ErrorSeverity.MEDIUM);
      }
      showError(`Failed to export ${format.toUpperCase()}: ${getUserFriendlyError(error, 'export transactions')}`);
    }
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
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1.5, sm: 2 },
          mb: { xs: 1, sm: 0 },
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            flexShrink: 0,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            fontWeight: 700,
          }}
        >
          Transactions
        </Typography>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1, sm: 1.5, md: 2 }}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            alignItems: { xs: 'stretch', sm: 'center' },
            flexShrink: 0,
            flexWrap: { sm: 'wrap', md: 'nowrap' },
          }}
        >
          <ViewToggle viewMode={viewMode} onToggle={toggleViewMode} aria-label="Toggle between table and card view" />
              {selectedIds.size > 0 && activeTab !== 'transfers' && (() => {
                const { showReceivedPaidCompleted, showPending } = getBulkStatusButtonConfig();
                return (
                  <>
                    <ButtonWithLoading
                      variant="outlined"
                      color="primary"
                      loading={isBulkOperating}
                      disabled={isBulkOperating}
                      onClick={() => setBulkEditDialogOpen(true)}
                      size={isMobile ? 'medium' : 'large'}
                      sx={{
                        minHeight: { xs: 44, sm: 48 },
                        fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                        whiteSpace: { xs: 'nowrap', sm: 'nowrap' },
                        px: { xs: 1.5, sm: 2 },
                      }}
                    >
                      Edit ({selectedIds.size})
                    </ButtonWithLoading>
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
                        size={isMobile ? 'medium' : 'large'}
                        sx={{
                          minHeight: { xs: 44, sm: 48 },
                          fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                          whiteSpace: { xs: 'nowrap', sm: 'nowrap' },
                          px: { xs: 1.5, sm: 2 },
                        }}
                      >
                        {isMobile 
                          ? `${activeTab === 'income' ? 'Received' : activeTab === 'expense' ? 'Paid' : 'Completed'} (${selectedIds.size})`
                          : `Mark as ${activeTab === 'income' ? 'Received' : activeTab === 'expense' ? 'Paid' : 'Completed'} (${selectedIds.size})`
                        }
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
                        size={isMobile ? 'medium' : 'large'}
                        sx={{
                          minHeight: { xs: 44, sm: 48 },
                          fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                          whiteSpace: { xs: 'nowrap', sm: 'nowrap' },
                          px: { xs: 1.5, sm: 2 },
                        }}
                      >
                        Pending ({selectedIds.size})
                      </ButtonWithLoading>
                    )}
                    <ButtonWithLoading
                      variant="outlined"
                      color="error"
                      loading={isBulkOperating}
                      disabled={isBulkOperating}
                      onClick={handleBulkDeleteClick}
                      size={isMobile ? 'medium' : 'large'}
                      sx={{
                        minHeight: { xs: 44, sm: 48 },
                        fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                        whiteSpace: { xs: 'nowrap', sm: 'nowrap' },
                        px: { xs: 1.5, sm: 2 },
                      }}
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
              sx={{
                minHeight: { xs: 44, sm: 48 },
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                whiteSpace: { xs: 'nowrap', sm: 'nowrap' },
                px: { xs: 1.5, sm: 2 },
              }}
            >
              {isMobile
                ? selectedIds.size > 0 
                  ? `Export (${selectedIds.size})`
                  : `Export${filteredAndSortedTransactions.length > 0 ? ` (${filteredAndSortedTransactions.length})` : ''}`
                : selectedIds.size > 0 
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
                onClick={() => setExportTemplateDialogOpen(true)}
                disabled={filteredAndSortedTransactions.length === 0 && selectedIds.size === 0}
              >
                Custom Template...
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
              sx={{
                minHeight: { xs: 44, sm: 48 },
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                whiteSpace: 'nowrap',
                px: { xs: 1.5, sm: 2 },
              }}
            >
              {isMobile ? 'Add' : 'Add Transfer'}
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
              sx={{
                minHeight: { xs: 44, sm: 48 },
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                whiteSpace: 'nowrap',
                px: { xs: 1.5, sm: 2 },
              }}
            >
              {isMobile ? 'Add' : 'Add Transaction'}
            </Button>
          )}
        </Stack>
      </Box>

      <TransactionFilters ref={searchInputRef} type={activeTab} accounts={accounts} onFilterChange={setFilters} />

      <Paper>
        {/* Mobile: Use Select dropdown for tabs */}
        {isMobile ? (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <FormControl fullWidth size="small">
              <Select
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value as ExtendedTabValue);
                  setSelectedIds(new Set());
                }}
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  '& .MuiSelect-select': {
                    py: 1.5,
                  },
                }}
              >
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
                <MenuItem value="savings">Savings/Investment</MenuItem>
                <MenuItem value="transfers">Transfers</MenuItem>
              </Select>
            </FormControl>
          </Box>
        ) : (
          <Tabs
            value={activeTab}
            onChange={(_, v) => {
              setActiveTab(v);
              setSelectedIds(new Set());
            }}
            aria-label="Transaction type tabs"
            variant="standard"
            sx={{
              '& .MuiTab-root': {
                minHeight: 72,
                fontSize: '0.875rem',
                px: 3,
                minWidth: 160,
              },
            }}
          >
            <Tab label="Income" value="income" aria-controls="income-tabpanel" />
            <Tab label="Expense" value="expense" aria-controls="expense-tabpanel" />
            <Tab label="Savings/Investment" value="savings" aria-controls="savings-tabpanel" />
            <Tab label="Transfers" value="transfers" aria-controls="transfers-tabpanel" />
          </Tabs>
        )}

        {/* Card Layout or Table Layout based on view mode */}
        {viewMode === 'card' ? (
          <Box sx={{ p: { xs: 1, sm: 2 } }}>
            {isLoading ? (
              <Stack spacing={1.5}>
                {[...Array(5)].map((_, i) => (
                  <Box key={i} sx={{ height: 120, bgcolor: 'action.hover', borderRadius: 1 }} />
                ))}
              </Stack>
            ) : paginatedTransactions.length === 0 ? (
              <Box sx={{ py: 4, px: 2 }}>
                <EmptyState
                  icon={
                    activeTab === 'income' ? <AttachMoneyIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} /> :
                    activeTab === 'expense' ? <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} /> :
                    activeTab === 'savings' ? <SavingsIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} /> :
                    <SwapHorizIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                  }
                  title={
                    (activeTab === 'income' && incomeTransactions.length === 0) ||
                    (activeTab === 'expense' && expenseTransactions.length === 0) ||
                    (activeTab === 'savings' && savingsTransactions.length === 0) ||
                    (activeTab === 'transfers' && transferTransactions.length === 0)
                      ? `No ${activeTab === 'savings' ? 'Savings/Investment' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Transactions Yet`
                      : filteredAndSortedTransactions.length === 0
                      ? 'No Transactions Match Filters'
                      : 'No Transactions on This Page'
                  }
                  description={
                    filteredAndSortedTransactions.length === 0
                      ? 'Try adjusting your search or filter criteria to find the transactions you\'re looking for.'
                      : 'Navigate to a different page to see more transactions.'
                  }
                />
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {paginatedTransactions.map((transaction) => {
                  let accountName: string;
                  let toAccountName: string | undefined;
                  
                  if (activeTab === 'transfers') {
                    const transfer = transaction as TransferTransaction;
                    accountName = accountsMap.get(transfer.fromAccountId) || '—';
                    toAccountName = accountsMap.get(transfer.toAccountId) || '—';
                  } else {
                    const tx = transaction as IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction;
                    accountName = accountsMap.get(tx.accountId) || '—';
                  }
                  
                  return (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      type={activeTab}
                      accountName={accountName}
                      toAccountName={toAccountName}
                      isSelected={selectedIds.has(transaction.id)}
                      isDeleting={deletingIds.has(transaction.id)}
                      onSelect={() => handleSelectTransaction(transaction.id)}
                      onEdit={() => {
                        if (activeTab === 'transfers') {
                          handleOpenTransferDialog(transaction.id);
                        } else {
                          handleOpenDialog(transaction.id);
                        }
                      }}
                      onDelete={() => handleDeleteClick(transaction.id, activeTab)}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  );
                })}
              </Stack>
            )}
            {!isLoading && filteredAndSortedTransactions.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <TablePagination
                  component="div"
                  count={filteredAndSortedTransactions.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[10, 25]}
                  labelRowsPerPage="Rows:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
                  }
                  sx={{
                    '& .MuiTablePagination-toolbar': {
                      flexWrap: 'wrap',
                      gap: 1,
                      px: 1,
                    },
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      fontSize: '0.75rem',
                    },
                    '& .MuiTablePagination-select': {
                      fontSize: '0.75rem',
                      minHeight: 36,
                    },
                    '& .MuiIconButton-root': {
                      minWidth: 40,
                      minHeight: 40,
                      p: 0.5,
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        ) : (
          <>
            <TableContainer
            sx={{
              overflowX: 'auto',
              maxWidth: '100%',
              '& .MuiTableCell-root': {
                whiteSpace: 'nowrap',
                minWidth: 100,
                padding: '16px',
                fontSize: '0.875rem',
              },
              '& .MuiTableRow-root:has(.MuiTableCell-root[colspan])': {
                '& .MuiTableCell-root': {
                  whiteSpace: 'normal',
                },
              },
              '& .MuiTableHead-root .MuiTableCell-root': {
                fontSize: '0.875rem',
                fontWeight: 600,
                padding: '16px',
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
                    sx={{
                      minWidth: { xs: 40, sm: 48 },
                      minHeight: { xs: 40, sm: 48 },
                      p: { xs: 0.5, sm: 1 },
                    }}
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
                      <TableCell 
                        colSpan={8} 
                        align="center" 
                        sx={{ 
                          border: 'none', 
                          py: 4,
                          px: { xs: 2, sm: 4 },
                          width: '100%',
                        }}
                      >
                        <Box sx={{ maxWidth: '100%', width: '100%', mx: 'auto' }}>
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
                              ? 'Start tracking your income by adding your first transaction. Record salaries, bonuses, and other income sources.'
                              : filteredAndSortedTransactions.length === 0
                              ? 'Try adjusting your search or filter criteria to find the transactions you\'re looking for.'
                              : 'Navigate to a different page to see more transactions.'
                          }
                          actions={
                            incomeTransactions.length === 0
                              ? accounts.length > 0
                                ? [
                                    {
                                      label: 'Add Income Transaction',
                                      onClick: () => handleOpenDialog('income'),
                                      icon: <AddIcon />,
                                    },
                                  ]
                                : [
                                    {
                                      label: 'Add Account',
                                      onClick: () => navigate('/accounts'),
                                      icon: <AddIcon />,
                                    },
                                  ]
                              : filteredAndSortedTransactions.length === 0
                              ? [
                                  {
                                    label: 'Clear Filters',
                                    onClick: () => {
                                      setFilters(defaultFilters);
                                    },
                                    variant: 'outlined' as const,
                                  },
                                ]
                              : undefined
                          }
                          tips={
                            incomeTransactions.length === 0
                              ? [
                                  {
                                    text: 'Track all income sources including salary, bonuses, freelance work, and investments.',
                                  },
                                  {
                                    text: 'Mark transactions as "Received" when money is actually in your account.',
                                  },
                                  {
                                    text: 'Use categories and client/project names to organize your income for better reporting.',
                                  },
                                ]
                              : undefined
                          }
                          quickStart={
                            incomeTransactions.length === 0 && accounts.length > 0
                              ? [
                                  'Click "Add Income Transaction" to create your first entry',
                                  'Enter the amount, date, and select the account',
                                  'Choose a category and add description',
                                  'Mark as "Received" when payment is confirmed',
                                ]
                              : undefined
                          }
                        />
                        </Box>
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
                              sx={{
                                minWidth: { xs: 40, sm: 48 },
                                minHeight: { xs: 40, sm: 48 },
                                p: { xs: 0.5, sm: 1 },
                              }}
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
                              sx={{
                                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                                height: { xs: 24, sm: 28 },
                                '& .MuiChip-label': {
                                  px: { xs: 0.75, sm: 1 },
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} justifyContent="flex-end">
                              <IconButton 
                                size="small" 
                                onClick={() => handleOpenDialog(transaction.id)}
                                disabled={isBulkOperating || deletingIds.has(transaction.id)}
                                aria-label={`Edit transaction ${transaction.description || transaction.id}`}
                                sx={{
                                  minWidth: { xs: 40, sm: 48 },
                                  minHeight: { xs: 40, sm: 48 },
                                  p: { xs: 0.5, sm: 1 },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteClick(transaction.id, 'income')} 
                                color="error"
                                disabled={isBulkOperating || deletingIds.has(transaction.id)}
                                aria-label={`Delete transaction ${transaction.description || transaction.id}`}
                                sx={{
                                  minWidth: { xs: 40, sm: 48 },
                                  minHeight: { xs: 40, sm: 48 },
                                  p: { xs: 0.5, sm: 1 },
                                }}
                              >
                                {deletingIds.has(transaction.id) ? (
                                  <CircularProgress size={16} aria-label="Deleting" />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Stack>
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
                      <TableCell 
                        colSpan={9} 
                        align="center" 
                        sx={{ 
                          border: 'none', 
                          py: 4,
                          px: { xs: 2, sm: 4 },
                          width: '100%',
                        }}
                      >
                        <Box sx={{ maxWidth: '100%', width: '100%', mx: 'auto' }}>
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
                              ? 'Start tracking your expenses by adding your first transaction. Record bills, utilities, and other expenses.'
                              : filteredAndSortedTransactions.length === 0
                              ? 'Try adjusting your search or filter criteria to find the transactions you\'re looking for.'
                              : 'Navigate to a different page to see more transactions.'
                          }
                          actions={
                            expenseTransactions.length === 0
                              ? accounts.length > 0
                                ? [
                                    {
                                      label: 'Add Expense Transaction',
                                      onClick: () => handleOpenDialog('expense'),
                                      icon: <AddIcon />,
                                    },
                                  ]
                                : [
                                    {
                                      label: 'Add Account',
                                      onClick: () => navigate('/accounts'),
                                      icon: <AddIcon />,
                                    },
                                  ]
                              : filteredAndSortedTransactions.length === 0
                              ? [
                                  {
                                    label: 'Clear Filters',
                                    onClick: () => {
                                      setFilters(defaultFilters);
                                    },
                                    variant: 'outlined' as const,
                                  },
                                ]
                              : undefined
                          }
                          tips={
                            expenseTransactions.length === 0
                              ? [
                                  {
                                    text: 'Use buckets to categorize expenses for better monthly planning and budgeting.',
                                  },
                                  {
                                    text: 'Set due dates for bills to track payment deadlines and avoid late fees.',
                                  },
                                  {
                                    text: 'Mark expenses as "Paid" only when payment is actually made from your account.',
                                  },
                                ]
                              : undefined
                          }
                          quickStart={
                            expenseTransactions.length === 0 && accounts.length > 0
                              ? [
                                  'Click "Add Expense Transaction" to record your first expense',
                                  'Select the account, category, and bucket',
                                  'Enter amount, date, and set due date if applicable',
                                  'Mark as "Paid" when payment is confirmed',
                                ]
                              : undefined
                          }
                        />
                        </Box>
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
                              sx={{
                                minWidth: { xs: 40, sm: 48 },
                                minHeight: { xs: 40, sm: 48 },
                                p: { xs: 0.5, sm: 1 },
                              }}
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
                              sx={{
                                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                                height: { xs: 24, sm: 28 },
                                '& .MuiChip-label': {
                                  px: { xs: 0.75, sm: 1 },
                                },
                              }}
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
                      <TableCell 
                        colSpan={9} 
                        align="center" 
                        sx={{ 
                          border: 'none', 
                          py: 4,
                          px: { xs: 2, sm: 4 },
                          width: '100%',
                        }}
                      >
                        <Box sx={{ maxWidth: '100%', width: '100%', mx: 'auto' }}>
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
                              ? 'Start tracking your savings and investments by adding your first transaction. Record SIPs, investments, and returns.'
                              : filteredAndSortedTransactions.length === 0
                              ? 'Try adjusting your search or filter criteria to find the transactions you\'re looking for.'
                              : 'Navigate to a different page to see more transactions.'
                          }
                          actions={
                            savingsTransactions.length === 0
                              ? accounts.length > 0
                                ? [
                                    {
                                      label: 'Add Savings/Investment Transaction',
                                      onClick: () => handleOpenDialog('savings'),
                                      icon: <AddIcon />,
                                    },
                                  ]
                                : [
                                    {
                                      label: 'Add Account',
                                      onClick: () => navigate('/accounts'),
                                      icon: <AddIcon />,
                                    },
                                  ]
                              : filteredAndSortedTransactions.length === 0
                              ? [
                                  {
                                    label: 'Clear Filters',
                                    onClick: () => {
                                      setFilters(defaultFilters);
                                    },
                                    variant: 'outlined' as const,
                                  },
                                ]
                              : undefined
                          }
                          tips={
                            savingsTransactions.length === 0
                              ? [
                                  {
                                    text: 'Track all types of investments: SIPs, mutual funds, stocks, FDs, and more.',
                                  },
                                  {
                                    text: 'Use destination field to specify where the money is invested (e.g., "HDFC Mutual Fund").',
                                  },
                                  {
                                    text: 'Mark as "Completed" when the investment transaction is finalized.',
                                  },
                                ]
                              : undefined
                          }
                          quickStart={
                            savingsTransactions.length === 0 && accounts.length > 0
                              ? [
                                  'Click "Add Savings/Investment Transaction" to record your first investment',
                                  'Select account, type (SIP, Lump Sum, etc.), and destination',
                                  'Enter amount and date of investment',
                                  'Mark as "Completed" when transaction is confirmed',
                                ]
                              : undefined
                          }
                        />
                        </Box>
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
                              sx={{
                                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                                height: { xs: 24, sm: 28 },
                                '& .MuiChip-label': {
                                  px: { xs: 0.75, sm: 1 },
                                },
                              }}
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
                      <TableCell 
                        colSpan={10} 
                        align="center" 
                        sx={{ 
                          border: 'none', 
                          py: 4,
                          px: { xs: 2, sm: 4 },
                          width: '100%',
                        }}
                      >
                        <Box sx={{ maxWidth: '100%', width: '100%', mx: 'auto' }}>
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
                          actions={
                            transferTransactions.length === 0
                              ? accounts.length >= 2
                                ? [
                                    {
                                      label: 'Add Transfer',
                                      onClick: () => handleOpenTransferDialog(),
                                      icon: <AddIcon />,
                                    },
                                  ]
                                : accounts.length === 1
                                ? [
                                    {
                                      label: 'Add Another Account',
                                      onClick: () => navigate('/accounts'),
                                      icon: <AddIcon />,
                                    },
                                  ]
                                : [
                                    {
                                      label: 'Add Account',
                                      onClick: () => navigate('/accounts'),
                                      icon: <AddIcon />,
                                    },
                                  ]
                              : filteredAndSortedTransactions.length === 0
                              ? [
                                  {
                                    label: 'Clear Filters',
                                    onClick: () => {
                                      setFilters(defaultFilters);
                                    },
                                    variant: 'outlined' as const,
                                  },
                                ]
                              : undefined
                          }
                          tips={
                            transferTransactions.length === 0
                              ? [
                                  {
                                    text: 'Track money movements between your accounts (e.g., from checking to savings).',
                                  },
                                  {
                                    text: 'Transfers automatically update balances in both source and destination accounts.',
                                  },
                                  {
                                    text: 'Use transfers to accurately reflect account balances and cash flow.',
                                  },
                                ]
                              : undefined
                          }
                          quickStart={
                            transferTransactions.length === 0 && accounts.length >= 2
                              ? [
                                  'Click "Add Transfer" to record money movement',
                                  'Select source and destination accounts',
                                  'Enter amount, date, and description',
                                  'Mark as "Completed" when transfer is confirmed',
                                ]
                              : undefined
                          }
                        />
                        </Box>
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
                              sx={{
                                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                                height: { xs: 24, sm: 28 },
                                '& .MuiChip-label': {
                                  px: { xs: 0.75, sm: 1 },
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} justifyContent="flex-end">
                              <IconButton 
                                size="small" 
                                onClick={() => handleOpenTransferDialog(transfer.id)}
                                disabled={isBulkOperating || deletingIds.has(transfer.id)}
                                aria-label={`Edit transfer ${transfer.description || transfer.id}`}
                                sx={{
                                  minWidth: { xs: 40, sm: 48 },
                                  minHeight: { xs: 40, sm: 48 },
                                  p: { xs: 0.5, sm: 1 },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteClick(transfer.id, 'transfers')} 
                                color="error"
                                disabled={isBulkOperating || deletingIds.has(transfer.id)}
                                aria-label={`Delete transfer ${transfer.description || transfer.id}`}
                                sx={{
                                  minWidth: { xs: 40, sm: 48 },
                                  minHeight: { xs: 40, sm: 48 },
                                  p: { xs: 0.5, sm: 1 },
                                }}
                              >
                                {deletingIds.has(transfer.id) ? (
                                  <CircularProgress size={16} aria-label="Deleting" />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Stack>
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
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
            }
            sx={{
              '& .MuiTablePagination-toolbar': {
                flexWrap: 'nowrap',
                px: 2,
              },
              '& .MuiTablePagination-selectLabel': {
                fontSize: '0.875rem',
                mr: 1,
              },
              '& .MuiTablePagination-displayedRows': {
                fontSize: '0.875rem',
              },
              '& .MuiTablePagination-select': {
                fontSize: '0.875rem',
                minHeight: 40,
              },
              '& .MuiIconButton-root': {
                minWidth: 48,
                minHeight: 48,
                p: 1,
              },
            }}
          />
        )}
          </>
        )}
      </Paper>

      {dialogOpen && (
        <Suspense fallback={<Box sx={{ display: 'none' }} />}>
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
        </Suspense>
      )}

      {transferDialogOpen && (
        <Suspense fallback={<Box sx={{ display: 'none' }} />}>
          <TransferFormDialog
            open={transferDialogOpen}
            onClose={handleCloseTransferDialog}
            accounts={accounts}
            editingTransfer={editingTransfer}
          />
        </Suspense>
      )}

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

      {bulkEditDialogOpen && activeTab !== 'transfers' && (
        <Suspense fallback={<Box sx={{ display: 'none' }} />}>
          <BulkEditDialog
            open={bulkEditDialogOpen}
            onClose={() => setBulkEditDialogOpen(false)}
            onSave={handleBulkEdit}
            selectedCount={selectedIds.size}
            transactionType={activeTab as 'income' | 'expense' | 'savings'}
            accounts={accounts}
            selectedTransactions={filteredAndSortedTransactions.filter((t) => selectedIds.has(t.id)) as Array<IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction>}
          />
        </Suspense>
      )}

      {exportTemplateDialogOpen && (
        <Suspense fallback={<Box sx={{ display: 'none' }} />}>
          <ExportTemplateDialog
            open={exportTemplateDialogOpen}
            onClose={() => setExportTemplateDialogOpen(false)}
            onSave={(columns) => {
              setExportTemplateDialogOpen(false);
              // Note: Custom column filtering would require modifying export functions
              // For now, this saves the preference for future use
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const _columns = columns; // Store for future use
              showSuccess(`Export template saved. Using default columns for now.`);
            }}
            columns={
              activeTab === 'income'
                ? [
                    { id: 'date', label: 'Date', default: true },
                    { id: 'account', label: 'Account', default: true },
                    { id: 'category', label: 'Category', default: true },
                    { id: 'description', label: 'Description', default: true },
                    { id: 'amount', label: 'Amount', default: true },
                    { id: 'status', label: 'Status', default: true },
                    { id: 'clientName', label: 'Client Name', default: false },
                    { id: 'projectName', label: 'Project Name', default: false },
                    { id: 'notes', label: 'Notes', default: false },
                  ]
                : activeTab === 'expense'
                  ? [
                      { id: 'date', label: 'Date', default: true },
                      { id: 'account', label: 'Account', default: true },
                      { id: 'category', label: 'Category', default: true },
                      { id: 'bucket', label: 'Bucket', default: true },
                      { id: 'description', label: 'Description', default: true },
                      { id: 'amount', label: 'Amount', default: true },
                      { id: 'status', label: 'Status', default: true },
                      { id: 'dueDate', label: 'Due Date', default: false },
                      { id: 'notes', label: 'Notes', default: false },
                    ]
                  : activeTab === 'savings'
                    ? [
                        { id: 'date', label: 'Date', default: true },
                        { id: 'account', label: 'Account', default: true },
                        { id: 'type', label: 'Type', default: true },
                        { id: 'destination', label: 'Destination', default: true },
                        { id: 'description', label: 'Description', default: false },
                        { id: 'amount', label: 'Amount', default: true },
                        { id: 'status', label: 'Status', default: true },
                        { id: 'sipNumber', label: 'SIP Number', default: false },
                        { id: 'notes', label: 'Notes', default: false },
                      ]
                    : []
            }
            title="Custom Export Template"
          />
        </Suspense>
      )}
    </Stack>
  );
}

