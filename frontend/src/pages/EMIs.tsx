import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  LinearProgress,
  Link,
  CircularProgress,
  Alert,
  AlertTitle,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useExpenseEMIsStore } from '../store/useExpenseEMIsStore';
import { useSavingsInvestmentEMIsStore } from '../store/useSavingsInvestmentEMIsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useToastStore } from '../store/useToastStore';
import { getUserFriendlyError } from '../utils/errorHandling';
import { useUndoStore } from '../store/useUndoStore';
import { restoreDeletedItem } from '../utils/undoRestore';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { ButtonWithLoading } from '../components/common/ButtonWithLoading';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { ConversionWizard } from '../components/common/ConversionWizard';
import { ViewToggle } from '../components/common/ViewToggle';
import { useViewMode } from '../hooks/useViewMode';
import { EMICard } from '../components/emis/EMICard';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SavingsIcon from '@mui/icons-material/Savings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import type { ExpenseEMI, SavingsInvestmentEMI } from '../types/emis';

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

type TabValue = 'expense' | 'savings';

export function EMIs() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { viewMode, toggleViewMode } = useViewMode('emis-view-mode');
  const [activeTab, setActiveTab] = useState<TabValue>('expense');
  const { emis: expenseEMIs, createEMI: createExpenseEMI, updateEMI: updateExpenseEMI, deleteEMI: deleteExpenseEMI, pauseEMI: pauseExpenseEMI, resumeEMI: resumeExpenseEMI, getGeneratedTransactions: getExpenseGeneratedTransactions, convertToRecurring: convertExpenseEMIToRecurring } = useExpenseEMIsStore();
  const { emis: savingsEMIs, createEMI: createSavingsEMI, updateEMI: updateSavingsEMI, deleteEMI: deleteSavingsEMI, pauseEMI: pauseSavingsEMI, resumeEMI: resumeSavingsEMI, getGeneratedTransactions: getSavingsGeneratedTransactions, convertToRecurring: convertSavingsEMIToRecurring } = useSavingsInvestmentEMIsStore();
  const { accounts } = useBankAccountsStore();
  const { showSuccess, showError, showToast } = useToastStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEMI, setEditingEMI] = useState<ExpenseEMI | SavingsInvestmentEMI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [emiToDelete, setEmiToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [infoAlertOpen, setInfoAlertOpen] = useState(true);
  const [conversionWizardOpen, setConversionWizardOpen] = useState(false);
  const [emiToConvert, setEmiToConvert] = useState<ExpenseEMI | SavingsInvestmentEMI | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Reset page when tab changes
  useEffect(() => {
    setPage(0);
  }, [activeTab]);

  const [formData, setFormData] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    deductionDate: '', // Optional - actual date when next installment will be deducted
    amount: 0,
    accountId: accounts[0]?.id || '',
    frequency: 'Monthly' as 'Monthly' | 'Quarterly',
    totalInstallments: 12,
    // Expense specific
    category: 'Other' as ExpenseEMI['category'],
    creditCardId: '',
    // Savings specific
    destination: '',
    notes: '',
  });

  const handleOpenDialog = useCallback((emi?: ExpenseEMI | SavingsInvestmentEMI) => {
    if (emi) {
      setEditingEMI(emi);
      if (activeTab === 'expense') {
        const e = emi as ExpenseEMI;
        setFormData({
          name: e.name,
          startDate: e.startDate,
          endDate: e.endDate,
          deductionDate: e.deductionDate || '',
          amount: e.amount,
          accountId: e.accountId,
          frequency: e.frequency,
          totalInstallments: e.totalInstallments,
          category: e.category,
          creditCardId: e.creditCardId || '',
          destination: '',
          notes: e.notes || '',
        });
      } else {
        const s = emi as SavingsInvestmentEMI;
        setFormData({
          name: s.name,
          startDate: s.startDate,
          endDate: s.endDate,
          deductionDate: s.deductionDate || '',
          amount: s.amount,
          accountId: s.accountId,
          frequency: s.frequency,
          totalInstallments: s.totalInstallments,
          category: 'Other',
          creditCardId: '',
          destination: s.destination,
          notes: s.notes || '',
        });
      }
    } else {
      setEditingEMI(null);
      setFormData({
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        deductionDate: '',
        amount: 0,
        accountId: accounts[0]?.id || '',
        frequency: 'Monthly' as 'Monthly' | 'Quarterly',
        totalInstallments: 12,
        // Expense specific
        category: 'Other' as ExpenseEMI['category'],
        creditCardId: '',
        // Savings specific
        destination: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  }, [activeTab, accounts]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + N - Open new EMI dialog
      if ((event.ctrlKey || event.metaKey) && event.key === 'n' && !dialogOpen) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          event.preventDefault();
          if (accounts.length > 0) {
            handleOpenDialog();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, accounts.length, handleOpenDialog]);

  const accountsMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((acc) => map.set(acc.id, acc.name));
    return map;
  }, [accounts]);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEMI(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.accountId || formData.amount <= 0) return;

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (activeTab === 'expense') {
      const emiData = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        deductionDate: formData.deductionDate || undefined,
        amount: formData.amount,
        accountId: formData.accountId,
        category: formData.category,
        creditCardId: formData.category === 'CCEMI' ? formData.creditCardId : undefined,
        frequency: formData.frequency,
        status: 'Active' as const,
        totalInstallments: formData.totalInstallments,
        notes: formData.notes || undefined,
      };

      if (editingEMI) {
        updateExpenseEMI(editingEMI.id, emiData);
        showSuccess('Expense EMI updated successfully');
      } else {
        createExpenseEMI(emiData);
        showSuccess('Expense EMI created successfully');
      }
    } else {
      const emiData = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        deductionDate: formData.deductionDate || undefined,
        amount: formData.amount,
        accountId: formData.accountId,
        destination: formData.destination,
        frequency: formData.frequency,
        status: 'Active' as const,
        totalInstallments: formData.totalInstallments,
        notes: formData.notes || undefined,
      };

      if (editingEMI) {
        updateSavingsEMI(editingEMI.id, emiData);
        showSuccess('Savings EMI updated successfully');
      } else {
        createSavingsEMI(emiData);
        showSuccess('Savings EMI created successfully');
      }
      }
      handleCloseDialog();
    } catch (error) {
      showError(getUserFriendlyError(error, 'save EMI'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setEmiToDelete(id);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!emiToDelete) return;
    
    const id = emiToDelete;
    setConfirmDeleteOpen(false);
    setDeletingId(id);
    try {
      // Store the EMI data for undo before deleting
      let emi: ExpenseEMI | SavingsInvestmentEMI | undefined;
      let entityType: 'ExpenseEMI' | 'SavingsInvestmentEMI';
      
      if (activeTab === 'expense') {
        emi = expenseEMIs.find((e) => e.id === id);
        entityType = 'ExpenseEMI';
      } else {
        emi = savingsEMIs.find((e) => e.id === id);
        entityType = 'SavingsInvestmentEMI';
      }

      if (!emi) {
        showError('EMI not found');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
      if (activeTab === 'expense') {
        deleteExpenseEMI(id);
      } else {
        deleteSavingsEMI(id);
      }

      // Store in undo store and show undo button
      const deletedItemId = useUndoStore.getState().addDeletedItem(entityType, emi);
      
      showToast(
        activeTab === 'expense' ? 'Expense EMI deleted successfully' : 'Savings EMI deleted successfully',
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
      showError(getUserFriendlyError(error, 'delete EMI'));
    } finally {
      setDeletingId(null);
      setEmiToDelete(null);
    }
  };

  const handlePauseResume = async (emi: ExpenseEMI | SavingsInvestmentEMI) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (emi.status === 'Active') {
        if (activeTab === 'expense') {
          pauseExpenseEMI(emi.id);
          showSuccess('Expense EMI paused');
        } else {
          pauseSavingsEMI(emi.id);
          showSuccess('Savings EMI paused');
        }
      } else if (emi.status === 'Paused') {
        if (activeTab === 'expense') {
          resumeExpenseEMI(emi.id);
          showSuccess('Expense EMI resumed');
        } else {
          resumeSavingsEMI(emi.id);
          showSuccess('Savings EMI resumed');
        }
      }
    } catch (error) {
        showError(getUserFriendlyError(error, 'update EMI status'));
    }
  };

  const getProgress = (emi: ExpenseEMI | SavingsInvestmentEMI): number => {
    return (emi.completedInstallments / emi.totalInstallments) * 100;
  };

  const getGeneratedTransactionsCount = (emiId: string): number => {
    if (activeTab === 'expense') {
      return getExpenseGeneratedTransactions(emiId).length;
    } else {
      return getSavingsGeneratedTransactions(emiId).length;
    }
  };

  const handleConvertToRecurringClick = (emi: ExpenseEMI | SavingsInvestmentEMI) => {
    setEmiToConvert(emi);
    setConversionWizardOpen(true);
  };

  const handleConversionConfirm = async () => {
    if (!emiToConvert) return;
    
    setIsConverting(true);
    try {
      if (activeTab === 'expense') {
        convertExpenseEMIToRecurring(emiToConvert.id);
        showSuccess('EMI converted to Recurring Template successfully');
      } else {
        convertSavingsEMIToRecurring(emiToConvert.id);
        showSuccess('EMI converted to Recurring Template successfully');
      }
      setConversionWizardOpen(false);
      setEmiToConvert(null);
    } catch (error) {
      showError(getUserFriendlyError(error, 'convert EMI'));
    } finally {
      setIsConverting(false);
    }
  };

  const handleConversionCancel = () => {
    setConversionWizardOpen(false);
    setEmiToConvert(null);
  };

  const allEMIs = useMemo(() => {
    return activeTab === 'expense' ? expenseEMIs : savingsEMIs;
  }, [activeTab, expenseEMIs, savingsEMIs]);

  // Pagination
  const paginatedEMIs = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return allEMIs.slice(start, end);
  }, [allEMIs, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
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
          EMIs
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <ViewToggle viewMode={viewMode} onToggle={toggleViewMode} aria-label="Toggle between table and card view" />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={accounts.length === 0}
            aria-label={accounts.length === 0 ? 'Add EMI (requires at least one bank account)' : 'Add new EMI'}
            fullWidth={isMobile}
            size={isMobile ? 'medium' : 'large'}
            sx={{ 
              flexShrink: 0,
              minHeight: { xs: 44, sm: 48 },
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              whiteSpace: 'nowrap',
              px: { xs: 1.5, sm: 2 },
            }}
          >
            Add EMI
          </Button>
        </Stack>
      </Box>

      <Collapse in={infoAlertOpen}>
        <Alert 
          severity="info" 
          onClose={() => setInfoAlertOpen(false)}
          sx={{ mb: 2 }}
        >
          <AlertTitle>When to Use EMIs</AlertTitle>
          <Typography 
            variant="body2" 
            component="div" 
            sx={{ 
              mt: 1,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            <strong>EMIs are for fixed-term commitments with a known end date:</strong>
            <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
              <li>Have a <strong>fixed number of installments</strong> (e.g., 12, 24, 36)</li>
              <li>Track <strong>progress</strong> (X of Y installments completed)</li>
              <li>Require an <strong>end date</strong></li>
              <li>Examples: Home loans, car loans, credit card EMIs, personal loans</li>
            </ul>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                mt: 1, 
                display: 'block',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              💡 <strong>Not sure?</strong> If your payment is ongoing without a fixed end date, use <strong>Recurring Templates</strong> instead (for subscriptions, utility bills, salary, etc.)
            </Typography>
          </Typography>
        </Alert>
      </Collapse>

      <Paper>
        {isMobile ? (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <FormControl fullWidth size="small">
              <InputLabel>EMI Type</InputLabel>
              <Select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as TabValue)}
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  '& .MuiSelect-select': {
                    py: 1.5,
                  },
                }}
              >
                <MenuItem value="expense">Expense EMIs</MenuItem>
                <MenuItem value="savings">Savings/Investment EMIs</MenuItem>
              </Select>
            </FormControl>
          </Box>
        ) : (
          <Tabs 
            value={activeTab} 
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              '& .MuiTab-root': {
                minHeight: 72,
                fontSize: '0.875rem',
                px: 3,
                minWidth: 160,
              },
            }}
          >
            <Tab label="Expense EMIs" value="expense" />
            <Tab label="Savings/Investment EMIs" value="savings" />
          </Tabs>
        )}

        {/* Card View or Table View based on view mode */}
        {viewMode === 'card' ? (
          <Box sx={{ p: { xs: 1, sm: 2 } }}>
            {isLoading ? (
              <Stack spacing={1.5}>
                {[...Array(5)].map((_, i) => (
                  <Box key={i} sx={{ height: 200, bgcolor: 'action.hover', borderRadius: 1 }} />
                ))}
              </Stack>
            ) : paginatedEMIs.length === 0 ? (
              <Box sx={{ py: 4, px: 2 }}>
                <EmptyState
                  icon={
                    activeTab === 'expense' ? (
                      <CreditCardIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                    ) : (
                      <SavingsIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                    )
                  }
                  title={allEMIs.length === 0 ? 'No EMIs Yet' : 'No EMIs on This Page'}
                  description={
                    allEMIs.length === 0
                      ? activeTab === 'expense'
                        ? 'Start tracking your expense EMIs by adding your first EMI. Track credit card bills, loans, and other installment-based expenses.'
                        : 'Start tracking your savings/investment EMIs by adding your first EMI. Track SIPs and other recurring investments.'
                      : 'Navigate to a different page to see more EMIs.'
                  }
                  actions={
                    allEMIs.length === 0
                      ? accounts.length > 0
                        ? [
                            {
                              label: `Add ${activeTab === 'expense' ? 'Expense' : 'Savings/Investment'} EMI`,
                              onClick: () => handleOpenDialog(),
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
                      : undefined
                  }
                />
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {paginatedEMIs
                  .sort((a, b) => b.startDate.localeCompare(a.startDate))
                  .map((emi) => (
                    <EMICard
                      key={emi.id}
                      emi={emi}
                      type={activeTab}
                      accountName={accountsMap.get(emi.accountId) || '—'}
                      isDeleting={deletingId === emi.id}
                      onEdit={() => handleOpenDialog(emi)}
                      onDelete={() => handleDeleteClick(emi.id)}
                      onPauseResume={() => handlePauseResume(emi)}
                      onConvertToRecurring={() => handleConvertToRecurringClick(emi)}
                      onViewTransactions={
                        getGeneratedTransactionsCount(emi.id) > 0
                          ? () => {
                              navigate(`/transactions?tab=${activeTab === 'expense' ? 'expense' : 'savings'}&emi=${emi.id}`);
                            }
                          : undefined
                      }
                      transactionsCount={getGeneratedTransactionsCount(emi.id)}
                      progress={getProgress(emi)}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  ))}
              </Stack>
            )}
            {!isLoading && paginatedEMIs.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <TablePagination
                  component="div"
                  count={allEMIs.length}
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
          <TableContainer
          sx={{
            overflowX: 'auto',
            maxWidth: '100%',
            '& .MuiTableCell-root': {
              whiteSpace: 'nowrap',
              minWidth: { xs: 80, sm: 100 },
              padding: { xs: '8px 4px', sm: '16px' },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            },
            '& .MuiTableRow-root:has(.MuiTableCell-root[colspan])': {
              '& .MuiTableCell-root': {
                whiteSpace: 'normal',
              },
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 600,
              padding: { xs: '12px 4px', sm: '16px' },
            },
          }}
        >
          <Table aria-label={`${activeTab} EMIs table`} sx={{ minWidth: { xs: 600, sm: 800 } }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableSkeleton rows={5} columns={8} />
              ) : paginatedEMIs.length === 0 ? (
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
                      icon={
                        activeTab === 'expense' ? (
                          <CreditCardIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                        ) : (
                          <SavingsIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                        )
                      }
                      title={allEMIs.length === 0 ? 'No EMIs Yet' : 'No EMIs on This Page'}
                      description={
                        allEMIs.length === 0
                          ? activeTab === 'expense'
                            ? 'Start tracking your expense EMIs by adding your first EMI. Track credit card bills, loans, and other installment-based expenses.'
                            : 'Start tracking your savings/investment EMIs by adding your first EMI. Track SIPs and other recurring investments.'
                          : 'Navigate to a different page to see more EMIs.'
                      }
                      actions={
                        allEMIs.length === 0
                          ? accounts.length > 0
                            ? [
                                {
                                  label: `Add ${activeTab === 'expense' ? 'Expense' : 'Savings/Investment'} EMI`,
                                  onClick: () => handleOpenDialog(),
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
                          : undefined
                      }
                      tips={
                        allEMIs.length === 0
                          ? activeTab === 'expense'
                            ? [
                                {
                                  text: 'Track credit card bills, personal loans, home loans, and other installment-based expenses.',
                                },
                                {
                                  text: 'EMIs automatically generate transactions for each installment based on the schedule.',
                                },
                                {
                                  text: 'Monitor payment progress and remaining installments for each EMI.',
                                },
                              ]
                            : [
                                {
                                  text: 'Track SIPs, investment loans, and other recurring investment installments.',
                                },
                                {
                                  text: 'EMIs automatically generate investment transactions for each installment.',
                                },
                                {
                                  text: 'Monitor investment progress and track returns over time.',
                                },
                              ]
                          : undefined
                      }
                      quickStart={
                        allEMIs.length === 0 && accounts.length > 0
                          ? activeTab === 'expense'
                            ? [
                                'Click "Add Expense EMI" to create your first EMI',
                                'Enter EMI details: name, amount, start date, and number of installments',
                                'Select the account and set payment frequency',
                                'EMI will automatically generate transactions for each installment',
                              ]
                            : [
                                'Click "Add Savings/Investment EMI" to create your first investment EMI',
                                'Enter SIP details: name, amount, start date, and number of installments',
                                'Select the account and destination (e.g., mutual fund name)',
                                'EMI will automatically generate investment transactions',
                              ]
                          : undefined
                      }
                    />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEMIs
                  .sort((a, b) => b.startDate.localeCompare(a.startDate))
                  .map((emi) => (
                    <TableRow key={emi.id} hover>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          sx={{
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            wordBreak: 'break-word',
                          }}
                        >
                          {emi.name}
                        </Typography>
                        {activeTab === 'savings' && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{
                              fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                              wordBreak: 'break-word',
                            }}
                          >
                            {(emi as SavingsInvestmentEMI).destination}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{accountsMap.get(emi.accountId) || '—'}</TableCell>
                      <TableCell>{formatCurrency(emi.amount)}</TableCell>
                      <TableCell>{emi.frequency}</TableCell>
                      <TableCell>{formatDate(emi.startDate)}</TableCell>
                      <TableCell>
                        <Box sx={{ minWidth: { xs: 80, sm: 100 } }}>
                          <LinearProgress
                            variant="determinate"
                            value={getProgress(emi)}
                            sx={{ 
                              height: { xs: 6, sm: 8 }, 
                              borderRadius: 1,
                              mb: { xs: 0.25, sm: 0.5 },
                            }}
                          />
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{
                              fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                            }}
                          >
                            {emi.completedInstallments} / {emi.totalInstallments}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={emi.status}
                          size="small"
                          color={
                            emi.status === 'Active'
                              ? 'success'
                              : emi.status === 'Completed'
                              ? 'default'
                              : 'warning'
                          }
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
                        <Stack 
                          direction="row" 
                          spacing={{ xs: 0.5, sm: 1 }} 
                          justifyContent="flex-end"
                          flexWrap="wrap"
                          sx={{ gap: { xs: 0.5, sm: 1 } }}
                        >
                          {!isMobile && (
                            <Link
                              component="button"
                              variant="body2"
                              onClick={() => {
                                const count = getGeneratedTransactionsCount(emi.id);
                                if (count > 0) {
                                  navigate(`/transactions?tab=${activeTab === 'expense' ? 'expense' : 'savings'}&emi=${emi.id}`);
                                }
                              }}
                              sx={{ 
                                textDecoration: 'none',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                minHeight: { xs: 40, sm: 'auto' },
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              {getGeneratedTransactionsCount(emi.id)} transactions
                            </Link>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handlePauseResume(emi)}
                            disabled={emi.status === 'Completed' || deletingId !== null}
                            aria-label={emi.status === 'Active' ? `Pause EMI ${emi.name}` : `Resume EMI ${emi.name}`}
                            sx={{
                              minWidth: { xs: 40, sm: 48 },
                              minHeight: { xs: 40, sm: 48 },
                              p: { xs: 0.5, sm: 1 },
                            }}
                          >
                            {emi.status === 'Active' ? (
                              <PauseIcon fontSize="small" />
                            ) : (
                              <PlayArrowIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleConvertToRecurringClick(emi)}
                            disabled={deletingId !== null}
                            aria-label={`Convert EMI ${emi.name} to Recurring Template`}
                            title="Convert to Recurring Template"
                            color="primary"
                            sx={{
                              minWidth: { xs: 40, sm: 48 },
                              minHeight: { xs: 40, sm: 48 },
                              p: { xs: 0.5, sm: 1 },
                            }}
                          >
                            <SwapHorizIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(emi)}
                            disabled={deletingId !== null}
                            aria-label={`Edit EMI ${emi.name}`}
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
                            onClick={() => handleDeleteClick(emi.id)} 
                            color="error"
                            disabled={deletingId !== null}
                            aria-label={`Delete EMI ${emi.name}`}
                            sx={{
                              minWidth: { xs: 40, sm: 48 },
                              minHeight: { xs: 40, sm: 48 },
                              p: { xs: 0.5, sm: 1 },
                            }}
                          >
                            {deletingId === emi.id ? (
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
            </TableBody>
          </Table>
        </TableContainer>
        )}
        {!isLoading && allEMIs.length > 0 && viewMode === 'table' && (
          <TablePagination
            component="div"
            count={allEMIs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={isMobile ? [10, 25] : [10, 25, 50, 100]}
            labelRowsPerPage={isMobile ? 'Rows:' : 'Rows per page:'}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
            }
            sx={{
              '& .MuiTablePagination-toolbar': {
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                gap: { xs: 1, sm: 0 },
                px: { xs: 1, sm: 2 },
              },
              '& .MuiTablePagination-selectLabel': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                mr: { xs: 0.5, sm: 1 },
              },
              '& .MuiTablePagination-displayedRows': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              },
              '& .MuiTablePagination-select': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minHeight: { xs: 36, sm: 40 },
              },
              '& .MuiIconButton-root': {
                minWidth: { xs: 40, sm: 48 },
                minHeight: { xs: 40, sm: 48 },
                p: { xs: 0.5, sm: 1 },
              },
            }}
          />
        )}
      </Paper>

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: '90vh' },
            width: { xs: '100%', sm: 'auto' },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            fontWeight: 700,
            pb: { xs: 1, sm: 2 },
          }}
        >
          {editingEMI ? 'Edit EMI' : 'Add EMI'}
        </DialogTitle>
        <DialogContent
          sx={{
            px: { xs: 2, sm: 3 },
            pb: { xs: 2, sm: 3 },
          }}
        >
          <div id="emi-dialog-description" className="sr-only">
            {editingEMI ? `Edit details for ${editingEMI.name}` : 'Enter details for a new EMI'}
          </div>
          <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ mt: { xs: 0, sm: 1 } }}>
            <TextField
              label="EMI Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              placeholder="e.g., Home Loan EMI"
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
              label="Monthly Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              required
              fullWidth
              InputProps={{
                startAdornment: <span style={{ marginRight: 8 }}>₹</span>,
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={formData.frequency}
                label="Frequency"
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'Monthly' | 'Quarterly' })}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: { xs: '60vh', sm: 'none' },
                      maxWidth: { xs: '90vw', sm: 'none' },
                    },
                  },
                }}
              >
                <MenuItem value="Monthly">Monthly</MenuItem>
                <MenuItem value="Quarterly">Quarterly</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Deduction Date (Optional)"
              type="date"
              value={formData.deductionDate}
              onChange={(e) => setFormData({ ...formData, deductionDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Actual date when next installment will be deducted. If not set, calculated automatically."
            />
            <TextField
              label="Total Installments"
              type="number"
              value={formData.totalInstallments}
              onChange={(e) => setFormData({ ...formData, totalInstallments: Number(e.target.value) })}
              required
              fullWidth
            />

            {activeTab === 'expense' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseEMI['category'] })}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: { xs: '60vh', sm: 'none' },
                          maxWidth: { xs: '90vw', sm: 'none' },
                        },
                      },
                    }}
                  >
                    <MenuItem value="CCEMI">CC EMI</MenuItem>
                    <MenuItem value="Loan">Loan</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
                {formData.category === 'CCEMI' && (
                  <FormControl fullWidth>
                    <InputLabel>Credit Card</InputLabel>
                    <Select
                      value={formData.creditCardId}
                      label="Credit Card"
                      onChange={(e) => setFormData({ ...formData, creditCardId: e.target.value })}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: { xs: '60vh', sm: 'none' },
                            maxWidth: { xs: '90vw', sm: 'none' },
                          },
                        },
                      }}
                    >
                      {accounts
                        .filter((acc) => acc.accountType === 'CreditCard')
                        .map((account) => (
                          <MenuItem key={account.id} value={account.id}>
                            {account.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}
              </>
            )}

            {activeTab === 'savings' && (
              <TextField
                label="Destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
                fullWidth
                placeholder="e.g., Mutual Fund Name, SIP Name"
              />
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
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            pb: { xs: 2, sm: 3 },
            gap: { xs: 1, sm: 1.5 },
            flexDirection: { xs: 'column-reverse', sm: 'row' },
          }}
        >
          <Button 
            onClick={handleCloseDialog} 
            disabled={isSaving}
            fullWidth={isMobile}
            sx={{
              minHeight: { xs: 44, sm: 40 },
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              px: { xs: 1.5, sm: 2 },
            }}
          >
            Cancel
          </Button>
          <ButtonWithLoading
            onClick={handleSave}
            variant="contained"
            loading={isSaving}
            disabled={
              !formData.name.trim() ||
              !formData.accountId ||
              formData.amount <= 0 ||
              (activeTab === 'savings' && !formData.destination.trim()) ||
              isSaving
            }
            fullWidth={isMobile}
            sx={{
              minHeight: { xs: 44, sm: 40 },
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              px: { xs: 1.5, sm: 2 },
            }}
          >
            {editingEMI ? 'Update' : 'Create'}
          </ButtonWithLoading>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete EMI"
        message="Are you sure you want to delete this EMI? This will not delete generated transactions. This action cannot be undone, but you can use the undo option in the notification."
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setEmiToDelete(null);
        }}
      />

      <ConversionWizard
        open={conversionWizardOpen}
        onClose={handleConversionCancel}
        onConfirm={handleConversionConfirm}
        conversionType="emi-to-recurring"
        emi={emiToConvert || undefined}
        isConverting={isConverting}
      />
    </Stack>
  );
}

