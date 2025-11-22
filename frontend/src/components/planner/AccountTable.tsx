import { useMemo, memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  Button,
  Box,
  Checkbox,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import RestoreIcon from '@mui/icons-material/Restore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import IconButton from '@mui/material/IconButton';
import type { AggregatedMonth } from '../../types/plannedExpensesAggregated';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';
import { EmptyState } from '../common/EmptyState';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import { useAggregatedPlannedMonthsStore } from '../../store/useAggregatedPlannedMonthsStore';
import { useDueDateOverridesStore } from '../../store/useDueDateOverridesStore';

interface AccountTableProps {
  month: AggregatedMonth;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '—';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Check if a due date has passed
 */
const isDueDatePassed = (dueDate: string | null | undefined): boolean => {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return today > due;
};

/**
 * Get original bucket amount (before due date zeroing) for an account
 */
const getOriginalBucketAmount = (
  accountId: string,
  bucketId: string,
  monthId: string,
  transactions: ReturnType<typeof useExpenseTransactionsStore.getState>['transactions'],
): number => {
  const [year, month] = monthId.split('-');
  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-31`;

  return transactions
    .filter(
      (t) =>
        t.accountId === accountId &&
        t.bucket === bucketId &&
        t.date >= startDate &&
        t.date <= endDate,
    )
    .reduce((sum, t) => sum + t.amount, 0);
};

export const AccountTable = memo(function AccountTable({ month }: AccountTableProps) {
  const navigate = useNavigate();
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const { hasOverride, addOverride, removeOverride, clearMonth } = useDueDateOverridesStore();
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<HTMLElement | null>(null);
  const buckets = useMemo(
    () => DEFAULT_BUCKETS.filter((bucket) => month.bucketOrder.includes(bucket.id)),
    [month.bucketOrder],
  );

  // Calculate override statistics
  const overrideStats = useMemo(() => {
    let totalZeroed = 0;
    let totalOverridden = 0;
    const accountOverrides = new Map<string, number>();

    month.accounts.forEach((account) => {
      let accountOverrideCount = 0;
      buckets.forEach((bucket) => {
        const dueDate = account.bucketDueDates?.[bucket.id] ?? month.dueDates[bucket.id];
        const isPastDue = isDueDatePassed(dueDate);
        const originalAmount = getOriginalBucketAmount(
          account.id,
          bucket.id,
          month.id,
          expenseTransactions,
        );
        const bucketAmount = account.bucketAmounts[bucket.id];
        const isZeroed = isPastDue && (bucketAmount === null || bucketAmount === 0) && originalAmount > 0;
        const isOverridden = hasOverride(month.id, account.id, bucket.id);

        if (isZeroed) totalZeroed++;
        if (isOverridden) {
          totalOverridden++;
          accountOverrideCount++;
        }
      });
      if (accountOverrideCount > 0) {
        accountOverrides.set(account.id, accountOverrideCount);
      }
    });

    return { totalZeroed, totalOverridden, accountOverrides };
  }, [month, buckets, expenseTransactions, hasOverride]);

  // Bulk override functions
  const handleBulkOverrideAll = () => {
    month.accounts.forEach((account) => {
      buckets.forEach((bucket) => {
        const dueDate = account.bucketDueDates?.[bucket.id] ?? month.dueDates[bucket.id];
        const isPastDue = isDueDatePassed(dueDate);
        const originalAmount = getOriginalBucketAmount(
          account.id,
          bucket.id,
          month.id,
          expenseTransactions,
        );
        const bucketAmount = account.bucketAmounts[bucket.id];
        const isZeroed = isPastDue && (bucketAmount === null || bucketAmount === 0) && originalAmount > 0;
        if (isZeroed && !hasOverride(month.id, account.id, bucket.id)) {
          addOverride(month.id, account.id, bucket.id);
        }
      });
    });
    setBulkMenuAnchor(null);
  };


  const handleClearAllOverrides = () => {
    if (window.confirm('Are you sure you want to clear all overrides for this month?')) {
      clearMonth(month.id);
    }
    setBulkMenuAnchor(null);
  };

  if (month.accounts.length === 0) {
    return (
      <EmptyState
        icon={<AddIcon sx={{ fontSize: 48 }} />}
        title="No Accounts"
        description="No accounts found for this month. Add bank accounts to see allocations."
        action={{
          label: 'Add Account',
          onClick: () => {
            navigate('/accounts');
          },
          icon: <AddIcon />,
        }}
      />
    );
  }

  return (
    <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
      {(overrideStats.totalZeroed > 0 || overrideStats.totalOverridden > 0) && (
        <Box
          sx={{
            p: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
          className="no-print"
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {overrideStats.totalZeroed > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`${overrideStats.totalZeroed} zeroed item${overrideStats.totalZeroed !== 1 ? 's' : ''}`}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
            {overrideStats.totalOverridden > 0 && (
              <Chip
                icon={<CheckCircleIcon />}
                label={`${overrideStats.totalOverridden} override${overrideStats.totalOverridden !== 1 ? 's' : ''} active`}
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            {overrideStats.totalZeroed > 0 && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<RestoreIcon />}
                onClick={handleBulkOverrideAll}
              >
                Override All Zeroed
              </Button>
            )}
            {overrideStats.totalOverridden > 0 && (
              <>
                <IconButton
                  size="small"
                  onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                  aria-label="bulk override options"
                >
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={bulkMenuAnchor}
                  open={Boolean(bulkMenuAnchor)}
                  onClose={() => setBulkMenuAnchor(null)}
                >
                  <MenuItem onClick={handleClearAllOverrides}>
                    <ClearAllIcon sx={{ mr: 1 }} fontSize="small" />
                    Clear All Overrides
                  </MenuItem>
                </Menu>
              </>
            )}
          </Stack>
        </Box>
      )}
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant="subtitle2" fontWeight="bold">
                Account
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                <Typography variant="subtitle2" fontWeight="bold">
                  Remaining
                </Typography>
                <Tooltip title="Calculated as: Inflow - Fixed Balance - Savings Transfer + Manual Adjustments">
                  <InfoIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                </Tooltip>
              </Stack>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                Fixed
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                Savings
              </Typography>
            </TableCell>
            {buckets.map((bucket) => (
              <TableCell key={bucket.id} align="right">
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  sx={{ color: bucket.color }}
                >
                  {bucket.name}
                </Typography>
              </TableCell>
            ))}
            <TableCell align="center">
              <Typography variant="subtitle2" fontWeight="bold">
                Actions
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {month.accounts.map((account) => (
            <TableRow key={account.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {account.accountName}
                </Typography>
                {account.notes && (
                  <Typography variant="caption" color="text.secondary">
                    {account.notes}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Stack spacing={0.5} alignItems="flex-end">
                  <Tooltip
                    title={
                      account.remainingCash !== null && account.remainingCash < 0
                        ? `Warning: This account has negative remaining cash (₹${formatCurrency(account.remainingCash)}). Consider adjusting transactions or adding income to balance it.`
                        : 'Remaining cash after fixed balances, savings transfers, and bucket allocations'
                    }
                    arrow
                  >
                    <Typography
                      variant="body2"
                      color={
                        account.remainingCash !== null && account.remainingCash < 0
                          ? 'error'
                          : 'text.primary'
                      }
                      sx={{ fontStyle: 'italic', cursor: 'help', fontWeight: account.remainingCash !== null && account.remainingCash < 0 ? 'bold' : 'normal' }}
                    >
                      {formatCurrency(account.remainingCash)}
                    </Typography>
                  </Tooltip>
                  {account.remainingCash !== null && account.remainingCash < 0 && (
                    <Tooltip
                      title="Suggestions: 1) Add income transactions 2) Reduce expense allocations 3) Adjust fixed balance"
                      arrow
                    >
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ fontStyle: 'italic', cursor: 'help', display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <WarningIcon fontSize="small" sx={{ fontSize: 14 }} />
                        Negative balance
                      </Typography>
                    </Tooltip>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    (calculated)
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="right">
                <Stack spacing={0.5} alignItems="flex-end">
                  <Typography variant="body2">{formatCurrency(account.fixedBalance)}</Typography>
                  {(() => {
                    // Get previous month for comparison
                    const [year, monthNum] = month.id.split('-');
                    const prevMonth = parseInt(monthNum) === 1 
                      ? `${parseInt(year) - 1}-12`
                      : `${year}-${String(parseInt(monthNum) - 1).padStart(2, '0')}`;
                    const prevMonthData = useAggregatedPlannedMonthsStore.getState().getMonth(prevMonth);
                    const prevAccount = prevMonthData?.accounts.find((a) => a.id === account.id);
                    const prevFixedBalance = prevAccount?.fixedBalance;
                    
                    if (prevFixedBalance !== null && prevFixedBalance !== undefined && account.fixedBalance !== null) {
                      const difference = account.fixedBalance - prevFixedBalance;
                      const hasChanged = Math.abs(difference) > 0.01; // Account for floating point
                      
                      if (hasChanged) {
                        return (
                          <Tooltip
                            title={`Previous month (${prevMonth}): ${formatCurrency(prevFixedBalance)}`}
                            arrow
                          >
                            <Typography
                              variant="caption"
                              color={difference > 0 ? 'success.main' : 'error.main'}
                              sx={{ fontStyle: 'italic', cursor: 'help' }}
                            >
                              {difference > 0 ? '+' : ''}{formatCurrency(difference)} from previous
                            </Typography>
                          </Tooltip>
                        );
                      }
                    }
                    return null;
                  })()}
                </Stack>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">{formatCurrency(account.savingsTransfer)}</Typography>
              </TableCell>
              {buckets.map((bucket) => {
                const bucketAmount = account.bucketAmounts[bucket.id];
                // Use account-level due date (if available), fallback to bucket-level due date
                const dueDate = account.bucketDueDates?.[bucket.id] ?? month.dueDates[bucket.id];
                const isPastDue = isDueDatePassed(dueDate);
                const originalAmount = getOriginalBucketAmount(
                  account.id,
                  bucket.id,
                  month.id,
                  expenseTransactions,
                );
                const isZeroed = isPastDue && (bucketAmount === null || bucketAmount === 0) && originalAmount > 0;
                const isOverridden = hasOverride(month.id, account.id, bucket.id);
                const showToggle = isZeroed || isOverridden;

                return (
                  <TableCell key={bucket.id} align="right">
                    {showToggle ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Checkbox
                          size="small"
                          checked={isOverridden}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addOverride(month.id, account.id, bucket.id);
                            } else {
                              removeOverride(month.id, account.id, bucket.id);
                            }
                          }}
                          sx={{ p: 0.5 }}
                          aria-label={isOverridden ? 'Remove override' : 'Add override'}
                        />
                        {isOverridden ? (
                          <>
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium' }}>
                              {formatCurrency(originalAmount)}
                            </Typography>
                            <Tooltip
                              title={`Override active: Amount re-enabled despite past due date (${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}).`}
                              arrow
                            >
                              <CheckCircleIcon fontSize="small" color="success" />
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Tooltip
                              title={`Due date (${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}) has passed. Original amount: ${formatCurrency(originalAmount)}. Check to re-enable.`}
                              arrow
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textDecoration: 'line-through',
                                    color: 'text.disabled',
                                    fontStyle: 'italic',
                                  }}
                                >
                                  {formatCurrency(originalAmount)}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ fontWeight: 'medium' }}
                                >
                                  {formatCurrency(0)}
                                </Typography>
                                <WarningIcon fontSize="small" sx={{ color: 'warning.main', fontSize: 16 }} />
                              </Box>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2">{formatCurrency(bucketAmount)}</Typography>
                    )}
                  </TableCell>
                );
              })}
              <TableCell align="center">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    navigate('/transactions');
                  }}
                  className="no-print"
                >
                  Add Transaction
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});
