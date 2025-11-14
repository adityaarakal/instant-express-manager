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
  Chip,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useBanksStore } from '../store/useBanksStore';
import { useToastStore } from '../store/useToastStore';
import { getUserFriendlyError } from '../utils/errorHandling';
import { useUndoStore } from '../store/useUndoStore';
import { restoreDeletedItem } from '../utils/undoRestore';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { ButtonWithLoading } from '../components/common/ButtonWithLoading';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import type { BankAccount } from '../types/bankAccounts';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function BankAccounts() {
  const { accounts, createAccount, updateAccount, deleteAccount } = useBankAccountsStore();
  const { banks } = useBanksStore();
  const { showSuccess, showError, showToast } = useToastStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    bankId: '',
    accountType: 'Savings' as BankAccount['accountType'],
    accountNumber: '',
    currentBalance: 0,
    creditLimit: 0,
    outstandingBalance: 0,
    statementDate: '',
    dueDate: '',
    notes: '',
  });

  // Field-level validation
  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Account name is required';
    }
    
    if (!formData.bankId) {
      errors.bankId = 'Bank is required';
    }
    
    if (formData.currentBalance < 0 && formData.accountType !== 'CreditCard') {
      errors.currentBalance = 'Balance cannot be negative for non-credit card accounts';
    }
    
    return errors;
  }, [formData]);

  const banksMap = useMemo(() => {
    const map = new Map<string, string>();
    banks.forEach((bank) => map.set(bank.id, bank.name));
    return map;
  }, [banks]);

  const [filterBankId, setFilterBankId] = useState<string>('All');
  const [filterAccountType, setFilterAccountType] = useState<BankAccount['accountType'] | 'All'>('All');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesBank = filterBankId === 'All' || account.bankId === filterBankId;
      const matchesType = filterAccountType === 'All' || account.accountType === filterAccountType;
      return matchesBank && matchesType;
    });
  }, [accounts, filterBankId, filterAccountType]);

  const hasActiveFilters = filterBankId !== 'All' || filterAccountType !== 'All';

  const handleClearFilters = () => {
    setFilterBankId('All');
    setFilterAccountType('All');
  };

  const handleOpenDialog = (account?: BankAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        bankId: account.bankId,
        accountType: account.accountType,
        accountNumber: account.accountNumber || '',
        currentBalance: account.currentBalance,
        creditLimit: account.creditLimit || 0,
        outstandingBalance: account.outstandingBalance || 0,
        statementDate: account.statementDate || '',
        dueDate: account.dueDate || '',
        notes: account.notes || '',
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        bankId: banks[0]?.id || '',
        accountType: 'Savings',
        accountNumber: '',
        currentBalance: 0,
        creditLimit: 0,
        outstandingBalance: 0,
        statementDate: '',
        dueDate: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.bankId) return;

    const accountData = {
      name: formData.name,
      bankId: formData.bankId,
      accountType: formData.accountType,
      accountNumber: formData.accountNumber || undefined,
      currentBalance: formData.currentBalance,
      creditLimit: formData.accountType === 'CreditCard' ? formData.creditLimit : undefined,
      outstandingBalance: formData.accountType === 'CreditCard' ? formData.outstandingBalance : undefined,
      statementDate: formData.statementDate || undefined,
      dueDate: formData.accountType === 'CreditCard' ? formData.dueDate : undefined,
      notes: formData.notes || undefined,
    };

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      if (editingAccount) {
        updateAccount(editingAccount.id, accountData);
        showSuccess('Account updated successfully');
      } else {
        createAccount(accountData);
        showSuccess('Account created successfully');
      }
      handleCloseDialog();
    } catch (error) {
      showError(getUserFriendlyError(error, 'save account'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setAccountToDelete(id);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    
    setConfirmDeleteOpen(false);
    setDeletingId(accountToDelete);
    try {
      // Store the account data for undo before deleting
      const account = accounts.find((a) => a.id === accountToDelete);
      if (!account) {
        showError('Account not found');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
      deleteAccount(accountToDelete);

      // Store in undo store and show undo button
      const deletedItemId = useUndoStore.getState().addDeletedItem('BankAccount', account);
      
      showToast(
        'Account deleted successfully',
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
      showError(getUserFriendlyError(error, 'delete account'));
    } finally {
      setDeletingId(null);
      setAccountToDelete(null);
    }
  };

  const isCreditCard = formData.accountType === 'CreditCard';

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Bank Accounts</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={banks.length === 0}
        >
          Add Account
        </Button>
      </Box>

      {banks.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Please add a bank first before creating accounts.
          </Typography>
        </Paper>
      )}

      {banks.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Stack 
            direction={isMobile ? 'column' : 'row'} 
            spacing={2}
          >
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Bank</InputLabel>
              <Select
                value={filterBankId}
                label="Filter by Bank"
                onChange={(e) => setFilterBankId(e.target.value)}
              >
                <MenuItem value="All">All Banks</MenuItem>
                {banks.map((bank) => (
                  <MenuItem key={bank.id} value={bank.id}>
                    {bank.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={filterAccountType}
                label="Filter by Type"
                onChange={(e) => setFilterAccountType(e.target.value as BankAccount['accountType'] | 'All')}
              >
                <MenuItem value="All">All Types</MenuItem>
                <MenuItem value="Savings">Savings</MenuItem>
                <MenuItem value="Current">Current</MenuItem>
                <MenuItem value="CreditCard">Credit Card</MenuItem>
                <MenuItem value="Wallet">Wallet</MenuItem>
              </Select>
            </FormControl>
            {hasActiveFilters && (
              <Button
                size="small"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
                variant="outlined"
                color="inherit"
              >
                Clear
              </Button>
            )}
          </Stack>
          
          {/* Filter Chips */}
          {hasActiveFilters && (
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
              {filterBankId !== 'All' && (
                <Chip
                  label={`Bank: ${banksMap.get(filterBankId) || filterBankId}`}
                  onDelete={() => setFilterBankId('All')}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )}
              {filterAccountType !== 'All' && (
                <Chip
                  label={`Type: ${filterAccountType}`}
                  onDelete={() => setFilterAccountType('All')}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )}
            </Stack>
          )}
        </Paper>
      )}

      <TableContainer 
        component={Paper}
        sx={{
          overflowX: 'auto',
          '& .MuiTableCell-root': {
            whiteSpace: 'nowrap',
            minWidth: 100,
          },
        }}
      >
        <Table aria-label="Bank accounts table" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Account Name</TableCell>
              <TableCell>Bank</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Balance</TableCell>
              {isCreditCard && <TableCell align="right">Outstanding</TableCell>}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={5} columns={isCreditCard ? 6 : 5} />
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isCreditCard ? 6 : 5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    {accounts.length === 0
                      ? 'No accounts found. Add your first account to get started.'
                      : 'No accounts match the current filters.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {account.name}
                    </Typography>
                    {account.accountNumber && (
                      <Typography variant="caption" color="text.secondary">
                        {account.accountNumber}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{banksMap.get(account.bankId) || '—'}</TableCell>
                  <TableCell>
                    <Chip label={account.accountType} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={account.currentBalance < 0 ? 'error' : 'text.primary'}
                    >
                      {formatCurrency(account.currentBalance)}
                    </Typography>
                  </TableCell>
                  {isCreditCard && (
                    <TableCell align="right">
                      {account.outstandingBalance
                        ? formatCurrency(account.outstandingBalance)
                        : '—'}
                    </TableCell>
                  )}
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(account)} 
                      disabled={deletingId !== null}
                      aria-label={`Edit account ${account.name}`}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteClick(account.id)} 
                      color="error"
                      disabled={deletingId !== null}
                      aria-label={`Delete account ${account.name}`}
                    >
                      {deletingId === account.id ? (
                        <CircularProgress size={16} aria-label="Deleting" />
                      ) : (
                        <DeleteIcon fontSize="small" />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
        <DialogContent>
          <div id="account-dialog-description" className="sr-only">
            {editingAccount ? `Edit details for ${editingAccount.name}` : 'Enter details for a new bank account'}
          </div>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Account Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
              placeholder="e.g., ICICI 3945"
            />
            <FormControl fullWidth required error={!!fieldErrors.bankId}>
              <InputLabel>Bank</InputLabel>
              <Select
                value={formData.bankId}
                label="Bank"
                onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
              >
                {banks.map((bank) => (
                  <MenuItem key={bank.id} value={bank.id}>
                    {bank.name}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.bankId && (
                <span style={{ color: 'var(--mui-palette-error-main)', fontSize: '0.75rem', marginTop: '3px', marginLeft: '14px' }}>
                  {fieldErrors.bankId}
                </span>
              )}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={formData.accountType}
                label="Account Type"
                onChange={(e) =>
                  setFormData({ ...formData, accountType: e.target.value as BankAccount['accountType'] })
                }
              >
                <MenuItem value="Savings">Savings</MenuItem>
                <MenuItem value="Current">Current</MenuItem>
                <MenuItem value="CreditCard">Credit Card</MenuItem>
                <MenuItem value="Wallet">Wallet</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Account Number"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              fullWidth
            />
            <TextField
              label="Current Balance"
              type="number"
              value={formData.currentBalance}
              onChange={(e) => setFormData({ ...formData, currentBalance: Number(e.target.value) })}
              fullWidth
              error={!!fieldErrors.currentBalance}
              helperText={fieldErrors.currentBalance}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
              }}
            />
            {isCreditCard && (
              <>
                <TextField
                  label="Credit Limit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                  fullWidth
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                  }}
                />
                <TextField
                  label="Outstanding Balance"
                  type="number"
                  value={formData.outstandingBalance}
                  onChange={(e) => setFormData({ ...formData, outstandingBalance: Number(e.target.value) })}
                  fullWidth
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                  }}
                />
                <TextField
                  label="Statement Date"
                  type="date"
                  value={formData.statementDate}
                  onChange={(e) => setFormData({ ...formData, statementDate: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Due Date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
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
            disabled={!formData.name.trim() || !formData.bankId}
            loading={isSaving}
          >
            {editingAccount ? 'Update' : 'Create'}
          </ButtonWithLoading>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Account"
        message="Are you sure you want to delete this account? This action cannot be undone, but you can use the undo option in the notification."
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setAccountToDelete(null);
        }}
      />
    </Stack>
  );
}

