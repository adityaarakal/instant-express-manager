import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Link,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CircularProgress from '@mui/material/CircularProgress';
import type { ExpenseEMI, SavingsInvestmentEMI } from '../../types/emis';

type EMICardProps = {
  emi: ExpenseEMI | SavingsInvestmentEMI;
  type: 'expense' | 'savings';
  accountName: string;
  isSelected?: boolean;
  isDeleting?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPauseResume: () => void;
  onConvertToRecurring: () => void;
  onViewTransactions?: () => void;
  transactionsCount?: number;
  progress: number;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
};

export function EMICard({
  emi,
  type,
  accountName,
  isSelected = false,
  isDeleting = false,
  onEdit,
  onDelete,
  onPauseResume,
  onConvertToRecurring,
  onViewTransactions,
  transactionsCount = 0,
  progress,
  formatCurrency,
  formatDate,
}: EMICardProps) {
  const isExpense = type === 'expense';
  const isActive = emi.status === 'Active';
  const isCompleted = emi.status === 'Completed';

  return (
    <Card
      sx={{
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
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
                  mb: type === 'savings' ? 0.5 : 0,
                }}
              >
                {emi.name}
              </Typography>
              {type === 'savings' && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                    wordBreak: 'break-word',
                    display: 'block',
                  }}
                >
                  {(emi as SavingsInvestmentEMI).destination}
                </Typography>
              )}
            </Box>
            <Chip
              label={emi.status}
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
                {formatCurrency(emi.amount)}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                Frequency:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {emi.frequency}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                Start Date:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {formatDate(emi.startDate)}
              </Typography>
            </Stack>

            {isExpense && (emi as ExpenseEMI).category && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Category:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {(emi as ExpenseEMI).category}
                </Typography>
              </Stack>
            )}
          </Stack>

          {/* Progress */}
          <Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: { xs: 6, sm: 8 },
                borderRadius: 1,
                mb: 0.5,
              }}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                Progress:
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                {emi.completedInstallments} / {emi.totalInstallments}
              </Typography>
            </Stack>
          </Box>

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
            <Tooltip title={isActive ? 'Pause EMI' : 'Resume EMI'}>
              <IconButton
                size="small"
                onClick={onPauseResume}
                disabled={isCompleted || isDeleting}
                aria-label={isActive ? `Pause EMI ${emi.name}` : `Resume EMI ${emi.name}`}
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

            <Tooltip title="Convert to Recurring Template">
              <IconButton
                size="small"
                onClick={onConvertToRecurring}
                disabled={isDeleting}
                aria-label={`Convert EMI ${emi.name} to Recurring Template`}
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

            <Tooltip title="Edit EMI">
              <IconButton
                size="small"
                onClick={onEdit}
                disabled={isDeleting}
                aria-label={`Edit EMI ${emi.name}`}
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

            <Tooltip title="Delete EMI">
              <IconButton
                size="small"
                onClick={onDelete}
                disabled={isDeleting}
                aria-label={`Delete EMI ${emi.name}`}
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

