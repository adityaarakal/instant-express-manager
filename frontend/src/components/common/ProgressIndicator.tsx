import { Box, LinearProgress, Typography, CircularProgress, Stack } from '@mui/material';

interface ProgressIndicatorProps {
  progress?: number; // 0-100 for linear progress
  message?: string;
  variant?: 'linear' | 'circular';
  size?: number;
  showPercentage?: boolean;
}

/**
 * Progress Indicator Component
 * Shows progress for long-running operations like imports/exports
 */
export function ProgressIndicator({
  progress,
  message,
  variant = 'linear',
  size = 40,
  showPercentage = true,
}: ProgressIndicatorProps) {
  if (variant === 'circular') {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 2 }}>
        <CircularProgress size={size} />
        {message && (
          <Typography variant="body2" color="text.secondary" align="center">
            {message}
          </Typography>
        )}
      </Stack>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {message}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: '100%', flexGrow: 1 }}>
          <LinearProgress
            variant={progress !== undefined ? 'determinate' : 'indeterminate'}
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
            }}
          />
        </Box>
        {showPercentage && progress !== undefined && (
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 45, textAlign: 'right' }}>
            {Math.round(progress)}%
          </Typography>
        )}
      </Box>
    </Box>
  );
}

