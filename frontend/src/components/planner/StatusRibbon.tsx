import { Box, Chip, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import type { AllocationStatus, PlannedMonthSnapshot } from '../../types/plannedExpenses';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';

interface StatusRibbonProps {
  month: PlannedMonthSnapshot;
}

export function StatusRibbon({ month }: StatusRibbonProps) {
  const buckets = DEFAULT_BUCKETS.filter((bucket) =>
    month.bucketOrder.includes(bucket.id),
  );

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Bucket Status
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
              sx={{
                borderColor: isPaid ? undefined : bucket.color,
                backgroundColor: isPaid ? undefined : 'transparent',
                '& .MuiChip-icon': {
                  color: isPaid ? undefined : bucket.color,
                },
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

