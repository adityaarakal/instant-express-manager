import { Box, Chip, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import type { AllocationStatus, PlannedMonthSnapshot } from '../../types/plannedExpenses';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';
import { usePlannedMonthsStore } from '../../store/usePlannedMonthsStore';

interface StatusRibbonProps {
  month: PlannedMonthSnapshot;
}

export function StatusRibbon({ month }: StatusRibbonProps) {
  const { updateBucketStatus } = usePlannedMonthsStore();
  const buckets = DEFAULT_BUCKETS.filter((bucket) =>
    month.bucketOrder.includes(bucket.id),
  );

  const handleStatusToggle = (bucketId: string, currentStatus: AllocationStatus) => {
    const newStatus: AllocationStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    updateBucketStatus(month.id, bucketId, newStatus);
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Bucket Status (click to toggle)
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
        {buckets.map((bucket) => {
          const status: AllocationStatus =
            month.statusByBucket[bucket.id] ?? bucket.defaultStatus;
          const isPaid = status === 'paid';

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

