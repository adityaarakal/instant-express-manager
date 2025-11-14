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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useBanksStore } from '../store/useBanksStore';
import { useToastStore } from '../store/useToastStore';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { ButtonWithLoading } from '../components/common/ButtonWithLoading';
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
  const { showSuccess, showError } = useToastStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const banksMap = useMemo(() => {
    const map = new Map<string, string>();
    banks.forEach((bank) => map.set(bank.id, bank.name));
    return map;
  }, [banks]);

  const [filterBankId, setFilterBankId] = useState<string>('All');
  const [filterAccountType, setFilterAccountType] = useState<BankAccount['accountType'] | 'All'>('All');

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesBank = filterBankId === 'All' || account.bankId === filterBankId;
      const matchesType = filterAccountType === 'All' || account.accountType === filterAccountType;
      return matchesBank && matchesType;
    });
  }, [accounts, filterBankId, filterAccountType]);

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
      showError(error instanceof Error ? error.message : 'Failed to save account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      setDeletingId(id);
      try {
        await new Promise((resolve) => setTimeout(resolve, 200));
        deleteAccount(id);
        showSuccess('Account deleted successfully');
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to delete account');
      } finally {
        setDeletingId(null);
      }
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
          <Stack direction="row" spacing={2}>
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
          </Stack>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
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
                    <IconButton size="small" onClick={() => handleOpenDialog(account)} disabled={deletingId !== null}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(account.id)} 
                      color="error"
                      disabled={deletingId !== null}
                    >
                      {deletingId === account.id ? (
                        <CircularProgress size={16} />
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
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Account Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              placeholder="e.g., ICICI 3945"
            />
            <FormControl fullWidth required>
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
    </Stack>
  );
}

