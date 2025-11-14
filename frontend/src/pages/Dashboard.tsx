import { useMemo, memo, lazy, Suspense } from 'react';
import { Stack, Box, CircularProgress } from '@mui/material';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import SavingsIcon from '@mui/icons-material/Savings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useAggregatedPlannedMonthsStore } from '../store/useAggregatedPlannedMonthsStore';
import { usePlannerStore } from '../store/usePlannerStore';
import { calculateDashboardMetrics } from '../utils/dashboard';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { DueSoonReminders } from '../components/dashboard/DueSoonReminders';

// Lazy load chart components for better performance
const SavingsTrendChart = lazy(() =>
  import('../components/dashboard/SavingsTrendChart').then((module) => ({ default: module.SavingsTrendChart }))
);
const BudgetVsActual = lazy(() =>
  import('../components/dashboard/BudgetVsActual').then((module) => ({ default: module.BudgetVsActual }))
);

// Chart loading fallback
function ChartLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export const Dashboard = memo(function Dashboard() {
  const incomeTransactions = useIncomeTransactionsStore((state) => state.transactions);
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const savingsTransactions = useSavingsInvestmentTransactionsStore((state) => state.transactions);
  const accounts = useBankAccountsStore((state) => state.accounts);
  const { activeMonthId } = usePlannerStore();

  const metrics = useMemo(() => {
    return calculateDashboardMetrics(
      incomeTransactions,
      expenseTransactions,
      savingsTransactions,
      accounts,
    );
  }, [incomeTransactions, expenseTransactions, savingsTransactions, accounts]);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        sx={{ alignItems: 'stretch', width: '100%' }}
      >
        <SummaryCard
          label="Total Income"
          value={metrics.totalIncome}
          description="Total received income from all transactions"
          color="success"
          icon={<AccountBalanceIcon fontSize="small" />}
        />
        <SummaryCard
          label="Total Expenses"
          value={metrics.totalExpenses}
          description="Total expenses across all transactions"
          color="error"
          icon={<PendingActionsIcon fontSize="small" />}
        />
        <SummaryCard
          label="Total Savings"
          value={metrics.totalSavings}
          description={
            metrics.totalSavings > 0
              ? 'Total completed savings/investment transactions'
              : 'Start adding savings transfers to track progress'
          }
          color="success"
          icon={<SavingsIcon fontSize="small" />}
        />
        <SummaryCard
          label="Credit Card Outstanding"
          value={metrics.creditCardOutstanding}
          description={
            metrics.creditCardOutstanding > 0
              ? 'Total outstanding balance across all credit cards'
              : 'No credit card outstanding balance'
          }
          color="warning"
          icon={<CreditCardIcon fontSize="small" />}
        />
      </Stack>

      <DueSoonReminders reminders={metrics.upcomingDueDates} />

      <Suspense fallback={<ChartLoader />}>
        <SavingsTrendChart trend={metrics.savingsTrend} />
      </Suspense>

      <Suspense fallback={<ChartLoader />}>
        <BudgetVsActual monthId={activeMonthId} />
      </Suspense>
    </Stack>
  );
});
