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
import { EmptyState } from '../components/common/EmptyState';
import { ViewToggle } from '../components/common/ViewToggle';
import { useViewMode } from '../hooks/useViewMode';
import { BankAccountCard } from '../components/bankAccounts/BankAccountCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
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
    initialBalance: 0, // Track initial balance separately
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
  const { viewMode, toggleViewMode } = useViewMode('bank-accounts-view-mode');

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((account) => {
      const matchesBank = filterBankId === 'All' || account.bankId === filterBankId;
      const matchesType = filterAccountType === 'All' || account.accountType === filterAccountType;
      return matchesBank && matchesType;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // Newest first
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
        initialBalance: account.initialBalance ?? account.currentBalance ?? 0,
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
        initialBalance: 0,
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

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      if (editingAccount) {
        // When updating, preserve existing initialBalance (don't pass it in updates)
        const updateData = {
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
        updateAccount(editingAccount.id, updateData);
        showSuccess('Account updated successfully');
      } else {
        // When creating, set initialBalance to currentBalance
        const createData = {
          name: formData.name,
          bankId: formData.bankId,
          accountType: formData.accountType,
          accountNumber: formData.accountNumber || undefined,
          currentBalance: formData.currentBalance,
          initialBalance: formData.currentBalance,
          creditLimit: formData.accountType === 'CreditCard' ? formData.creditLimit : undefined,
          outstandingBalance: formData.accountType === 'CreditCard' ? formData.outstandingBalance : undefined,
          statementDate: formData.statementDate || undefined,
          dueDate: formData.accountType === 'CreditCard' ? formData.dueDate : undefined,
          notes: formData.notes || undefined,
        };
        createAccount(createData);
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
  const hasCreditCardAccounts = filteredAccounts.some(account => account.accountType === 'CreditCard');

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
          Bank Accounts
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={banks.length === 0}
            sx={{ 
              flexShrink: 0,
              minHeight: { xs: 44, sm: 48 },
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              whiteSpace: 'nowrap',
              px: { xs: 1.5, sm: 2 },
            }}
            fullWidth={isMobile}
          >
            Add Account
          </Button>
        </Stack>
      </Box>

      {banks.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Please add a bank first before creating accounts.
          </Typography>
        </Paper>
      )}

      {banks.length > 0 && (
        <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1.5, sm: 2 }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: '100%', sm: 200 },
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              <InputLabel>Filter by Bank</InputLabel>
              <Select
                value={filterBankId}
                label="Filter by Bank"
                onChange={(e) => setFilterBankId(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: { xs: '60vh', sm: 'none' },
                      maxWidth: { xs: '90vw', sm: 'none' },
                    },
                  },
                }}
              >
                <MenuItem value="All">All Banks</MenuItem>
                {banks.map((bank) => (
                  <MenuItem key={bank.id} value={bank.id}>
                    {bank.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: '100%', sm: 150 },
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={filterAccountType}
                label="Filter by Type"
                onChange={(e) => setFilterAccountType(e.target.value as BankAccount['accountType'] | 'All')}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: { xs: '60vh', sm: 'none' },
                      maxWidth: { xs: '90vw', sm: 'none' },
                    },
                  },
                }}
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
                sx={{
                  minHeight: { xs: 40, sm: 36 },
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                  px: { xs: 1.5, sm: 2 },
                  whiteSpace: 'nowrap',
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                Clear
              </Button>
            )}
          </Stack>
          
          {/* Filter Chips */}
          {hasActiveFilters && (
            <Stack 
              direction="row" 
              spacing={{ xs: 0.5, sm: 1 }} 
              sx={{ 
                mt: { xs: 1.5, sm: 2 }, 
                flexWrap: 'wrap', 
                gap: { xs: 0.5, sm: 1 } 
              }}
            >
              {filterBankId !== 'All' && (
                <Chip
                  label={`Bank: ${banksMap.get(filterBankId) || filterBankId}`}
                  onDelete={() => setFilterBankId('All')}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{
                    fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                    height: { xs: 24, sm: 28 },
                    '& .MuiChip-label': {
                      px: { xs: 0.75, sm: 1 },
                      maxWidth: { xs: 150, sm: 'none' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              )}
              {filterAccountType !== 'All' && (
                <Chip
                  label={`Type: ${filterAccountType}`}
                  onDelete={() => setFilterAccountType('All')}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{
                    fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                    height: { xs: 24, sm: 28 },
                    '& .MuiChip-label': {
                      px: { xs: 0.75, sm: 1 },
                    },
                  }}
                />
              )}
            </Stack>
          )}
        </Paper>
      )}

      {viewMode === 'card' ? (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
          {isLoading ? (
            <Stack spacing={1.5}>
              {[...Array(5)].map((_, i) => (
                <Box key={i} sx={{ height: 200, bgcolor: 'action.hover', borderRadius: 1 }} />
              ))}
            </Stack>
          ) : filteredAccounts.length === 0 ? (
            <Box sx={{ py: 4, px: 2 }}>
              <EmptyState
                icon={<AccountBalanceWalletIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />}
                title={accounts.length === 0 ? 'No Accounts Yet' : 'No Accounts Match Filters'}
                description={
                  accounts.length === 0
                    ? 'Create your first bank account to start tracking transactions. Link it to a bank to organize your finances.'
                    : 'Try adjusting your filter criteria to find the accounts you\'re looking for.'
                }
                action={
                  accounts.length === 0
                    ? {
                        label: 'Add Your First Account',
                        onClick: () => handleOpenDialog(),
                        icon: <AddIcon />,
                      }
                    : undefined
                }
              />
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {filteredAccounts.map((account) => (
                <BankAccountCard
                  key={account.id}
                  account={account}
                  bankName={banksMap.get(account.bankId) || '—'}
                  isDeleting={deletingId === account.id}
                  onEdit={() => handleOpenDialog(account)}
                  onDelete={() => handleDeleteClick(account.id)}
                  formatCurrency={formatCurrency}
                />
              ))}
            </Stack>
          )}
        </Box>
      ) : (
        <TableContainer 
          component={Paper}
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
          <Table aria-label="Bank accounts table" sx={{ minWidth: { xs: 600, sm: 800 } }}>
            <TableHead>
              <TableRow>
                <TableCell>Account Name</TableCell>
                <TableCell>Bank</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Balance</TableCell>
                {hasCreditCardAccounts && <TableCell align="right">Outstanding</TableCell>}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableSkeleton rows={5} columns={hasCreditCardAccounts ? 6 : 5} />
              ) : filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={hasCreditCardAccounts ? 6 : 5} 
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
                        icon={<AccountBalanceWalletIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />}
                        title={accounts.length === 0 ? 'No Accounts Yet' : 'No Accounts Match Filters'}
                        description={
                          accounts.length === 0
                            ? 'Create your first bank account to start tracking transactions. Link it to a bank to organize your finances.'
                            : 'Try adjusting your filter criteria to find the accounts you\'re looking for.'
                        }
                        action={
                          accounts.length === 0
                            ? {
                                label: 'Add Your First Account',
                                onClick: () => handleOpenDialog(),
                                icon: <AddIcon />,
                              }
                            : undefined
                        }
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id} hover>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        sx={{
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          wordBreak: 'break-word',
                        }}
                      >
                        {account.name}
                      </Typography>
                      {account.accountNumber && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                            wordBreak: 'break-word',
                          }}
                        >
                          {account.accountNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        wordBreak: 'break-word',
                      }}
                    >
                      {banksMap.get(account.bankId) || '—'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={account.accountType} 
                        size="small"
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
                      <Typography
                        variant="body2"
                        color={account.currentBalance < 0 ? 'error' : 'text.primary'}
                        sx={{
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                      {formatCurrency(account.currentBalance)}
                    </Typography>
                  </TableCell>
                  {hasCreditCardAccounts && (
                    <TableCell align="right">
                      <Typography
                        sx={{
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {account.accountType === 'CreditCard' && account.outstandingBalance
                          ? formatCurrency(account.outstandingBalance)
                          : '—'}
                      </Typography>
                    </TableCell>
                  )}
                    <TableCell align="right">
                      <Stack 
                        direction="row" 
                        spacing={{ xs: 0.5, sm: 1 }} 
                        justifyContent="flex-end"
                      >
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDialog(account)} 
                          disabled={deletingId !== null}
                          aria-label={`Edit account ${account.name}`}
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
                          onClick={() => handleDeleteClick(account.id)} 
                          color="error"
                          disabled={deletingId !== null}
                          aria-label={`Delete account ${account.name}`}
                          sx={{
                            minWidth: { xs: 40, sm: 48 },
                            minHeight: { xs: 40, sm: 48 },
                            p: { xs: 0.5, sm: 1 },
                          }}
                        >
                          {deletingId === account.id ? (
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
          {editingAccount ? 'Edit Account' : 'Add Account'}
        </DialogTitle>
        <DialogContent
          sx={{
            px: { xs: 2, sm: 3 },
            pb: { xs: 2, sm: 3 },
          }}
        >
          <div id="account-dialog-description" className="sr-only">
            {editingAccount ? `Edit details for ${editingAccount.name}` : 'Enter details for a new bank account'}
          </div>
          <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ mt: { xs: 0, sm: 1 } }}>
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
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: { xs: '60vh', sm: 'none' },
                      maxWidth: { xs: '90vw', sm: 'none' },
                    },
                  },
                }}
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
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: { xs: '60vh', sm: 'none' },
                      maxWidth: { xs: '90vw', sm: 'none' },
                    },
                  },
                }}
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
            disabled={!formData.name.trim() || !formData.bankId}
            loading={isSaving}
            fullWidth={isMobile}
            sx={{
              minHeight: { xs: 44, sm: 40 },
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              px: { xs: 1.5, sm: 2 },
            }}
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

