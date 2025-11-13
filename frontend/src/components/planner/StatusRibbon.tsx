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
    <Box sx={{ py: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Bucket Status (click to toggle)
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
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
              sx={{
                cursor: 'pointer',
                borderColor: isPaid ? undefined : bucket.color,
                backgroundColor: isPaid ? undefined : 'transparent',
                '& .MuiChip-icon': {
                  color: isPaid ? undefined : bucket.color,
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

