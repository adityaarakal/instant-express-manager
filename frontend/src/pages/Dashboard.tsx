import { useMemo, memo, lazy, Suspense, useState, useEffect } from 'react';
import { Stack, Box, CircularProgress, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Divider, Button, IconButton } from '@mui/material';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import SavingsIcon from '@mui/icons-material/Savings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { calculateDashboardMetrics } from '../utils/dashboard';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { DueSoonReminders } from '../components/dashboard/DueSoonReminders';
import { WidgetSettings } from '../components/dashboard/WidgetSettings';
import { useDashboardWidgetsStore } from '../store/useDashboardWidgetsStore';

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
  const { getEnabledWidgets, initializeWidgets } = useDashboardWidgetsStore();
  const [widgetSettingsOpen, setWidgetSettingsOpen] = useState(false);
  
  // Initialize widgets on mount
  useEffect(() => {
    initializeWidgets();
  }, [initializeWidgets]);
  
  // Get current month as default - always prioritize current/latest month
  const getCurrentMonthId = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  
  // Always default to current month - latest/future focused
  const [selectedMonthId, setSelectedMonthId] = useState<string>(getCurrentMonthId());
  
  const enabledWidgets = getEnabledWidgets();

  // Generate list of available months (current month first, then last 12 months)
  // Prioritize latest and future months
  const availableMonths = useMemo(() => {
    const months: Array<{ id: string; label: string }> = [];
    const now = new Date();
    
    // Start with current month and future months (up to 3 months ahead)
    for (let i = 0; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('en-IN', {
        month: 'long',
        year: 'numeric',
      }).format(date);
      months.push({ id: monthId, label });
    }
    
    // Then add past months (last 12 months)
    for (let i = 1; i <= 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('en-IN', {
        month: 'long',
        year: 'numeric',
      }).format(date);
      months.push({ id: monthId, label });
    }
    
    return months;
  }, []);

  const formatMonthDate = (monthId: string): string => {
    const [year, month] = monthId.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat('en-IN', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const handlePrint = () => {
    window.print();
  };

  const metrics = useMemo(() => {
    return calculateDashboardMetrics(
      incomeTransactions,
      expenseTransactions,
      savingsTransactions,
      accounts,
      selectedMonthId,
    );
  }, [incomeTransactions, expenseTransactions, savingsTransactions, accounts, selectedMonthId]);

  return (
    <Stack spacing={3}>
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton
            onClick={() => setWidgetSettingsOpen(true)}
            aria-label="Widget settings"
            size="small"
          >
            <SettingsIcon />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            size="small"
            aria-label="Print dashboard"
          >
            Print
          </Button>
        </Stack>
      </Box>
      <Box className="print-header print-only" sx={{ display: 'none' }}>
        <Typography variant="h4">Financial Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Month: {formatMonthDate(selectedMonthId)} | Generated: {new Date().toLocaleString('en-IN')}
        </Typography>
      </Box>
      {/* Month Selector */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CalendarMonthIcon color="primary" />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Select Month</InputLabel>
            <Select
              value={selectedMonthId}
              label="Select Month"
              onChange={(e) => setSelectedMonthId(e.target.value)}
            >
              {availableMonths.map((month) => (
                <MenuItem key={month.id} value={month.id}>
                  {month.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            Viewing metrics for: <strong>{formatMonthDate(selectedMonthId)}</strong>
          </Typography>
        </Stack>
      </Paper>

      {/* Monthly Metrics Section - Summary Cards Widget */}
      {enabledWidgets.some((w) => w.id === 'summary-cards') && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthIcon fontSize="small" />
            Monthly Metrics - {formatMonthDate(selectedMonthId)}
          </Typography>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            sx={{ alignItems: 'stretch', width: '100%' }}
          >
            <SummaryCard
              label="Monthly Income"
              value={metrics.monthlyIncome}
              description={`Income received in ${formatMonthDate(selectedMonthId)}`}
              color="success"
              icon={<AccountBalanceIcon fontSize="small" />}
            />
            <SummaryCard
              label="Monthly Expenses"
              value={metrics.monthlyExpenses}
              description={`Expenses in ${formatMonthDate(selectedMonthId)}`}
              color="error"
              icon={<PendingActionsIcon fontSize="small" />}
            />
            <SummaryCard
              label="Monthly Savings"
              value={metrics.monthlySavings}
              description={`Savings in ${formatMonthDate(selectedMonthId)}`}
              color="success"
              icon={<SavingsIcon fontSize="small" />}
            />
            <SummaryCard
              label="Monthly Investments"
              value={metrics.monthlyInvestments}
              description={`Investments (SIP/LumpSum) in ${formatMonthDate(selectedMonthId)}`}
              color="info"
              icon={<TrendingUpIcon fontSize="small" />}
            />
          </Stack>
        </Box>
      )}

      <Divider />

      {/* Overall Metrics Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon fontSize="small" />
          Overall Metrics (All Time)
        </Typography>
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
      </Box>

      {/* Due Soon Reminders Widget */}
      {enabledWidgets.some((w) => w.id === 'due-soon-reminders') && (
        <DueSoonReminders reminders={metrics.upcomingDueDates} />
      )}

      {/* Savings Trend Chart Widget */}
      {enabledWidgets.some((w) => w.id === 'savings-trend-chart') && (
        <Suspense fallback={<ChartLoader />}>
          <SavingsTrendChart trend={metrics.savingsTrend} />
        </Suspense>
      )}

      {/* Budget vs Actual Widget */}
      {enabledWidgets.some((w) => w.id === 'budget-vs-actual') && (
        <Suspense fallback={<ChartLoader />}>
          <BudgetVsActual monthId={selectedMonthId} />
        </Suspense>
      )}

      <Box className="print-footer print-only" sx={{ display: 'none' }}>
        <Typography variant="caption">
          Generated by Instant Express Manager | {new Date().toLocaleDateString('en-IN')} | Page {window.location.pathname}
        </Typography>
      </Box>
      
      <WidgetSettings open={widgetSettingsOpen} onClose={() => setWidgetSettingsOpen(false)} />
    </Stack>
  );
});
