import { Box, Skeleton, Stack } from '@mui/material';

interface ListSkeletonProps {
  count?: number;
  showAvatar?: boolean;
  showSecondaryText?: boolean;
}

/**
 * List Skeleton Component
 * Shows skeleton loaders for list-based layouts
 */
export function ListSkeleton({ count = 5, showAvatar = false, showSecondaryText = true }: ListSkeletonProps) {
  return (
    <Stack spacing={1}>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={`skeleton-list-item-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
          {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="70%" height={24} />
            {showSecondaryText && <Skeleton variant="text" width="50%" height={20} sx={{ mt: 0.5 }} />}
          </Box>
          <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
    </Stack>
  );
}

