import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import type { PlannedMonthSnapshot } from '../../types/plannedExpenses';

interface MonthViewHeaderProps {
  month: PlannedMonthSnapshot;
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

export function MonthViewHeader({ month }: MonthViewHeaderProps) {
  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CalendarMonthIcon color="primary" />
          <Typography variant="h5" component="h2">
            {formatMonthDate(month.monthStart)}
          </Typography>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Inflow:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatCurrency(month.inflowTotal)}
            </Typography>
          </Box>

          {month.fixedFactor !== null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Fixed Factor:
              </Typography>
              <Chip
                label={formatCurrency(month.fixedFactor)}
                size="small"
                variant="outlined"
                color="primary"
              />
            </Box>
          )}

          {month.refErrors.length > 0 && (
            <Chip
              label={`${month.refErrors.length} Reference Error${month.refErrors.length > 1 ? 's' : ''}`}
              size="small"
              color="error"
              variant="outlined"
            />
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

