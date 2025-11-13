import { Box, Paper, Stack, Typography } from '@mui/material';
import type { AggregatedMonth } from '../../types/plannedExpensesAggregated';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';
import type { BucketTotals } from '../../utils/totals';

interface TotalsFooterProps {
  month: AggregatedMonth;
  totals: BucketTotals;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function TotalsFooter({ month, totals }: TotalsFooterProps) {
  const buckets = DEFAULT_BUCKETS.filter((bucket) =>
    month.bucketOrder.includes(bucket.id),
  );

  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2, bgcolor: 'background.default' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Totals Summary
      </Typography>
      <Stack spacing={2}>
        {buckets.map((bucket) => {
          const pending = totals.pending[bucket.id] ?? 0;
          const paid = totals.paid[bucket.id] ?? 0;
          const all = totals.all[bucket.id] ?? 0;
          const status = month.statusByBucket[bucket.id] ?? bucket.defaultStatus;

          return (
            <Box
              key={bucket.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'action.hover',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: bucket.color,
                  }}
                />
                <Typography variant="body1" fontWeight="medium">
                  {bucket.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({status})
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                {status === 'pending' && pending > 0 && (
                  <Typography variant="body2" color="warning.main">
                    Pending: {formatCurrency(pending)}
                  </Typography>
                )}
                {status === 'paid' && paid > 0 && (
                  <Typography variant="body2" color="success.main">
                    Paid: {formatCurrency(paid)}
                  </Typography>
                )}
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(all)}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

