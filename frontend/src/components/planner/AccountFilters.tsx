import { useMemo, memo, useState } from 'react';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  TextField,
  Collapse,
  Button,
  IconButton,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import type { AggregatedMonth } from '../../types/plannedExpensesAggregated';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';
import type { BankAccount } from '../../types/bankAccounts';
import { useBankAccountsStore } from '../../store/useBankAccountsStore';
import { FilterPresetsManager } from './FilterPresetsManager';
import type { FilterPreset } from '../../store/useFilterPresetsStore';

interface AccountFiltersProps {
  month: AggregatedMonth;
  selectedAccount: string | null;
  selectedBucket: string | null;
  selectedAccountType: string | null;
  selectedStatus: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  showNegativeOnly: boolean;
  onAccountChange: (accountId: string | null) => void;
  onBucketChange: (bucketId: string | null) => void;
  onAccountTypeChange: (accountType: string | null) => void;
  onStatusChange: (status: string | null) => void;
  onMinAmountChange: (amount: number | null) => void;
  onMaxAmountChange: (amount: number | null) => void;
  onNegativeOnlyChange: (show: boolean) => void;
  onClear: () => void;
}

export const AccountFilters = memo(function AccountFilters({
  month,
  selectedAccount,
  selectedBucket,
  selectedAccountType,
  selectedStatus,
  minAmount,
  maxAmount,
  showNegativeOnly,
  onAccountChange,
  onBucketChange,
  onAccountTypeChange,
  onStatusChange,
  onMinAmountChange,
  onMaxAmountChange,
  onNegativeOnlyChange,
  onClear,
}: AccountFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [presetsAnchorEl, setPresetsAnchorEl] = useState<HTMLElement | null>(null);

  const currentFilters: FilterPreset['filters'] = useMemo(
    () => ({
      selectedAccount,
      selectedBucket,
      selectedAccountType,
      selectedStatus,
      minAmount,
      maxAmount,
      showNegativeOnly,
    }),
    [selectedAccount, selectedBucket, selectedAccountType, selectedStatus, minAmount, maxAmount, showNegativeOnly],
  );

  const handleLoadPreset = (filters: FilterPreset['filters']) => {
    onAccountChange(filters.selectedAccount);
    onBucketChange(filters.selectedBucket);
    onAccountTypeChange(filters.selectedAccountType);
    onStatusChange(filters.selectedStatus);
    onMinAmountChange(filters.minAmount);
    onMaxAmountChange(filters.maxAmount);
    onNegativeOnlyChange(filters.showNegativeOnly);
  };
  const accounts = useBankAccountsStore((state) => state.accounts);
  const accountsMap = useMemo(() => {
    const map = new Map<string, BankAccount>();
    accounts.forEach((acc) => map.set(acc.id, acc));
    return map;
  }, [accounts]);

  const buckets = useMemo(
    () => DEFAULT_BUCKETS.filter((bucket) => month.bucketOrder.includes(bucket.id)),
    [month.bucketOrder],
  );

  // Get unique account types from month accounts
  const accountTypes = useMemo(() => {
    const types = new Set<string>();
    month.accounts.forEach((acc) => {
      const account = accountsMap.get(acc.id);
      if (account) types.add(account.accountType);
    });
    return Array.from(types).sort();
  }, [month.accounts, accountsMap]);

  const hasActiveFilters =
    selectedAccount !== null ||
    selectedBucket !== null ||
    selectedAccountType !== null ||
    selectedStatus !== null ||
    minAmount !== null ||
    maxAmount !== null ||
    showNegativeOnly;

  return (
    <Paper elevation={1} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }} className="no-print">
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
          <FilterListIcon fontSize="small" color="action" />
          <Typography 
            variant="subtitle2" 
            fontWeight="bold"
            sx={{
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            }}
          >
            Quick Filters
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => setPresetsAnchorEl(e.currentTarget)}
            aria-label="filter presets"
            sx={{ 
              ml: 'auto',
              minWidth: { xs: 40, sm: 40 },
              minHeight: { xs: 40, sm: 40 },
              p: { xs: 0.5, sm: 0.75 },
            }}
          >
            <BookmarkIcon fontSize="small" />
          </IconButton>
          {hasActiveFilters && (
            <Chip
              icon={<ClearIcon />}
              label="Clear All"
              onClick={onClear}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ 
                cursor: 'pointer',
                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                height: { xs: 24, sm: 28 },
                '& .MuiChip-label': {
                  px: { xs: 0.75, sm: 1 },
                },
              }}
            />
          )}
        </Stack>
        <FilterPresetsManager
          currentFilters={currentFilters}
          onLoadPreset={handleLoadPreset}
          anchorEl={presetsAnchorEl}
          onClose={() => setPresetsAnchorEl(null)}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="account-filter-label">Filter by Account</InputLabel>
            <Select
              labelId="account-filter-label"
              value={selectedAccount ?? ''}
              label="Filter by Account"
              onChange={(e) => onAccountChange(e.target.value || null)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: { xs: '60vh', sm: 'none' },
                    maxWidth: { xs: '90vw', sm: 'none' },
                  },
                },
              }}
            >
              <MenuItem value="">All Accounts</MenuItem>
              {month.accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.accountName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id="bucket-filter-label">Filter by Bucket</InputLabel>
            <Select
              labelId="bucket-filter-label"
              value={selectedBucket ?? ''}
              label="Filter by Bucket"
              onChange={(e) => onBucketChange(e.target.value || null)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: { xs: '60vh', sm: 'none' },
                    maxWidth: { xs: '90vw', sm: 'none' },
                  },
                },
              }}
            >
              <MenuItem value="">All Buckets</MenuItem>
              {buckets.map((bucket) => (
                <MenuItem key={bucket.id} value={bucket.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: bucket.color,
                      }}
                    />
                    {bucket.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <ToggleButtonGroup
              value={showNegativeOnly ? 'negative' : 'all'}
              exclusive
              onChange={(_, value) => onNegativeOnlyChange(value === 'negative')}
              aria-label="filter by remaining cash"
              size="small"
              fullWidth
              sx={{
                width: { xs: '100%', sm: 'auto' },
                '& .MuiToggleButton-root': {
                  minHeight: { xs: 44, sm: 40 },
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  px: { xs: 1.5, sm: 1 },
                },
              }}
            >
              <ToggleButton value="all" aria-label="all accounts">
                All Accounts
              </ToggleButton>
              <ToggleButton value="negative" aria-label="negative cash only">
                Negative Cash Only
              </ToggleButton>
            </ToggleButtonGroup>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            startIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="text"
            sx={{
              minHeight: { xs: 44, sm: 40 },
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              px: { xs: 1, sm: 1.5 },
            }}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
          </Button>
        </Stack>

        <Collapse in={showAdvanced}>
          <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="account-type-filter-label">Filter by Account Type</InputLabel>
                <Select
                  labelId="account-type-filter-label"
                  value={selectedAccountType ?? ''}
                  label="Filter by Account Type"
                  onChange={(e) => onAccountTypeChange(e.target.value || null)}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: { xs: '60vh', sm: 'none' },
                        maxWidth: { xs: '90vw', sm: 'none' },
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {accountTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Filter by Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={selectedStatus ?? ''}
                  label="Filter by Status"
                  onChange={(e) => onStatusChange(e.target.value || null)}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: { xs: '60vh', sm: 'none' },
                        maxWidth: { xs: '90vw', sm: 'none' },
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 2 }}>
              <TextField
                label="Min Amount"
                type="number"
                size="small"
                value={minAmount ?? ''}
                onChange={(e) => onMinAmountChange(e.target.value ? parseFloat(e.target.value) : null)}
                inputProps={{ min: 0, step: 0.01 }}
                fullWidth
              />
              <TextField
                label="Max Amount"
                type="number"
                size="small"
                value={maxAmount ?? ''}
                onChange={(e) => onMaxAmountChange(e.target.value ? parseFloat(e.target.value) : null)}
                inputProps={{ min: 0, step: 0.01 }}
                fullWidth
              />
            </Stack>
          </Stack>
        </Collapse>

        {hasActiveFilters && (
          <Stack 
            direction="row" 
            spacing={{ xs: 0.5, sm: 1 }} 
            flexWrap="wrap" 
            useFlexGap
            gap={{ xs: 0.5, sm: 1 }}
          >
            {selectedAccount && (
              <Chip
                label={`Account: ${month.accounts.find((a) => a.id === selectedAccount)?.accountName ?? ''}`}
                onDelete={() => onAccountChange(null)}
                size="small"
                color="primary"
                variant="outlined"
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
            {selectedBucket && (
              <Chip
                label={`Bucket: ${buckets.find((b) => b.id === selectedBucket)?.name ?? ''}`}
                onDelete={() => onBucketChange(null)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 },
                  '& .MuiChip-label': {
                    px: { xs: 0.75, sm: 1 },
                  },
                }}
              />
            )}
            {selectedAccountType && (
              <Chip
                label={`Type: ${selectedAccountType}`}
                onDelete={() => onAccountTypeChange(null)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 },
                  '& .MuiChip-label': {
                    px: { xs: 0.75, sm: 1 },
                  },
                }}
              />
            )}
            {selectedStatus && (
              <Chip
                label={`Status: ${selectedStatus}`}
                onDelete={() => onStatusChange(null)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 },
                  '& .MuiChip-label': {
                    px: { xs: 0.75, sm: 1 },
                  },
                }}
              />
            )}
            {minAmount !== null && (
              <Chip
                label={`Min: ₹${minAmount.toLocaleString('en-IN')}`}
                onDelete={() => onMinAmountChange(null)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 },
                  '& .MuiChip-label': {
                    px: { xs: 0.75, sm: 1 },
                  },
                }}
              />
            )}
            {maxAmount !== null && (
              <Chip
                label={`Max: ₹${maxAmount.toLocaleString('en-IN')}`}
                onDelete={() => onMaxAmountChange(null)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 },
                  '& .MuiChip-label': {
                    px: { xs: 0.75, sm: 1 },
                  },
                }}
              />
            )}
            {showNegativeOnly && (
              <Chip
                label="Negative Cash Only"
                onDelete={() => onNegativeOnlyChange(false)}
                size="small"
                color="warning"
                variant="outlined"
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
      </Stack>
    </Paper>
  );
});

