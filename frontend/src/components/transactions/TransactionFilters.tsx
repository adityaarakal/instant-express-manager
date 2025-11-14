import { useState, useMemo, forwardRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Stack,
  Chip,
  IconButton,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import type { BankAccount } from '../../types/bankAccounts';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../../types/transactions';

type TabValue = 'income' | 'expense' | 'savings';

interface TransactionFiltersProps {
  type: TabValue;
  accounts: BankAccount[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  accountId: string;
  category: string;
  status: string;
  searchTerm: string;
}

const defaultFilters: FilterState = {
  dateFrom: '',
  dateTo: '',
  accountId: '',
  category: '',
  status: '',
  searchTerm: '',
};

export const TransactionFilters = forwardRef<HTMLInputElement, TransactionFiltersProps>(
  function TransactionFilters({ type, accounts, onFilterChange }, searchInputRef) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.accountId) count++;
    if (filters.category) count++;
    if (filters.status) count++;
    if (filters.searchTerm) count++;
    return count;
  }, [filters]);

  const activeFilters = useMemo(() => {
    const active: Array<{ key: keyof FilterState; label: string; value: string }> = [];
    
    if (filters.dateFrom) {
      active.push({ key: 'dateFrom', label: 'From', value: filters.dateFrom });
    }
    if (filters.dateTo) {
      active.push({ key: 'dateTo', label: 'To', value: filters.dateTo });
    }
    if (filters.accountId) {
      const account = accounts.find((a) => a.id === filters.accountId);
      active.push({ key: 'accountId', label: 'Account', value: account?.name || filters.accountId });
    }
    if (filters.category) {
      active.push({ key: 'category', label: type === 'savings' ? 'Type' : 'Category', value: filters.category });
    }
    if (filters.status) {
      active.push({ key: 'status', label: 'Status', value: filters.status });
    }
    if (filters.searchTerm) {
      active.push({ key: 'searchTerm', label: 'Search', value: filters.searchTerm });
    }
    
    return active;
  }, [filters, accounts, type]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const handleRemoveFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters, [key]: '' };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const incomeCategories: IncomeTransaction['category'][] = [
    'Salary',
    'Bonus',
    'Freelancing',
    'Tutoring',
    'Project',
    'Business',
    'LendingReturns',
    'Other',
  ];

  const expenseCategories: ExpenseTransaction['category'][] = [
    'Utilities',
    'Responsibilities',
    'STRResidency',
    'Maintenance',
    'CCBill',
    'Unplanned',
    'Other',
  ];

  const savingsTypes: SavingsInvestmentTransaction['type'][] = [
    'SIP',
    'LumpSum',
    'Withdrawal',
    'Return',
  ];

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <TextField
          inputRef={searchInputRef}
          placeholder="Search by description..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <Button
          variant={filtersExpanded ? 'contained' : 'outlined'}
          startIcon={<FilterListIcon />}
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          endIcon={activeFilterCount > 0 ? <Chip label={activeFilterCount} size="small" /> : undefined}
        >
          Filters
        </Button>
        {activeFilterCount > 0 && (
          <Button
            size="small"
            onClick={handleClearFilters}
            startIcon={<ClearIcon />}
            variant="outlined"
            color="inherit"
          >
            Clear All
          </Button>
        )}
      </Stack>

      {/* Filter Chips */}
      {activeFilters.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {activeFilters.map((filter) => (
            <Chip
              key={filter.key}
              label={`${filter.label}: ${filter.value}`}
              onDelete={() => handleRemoveFilter(filter.key)}
              size="small"
              variant="outlined"
              color="primary"
            />
          ))}
        </Stack>
      )}

      {filtersExpanded && (
        <Box
          sx={{
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Date From"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="Date To"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Account</InputLabel>
              <Select
                value={filters.accountId}
                label="Account"
                onChange={(e) => handleFilterChange('accountId', e.target.value)}
              >
                <MenuItem value="">All Accounts</MenuItem>
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {type === 'income' && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {incomeCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {type === 'expense' && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {expenseCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {type === 'savings' && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.category}
                  label="Type"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {savingsTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                {type === 'income' && (
                  <>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Received">Received</MenuItem>
                  </>
                )}
                {type === 'expense' && (
                  <>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                  </>
                )}
                {type === 'savings' && (
                  <>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
          </Stack>
        </Box>
      )}
    </Box>
  );
  }
);

