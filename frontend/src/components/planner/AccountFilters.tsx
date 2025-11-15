import { useMemo, memo } from 'react';
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
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import type { AggregatedMonth } from '../../types/plannedExpensesAggregated';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';

interface AccountFiltersProps {
  month: AggregatedMonth;
  selectedAccount: string | null;
  selectedBucket: string | null;
  showNegativeOnly: boolean;
  onAccountChange: (accountId: string | null) => void;
  onBucketChange: (bucketId: string | null) => void;
  onNegativeOnlyChange: (show: boolean) => void;
  onClear: () => void;
}

export const AccountFilters = memo(function AccountFilters({
  month,
  selectedAccount,
  selectedBucket,
  showNegativeOnly,
  onAccountChange,
  onBucketChange,
  onNegativeOnlyChange,
  onClear,
}: AccountFiltersProps) {
  const buckets = useMemo(
    () => DEFAULT_BUCKETS.filter((bucket) => month.bucketOrder.includes(bucket.id)),
    [month.bucketOrder],
  );

  const hasActiveFilters = selectedAccount !== null || selectedBucket !== null || showNegativeOnly;

  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
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

