import { useState, useMemo, forwardRef, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
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
  Menu,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import type { BankAccount } from '../../types/bankAccounts';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../../types/transactions';
import { useSavedFiltersStore } from '../../store/useSavedFiltersStore';
import { useSearchHistoryStore } from '../../store/useSearchHistoryStore';
import { useToastStore } from '../../store/useToastStore';

// Lazy load AdvancedSearchDialog to reduce initial bundle size
const AdvancedSearchDialog = lazy(() => 
  import('./AdvancedSearchDialog').then((module) => ({ 
    default: module.AdvancedSearchDialog 
  }))
);

/**
 * Transaction Filters Component
 * 
 * Provides filtering and search functionality for transaction lists.
 * Includes full-text search with debouncing, saved filters, search history, and advanced search dialog.
 * Supports filtering by date range, account, category, status, and search term.
 * 
 * Features:
 * - Full-text search across all transaction fields (300ms debounce)
 * - Search history with autocomplete suggestions
 * - Save/load/delete filter presets
 * - Advanced search dialog for complex filter combinations
 * - Visual filter chips showing active filters
 * 
 * @component
 * @example
 * ```tsx
 * <TransactionFilters
 *   ref={searchInputRef}
 *   type="expense"
 *   accounts={accounts}
 *   onFilterChange={(filters) => setFilters(filters)}
 * />
 * ```
 */

type TabValue = 'income' | 'expense' | 'savings' | 'transfers';

/**
 * Props for TransactionFilters component
 * @interface
 */
interface TransactionFiltersProps {
  /** Type of transactions being filtered */
  type: TabValue;
  /** List of bank accounts for account filter */
  accounts: BankAccount[];
  /** Callback function called when filters change */
  onFilterChange: (filters: FilterState) => void;
}

/**
 * Filter state for transactions
 * Contains all filterable fields for transaction lists
 * @interface
 */
export interface FilterState {
  /** Start date for date range filter (ISO date string) */
  dateFrom: string;
  /** End date for date range filter (ISO date string) */
  dateTo: string;
  /** Selected account ID filter */
  accountId: string;
  /** Selected category/type filter */
  category: string;
  /** Selected status filter */
  status: string;
  /** Search term for full-text search */
  searchTerm: string;
}

/** Default empty filter state */
const defaultFilters: FilterState = {
  dateFrom: '',
  dateTo: '',
  accountId: '',
  category: '',
  status: '',
  searchTerm: '',
};

/**
 * TransactionFilters component
 * Provides comprehensive filtering and search for transaction lists
 * 
 * @param props - TransactionFiltersProps
 * @param searchInputRef - Ref to the search input element (for keyboard shortcuts)
 * @returns Filter controls and search interface
 */
export const TransactionFilters = forwardRef<HTMLInputElement, TransactionFiltersProps>(
  function TransactionFilters({ type, accounts, onFilterChange }, searchInputRef) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [saveFilterDialogOpen, setSaveFilterDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [savedFiltersMenuAnchor, setSavedFiltersMenuAnchor] = useState<null | HTMLElement>(null);
  const [advancedSearchDialogOpen, setAdvancedSearchDialogOpen] = useState(false);
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const { saveFilter, getFiltersByType, loadFilter, deleteFilter, updateFilterLastUsed, savedFilters } = useSavedFiltersStore();
  const { addSearch, getHistoryByType, history } = useSearchHistoryStore();
  const { showSuccess, showError } = useToastStore();
  
  const savedFiltersForType = useMemo(() => getFiltersByType(type), [type, getFiltersByType, savedFilters]);
  const searchHistory = useMemo(() => getHistoryByType(type), [type, getHistoryByType, history]);

  // Sync searchInputValue with filters.searchTerm
  useEffect(() => {
    setSearchInputValue(filters.searchTerm);
  }, [filters.searchTerm]);

  // Debounced search - update filter after user stops typing
  useEffect(() => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    searchDebounceTimer.current = setTimeout(() => {
      if (searchInputValue !== filters.searchTerm) {
        const newFilters = { ...filters, searchTerm: searchInputValue };
        setFilters(newFilters);
        onFilterChange(newFilters);
        
        // Track search history when search term changes
        if (searchInputValue.trim()) {
          addSearch(type, searchInputValue);
        }
      }
    }, 300); // 300ms debounce delay

    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, [searchInputValue, filters, onFilterChange, addSearch, type]); // Dependencies for debounced search

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
      const categoryLabel = type === 'savings' ? 'Type' : type === 'transfers' ? 'Category' : 'Category';
      active.push({ key: 'category', label: categoryLabel, value: filters.category });
    }
    if (filters.status) {
      active.push({ key: 'status', label: 'Status', value: filters.status });
    }
    if (filters.searchTerm) {
      active.push({ key: 'searchTerm', label: 'Search', value: filters.searchTerm });
    }
    
    return active;
  }, [filters, accounts, type]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
    
    // Track search history when search term changes
    if (key === 'searchTerm' && value.trim()) {
      addSearch(type, value);
    }
  }, [filters, onFilterChange, addSearch, type]);
  
  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      showError('Please enter a name for the filter');
      return;
    }
    
    if (activeFilterCount === 0) {
      showError('Please apply at least one filter before saving');
      return;
    }
    
    saveFilter(filterName.trim(), type, filters);
    setSaveFilterDialogOpen(false);
    setFilterName('');
    showSuccess(`Filter "${filterName.trim()}" saved successfully`);
  };
  
  const handleLoadFilter = (filterId: string) => {
    const savedFilter = loadFilter(filterId);
    if (savedFilter) {
      setFilters(savedFilter.filters);
      onFilterChange(savedFilter.filters);
      updateFilterLastUsed(filterId);
      setSavedFiltersMenuAnchor(null);
      showSuccess(`Filter "${savedFilter.name}" loaded`);
    }
  };
  
  const handleDeleteFilter = (e: React.MouseEvent, filterId: string) => {
    e.stopPropagation();
    deleteFilter(filterId);
    showSuccess('Filter deleted');
  };
  
  const handleSearchHistorySelect = (searchTerm: string) => {
    handleFilterChange('searchTerm', searchTerm);
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

  const transferCategories: Array<'AccountMaintenance' | 'CreditCardPayment' | 'FundRebalancing' | 'LoanRepayment' | 'Other'> = [
    'AccountMaintenance',
    'CreditCardPayment',
    'FundRebalancing',
    'LoanRepayment',
    'Other',
  ];

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Autocomplete
          freeSolo
          options={searchHistory.map((entry) => entry.searchTerm)}
          value={searchInputValue}
          onInputChange={(_, newValue) => {
            setSearchInputValue(newValue || '');
          }}
          onChange={(_, newValue) => {
            if (typeof newValue === 'string') {
              setSearchInputValue(newValue);
              handleSearchHistorySelect(newValue);
            }
          }}
          size="small"
          sx={{ flex: 1 }}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={searchInputRef}
              placeholder="Search across all fields..."
              InputProps={{
                ...params.InputProps,
                startAdornment: searchHistory.length > 0 && searchInputValue ? (
                  <HistoryIcon sx={{ ml: 1, mr: 0.5, color: 'text.secondary' }} fontSize="small" />
                ) : undefined,
              }}
            />
          )}
        />
        <Tooltip title="Advanced Search">
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={() => setAdvancedSearchDialogOpen(true)}
            size="small"
          >
            Advanced
          </Button>
        </Tooltip>
        <Tooltip title="Saved Filters">
          <Button
            variant={savedFiltersMenuAnchor ? 'contained' : 'outlined'}
            startIcon={<BookmarkIcon />}
            onClick={(e) => setSavedFiltersMenuAnchor(e.currentTarget)}
            disabled={savedFiltersForType.length === 0}
            size="small"
          >
            Saved ({savedFiltersForType.length})
          </Button>
        </Tooltip>
        {activeFilterCount > 0 && (
          <Tooltip title="Save Current Filters">
            <Button
              size="small"
              onClick={() => setSaveFilterDialogOpen(true)}
              startIcon={<SaveIcon />}
              variant="outlined"
              color="primary"
            >
              Save
            </Button>
          </Tooltip>
        )}
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
      
      {/* Advanced Search Dialog */}
      {advancedSearchDialogOpen && (
        <Suspense fallback={null}>
          <AdvancedSearchDialog
            open={advancedSearchDialogOpen}
            onClose={() => setAdvancedSearchDialogOpen(false)}
            onApply={(newFilters) => {
              setFilters(newFilters);
              setSearchInputValue(newFilters.searchTerm);
              onFilterChange(newFilters);
            }}
            accounts={accounts}
            currentFilters={filters}
            type={type}
          />
        </Suspense>
      )}

      {/* Saved Filters Menu */}
      <Menu
        anchorEl={savedFiltersMenuAnchor}
        open={Boolean(savedFiltersMenuAnchor)}
        onClose={() => setSavedFiltersMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {savedFiltersForType.length === 0 ? (
          <MenuItem disabled>No saved filters for this type</MenuItem>
        ) : (
          savedFiltersForType.map((savedFilter) => (
            <MenuItem
              key={savedFilter.id}
              onClick={() => handleLoadFilter(savedFilter.id)}
              sx={{ minWidth: 300, justifyContent: 'space-between', pr: 1 }}
            >
              <Box>
                <Box component="div">{savedFilter.name}</Box>
                <Typography variant="caption" color="text.secondary">
                  {new Date(savedFilter.lastUsedAt).toLocaleDateString()}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => handleDeleteFilter(e, savedFilter.id)}
                sx={{ ml: 1 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </MenuItem>
          ))
        )}
      </Menu>
      
      {/* Save Filter Dialog */}
      <Dialog open={saveFilterDialogOpen} onClose={() => setSaveFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Save Filter
          <IconButton
            aria-label="close"
            onClick={() => setSaveFilterDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Filter Name"
            fullWidth
            variant="outlined"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="e.g., Monthly Expenses, Pending Items"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveFilter();
              }
            }}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Current filters: {activeFilterCount} active
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveFilterDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveFilter} variant="contained" disabled={!filterName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

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
            {type === 'transfers' && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {transferCategories.map((transferCategory) => (
                    <MenuItem key={transferCategory} value={transferCategory}>
                      {transferCategory === 'AccountMaintenance' ? 'Account Maintenance' :
                       transferCategory === 'CreditCardPayment' ? 'Credit Card Payment' :
                       transferCategory === 'FundRebalancing' ? 'Fund Rebalancing' :
                       transferCategory === 'LoanRepayment' ? 'Loan Repayment' :
                       transferCategory}
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
                {type === 'transfers' && (
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

