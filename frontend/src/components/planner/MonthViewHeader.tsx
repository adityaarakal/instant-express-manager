import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TuneIcon from '@mui/icons-material/Tune';
import type { AggregatedMonth } from '../../types/plannedExpensesAggregated';

interface MonthViewHeaderProps {
  month: AggregatedMonth;
  onAdjustmentsClick?: () => void;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatMonthDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export function MonthViewHeader({ month, onAdjustmentsClick }: MonthViewHeaderProps) {
  const totalAdjustments = (month.manualAdjustments ?? []).reduce(
    (sum, adj) => sum + adj.amount,
    0,
  );

  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CalendarMonthIcon color="primary" />
          <Typography variant="h5" component="h2">
            {formatMonthDate(month.monthStart)}
          </Typography>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
            <AccountBalanceIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
              Inflow:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatCurrency(month.inflowTotal)}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                window.location.href = '/transactions?tab=income';
              }}
              sx={{ ml: 1 }}
            >
              Edit
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>
              Fixed Factor:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatCurrency(month.fixedFactor)}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                window.location.href = '/settings';
              }}
              sx={{ ml: 1 }}
            >
              Edit
            </Button>
          </Box>

          {month.refErrors.length > 0 && (
            <Chip
              label={`${month.refErrors.length} Reference Error${month.refErrors.length > 1 ? 's' : ''}`}
              size="small"
              color="error"
              variant="outlined"
            />
          )}
          {onAdjustmentsClick && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<TuneIcon />}
              onClick={onAdjustmentsClick}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Adjustments
              {totalAdjustments !== 0 && (
                <Chip
                  label={formatCurrency(Math.abs(totalAdjustments))}
                  size="small"
                  color={totalAdjustments >= 0 ? 'success' : 'error'}
                  sx={{ ml: 1, height: 20 }}
                />
              )}
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

