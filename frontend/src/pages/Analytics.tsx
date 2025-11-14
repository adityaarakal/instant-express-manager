import { useState, useMemo, memo, lazy, Suspense } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';

// Lazy load chart components for better performance
const IncomeTrendsChart = lazy(() =>
  import('../components/analytics/IncomeTrendsChart').then((module) => ({ default: module.IncomeTrendsChart }))
);
const ExpenseBreakdownChart = lazy(() =>
  import('../components/analytics/ExpenseBreakdownChart').then((module) => ({ default: module.ExpenseBreakdownChart }))
);
const SavingsProgressChart = lazy(() =>
  import('../components/analytics/SavingsProgressChart').then((module) => ({ default: module.SavingsProgressChart }))
);
const InvestmentPerformanceChart = lazy(() =>
  import('../components/analytics/InvestmentPerformanceChart').then((module) => ({
    default: module.InvestmentPerformanceChart,
  }))
);
const CreditCardAnalysisChart = lazy(() =>
  import('../components/analytics/CreditCardAnalysisChart').then((module) => ({
    default: module.CreditCardAnalysisChart,
  }))
);
const BudgetVsActualChart = lazy(() =>
  import('../components/analytics/BudgetVsActualChart').then((module) => ({ default: module.BudgetVsActualChart }))
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

type DateRange = 'last3months' | 'last6months' | 'last12months' | 'all';

const getDateRange = (range: DateRange): { start: string; end: string } => {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case 'last3months':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'last6months':
      start.setMonth(start.getMonth() - 6);
      break;
    case 'last12months':
      start.setMonth(start.getMonth() - 12);
      break;
    case 'all':
      start.setFullYear(2020, 0, 1); // Start from 2020
      break;
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

export const Analytics = memo(function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>('last12months');
  const [activeTab, setActiveTab] = useState(0);

  const incomeTransactions = useIncomeTransactionsStore((state) => state.transactions);
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const savingsTransactions = useSavingsInvestmentTransactionsStore((state) => state.transactions);
  const accounts = useBankAccountsStore((state) => state.accounts);

  const { start, end } = useMemo(() => getDateRange(dateRange), [dateRange]);

  const filteredIncome = useMemo(
    () => incomeTransactions.filter((t) => t.date >= start && t.date <= end),
    [incomeTransactions, start, end],
  );

  const filteredExpenses = useMemo(
    () => expenseTransactions.filter((t) => t.date >= start && t.date <= end),
    [expenseTransactions, start, end],
  );

  const filteredSavings = useMemo(
    () => savingsTransactions.filter((t) => t.date >= start && t.date <= end),
    [savingsTransactions, start, end],
  );

  const creditCards = useMemo(
    () => accounts.filter((acc) => acc.accountType === 'CreditCard'),
    [accounts],
  );

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Analytics</Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Date Range</InputLabel>
          <Select value={dateRange} label="Date Range" onChange={(e) => setDateRange(e.target.value as DateRange)}>
            <MenuItem value="last3months">Last 3 Months</MenuItem>
            <MenuItem value="last6months">Last 6 Months</MenuItem>
            <MenuItem value="last12months">Last 12 Months</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={1} sx={{ p: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Income" />
          <Tab label="Expenses" />
          <Tab label="Savings" />
          <Tab label="Credit Cards" />
          <Tab label="Budget vs Actual" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Suspense fallback={<ChartLoader />}>
          <Stack spacing={3}>
            <IncomeTrendsChart transactions={filteredIncome} />
          </Stack>
        </Suspense>
      )}

      {activeTab === 1 && (
        <Suspense fallback={<ChartLoader />}>
          <Stack spacing={3}>
            <ExpenseBreakdownChart transactions={filteredExpenses} />
          </Stack>
        </Suspense>
      )}

      {activeTab === 2 && (
        <Suspense fallback={<ChartLoader />}>
          <Stack spacing={3}>
            <SavingsProgressChart transactions={filteredSavings} />
            <InvestmentPerformanceChart transactions={filteredSavings} />
          </Stack>
        </Suspense>
      )}

      {activeTab === 3 && (
        <Suspense fallback={<ChartLoader />}>
          <Stack spacing={3}>
            <CreditCardAnalysisChart accounts={creditCards} transactions={filteredExpenses} />
          </Stack>
        </Suspense>
      )}

      {activeTab === 4 && (
        <Suspense fallback={<ChartLoader />}>
          <Stack spacing={3}>
            <BudgetVsActualChart
              incomeTransactions={filteredIncome}
              expenseTransactions={filteredExpenses}
              savingsTransactions={filteredSavings}
            />
          </Stack>
        </Suspense>
      )}
    </Stack>
  );
});

