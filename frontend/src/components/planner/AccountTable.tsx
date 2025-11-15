import { useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
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
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import type { AggregatedMonth } from '../../types/plannedExpensesAggregated';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';
import { EmptyState } from '../common/EmptyState';

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

export const AccountTable = memo(function AccountTable({ month }: AccountTableProps) {
  const navigate = useNavigate();
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
              {buckets.map((bucket) => (
                <TableCell key={bucket.id} align="right">
                  <Typography variant="body2">{formatCurrency(account.bucketAmounts[bucket.id])}</Typography>
                </TableCell>
              ))}
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
