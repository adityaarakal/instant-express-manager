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
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { AggregatedMonth } from '../../types/plannedExpensesAggregated';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';
import type { BankAccount } from '../../types/bankAccounts';
import { useBankAccountsStore } from '../../store/useBankAccountsStore';

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
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }} className="no-print">
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FilterListIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight="bold">
            Quick Filters
          </Typography>
          {hasActiveFilters && (
            <Chip
              icon={<ClearIcon />}
              label="Clear All"
              onClick={onClear}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ ml: 'auto', cursor: 'pointer' }}
            />
          )}
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="account-filter-label">Filter by Account</InputLabel>
            <Select
              labelId="account-filter-label"
              value={selectedAccount ?? ''}
              label="Filter by Account"
              onChange={(e) => onAccountChange(e.target.value || null)}
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

          <FormControl size="small">
            <ToggleButtonGroup
              value={showNegativeOnly ? 'negative' : 'all'}
              exclusive
              onChange={(_, value) => onNegativeOnlyChange(value === 'negative')}
              aria-label="filter by remaining cash"
              size="small"
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
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
          </Button>
        </Stack>

        <Collapse in={showAdvanced}>
          <Stack spacing={2} sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="account-type-filter-label">Filter by Account Type</InputLabel>
                <Select
                  labelId="account-type-filter-label"
                  value={selectedAccountType ?? ''}
                  label="Filter by Account Type"
                  onChange={(e) => onAccountTypeChange(e.target.value || null)}
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
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {selectedAccount && (
              <Chip
                label={`Account: ${month.accounts.find((a) => a.id === selectedAccount)?.accountName ?? ''}`}
                onDelete={() => onAccountChange(null)}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {selectedBucket && (
              <Chip
                label={`Bucket: ${buckets.find((b) => b.id === selectedBucket)?.name ?? ''}`}
                onDelete={() => onBucketChange(null)}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {selectedAccountType && (
              <Chip
                label={`Type: ${selectedAccountType}`}
                onDelete={() => onAccountTypeChange(null)}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {selectedStatus && (
              <Chip
                label={`Status: ${selectedStatus}`}
                onDelete={() => onStatusChange(null)}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {minAmount !== null && (
              <Chip
                label={`Min: ₹${minAmount.toLocaleString('en-IN')}`}
                onDelete={() => onMinAmountChange(null)}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {maxAmount !== null && (
              <Chip
                label={`Max: ₹${maxAmount.toLocaleString('en-IN')}`}
                onDelete={() => onMaxAmountChange(null)}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {showNegativeOnly && (
              <Chip
                label="Negative Cash Only"
                onDelete={() => onNegativeOnlyChange(false)}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
});

