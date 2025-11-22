import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  Chip,
  IconButton,
  Link,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CircularProgress from '@mui/material/CircularProgress';
import type {
  RecurringIncome,
  RecurringExpense,
  RecurringSavingsInvestment,
} from '../../types/recurring';

type RecurringCardProps = {
  template: RecurringIncome | RecurringExpense | RecurringSavingsInvestment;
  type: 'income' | 'expense' | 'savings';
  accountName: string;
  isDeleting?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPauseResume: () => void;
  onConvertToEMI?: () => void;
  onViewTransactions?: () => void;
  transactionsCount?: number;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
};

export function RecurringCard({
  template,
  type,
  accountName,
  isDeleting = false,
  onEdit,
  onDelete,
  onPauseResume,
  onConvertToEMI,
  onViewTransactions,
  transactionsCount = 0,
  formatCurrency,
  formatDate,
}: RecurringCardProps) {
  const isActive = template.status === 'Active';
  const isCompleted = template.status === 'Completed';

  const getCategoryLabel = () => {
    if (type === 'income') {
      return (template as RecurringIncome).category;
    } else if (type === 'expense') {
      return (template as RecurringExpense).category;
    } else {
      return (template as RecurringSavingsInvestment).type;
    }
  };

  const getAdditionalInfo = () => {
    if (type === 'expense') {
      return (template as RecurringExpense).bucket;
    } else if (type === 'savings') {
      return (template as RecurringSavingsInvestment).destination;
    }
    return null;
  };

  return (
    <Card
      sx={{
        border: 1,
        borderColor: 'divider',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Stack spacing={1.5}>
          {/* Header: Name and Status */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body1"
                fontWeight="medium"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  wordBreak: 'break-word',
                  mb: getAdditionalInfo() ? 0.5 : 0,
                }}
              >
                {template.name}
              </Typography>
              {getAdditionalInfo() && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                    wordBreak: 'break-word',
                    display: 'block',
                  }}
                >
                  {getAdditionalInfo()}
                </Typography>
              )}
            </Box>
            <Chip
              label={template.status}
              size="small"
              color={
                isActive ? 'success' : isCompleted ? 'default' : 'warning'
              }
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

          {/* Details */}
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                Account:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 500 }}>
                {accountName}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                Amount:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600 }}>
                {formatCurrency(template.amount)}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                Frequency:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {template.frequency}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                Next Due Date:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {formatDate(template.nextDueDate)}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                Category/Type:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {getCategoryLabel()}
              </Typography>
            </Stack>
          </Stack>

          {/* Transactions Link */}
          {onViewTransactions && transactionsCount > 0 && (
            <Box>
              <Link
                component="button"
                variant="body2"
                onClick={onViewTransactions}
                sx={{
                  textDecoration: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minHeight: { xs: 40, sm: 'auto' },
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {transactionsCount} transaction{transactionsCount !== 1 ? 's' : ''}
              </Link>
            </Box>
          )}

          {/* Actions */}
          <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" sx={{ gap: 1, pt: 0.5 }}>
            <Tooltip title={isActive ? 'Pause Template' : 'Resume Template'}>
              <IconButton
                size="small"
                onClick={onPauseResume}
                disabled={isCompleted || isDeleting}
                aria-label={isActive ? `Pause template ${template.name}` : `Resume template ${template.name}`}
                sx={{
                  minWidth: { xs: 40, sm: 48 },
                  minHeight: { xs: 40, sm: 48 },
                  p: { xs: 0.5, sm: 1 },
                }}
              >
                {isActive ? (
                  <PauseIcon fontSize="small" />
                ) : (
                  <PlayArrowIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            {onConvertToEMI && (type === 'expense' || type === 'savings') && (
              <Tooltip title="Convert to EMI">
                <IconButton
                  size="small"
                  onClick={onConvertToEMI}
                  disabled={isDeleting}
                  aria-label={`Convert template ${template.name} to EMI`}
                  color="primary"
                  sx={{
                    minWidth: { xs: 40, sm: 48 },
                    minHeight: { xs: 40, sm: 48 },
                    p: { xs: 0.5, sm: 1 },
                  }}
                >
                  <SwapHorizIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Edit Template">
              <IconButton
                size="small"
                onClick={onEdit}
                disabled={isDeleting}
                aria-label={`Edit template ${template.name}`}
                sx={{
                  minWidth: { xs: 40, sm: 48 },
                  minHeight: { xs: 40, sm: 48 },
                  p: { xs: 0.5, sm: 1 },
                }}
              >
                {isDeleting ? (
                  <CircularProgress size={16} aria-label="Deleting" />
                ) : (
                  <EditIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Template">
              <IconButton
                size="small"
                onClick={onDelete}
                disabled={isDeleting}
                aria-label={`Delete template ${template.name}`}
                color="error"
                sx={{
                  minWidth: { xs: 40, sm: 48 },
                  minHeight: { xs: 40, sm: 48 },
                  p: { xs: 0.5, sm: 1 },
                }}
              >
                {isDeleting ? (
                  <CircularProgress size={16} aria-label="Deleting" />
                ) : (
                  <DeleteIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

