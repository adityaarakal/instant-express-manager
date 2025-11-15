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
import { useRecurringIncomesStore } from '../store/useRecurringIncomesStore';
import { useRecurringExpensesStore } from '../store/useRecurringExpensesStore';
import { useRecurringSavingsInvestmentsStore } from '../store/useRecurringSavingsInvestmentsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
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
import RepeatIcon from '@mui/icons-material/Repeat';
import type {
  RecurringIncome,
  RecurringExpense,
  RecurringSavingsInvestment,
} from '../types/recurring';
import type { IncomeCategory, ExpenseCategory, ExpenseBucket, SavingsInvestmentType } from '../types/transactions';

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

export function Recurring() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('income');
  const { templates: incomeTemplates, createTemplate: createIncome, updateTemplate: updateIncome, deleteTemplate: deleteIncome, pauseTemplate: pauseIncome, resumeTemplate: resumeIncome, getGeneratedTransactions: getIncomeGeneratedTransactions } = useRecurringIncomesStore();
  const { templates: expenseTemplates, createTemplate: createExpense, updateTemplate: updateExpense, deleteTemplate: deleteExpense, pauseTemplate: pauseExpense, resumeTemplate: resumeExpense, getGeneratedTransactions: getExpenseGeneratedTransactions } = useRecurringExpensesStore();
  const { templates: savingsTemplates, createTemplate: createSavings, updateTemplate: updateSavings, deleteTemplate: deleteSavings, pauseTemplate: pauseSavings, resumeTemplate: resumeSavings, getGeneratedTransactions: getSavingsGeneratedTransactions } = useRecurringSavingsInvestmentsStore();
  const { accounts } = useBankAccountsStore();
  const incomeTransactions = useIncomeTransactionsStore((state) => state.transactions);
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const savingsTransactions = useSavingsInvestmentTransactionsStore((state) => state.transactions);
  const { showSuccess, showError, showToast } = useToastStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringIncome | RecurringExpense | RecurringSavingsInvestment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [infoAlertOpen, setInfoAlertOpen] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      // Ctrl/Cmd + N - Open new recurring template dialog
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

  const [formData, setFormData] = useState<{
    name: string;
    amount: number;
    accountId: string;
    frequency: 'Monthly' | 'Weekly' | 'Yearly' | 'Custom' | 'Quarterly';
    startDate: string;
    endDate: string;
    category: IncomeCategory;
    expenseCategory: ExpenseCategory;
    bucket: ExpenseBucket;
    destination: string;
    type: SavingsInvestmentType;
    notes: string;
  }>({
    name: '',
    amount: 0,
    accountId: accounts[0]?.id || '',
    frequency: 'Monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    // Income specific
    category: 'Salary',
    // Expense specific
    expenseCategory: 'Other',
    bucket: 'Expense',
    // Savings specific
    destination: '',
    type: 'SIP',
    notes: '',
  });

  const accountsMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((acc) => map.set(acc.id, acc.name));
    return map;
  }, [accounts]);

  // Get valid frequency options for current tab
  const frequencyOptions = useMemo(() => {
    if (activeTab === 'savings') {
      return [
        { value: 'Monthly', label: 'Monthly' },
        { value: 'Quarterly', label: 'Quarterly' },
        { value: 'Yearly', label: 'Yearly' },
      ];
    } else {
      return [
        { value: 'Monthly', label: 'Monthly' },
        { value: 'Weekly', label: 'Weekly' },
        { value: 'Yearly', label: 'Yearly' },
        { value: 'Custom', label: 'Custom' },
      ];
    }
  }, [activeTab]);

  // Reset frequency to valid value when dialog opens or tab changes
  useEffect(() => {
    if (dialogOpen && frequencyOptions.length > 0) {
      setFormData((prev) => {
        const currentFreq = prev.frequency;
        const validValues = frequencyOptions.map(opt => opt.value);
        const isValidForTab = currentFreq && validValues.includes(currentFreq);
        
        if (!isValidForTab) {
          // Set to first valid option for current tab
          return { ...prev, frequency: frequencyOptions[0].value as typeof prev.frequency };
        }
        return prev;
      });
    }
  }, [dialogOpen, activeTab, frequencyOptions]);

  const handleOpenDialog = (template?: RecurringIncome | RecurringExpense | RecurringSavingsInvestment) => {
    if (template) {
      setEditingTemplate(template);
      if (activeTab === 'income') {
        const t = template as RecurringIncome;
        setFormData({
          name: t.name,
          amount: t.amount,
          accountId: t.accountId,
          frequency: t.frequency,
          startDate: t.startDate,
          endDate: t.endDate || '',
          category: t.category,
          expenseCategory: 'Other',
          bucket: 'Expense',
          destination: '',
          type: 'SIP',
          notes: t.notes || '',
        });
      } else if (activeTab === 'expense') {
        const t = template as RecurringExpense;
        setFormData({
          name: t.name,
          amount: t.amount,
          accountId: t.accountId,
          frequency: t.frequency,
          startDate: t.startDate,
          endDate: t.endDate || '',
          category: 'Salary',
          expenseCategory: t.category,
          bucket: t.bucket,
          destination: '',
          type: 'SIP',
          notes: t.notes || '',
        });
      } else {
        const t = template as RecurringSavingsInvestment;
        setFormData({
          name: t.name,
          amount: t.amount,
          accountId: t.accountId,
          frequency: t.frequency as 'Monthly' | 'Quarterly' | 'Yearly', // Savings frequency type
          startDate: t.startDate,
          endDate: t.endDate || '',
          category: 'Salary',
          expenseCategory: 'Other',
          bucket: 'Expense',
          destination: t.destination,
          type: t.type,
          notes: t.notes || '',
        });
      }
    } else {
      setEditingTemplate(null);
      // Set frequency based on active tab - ensure it's valid for the current tab
      const defaultFrequency = activeTab === 'savings' 
        ? 'Monthly' as 'Monthly' | 'Quarterly' | 'Yearly'
        : 'Monthly' as 'Monthly' | 'Weekly' | 'Yearly' | 'Custom';
      
      setFormData({
        name: '',
        amount: 0,
        accountId: accounts[0]?.id || '',
        frequency: defaultFrequency,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        category: 'Salary',
        expenseCategory: 'Other',
        bucket: 'Expense',
        destination: '',
        type: 'SIP',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      showError('Template name is required');
      return;
    }
    if (!formData.accountId) {
      showError('Account is required');
      return;
    }
    if (formData.amount <= 0) {
      showError('Amount must be greater than 0');
      return;
    }
    if (activeTab === 'savings' && !formData.destination.trim()) {
      showError('Destination is required for savings/investment templates');
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (activeTab === 'income') {
      // Convert frequency - filter out 'Quarterly' for Income (not valid)
      const incomeFrequency: 'Monthly' | 'Weekly' | 'Yearly' | 'Custom' =
        formData.frequency === 'Quarterly' ? 'Monthly' : (formData.frequency as 'Monthly' | 'Weekly' | 'Yearly' | 'Custom');
      
      const templateData = {
        name: formData.name,
        amount: formData.amount,
        accountId: formData.accountId,
        category: formData.category,
        frequency: incomeFrequency,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        status: 'Active' as const,
        notes: formData.notes || undefined,
      };

      if (editingTemplate) {
        updateIncome(editingTemplate.id, templateData);
        showSuccess('Recurring income template updated successfully');
      } else {
        createIncome(templateData);
        showSuccess('Recurring income template created successfully');
      }
    } else if (activeTab === 'expense') {
      // Convert frequency - filter out 'Quarterly' for Expense (not valid)
      const expenseFrequency: 'Monthly' | 'Weekly' | 'Yearly' | 'Custom' =
        formData.frequency === 'Quarterly' ? 'Monthly' : (formData.frequency as 'Monthly' | 'Weekly' | 'Yearly' | 'Custom');
      
      const templateData = {
        name: formData.name,
        amount: formData.amount,
        accountId: formData.accountId,
        category: formData.expenseCategory,
        bucket: formData.bucket,
        frequency: expenseFrequency,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        status: 'Active' as const,
        notes: formData.notes || undefined,
      };

      if (editingTemplate) {
        updateExpense(editingTemplate.id, templateData);
        showSuccess('Recurring expense template updated successfully');
      } else {
        createExpense(templateData);
        showSuccess('Recurring expense template created successfully');
      }
    } else {
      // Convert frequency to Savings/Investment format (Monthly | Quarterly | Yearly)
      const savingsFrequency: 'Monthly' | 'Quarterly' | 'Yearly' =
        formData.frequency === 'Quarterly' ? 'Quarterly' : formData.frequency === 'Yearly' ? 'Yearly' : 'Monthly';
      
      const templateData = {
        name: formData.name,
        amount: formData.amount,
        accountId: formData.accountId,
        destination: formData.destination,
        type: formData.type,
        frequency: savingsFrequency,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        status: 'Active' as const,
        notes: formData.notes || undefined,
      };

      if (editingTemplate) {
        updateSavings(editingTemplate.id, templateData);
        showSuccess('Recurring savings template updated successfully');
      } else {
        createSavings(templateData);
        showSuccess('Recurring savings template created successfully');
      }
    }
    handleCloseDialog();
    } catch (error) {
      showError(getUserFriendlyError(error, 'save recurring template'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setTemplateToDelete(id);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    
    const id = templateToDelete;
    setConfirmDeleteOpen(false);
    setDeletingId(id);
    try {
      // Store the template data for undo before deleting
      let template: RecurringIncome | RecurringExpense | RecurringSavingsInvestment | undefined;
      let entityType: 'RecurringIncome' | 'RecurringExpense' | 'RecurringSavingsInvestment';
      let successMessage: string;
      
      if (activeTab === 'income') {
        template = incomeTemplates.find((t) => t.id === id);
        entityType = 'RecurringIncome';
        successMessage = 'Recurring income template deleted successfully';
      } else if (activeTab === 'expense') {
        template = expenseTemplates.find((t) => t.id === id);
        entityType = 'RecurringExpense';
        successMessage = 'Recurring expense template deleted successfully';
      } else {
        template = savingsTemplates.find((t) => t.id === id);
        entityType = 'RecurringSavingsInvestment';
        successMessage = 'Recurring savings template deleted successfully';
      }

      if (!template) {
        showError('Template not found');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
      if (activeTab === 'income') {
        deleteIncome(id);
      } else if (activeTab === 'expense') {
        deleteExpense(id);
      } else {
        deleteSavings(id);
      }

      // Store in undo store and show undo button
      const deletedItemId = useUndoStore.getState().addDeletedItem(entityType, template);
      
      showToast(
        successMessage,
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
      showError(getUserFriendlyError(error, 'delete recurring template'));
    } finally {
      setDeletingId(null);
      setTemplateToDelete(null);
    }
  };

  const handlePauseResume = async (template: RecurringIncome | RecurringExpense | RecurringSavingsInvestment) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (template.status === 'Active') {
        if (activeTab === 'income') {
          pauseIncome(template.id);
          showSuccess('Recurring income template paused');
        } else if (activeTab === 'expense') {
          pauseExpense(template.id);
          showSuccess('Recurring expense template paused');
        } else {
          pauseSavings(template.id);
          showSuccess('Recurring savings template paused');
        }
      } else if (template.status === 'Paused') {
        if (activeTab === 'income') {
          resumeIncome(template.id);
          showSuccess('Recurring income template resumed');
        } else if (activeTab === 'expense') {
          resumeExpense(template.id);
          showSuccess('Recurring expense template resumed');
        } else {
          resumeSavings(template.id);
          showSuccess('Recurring savings template resumed');
        }
      }
    } catch (error) {
        showError(getUserFriendlyError(error, 'update recurring template status'));
    }
  };

  const getGeneratedTransactionsCount = (templateId: string): number => {
    if (activeTab === 'income') {
      return getIncomeGeneratedTransactions(templateId).length;
    } else if (activeTab === 'expense') {
      return getExpenseGeneratedTransactions(templateId).length;
    } else {
      return getSavingsGeneratedTransactions(templateId).length;
    }
  };

  const allTemplates = useMemo(() => {
    if (activeTab === 'income') return incomeTemplates;
    if (activeTab === 'expense') return expenseTemplates;
    return savingsTemplates;
  }, [activeTab, incomeTemplates, expenseTemplates, savingsTemplates]);

  // Pagination
  const paginatedTemplates = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return allTemplates.slice(start, end);
  }, [allTemplates, page, rowsPerPage]);

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
        <Typography variant="h4">Recurring Templates</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={accounts.length === 0}
          aria-label={accounts.length === 0 ? 'Add recurring template (requires at least one bank account)' : 'Add new recurring template'}
          fullWidth={isMobile}
          size={isMobile ? 'medium' : 'large'}
        >
          Add Template
        </Button>
      </Box>

      <Collapse in={infoAlertOpen}>
        <Alert 
          severity="info" 
          onClose={() => setInfoAlertOpen(false)}
          sx={{ mb: 2 }}
        >
          <AlertTitle>When to Use Recurring Templates</AlertTitle>
          <Typography variant="body2" component="div" sx={{ mt: 1 }}>
            <strong>Recurring Templates are for ongoing/repeating transactions:</strong>
            <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
              <li><strong>No fixed number of installments</strong> (can be indefinite)</li>
              <li>Track <strong>next due date</strong> instead of progress</li>
              <li><strong>End date is optional</strong> (can continue indefinitely)</li>
              <li>More <strong>flexible frequencies</strong> (Monthly, Weekly, Quarterly, Yearly, Custom)</li>
              <li>Examples: Monthly salary, Netflix subscription, utility bills, SIP investments, insurance premiums</li>
            </ul>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 <strong>Not sure?</strong> If your payment has a fixed number of installments with a known end date, use <strong>EMIs</strong> instead (for loans, credit card EMIs, etc.)
            </Typography>
          </Typography>
        </Alert>
      </Collapse>

      <Paper>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Recurring Incomes" value="income" />
          <Tab label="Recurring Expenses" value="expense" />
          <Tab label="Recurring Savings/Investments" value="savings" />
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
          <Table aria-label={`${activeTab} recurring templates table`} sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Next Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableSkeleton rows={5} columns={7} />
              ) : paginatedTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ border: 'none', py: 4 }}>
                    <EmptyState
                      icon={<RepeatIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />}
                      title={allTemplates.length === 0 ? 'No Recurring Templates Yet' : 'No Templates on This Page'}
                      description={
                        allTemplates.length === 0
                          ? `Start automating your ${activeTab === 'income' ? 'income' : activeTab === 'expense' ? 'expense' : 'savings/investment'} tracking by creating your first recurring template. Set up automatic transaction generation for regular ${activeTab === 'income' ? 'income' : activeTab === 'expense' ? 'expenses' : 'savings/investments'}.`
                          : 'Navigate to a different page to see more templates.'
                      }
                      action={
                        allTemplates.length === 0 && accounts.length > 0
                          ? {
                              label: `Add ${activeTab === 'income' ? 'Income' : activeTab === 'expense' ? 'Expense' : 'Savings/Investment'} Template`,
                              onClick: () => handleOpenDialog(),
                              icon: <AddIcon />,
                            }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTemplates
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((template) => (
                    <TableRow key={template.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {template.name}
                        </Typography>
                        {activeTab === 'expense' && (
                          <Typography variant="caption" color="text.secondary">
                            {(template as RecurringExpense).bucket}
                          </Typography>
                        )}
                        {activeTab === 'savings' && (
                          <Typography variant="caption" color="text.secondary">
                            {(template as RecurringSavingsInvestment).destination}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{accountsMap.get(template.accountId) || '—'}</TableCell>
                      <TableCell>{formatCurrency(template.amount)}</TableCell>
                      <TableCell>{template.frequency}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={
                            new Date(template.nextDueDate) <= new Date()
                              ? 'error'
                              : 'text.primary'
                          }
                        >
                          {formatDate(template.nextDueDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={template.status}
                          size="small"
                          color={
                            template.status === 'Active'
                              ? 'success'
                              : template.status === 'Completed'
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
                              const count = getGeneratedTransactionsCount(template.id);
                              if (count > 0) {
                                navigate(`/transactions?tab=${activeTab}`);
                              }
                            }}
                            sx={{ textDecoration: 'none' }}
                          >
                            {getGeneratedTransactionsCount(template.id)} transactions
                          </Link>
                          <IconButton
                            size="small"
                            onClick={() => handlePauseResume(template)}
                            disabled={template.status === 'Completed' || deletingId !== null}
                            aria-label={template.status === 'Active' ? `Pause recurring template ${template.name}` : `Resume recurring template ${template.name}`}
                          >
                            {template.status === 'Active' ? (
                              <PauseIcon fontSize="small" />
                            ) : (
                              <PlayArrowIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(template)}
                            disabled={deletingId !== null}
                            aria-label={`Edit recurring template ${template.name}`}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteClick(template.id)} 
                            color="error"
                            disabled={deletingId !== null}
                            aria-label={`Delete recurring template ${template.name}`}
                          >
                            {deletingId === template.id ? (
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
        {!isLoading && allTemplates.length > 0 && (
          <TablePagination
            component="div"
            count={allTemplates.length}
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
        <DialogTitle>{editingTemplate ? 'Edit Template' : 'Add Recurring Template'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              placeholder="e.g., Monthly Salary, Rent Payment"
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
              required
              fullWidth
              InputProps={{
                startAdornment: <span style={{ marginRight: 8 }}>₹</span>,
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={formData.frequency || frequencyOptions[0]?.value || 'Monthly'}
                label="Frequency"
                onChange={(e) => {
                  const newFrequency = e.target.value as 'Monthly' | 'Weekly' | 'Yearly' | 'Custom' | 'Quarterly';
                  setFormData({ ...formData, frequency: newFrequency });
                }}
              >
                {frequencyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
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
              label="End Date (Optional)"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            {activeTab === 'income' && (
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as IncomeCategory })}
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
            )}

            {activeTab === 'expense' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.expenseCategory}
                    label="Category"
                    onChange={(e) =>
                      setFormData({ ...formData, expenseCategory: e.target.value as ExpenseCategory })
                    }
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
                    onChange={(e) => setFormData({ ...formData, bucket: e.target.value as ExpenseBucket })}
                  >
                    <MenuItem value="Balance">Balance</MenuItem>
                    <MenuItem value="Savings">Savings</MenuItem>
                    <MenuItem value="MutualFunds">Mutual Funds</MenuItem>
                    <MenuItem value="CCBill">CC Bill</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Expense">Expense</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            {activeTab === 'savings' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Type"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as SavingsInvestmentType })}
                  >
                    <MenuItem value="SIP">SIP</MenuItem>
                    <MenuItem value="LumpSum">Lump Sum</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Destination"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  required
                  fullWidth
                  placeholder="e.g., Mutual Fund Name, SIP Name"
                />
                {formData.frequency === 'Quarterly' && (
                  <Typography variant="caption" color="text.secondary">
                    Note: Quarterly frequency is available for Savings/Investment templates.
                  </Typography>
                )}
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
          <Button onClick={handleCloseDialog} disabled={isSaving}>Cancel</Button>
          <ButtonWithLoading
            onClick={handleSave}
            variant="contained"
            loading={isSaving}
            disabled={
              !formData.name.trim() ||
              !formData.accountId ||
              formData.amount <= 0 ||
              isSaving ||
              (activeTab === 'savings' && !formData.destination.trim())
            }
          >
            {editingTemplate ? 'Update' : 'Create'}
          </ButtonWithLoading>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Recurring Template"
        message="Are you sure you want to delete this recurring template? This will not delete generated transactions. This action cannot be undone, but you can use the undo option in the notification."
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setTemplateToDelete(null);
        }}
      />
    </Stack>
  );
}

