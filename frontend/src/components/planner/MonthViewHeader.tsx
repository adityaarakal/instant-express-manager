import { useState } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import type { AggregatedMonth } from '../../types/plannedExpensesAggregated';
import { CopyMonthDialog } from './CopyMonthDialog';
import { MonthComparisonDialog } from './MonthComparisonDialog';

interface MonthViewHeaderProps {
  month: AggregatedMonth;
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
  const navigate = useNavigate();
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  return (
    <>
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <CalendarMonthIcon color="primary" />
              <Typography variant="h5" component="h2">
                {formatMonthDate(month.monthStart)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<CompareArrowsIcon />}
                onClick={() => setCompareDialogOpen(true)}
                size="small"
                className="no-print"
              >
                Compare
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={() => setCopyDialogOpen(true)}
                size="small"
                className="no-print"
              >
                Copy Month
              </Button>
            </Stack>
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
                navigate('/transactions?tab=income');
              }}
              sx={{ ml: 1 }}
              className="no-print"
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
                navigate('/settings');
              }}
              sx={{ ml: 1 }}
              className="no-print"
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
        </Stack>
      </Stack>
    </Paper>
    <CopyMonthDialog
      open={copyDialogOpen}
      onClose={() => setCopyDialogOpen(false)}
      sourceMonthId={month.id}
      sourceMonthStart={month.monthStart}
    />
    <MonthComparisonDialog
      open={compareDialogOpen}
      onClose={() => setCompareDialogOpen(false)}
      currentMonthId={month.id}
      currentMonthStart={month.monthStart}
    />
    </>
  );
}

