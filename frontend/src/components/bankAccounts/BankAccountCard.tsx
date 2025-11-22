import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { BankAccount } from '../../types/bankAccounts';

type BankAccountCardProps = {
  account: BankAccount;
  bankName: string;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  formatCurrency: (value: number) => string;
};

export function BankAccountCard({
  account,
  bankName,
  isDeleting,
  onEdit,
  onDelete,
  formatCurrency,
}: BankAccountCardProps) {
  const getAccountTypeColor = (type: BankAccount['accountType']) => {
    switch (type) {
      case 'Savings':
        return 'primary';
      case 'Current':
        return 'secondary';
      case 'CreditCard':
        return 'error';
      case 'Wallet':
        return 'success';
      default:
        return 'default';
    }
  };

  const isCreditCard = account.accountType === 'CreditCard';

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'visible',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack spacing={1.5}>
          {/* Header: Name and Type */}
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
                {account.name}
              </Typography>
              {account.accountNumber && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    wordBreak: 'break-word',
                  }}
                >
                  {account.accountNumber}
                </Typography>
              )}
            </Box>
            <Chip
              label={account.accountType}
              size="small"
              color={getAccountTypeColor(account.accountType)}
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

          {/* Bank Name */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Bank: <Typography component="span" fontWeight="medium" sx={{ fontSize: 'inherit' }}>{bankName}</Typography>
            </Typography>
          </Stack>

          {/* Balance */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Balance:
            </Typography>
            <Typography
              variant="body1"
              fontWeight="bold"
              color={account.currentBalance < 0 ? 'error.main' : 'text.primary'}
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              {formatCurrency(account.currentBalance)}
            </Typography>
          </Stack>

          {/* Credit Card Specific Fields */}
          {isCreditCard && (
            <>
              {account.creditLimit !== undefined && account.creditLimit > 0 && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Credit Limit:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {formatCurrency(account.creditLimit)}
                  </Typography>
                </Stack>
              )}
              {account.outstandingBalance !== undefined && account.outstandingBalance > 0 && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Outstanding:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="error.main" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {formatCurrency(account.outstandingBalance)}
                  </Typography>
                </Stack>
              )}
              {account.dueDate && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Due Date:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {new Date(account.dueDate).toLocaleDateString()}
                  </Typography>
                </Stack>
              )}
            </>
          )}

          {/* Notes */}
          {account.notes && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' }, display: 'block', mb: 0.5 }}>
                Notes:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  wordBreak: 'break-word',
                }}
              >
                {account.notes}
              </Typography>
            </Box>
          )}

          {/* Actions */}
          <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap" sx={{ mt: 1 }}>
            <IconButton
              size="small"
              onClick={onEdit}
              disabled={isDeleting}
              aria-label={`Edit account ${account.name}`}
              sx={{ minWidth: 40, minHeight: 40, p: 0.5 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={onDelete}
              color="error"
              disabled={isDeleting}
              aria-label={`Delete account ${account.name}`}
              sx={{ minWidth: 40, minHeight: 40, p: 0.5 }}
            >
              {isDeleting ? (
                <CircularProgress size={16} aria-label="Deleting" />
              ) : (
                <DeleteIcon fontSize="small" />
              )}
            </IconButton>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

