import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PaymentIcon from '@mui/icons-material/Payment';
import WarningIcon from '@mui/icons-material/Warning';
import type { BankAccount } from '../../types/bankAccounts';

type CreditCardCardProps = {
  card: BankAccount;
  bankName: string;
  outstanding: number;
  creditLimit: number;
  utilization: number;
  dueDate: string | null | undefined;
  daysUntilDue: number | null;
  isOverdue: boolean;
  isDueSoon: boolean;
  onViewTransactions: () => void;
  onRecordPayment: () => void;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string | null | undefined) => string;
};

export function CreditCardCard({
  card,
  bankName,
  outstanding,
  creditLimit,
  utilization,
  dueDate,
  daysUntilDue,
  isOverdue,
  isDueSoon,
  onViewTransactions,
  onRecordPayment,
  formatCurrency,
  formatDate,
}: CreditCardCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'visible',
        borderColor: isOverdue ? 'error.main' : isDueSoon ? 'warning.main' : 'divider',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack spacing={1.5}>
          {/* Header: Name and Status */}
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
                {card.name}
              </Typography>
              {card.accountNumber && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    wordBreak: 'break-word',
                  }}
                >
                  ****{card.accountNumber.slice(-4)}
                </Typography>
              )}
            </Box>
            {isOverdue ? (
              <Chip
                label="Overdue"
                color="error"
                size="small"
                icon={<WarningIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                sx={{
                  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 },
                  flexShrink: 0,
                  '& .MuiChip-label': {
                    px: { xs: 0.75, sm: 1 },
                  },
                }}
              />
            ) : isDueSoon ? (
              <Chip
                label="Due Soon"
                color="warning"
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
                label="Current"
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
            )}
          </Stack>

          {/* Bank Name */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Bank: <Typography component="span" fontWeight="medium" sx={{ fontSize: 'inherit' }}>{bankName}</Typography>
            </Typography>
          </Stack>

          {/* Outstanding Balance */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Outstanding:
            </Typography>
            <Typography
              variant="body1"
              fontWeight="bold"
              color={outstanding > 0 ? 'error.main' : 'text.primary'}
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              {formatCurrency(outstanding)}
            </Typography>
          </Stack>

          {/* Credit Limit */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Credit Limit:
            </Typography>
            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {formatCurrency(creditLimit)}
            </Typography>
          </Stack>

          {/* Utilization */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Utilization:
            </Typography>
            <Chip
              label={`${utilization.toFixed(1)}%`}
              size="small"
              color={
                utilization > 80
                  ? 'error'
                  : utilization > 50
                    ? 'warning'
                    : 'success'
              }
              sx={{
                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                height: { xs: 24, sm: 28 },
                '& .MuiChip-label': {
                  px: { xs: 0.75, sm: 1 },
                },
              }}
            />
          </Stack>

          {/* Due Date */}
          {dueDate && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Due Date:
                </Typography>
                <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {formatDate(dueDate)}
                </Typography>
              </Stack>
              {daysUntilDue !== null && (
                <Typography
                  variant="caption"
                  color={
                    isOverdue
                      ? 'error'
                      : isDueSoon
                        ? 'warning.main'
                        : 'text.secondary'
                  }
                  sx={{
                    fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                    display: 'block',
                  }}
                >
                  {isOverdue
                    ? `${Math.abs(daysUntilDue)} days overdue`
                    : isDueSoon
                      ? `${daysUntilDue} days left`
                      : `${daysUntilDue} days remaining`}
                </Typography>
              )}
            </Box>
          )}

          {/* Actions */}
          <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap" sx={{ mt: 1 }}>
            <Tooltip title="View Transactions">
              <IconButton
                size="small"
                onClick={onViewTransactions}
                aria-label="View transactions"
                sx={{ minWidth: 40, minHeight: 40, p: 0.5 }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Record Payment">
              <IconButton
                size="small"
                onClick={onRecordPayment}
                aria-label="Record payment"
                sx={{ minWidth: 40, minHeight: 40, p: 0.5 }}
              >
                <PaymentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

