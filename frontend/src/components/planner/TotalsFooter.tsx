import { Box, Paper, Stack, Typography } from '@mui/material';
import type { AggregatedMonth, BucketTotals } from '../../types/plannedExpensesAggregated';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';

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
    <Paper 
      elevation={1} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        borderRadius: 2, 
        bgcolor: 'background.default' 
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          mb: { xs: 1.5, sm: 2 },
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
          fontWeight: 700,
        }}
      >
        Totals Summary
      </Typography>
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        {buckets.map((bucket) => {
          const pending = totals.pending[bucket.id] ?? 0;
          const paid = totals.paid[bucket.id] ?? 0;
          const all = totals.all[bucket.id] ?? 0;
          const status = month.statusByBucket[bucket.id] ?? 'Pending';

          return (
            <Box
              key={bucket.id}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1, sm: 0 },
                p: { xs: 1.25, sm: 1.5 },
                borderRadius: 1,
                bgcolor: 'action.hover',
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 0.75, sm: 1 },
                  flexWrap: 'wrap',
                }}
              >
                <Box
                  sx={{
                    width: { xs: 10, sm: 12 },
                    height: { xs: 10, sm: 12 },
                    borderRadius: '50%',
                    bgcolor: bucket.color,
                    flexShrink: 0,
                  }}
                />
                <Typography 
                  variant="body1" 
                  fontWeight="medium"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {bucket.name}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  }}
                >
                  ({status})
                </Typography>
              </Box>
              <Stack 
                direction="row" 
                spacing={{ xs: 1, sm: 2 }} 
                alignItems="center"
                flexWrap="wrap"
                sx={{
                  justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                }}
              >
                {status === 'Pending' && pending > 0 && (
                  <Typography 
                    variant="body2" 
                    color="warning.main"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Pending: {formatCurrency(pending)}
                  </Typography>
                )}
                {status === 'Paid' && paid > 0 && (
                  <Typography 
                    variant="body2" 
                    color="success.main"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Paid: {formatCurrency(paid)}
                  </Typography>
                )}
                <Typography 
                  variant="body1" 
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: '0.9375rem', sm: '1rem' },
                    whiteSpace: 'nowrap',
                  }}
                >
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

