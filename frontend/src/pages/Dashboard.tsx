import { useMemo } from 'react';
import { Stack, Typography } from '@mui/material';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import SavingsIcon from '@mui/icons-material/Savings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { usePlannedMonthsStore } from '../store/usePlannedMonthsStore';
import { calculateDashboardMetrics } from '../utils/dashboard';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { DueSoonReminders } from '../components/dashboard/DueSoonReminders';

export function Dashboard() {
  const { months } = usePlannedMonthsStore();

  const metrics = useMemo(() => {
    if (months.length === 0) {
      return {
        totalPendingAllocations: 0,
        totalSavings: 0,
        totalCCBills: 0,
        upcomingDueDates: [],
        savingsTrend: [],
      };
    }
    return calculateDashboardMetrics(months);
  }, [months]);

  const savingsDescription =
    metrics.totalSavings > 0
      ? `Total savings across ${months.length} month${months.length > 1 ? 's' : ''}`
      : 'Start adding savings transfers to track progress';

  const ccBillsDescription =
    metrics.totalCCBills > 0
      ? 'Total credit card bills across all months'
      : 'No credit card bills recorded yet';

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        sx={{ alignItems: 'stretch', width: '100%' }}
      >
        <SummaryCard
          label="Pending Allocations"
          value={metrics.totalPendingAllocations}
          description={
            metrics.totalPendingAllocations > 0
              ? `Pending amounts across all buckets`
              : 'All allocations are paid or no data available'
          }
          color="warning"
          icon={<PendingActionsIcon fontSize="small" />}
        />
        <SummaryCard
          label="Total Savings"
          value={metrics.totalSavings}
          description={savingsDescription}
          color="success"
          icon={<SavingsIcon fontSize="small" />}
        />
        <SummaryCard
          label="Credit Card Bills"
          value={metrics.totalCCBills}
          description={ccBillsDescription}
          color="error"
          icon={<CreditCardIcon fontSize="small" />}
        />
      </Stack>

      <DueSoonReminders reminders={metrics.upcomingDueDates} />

      {metrics.savingsTrend.length > 0 && (
        <Stack spacing={1}>
          <Typography variant="h6">Savings Trend (Last 12 Months)</Typography>
          <Typography variant="body2" color="text.secondary">
            Total savings: {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
            }).format(metrics.savingsTrend.reduce((sum, item) => sum + item.savings, 0))}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Average per month:{' '}
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
            }).format(
              metrics.savingsTrend.length > 0
                ? metrics.savingsTrend.reduce((sum, item) => sum + item.savings, 0) /
                    metrics.savingsTrend.length
                : 0,
            )}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

