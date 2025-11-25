import { Box, Skeleton, Stack, Paper } from '@mui/material';

interface CardSkeletonProps {
  count?: number;
  showAvatar?: boolean;
  showActions?: boolean;
}

/**
 * Card Skeleton Component
 * Shows skeleton loaders for card-based layouts
 */
export function CardSkeleton({ count = 3, showAvatar = false, showActions = true }: CardSkeletonProps) {
  return (
    <Stack spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Paper key={`skeleton-card-${index}`} elevation={1} sx={{ p: 2 }}>
          <Stack spacing={2}>
            {showAvatar && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" height={20} />
                </Box>
              </Box>
            )}
            <Box>
              <Skeleton variant="text" width="80%" height={28} />
              <Skeleton variant="text" width="60%" height={20} sx={{ mt: 0.5 }} />
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1 }} />
            </Stack>
            {showActions && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Skeleton variant="rectangular" width={60} height={36} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={60} height={36} sx={{ borderRadius: 1 }} />
              </Box>
            )}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

