import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  Button,
  Checkbox,
  Tooltip,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import type { AggregatedAccount } from '../../types/plannedExpensesAggregated';
import type { BucketDefinition } from '../../types/plannedExpenses';
import { useAggregatedPlannedMonthsStore } from '../../store/useAggregatedPlannedMonthsStore';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import { useDueDateOverridesStore } from '../../store/useDueDateOverridesStore';
import { useMediaQuery, useTheme } from '@mui/material';

type PlannerAccountCardProps = {
  account: AggregatedAccount;
  monthId: string;
  buckets: BucketDefinition[];
  formatCurrency: (value: number | null | undefined) => string;
  isDueDatePassed: (dueDate: string | null | undefined) => boolean;
  getOriginalBucketAmount: (
    accountId: string,
    bucketId: string,
    monthId: string,
    transactions: ReturnType<typeof useExpenseTransactionsStore.getState>['transactions'],
  ) => number;
  onAddTransaction: () => void;
};

export function PlannerAccountCard({
  account,
  monthId,
  buckets,
  formatCurrency,
  isDueDatePassed,
  getOriginalBucketAmount,
  onAddTransaction,
}: PlannerAccountCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const { hasOverride, addOverride, removeOverride } = useDueDateOverridesStore();

  // Get previous month for comparison
  const [year, monthNum] = monthId.split('-');
  const prevMonth = parseInt(monthNum) === 1 
    ? `${parseInt(year) - 1}-12`
    : `${year}-${String(parseInt(monthNum) - 1).padStart(2, '0')}`;
  const prevMonthData = useAggregatedPlannedMonthsStore.getState().getMonth(prevMonth);
  const prevAccount = prevMonthData?.accounts.find((a) => a.id === account.id);
  const prevFixedBalance = prevAccount?.fixedBalance;
  const fixedBalanceDifference = 
    prevFixedBalance !== null && prevFixedBalance !== undefined && account.fixedBalance !== null
      ? account.fixedBalance - prevFixedBalance
      : null;
  const hasFixedBalanceChanged = fixedBalanceDifference !== null && Math.abs(fixedBalanceDifference) > 0.01;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'visible',
        borderColor: account.remainingCash !== null && account.remainingCash < 0 ? 'error.main' : 'divider',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack spacing={1.5}>
          {/* Header: Account Name */}
          <Box>
            <Typography
              variant="body1"
              fontWeight="medium"
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                wordBreak: 'break-word',
              }}
            >
              {account.accountName}
            </Typography>
            {account.notes && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  wordBreak: 'break-word',
                  mt: 0.5,
                }}
              >
                {account.notes}
              </Typography>
            )}
          </Box>

          {/* Remaining Cash */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Remaining:
                </Typography>
                <Tooltip title="Calculated as: Inflow - Fixed Balance - Savings Transfer + Manual Adjustments">
                  <InfoIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: { xs: 14, sm: 16 } }} />
                </Tooltip>
              </Stack>
              <Tooltip
                title={
                  account.remainingCash !== null && account.remainingCash < 0
                    ? `Warning: This account has negative remaining cash (${formatCurrency(account.remainingCash)}). Consider adjusting transactions or adding income to balance it.`
                    : 'Remaining cash after fixed balances, savings transfers, and bucket allocations'
                }
                arrow
              >
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  color={
                    account.remainingCash !== null && account.remainingCash < 0
                      ? 'error'
                      : 'text.primary'
                  }
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {formatCurrency(account.remainingCash)}
                </Typography>
              </Tooltip>
            </Stack>
            {account.remainingCash !== null && account.remainingCash < 0 && (
              <Tooltip
                title="Suggestions: 1) Add income transactions 2) Reduce expense allocations 3) Adjust fixed balance"
                arrow
              >
                <Chip
                  icon={<WarningIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                  label="Negative balance"
                  size="small"
                  color="error"
                  sx={{
                    fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                    height: { xs: 20, sm: 24 },
                    '& .MuiChip-label': {
                      px: { xs: 0.5, sm: 0.75 },
                    },
                  }}
                />
              </Tooltip>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
              (calculated)
            </Typography>
          </Box>

          {/* Fixed Balance */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Fixed:
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {formatCurrency(account.fixedBalance)}
              </Typography>
              {hasFixedBalanceChanged && fixedBalanceDifference !== null && (
                <Tooltip
                  title={`Previous month (${prevMonth}): ${formatCurrency(prevFixedBalance)}`}
                  arrow
                >
                  <Typography
                    variant="caption"
                    color={fixedBalanceDifference > 0 ? 'success.main' : 'error.main'}
                    sx={{ fontStyle: 'italic', cursor: 'help', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                  >
                    {fixedBalanceDifference > 0 ? '+' : ''}{formatCurrency(fixedBalanceDifference)} from previous
                  </Typography>
                </Tooltip>
              )}
            </Box>
          </Stack>

          {/* Savings Transfer */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Savings:
            </Typography>
            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {formatCurrency(account.savingsTransfer)}
            </Typography>
          </Stack>

          {/* Buckets */}
          <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 1 }}>
              Buckets:
            </Typography>
            <Stack spacing={1}>
              {buckets.map((bucket) => {
                const bucketAmount = account.bucketAmounts[bucket.id];
                const dueDate = account.bucketDueDates?.[bucket.id] ?? null;
                const isPastDue = isDueDatePassed(dueDate);
                const originalAmount = getOriginalBucketAmount(
                  account.id,
                  bucket.id,
                  monthId,
                  expenseTransactions,
                );
                const isZeroed = isPastDue && (bucketAmount === null || bucketAmount === 0) && originalAmount > 0;
                const isOverridden = hasOverride(monthId, account.id, bucket.id);
                const showToggle = isZeroed || isOverridden;

                return (
                  <Stack
                    key={bucket.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
                      {showToggle && (
                        <Checkbox
                          size="small"
                          checked={isOverridden}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addOverride(monthId, account.id, bucket.id);
                            } else {
                              removeOverride(monthId, account.id, bucket.id);
                            }
                          }}
                          sx={{ p: 0.5 }}
                          aria-label={isOverridden ? 'Remove override' : 'Add override'}
                        />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          color: bucket.color,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          fontWeight: 'medium',
                          wordBreak: 'break-word',
                        }}
                      >
                        {bucket.name}:
                      </Typography>
                    </Stack>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                      {showToggle ? (
                        <>
                          {isOverridden ? (
                            <>
                              <Typography variant="body2" color="success.main" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {formatCurrency(originalAmount)}
                              </Typography>
                              <Tooltip
                                title={`Override active: Amount re-enabled despite past due date (${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}).`}
                                arrow
                              >
                                <CheckCircleIcon fontSize="small" color="success" sx={{ fontSize: { xs: 14, sm: 16 } }} />
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
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                    }}
                                  >
                                    {formatCurrency(originalAmount)}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    fontWeight="medium"
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                  >
                                    {formatCurrency(0)}
                                  </Typography>
                                  <WarningIcon fontSize="small" sx={{ color: 'warning.main', fontSize: { xs: 14, sm: 16 } }} />
                                </Box>
                              </Tooltip>
                            </>
                          )}
                        </>
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {formatCurrency(bucketAmount)}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          </Box>

          {/* Actions */}
          <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onAddTransaction}
              fullWidth={isMobile}
              sx={{
                minHeight: { xs: 44, sm: 36 },
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                px: { xs: 1.5, sm: 2 },
              }}
            >
              {isMobile ? 'Add' : 'Add Transaction'}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

