import { useMemo, memo } from 'react';
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
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import type { AggregatedMonth } from '../../types/plannedExpensesAggregated';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';
import { EmptyState } from '../common/EmptyState';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';

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
  const buckets = useMemo(
    () => DEFAULT_BUCKETS.filter((bucket) => month.bucketOrder.includes(bucket.id)),
    [month.bucketOrder],
  );

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
                <Tooltip
                  title={
                    account.remainingCash !== null && account.remainingCash < 0
                      ? `Warning: This account has negative remaining cash. Consider adjusting transactions or adding income to balance it.`
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
                    sx={{ fontStyle: 'italic', cursor: 'help' }}
                >
                  {formatCurrency(account.remainingCash)}
                </Typography>
                </Tooltip>
                <Typography variant="caption" color="text.secondary">
                  (calculated)
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">{formatCurrency(account.fixedBalance)}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">{formatCurrency(account.savingsTransfer)}</Typography>
              </TableCell>
              {buckets.map((bucket) => {
                const bucketAmount = account.bucketAmounts[bucket.id];
                const dueDate = month.dueDates[bucket.id];
                const isPastDue = isDueDatePassed(dueDate);
                const originalAmount = getOriginalBucketAmount(
                  account.id,
                  bucket.id,
                  month.id,
                  expenseTransactions,
                );
                const isZeroed = isPastDue && (bucketAmount === null || bucketAmount === 0) && originalAmount > 0;

                return (
                  <TableCell key={bucket.id} align="right">
                    {isZeroed ? (
                      <Tooltip
                        title={`Due date (${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}) has passed. Original amount: ${formatCurrency(originalAmount)}`}
                        arrow
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
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
