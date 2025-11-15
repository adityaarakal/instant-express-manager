import { useState, useMemo, useEffect } from 'react';
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
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useToastStore } from '../store/useToastStore';
import { getUserFriendlyError } from '../utils/errorHandling';
import { useUndoStore } from '../store/useUndoStore';
import { restoreDeletedItem } from '../utils/undoRestore';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { ButtonWithLoading } from '../components/common/ButtonWithLoading';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { ConversionWizard } from '../components/common/ConversionWizard';
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
  const [activeTab, setActiveTab] = useState<TabValue>('expense');
  const { emis: expenseEMIs, createEMI: createExpenseEMI, updateEMI: updateExpenseEMI, deleteEMI: deleteExpenseEMI, pauseEMI: pauseExpenseEMI, resumeEMI: resumeExpenseEMI, getGeneratedTransactions: getExpenseGeneratedTransactions, convertToRecurring: convertExpenseEMIToRecurring } = useExpenseEMIsStore();
  const { emis: savingsEMIs, createEMI: createSavingsEMI, updateEMI: updateSavingsEMI, deleteEMI: deleteSavingsEMI, pauseEMI: pauseSavingsEMI, resumeEMI: resumeSavingsEMI, getGeneratedTransactions: getSavingsGeneratedTransactions, convertToRecurring: convertSavingsEMIToRecurring } = useSavingsInvestmentEMIsStore();
  const { accounts } = useBankAccountsStore();
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const savingsTransactions = useSavingsInvestmentTransactionsStore((state) => state.transactions);
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
  }, [dialogOpen, accounts.length]);

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

  const accountsMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((acc) => map.set(acc.id, acc.name));
    return map;
  }, [accounts]);

  const handleOpenDialog = (emi?: ExpenseEMI | SavingsInvestmentEMI) => {
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
        frequency: 'Monthly',
        totalInstallments: 12,
        category: 'Other',
        creditCardId: '',
        destination: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

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
    <Stack spacing={3}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0,
        }}
      >
        <Typography variant="h4">EMIs</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={accounts.length === 0}
          aria-label={accounts.length === 0 ? 'Add EMI (requires at least one bank account)' : 'Add new EMI'}
          fullWidth={isMobile}
          size={isMobile ? 'medium' : 'large'}
        >
          Add EMI
        </Button>
      </Box>

      <Collapse in={infoAlertOpen}>
        <Alert 
          severity="info" 
          onClose={() => setInfoAlertOpen(false)}
          sx={{ mb: 2 }}
        >
          <AlertTitle>When to Use EMIs</AlertTitle>
          <Typography variant="body2" component="div" sx={{ mt: 1 }}>
            <strong>EMIs are for fixed-term commitments with a known end date:</strong>
            <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
              <li>Have a <strong>fixed number of installments</strong> (e.g., 12, 24, 36)</li>
              <li>Track <strong>progress</strong> (X of Y installments completed)</li>
              <li>Require an <strong>end date</strong></li>
              <li>Examples: Home loans, car loans, credit card EMIs, personal loans</li>
            </ul>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 <strong>Not sure?</strong> If your payment is ongoing without a fixed end date, use <strong>Recurring Templates</strong> instead (for subscriptions, utility bills, salary, etc.)
            </Typography>
          </Typography>
        </Alert>
      </Collapse>

      <Paper>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Expense EMIs" value="expense" />
          <Tab label="Savings/Investment EMIs" value="savings" />
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
          <Table aria-label={`${activeTab} EMIs table`} sx={{ minWidth: 800 }}>
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
                  <TableCell colSpan={8} align="center" sx={{ border: 'none', py: 4 }}>
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
                            ? 'Start tracking your expense EMIs by adding your first EMI. Track credit card bills, loans, and other recurring expenses with installments.'
                            : 'Start tracking your savings/investment EMIs by adding your first EMI. Track SIPs, loans, and other recurring investments with installments.'
                          : 'Navigate to a different page to see more EMIs.'
                      }
                      action={
                        allEMIs.length === 0 && accounts.length > 0
                          ? {
                              label: `Add ${activeTab === 'expense' ? 'Expense' : 'Savings/Investment'} EMI`,
                              onClick: () => handleOpenDialog(),
                              icon: <AddIcon />,
                            }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEMIs
                  .sort((a, b) => b.startDate.localeCompare(a.startDate))
                  .map((emi) => (
                    <TableRow key={emi.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {emi.name}
                        </Typography>
                        {activeTab === 'savings' && (
                          <Typography variant="caption" color="text.secondary">
                            {(emi as SavingsInvestmentEMI).destination}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{accountsMap.get(emi.accountId) || '—'}</TableCell>
                      <TableCell>{formatCurrency(emi.amount)}</TableCell>
                      <TableCell>{emi.frequency}</TableCell>
                      <TableCell>{formatDate(emi.startDate)}</TableCell>
                      <TableCell>
                        <Box sx={{ minWidth: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={getProgress(emi)}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
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
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Link
                            component="button"
                            variant="body2"
                            onClick={() => {
                              const count = getGeneratedTransactionsCount(emi.id);
                              if (count > 0) {
                                navigate(`/transactions?tab=${activeTab === 'expense' ? 'expense' : 'savings'}&emi=${emi.id}`);
                              }
                            }}
                            sx={{ textDecoration: 'none' }}
                          >
                            {getGeneratedTransactionsCount(emi.id)} transactions
                          </Link>
                          <IconButton
                            size="small"
                            onClick={() => handlePauseResume(emi)}
                            disabled={emi.status === 'Completed' || deletingId !== null}
                            aria-label={emi.status === 'Active' ? `Pause EMI ${emi.name}` : `Resume EMI ${emi.name}`}
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
                          >
                            <SwapHorizIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(emi)}
                            disabled={deletingId !== null}
                            aria-label={`Edit EMI ${emi.name}`}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteClick(emi.id)} 
                            color="error"
                            disabled={deletingId !== null}
                            aria-label={`Delete EMI ${emi.name}`}
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
        {!isLoading && allEMIs.length > 0 && (
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
              },
            }}
          />
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingEMI ? 'Edit EMI' : 'Add EMI'}</DialogTitle>
        <DialogContent>
          <div id="emi-dialog-description" className="sr-only">
            {editingEMI ? `Edit details for ${editingEMI.name}` : 'Enter details for a new EMI'}
          </div>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSaving}>Cancel</Button>
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

