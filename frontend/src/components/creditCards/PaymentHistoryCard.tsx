import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import type { ExpenseTransaction } from '../../types/transactions';

type PaymentHistoryCardProps = {
  payment: ExpenseTransaction;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string | null | undefined) => string;
};

export function PaymentHistoryCard({
  payment,
  formatCurrency,
  formatDate,
}: PaymentHistoryCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'visible',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack spacing={1.5}>
          {/* Header: Date and Status */}
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
                {formatDate(payment.date)}
              </Typography>
            </Box>
            <Chip
              label={payment.status}
              size="small"
              color="success"
              sx={{
                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                height: { xs: 24, sm: 28 },
                flexShrink: 0,
                '& .MuiChip-label': {
                  px: { xs: 0.75, sm: 1 },
                },
              }}
            />
          </Stack>

          {/* Description */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}>
              Description:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                wordBreak: 'break-word',
              }}
            >
              {payment.description || 'Payment'}
            </Typography>
          </Box>

          {/* Amount */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Amount:
            </Typography>
            <Typography
              variant="body1"
              fontWeight="bold"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              {formatCurrency(payment.amount)}
            </Typography>
          </Stack>

          {/* Category and Bucket */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.5 }}>
            <Chip
              label={payment.category}
              size="small"
              variant="outlined"
              sx={{
                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                height: { xs: 20, sm: 24 },
                '& .MuiChip-label': {
                  px: { xs: 0.5, sm: 0.75 },
                },
              }}
            />
            <Chip
              label={payment.bucket}
              size="small"
              variant="outlined"
              sx={{
                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                height: { xs: 20, sm: 24 },
                '& .MuiChip-label': {
                  px: { xs: 0.5, sm: 0.75 },
                },
              }}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

