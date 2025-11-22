import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import type { SyncResult } from '../../utils/balanceSync';

type BalanceSyncResultCardProps = {
  result: SyncResult;
  formatCurrency: (value: number) => string;
};

export function BalanceSyncResultCard({
  result,
  formatCurrency,
}: BalanceSyncResultCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'visible',
        borderColor: result.updated ? 'success.main' : 'divider',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack spacing={1.5}>
          {/* Header: Account Name and Status */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="body1"
                fontWeight="medium"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  wordBreak: 'break-word',
                }}
              >
                {result.accountName}
              </Typography>
            </Box>
            {result.updated ? (
              <Chip
                label="Updated"
                color="success"
                size="small"
                sx={{
                  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 },
                  flexShrink: 0,
                  '& .MuiChip-label': {
                    px: { xs: 0.75, sm: 1 },
                  },
                }}
              />
            ) : (
              <Chip
                label="In Sync"
                size="small"
                sx={{
                  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 },
                  flexShrink: 0,
                  '& .MuiChip-label': {
                    px: { xs: 0.75, sm: 1 },
                  },
                }}
              />
            )}
          </Stack>

          {/* Previous Balance */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Previous Balance:
            </Typography>
            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {formatCurrency(result.previousBalance)}
            </Typography>
          </Stack>

          {/* New Balance */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              New Balance:
            </Typography>
            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {formatCurrency(result.calculatedBalance)}
            </Typography>
          </Stack>

          {/* Difference */}
          {result.balanceDifference !== 0 && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Difference:
              </Typography>
              <Typography
                variant="body1"
                fontWeight="bold"
                color={result.balanceDifference > 0 ? 'success.main' : 'error.main'}
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {result.balanceDifference > 0 ? '+' : ''}
                {formatCurrency(result.balanceDifference)}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

