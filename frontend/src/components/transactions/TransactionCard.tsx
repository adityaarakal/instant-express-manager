/**
 * TransactionCard Component
 * Displays a transaction as a card on mobile devices
 * Alternative to table rows for better mobile UX
 */

import { Box, Card, CardContent, Stack, Typography, Chip, IconButton, Checkbox } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CircularProgress from '@mui/material/CircularProgress';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
  TransferTransaction,
} from '../../types/transactions';

type TransactionCardProps = {
  transaction: IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction | TransferTransaction;
  type: 'income' | 'expense' | 'savings' | 'transfers';
  accountName: string;
  toAccountName?: string; // For transfers
  isSelected: boolean;
  isDeleting: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
};

export function TransactionCard({
  transaction,
  type,
  accountName,
  toAccountName,
  isSelected,
  isDeleting,
  onSelect,
  onEdit,
  onDelete,
  formatCurrency,
  formatDate,
}: TransactionCardProps) {
  const getStatusColor = () => {
    if (type === 'income') {
      return (transaction as IncomeTransaction).status === 'Received' ? 'success' : 'warning';
    } else if (type === 'expense') {
      return (transaction as ExpenseTransaction).status === 'Paid' ? 'success' : 'warning';
    } else {
      return (transaction as SavingsInvestmentTransaction | TransferTransaction).status === 'Completed' ? 'success' : 'warning';
    }
  };

  const getStatusLabel = () => {
    if (type === 'income') {
      return (transaction as IncomeTransaction).status;
    } else if (type === 'expense') {
      return (transaction as ExpenseTransaction).status;
    } else {
      return (transaction as SavingsInvestmentTransaction | TransferTransaction).status;
    }
  };

  const getCategoryLabel = () => {
    if (type === 'income') {
      return (transaction as IncomeTransaction).category;
    } else if (type === 'expense') {
      return (transaction as ExpenseTransaction).category;
    } else if (type === 'savings') {
      return (transaction as SavingsInvestmentTransaction).type;
    } else {
      return (transaction as TransferTransaction).category;
    }
  };

  const getDescription = () => {
    if (type === 'savings') {
      return ('description' in transaction ? transaction.description : transaction.destination) || '—';
    } else if (type === 'transfers') {
      return (transaction as TransferTransaction).description || '—';
    } else {
      return transaction.description || '—';
    }
  };

  const getAdditionalInfo = () => {
    if (type === 'expense') {
      return (transaction as ExpenseTransaction).bucket;
    } else if (type === 'savings') {
      return (transaction as SavingsInvestmentTransaction).destination;
    } else if (type === 'transfers') {
      return toAccountName ? `From: ${accountName} → To: ${toAccountName}` : null;
    }
    return null;
  };

  return (
    <Card
      sx={{
        mb: 1.5,
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Stack spacing={1.5}>
          {/* Header: Checkbox, Date, Status */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
              <Checkbox
                checked={isSelected}
                onChange={onSelect}
                size="small"
                icon={<CheckBoxOutlineBlankIcon />}
                checkedIcon={<CheckBoxIcon />}
                sx={{ p: 0.5 }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatDate(transaction.date)}
              </Typography>
            </Stack>
            <Chip
              label={getStatusLabel()}
              size="small"
              color={getStatusColor()}
              sx={{
                fontSize: '0.6875rem',
                height: 24,
                '& .MuiChip-label': {
                  px: 0.75,
                },
              }}
            />
          </Stack>

          {/* Main Content: Description and Amount */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {getDescription()}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  {accountName}
                </Typography>
                {getCategoryLabel() && (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                      •
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                      {getCategoryLabel()}
                    </Typography>
                  </>
                )}
                {getAdditionalInfo() && (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                      •
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                      {getAdditionalInfo()}
                    </Typography>
                  </>
                )}
              </Stack>
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1rem',
                color: type === 'income' || type === 'savings' ? 'success.main' : 'error.main',
                whiteSpace: 'nowrap',
                ml: 1,
              }}
            >
              {formatCurrency(transaction.amount)}
            </Typography>
          </Stack>

          {/* Actions */}
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <IconButton
              size="small"
              onClick={onEdit}
              sx={{
                minWidth: 40,
                minHeight: 40,
                p: 0.5,
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={onDelete}
              color="error"
              disabled={isDeleting}
              sx={{
                minWidth: 40,
                minHeight: 40,
                p: 0.5,
              }}
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

