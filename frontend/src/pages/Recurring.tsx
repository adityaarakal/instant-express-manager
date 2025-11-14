import { useState, useMemo, useEffect } from 'react';
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
  Link,
  CircularProgress,
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
import { useUndoStore } from '../store/useUndoStore';
import { restoreDeletedItem } from '../utils/undoRestore';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { ButtonWithLoading } from '../components/common/ButtonWithLoading';
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

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

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
      setFormData({
        name: '',
        amount: 0,
        accountId: accounts[0]?.id || '',
        frequency: 'Monthly',
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
    if (!formData.name.trim() || !formData.accountId || formData.amount <= 0) return;

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
      showError(error instanceof Error ? error.message : 'Failed to save recurring template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recurring template? This will not delete generated transactions.')) {
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
        showError(error instanceof Error ? error.message : 'Failed to delete recurring template');
      } finally {
        setDeletingId(null);
      }
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
      showError(error instanceof Error ? error.message : 'Failed to update recurring template status');
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

  const currentTemplates =
    activeTab === 'income'
      ? incomeTemplates
      : activeTab === 'expense'
      ? expenseTemplates
      : savingsTemplates;

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Recurring Templates</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={accounts.length === 0}
        >
          Add Template
        </Button>
      </Box>

      <Paper>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Recurring Incomes" value="income" />
          <Tab label="Recurring Expenses" value="expense" />
          <Tab label="Recurring Savings/Investments" value="savings" />
        </Tabs>

        <TableContainer>
          <Table>
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
              ) : currentTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      No recurring templates found. Add your first template to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                currentTemplates
                  .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
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
                                window.location.href = `/transactions?tab=${activeTab}`;
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
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(template.id)} 
                            color="error"
                            disabled={deletingId !== null}
                          >
                            {deletingId === template.id ? (
                              <CircularProgress size={16} />
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
                value={formData.frequency}
                label="Frequency"
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value as RecurringIncome['frequency'] })
                }
              >
                {activeTab === 'savings' ? (
                  <>
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Quarterly">Quarterly</MenuItem>
                    <MenuItem value="Yearly">Yearly</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Weekly">Weekly</MenuItem>
                    <MenuItem value="Yearly">Yearly</MenuItem>
                    <MenuItem value="Custom">Custom</MenuItem>
                  </>
                )}
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
    </Stack>
  );
}

