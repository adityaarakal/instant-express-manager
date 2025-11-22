import { useState } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import type { AggregatedMonth } from '../../types/plannedExpensesAggregated';
import { DuplicateMonthDialog } from './DuplicateMonthDialog';
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
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  return (
    <>
    <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1.5, sm: 2 }} 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            justifyContent="space-between"
          >
        <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
          <CalendarMonthIcon color="primary" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
          <Typography 
            variant="h5" 
            component="h2"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              fontWeight: 700,
            }}
          >
            {formatMonthDate(month.monthStart)}
          </Typography>
            </Stack>
            <Stack 
              direction="row" 
              spacing={{ xs: 1, sm: 1.5 }}
              sx={{ 
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'flex-start', sm: 'flex-end' },
              }}
            >
              <Button
                variant="outlined"
                startIcon={<CompareArrowsIcon />}
                onClick={() => setCompareDialogOpen(true)}
                size="small"
                className="no-print"
                sx={{
                  minHeight: { xs: 44, sm: 40 },
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                  px: { xs: 1.5, sm: 2 },
                  flex: { xs: 1, sm: '0 1 auto' },
                }}
              >
                Compare
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={() => setDuplicateDialogOpen(true)}
                size="small"
                className="no-print"
                sx={{
                  minHeight: { xs: 44, sm: 40 },
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                  px: { xs: 1.5, sm: 2 },
                  flex: { xs: 1, sm: '0 1 auto' },
                }}
              >
                Copy Month
              </Button>
            </Stack>
        </Stack>

        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1.5, sm: 2 }} 
          alignItems={{ xs: 'stretch', sm: 'center' }}
          flexWrap="wrap"
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 0.75, sm: 1 }, 
              minWidth: { xs: '100%', sm: 200 },
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}
          >
            <AccountBalanceIcon fontSize="small" color="action" />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                minWidth: { xs: 'auto', sm: 60 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              Inflow:
            </Typography>
            <Typography 
              variant="body1" 
              fontWeight="medium"
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                wordBreak: 'break-word',
              }}
            >
              {formatCurrency(month.inflowTotal)}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                navigate('/transactions?tab=income');
              }}
              sx={{ 
                ml: { xs: 0, sm: 1 },
                minHeight: { xs: 36, sm: 32 },
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                px: { xs: 1, sm: 1.5 },
              }}
              className="no-print"
            >
              Edit
            </Button>
          </Box>

          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 0.75, sm: 1 }, 
              minWidth: { xs: '100%', sm: 200 },
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}
          >
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                minWidth: { xs: 'auto', sm: 90 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              Fixed Factor:
            </Typography>
            <Typography 
              variant="body1" 
              fontWeight="medium"
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                wordBreak: 'break-word',
              }}
            >
              {formatCurrency(month.fixedFactor)}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                navigate('/settings');
              }}
              sx={{ 
                ml: { xs: 0, sm: 1 },
                minHeight: { xs: 36, sm: 32 },
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                px: { xs: 1, sm: 1.5 },
              }}
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
              sx={{
                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                height: { xs: 24, sm: 28 },
                '& .MuiChip-label': {
                  px: { xs: 0.75, sm: 1 },
                },
              }}
            />
          )}
        </Stack>
      </Stack>
    </Paper>
    <DuplicateMonthDialog
      open={duplicateDialogOpen}
      onClose={() => setDuplicateDialogOpen(false)}
      sourceMonthId={month.id}
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

