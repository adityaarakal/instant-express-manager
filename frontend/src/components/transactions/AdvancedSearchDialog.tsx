/**
 * Advanced Search Dialog Component
 * 
 * A comprehensive search dialog that allows users to apply multiple filters at once for transactions.
 * Provides a single interface for setting date ranges, account, category, status, and search term filters.
 * Shows active filters as removable chips and provides clear/reset functionality.
 * 
 * @component
 * @example
 * ```tsx
 * <AdvancedSearchDialog
 *   open={dialogOpen}
 *   onClose={() => setDialogOpen(false)}
 *   onApply={(filters) => handleFilterChange(filters)}
 *   accounts={accounts}
 *   currentFilters={currentFilters}
 *   type="expense"
 * />
 * ```
 */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import type { BankAccount } from '../../types/bankAccounts';
import type { FilterState } from './TransactionFilters';

/**
 * Props for AdvancedSearchDialog component
 * @interface
 */
interface AdvancedSearchDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback function called when dialog is closed */
  onClose: () => void;
  /** Callback function called when filters are applied */
  onApply: (filters: FilterState) => void;
  /** List of bank accounts for account filter */
  accounts: BankAccount[];
  /** Current filter state (initial values) */
  currentFilters: FilterState;
  /** Type of transactions being filtered */
  type: 'income' | 'expense' | 'savings' | 'transfers';
}

/**
 * Advanced Search Dialog component
 * Provides a comprehensive interface for applying multiple transaction filters
 * 
 * @param props - AdvancedSearchDialogProps
 * @returns Dialog component with filter controls
 */
export function AdvancedSearchDialog({
  open,
  onClose,
  onApply,
  accounts,
  currentFilters,
  type,
}: AdvancedSearchDialogProps) {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: FilterState = {
      dateFrom: '',
      dateTo: '',
      accountId: '',
      category: '',
      status: '',
      searchTerm: '',
    };
    setFilters(clearedFilters);
    onApply(clearedFilters);
  };

  const handleReset = () => {
    setFilters(currentFilters);
  };

  const getCategories = () => {
    if (type === 'income') {
      return ['Salary', 'Bonus', 'Freelancing', 'Tutoring', 'Project', 'Business', 'LendingReturns', 'Other'];
    } else if (type === 'expense') {
      return ['Utilities', 'Responsibilities', 'STRResidency', 'Maintenance', 'CCBill', 'Unplanned', 'Other'];
    } else if (type === 'savings') {
      return ['SIP', 'LumpSum', 'Withdrawal', 'Return'];
    } else {
      return ['AccountMaintenance', 'CreditCardPayment', 'FundRebalancing', 'LoanRepayment', 'Other'];
    }
  };

  const getStatuses = () => {
    if (type === 'transfers') {
      return ['Pending', 'Completed'];
    } else if (type === 'income') {
      return ['Pending', 'Received'];
    } else if (type === 'expense') {
      return ['Pending', 'Paid'];
    } else {
      return ['Pending', 'Completed'];
    }
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Advanced Search</Typography>
          <IconButton onClick={onClose} size="small" aria-label="close">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {activeFilterCount > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </Typography>
            </Box>
          )}

          <TextField
            label="Search Term"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            placeholder="Search across all fields..."
            fullWidth
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: filters.searchTerm && (
                <IconButton
                  size="small"
                  onClick={() => handleFilterChange('searchTerm', '')}
                  aria-label="clear search"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              ),
            }}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Date From"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Date To"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>

          <FormControl fullWidth>
            <InputLabel>Account</InputLabel>
            <Select
              value={filters.accountId}
              onChange={(e) => handleFilterChange('accountId', e.target.value)}
              label="Account"
            >
              <MenuItem value="">All Accounts</MenuItem>
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{type === 'savings' ? 'Type' : 'Category'}</InputLabel>
            <Select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              label={type === 'savings' ? 'Type' : 'Category'}
            >
              <MenuItem value="">All {type === 'savings' ? 'Types' : 'Categories'}</MenuItem>
              {getCategories().map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              label="Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {getStatuses().map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {activeFilterCount > 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Active Filters:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {filters.dateFrom && (
                  <Chip
                    label={`From: ${filters.dateFrom}`}
                    size="small"
                    onDelete={() => handleFilterChange('dateFrom', '')}
                  />
                )}
                {filters.dateTo && (
                  <Chip
                    label={`To: ${filters.dateTo}`}
                    size="small"
                    onDelete={() => handleFilterChange('dateTo', '')}
                  />
                )}
                {filters.accountId && (
                  <Chip
                    label={`Account: ${accounts.find((a) => a.id === filters.accountId)?.name || filters.accountId}`}
                    size="small"
                    onDelete={() => handleFilterChange('accountId', '')}
                  />
                )}
                {filters.category && (
                  <Chip
                    label={`${type === 'savings' ? 'Type' : 'Category'}: ${filters.category}`}
                    size="small"
                    onDelete={() => handleFilterChange('category', '')}
                  />
                )}
                {filters.status && (
                  <Chip
                    label={`Status: ${filters.status}`}
                    size="small"
                    onDelete={() => handleFilterChange('status', '')}
                  />
                )}
                {filters.searchTerm && (
                  <Chip
                    label={`Search: ${filters.searchTerm}`}
                    size="small"
                    onDelete={() => handleFilterChange('searchTerm', '')}
                  />
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} color="inherit">
          Reset
        </Button>
        <Button onClick={handleClear} startIcon={<ClearIcon />} color="error">
          Clear All
        </Button>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleApply} variant="contained" startIcon={<SearchIcon />}>
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
}

