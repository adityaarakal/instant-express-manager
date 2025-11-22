import { Box, Chip, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import type { AggregatedMonth } from '../../types/plannedExpensesAggregated';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';

interface StatusRibbonProps {
  month: AggregatedMonth;
  onStatusChange?: (bucketId: string, status: 'Pending' | 'Paid') => void;
}

export function StatusRibbon({ month, onStatusChange }: StatusRibbonProps) {
  const buckets = DEFAULT_BUCKETS.filter((bucket) =>
    month.bucketOrder.includes(bucket.id),
  );

  const handleStatusToggle = (bucketId: string, currentStatus: 'Pending' | 'Paid') => {
    const newStatus: 'Pending' | 'Paid' = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    onStatusChange?.(bucketId, newStatus);
  };

  return (
    <Box sx={{ py: { xs: 1.5, sm: 2 } }}>
      <Typography 
        variant="subtitle2" 
        color="text.secondary" 
        sx={{ 
          mb: { xs: 0.75, sm: 1 },
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
        }}
      >
        Bucket Status (click to toggle)
      </Typography>
      <Stack 
        direction="row" 
        spacing={{ xs: 0.5, sm: 1 }} 
        flexWrap="wrap" 
        gap={{ xs: 0.5, sm: 1 }}
      >
        {buckets.map((bucket) => {
          const status: 'Pending' | 'Paid' =
            month.statusByBucket[bucket.id] ?? 'Pending';
          const isPaid = status === 'Paid';

          return (
            <Chip
              key={bucket.id}
              label={bucket.name}
              icon={isPaid ? <CheckCircleIcon /> : <PendingIcon />}
              color={isPaid ? 'success' : 'default'}
              variant={isPaid ? 'filled' : 'outlined'}
              size="small"
              onClick={() => handleStatusToggle(bucket.id, status)}
              className="no-print-interactive"
              sx={{
                cursor: 'pointer',
                borderColor: isPaid ? undefined : bucket.color,
                backgroundColor: isPaid ? undefined : 'transparent',
                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                height: { xs: 28, sm: 32 },
                minHeight: { xs: 28, sm: 32 },
                '& .MuiChip-label': {
                  px: { xs: 0.75, sm: 1 },
                },
                '& .MuiChip-icon': {
                  color: isPaid ? undefined : bucket.color,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                },
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

