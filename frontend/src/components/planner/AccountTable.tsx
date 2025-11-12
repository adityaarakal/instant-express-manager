import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { PlannedMonthSnapshot } from '../../types/plannedExpenses';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';
import { usePlannedMonthsStore } from '../../store/usePlannedMonthsStore';
import { EditableCell } from './EditableCell';

interface AccountTableProps {
  month: PlannedMonthSnapshot;
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

export function AccountTable({ month }: AccountTableProps) {
  const { updateAccountAllocation } = usePlannedMonthsStore();
  const buckets = DEFAULT_BUCKETS.filter((bucket) =>
    month.bucketOrder.includes(bucket.id),
  );

  if (month.accounts.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No accounts found for this month.
        </Typography>
      </Paper>
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
              <Typography variant="subtitle2" fontWeight="bold">
                Remaining
              </Typography>
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
                <Typography
                  variant="body2"
                  color={
                    account.remainingCash !== null && account.remainingCash < 0
                      ? 'error'
                      : 'text.primary'
                  }
                  sx={{ fontStyle: 'italic' }}
                >
                  {formatCurrency(account.remainingCash)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  (calculated)
                </Typography>
              </TableCell>
              <TableCell align="right">
                <EditableCell
                  value={account.fixedBalance}
                  onSave={(value) =>
                    updateAccountAllocation(month.id, account.id, {
                      fixedBalance: value,
                    })
                  }
                  align="right"
                />
              </TableCell>
              <TableCell align="right">
                <EditableCell
                  value={account.savingsTransfer}
                  onSave={(value) =>
                    updateAccountAllocation(month.id, account.id, {
                      savingsTransfer: value,
                    })
                  }
                  align="right"
                />
              </TableCell>
              {buckets.map((bucket) => {
                const amount = account.bucketAmounts[bucket.id] ?? null;
                return (
                  <TableCell key={bucket.id} align="right">
                    <EditableCell
                      value={amount}
                      onSave={(value) =>
                        updateAccountAllocation(month.id, account.id, {
                          bucketAmounts: {
                            [bucket.id]: value,
                          },
                        })
                      }
                      align="right"
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

