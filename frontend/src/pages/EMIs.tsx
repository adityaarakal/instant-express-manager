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
import { useUndoStore } from '../store/useUndoStore';
import { restoreDeletedItem } from '../utils/undoRestore';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { ButtonWithLoading } from '../components/common/ButtonWithLoading';
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
  const [activeTab, setActiveTab] = useState<TabValue>('expense');
  const { emis: expenseEMIs, createEMI: createExpenseEMI, updateEMI: updateExpenseEMI, deleteEMI: deleteExpenseEMI, pauseEMI: pauseExpenseEMI, resumeEMI: resumeExpenseEMI, getGeneratedTransactions: getExpenseGeneratedTransactions } = useExpenseEMIsStore();
  const { emis: savingsEMIs, createEMI: createSavingsEMI, updateEMI: updateSavingsEMI, deleteEMI: deleteSavingsEMI, pauseEMI: pauseSavingsEMI, resumeEMI: resumeSavingsEMI, getGeneratedTransactions: getSavingsGeneratedTransactions } = useSavingsInvestmentEMIsStore();
  const { accounts } = useBankAccountsStore();
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const savingsTransactions = useSavingsInvestmentTransactionsStore((state) => state.transactions);
  const { showSuccess, showError, showToast } = useToastStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEMI, setEditingEMI] = useState<ExpenseEMI | SavingsInvestmentEMI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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
      showError(error instanceof Error ? error.message : 'Failed to save EMI');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this EMI? This will not delete generated transactions.')) {
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
        showError(error instanceof Error ? error.message : 'Failed to delete EMI');
      } finally {
        setDeletingId(null);
      }
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
      showError(error instanceof Error ? error.message : 'Failed to update EMI status');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">EMIs</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={accounts.length === 0}
        >
          Add EMI
        </Button>
      </Box>

      <Paper>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Expense EMIs" value="expense" />
          <Tab label="Savings/Investment EMIs" value="savings" />
        </Tabs>

        <TableContainer>
          <Table>
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
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      {allEMIs.length === 0
                        ? 'No EMIs found. Add your first EMI to get started.'
                        : 'No EMIs on this page.'}
                    </Typography>
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
                                window.location.href = `/transactions?tab=${activeTab === 'expense' ? 'expense' : 'savings'}&emi=${emi.id}`;
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
                          >
                            {emi.status === 'Active' ? (
                              <PauseIcon fontSize="small" />
                            ) : (
                              <PlayArrowIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(emi)}
                            disabled={deletingId !== null}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(emi.id)} 
                            color="error"
                            disabled={deletingId !== null}
                          >
                            {deletingId === emi.id ? (
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
        {!isLoading && allEMIs.length > 0 && (
          <TablePagination
            component="div"
            count={allEMIs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
            }
          />
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingEMI ? 'Edit EMI' : 'Add EMI'}</DialogTitle>
        <DialogContent>
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
    </Stack>
  );
}

