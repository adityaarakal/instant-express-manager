import { Box, Chip, Paper, Stack, TextField, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import type { PlannedMonthSnapshot } from '../../types/plannedExpenses';
import { usePlannedMonthsStore } from '../../store/usePlannedMonthsStore';
import { toNumber } from '../../utils/formulas';

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
  const { updateMonthMetadata } = usePlannedMonthsStore();

  const handleInflowChange = (value: string) => {
    const numValue = toNumber(value);
    updateMonthMetadata(month.id, {
      inflowTotal: numValue === 0 && value.trim() === '' ? null : numValue,
    });
  };

  const handleFixedFactorChange = (value: string) => {
    const numValue = toNumber(value);
    updateMonthMetadata(month.id, {
      fixedFactor: numValue === 0 && value.trim() === '' ? null : numValue,
    });
  };

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
            <TextField
              value={month.inflowTotal ?? ''}
              onChange={(e) => handleInflowChange(e.target.value)}
              size="small"
              type="number"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
              }}
              sx={{ width: 150 }}
              placeholder="0.00"
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>
              Fixed Factor:
            </Typography>
            <TextField
              value={month.fixedFactor ?? ''}
              onChange={(e) => handleFixedFactorChange(e.target.value)}
              size="small"
              type="number"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
              }}
              sx={{ width: 150 }}
              placeholder="0.00"
            />
          </Box>

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

