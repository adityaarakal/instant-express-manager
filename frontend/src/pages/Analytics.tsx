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
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
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
const IncomeVsExpenseChart = lazy(() =>
  import('../components/analytics/IncomeVsExpenseChart').then((module) => ({ default: module.IncomeVsExpenseChart }))
);
const SpendingTrendsChart = lazy(() =>
  import('../components/analytics/SpendingTrendsChart').then((module) => ({ default: module.SpendingTrendsChart }))
);
const SavingsRateChart = lazy(() =>
  import('../components/analytics/SavingsRateChart').then((module) => ({ default: module.SavingsRateChart }))
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

type DateRange = 'last3months' | 'last6months' | 'last12months' | 'all' | 'custom';

const getDateRange = (range: DateRange, customStart?: string, customEnd?: string): { start: string; end: string } => {
  if (range === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }

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
    case 'custom':
      // Will be handled by customStart/customEnd
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
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const incomeTransactions = useIncomeTransactionsStore((state) => state.transactions);
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const savingsTransactions = useSavingsInvestmentTransactionsStore((state) => state.transactions);
  const accounts = useBankAccountsStore((state) => state.accounts);

  const { start, end } = useMemo(() => getDateRange(dateRange, customStartDate, customEndDate), [dateRange, customStartDate, customEndDate]);

  const handleCustomDateRange = () => {
    if (customStartDate && customEndDate && customStartDate <= customEndDate) {
      setDateRange('custom');
      setCustomDateDialogOpen(false);
    }
  };

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Analytics</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => {
                const newRange = e.target.value as DateRange;
                setDateRange(newRange);
                if (newRange === 'custom') {
                  setCustomDateDialogOpen(true);
                }
              }}
            >
              <MenuItem value="last3months">Last 3 Months</MenuItem>
              <MenuItem value="last6months">Last 6 Months</MenuItem>
              <MenuItem value="last12months">Last 12 Months</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="custom">Custom Range...</MenuItem>
            </Select>
          </FormControl>
          {dateRange === 'custom' && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<CalendarTodayIcon />}
              onClick={() => setCustomDateDialogOpen(true)}
            >
              {customStartDate && customEndDate
                ? `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`
                : 'Set Dates'}
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => {
              // Export analytics data
              const data = {
                dateRange: { start, end },
                summary: {
                  income: {
                    count: filteredIncome.length,
                    total: filteredIncome.reduce((sum, t) => sum + (t.status === 'Received' ? t.amount : 0), 0),
                  },
                  expenses: {
                    count: filteredExpenses.length,
                    total: filteredExpenses.reduce((sum, t) => sum + (t.status === 'Paid' ? t.amount : 0), 0),
                  },
                  savings: {
                    count: filteredSavings.length,
                    total: filteredSavings.reduce((sum, t) => sum + (t.status === 'Completed' ? t.amount : 0), 0),
                  },
                },
                transactions: {
                  income: filteredIncome,
                  expenses: filteredExpenses,
                  savings: filteredSavings,
                },
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `analytics-${start}-to-${end}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export
          </Button>
        </Stack>
      </Box>

      <Dialog open={customDateDialogOpen} onClose={() => setCustomDateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Custom Date Range</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Start Date"
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomDateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCustomDateRange}
            variant="contained"
            disabled={!customStartDate || !customEndDate || customStartDate > customEndDate}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

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
            <IncomeVsExpenseChart incomeTransactions={filteredIncome} expenseTransactions={filteredExpenses} />
          </Stack>
        </Suspense>
      )}

      {activeTab === 1 && (
        <Suspense fallback={<ChartLoader />}>
          <Stack spacing={3}>
            <ExpenseBreakdownChart transactions={filteredExpenses} />
            <SpendingTrendsChart transactions={filteredExpenses} />
          </Stack>
        </Suspense>
      )}

      {activeTab === 2 && (
        <Suspense fallback={<ChartLoader />}>
          <Stack spacing={3}>
            <SavingsProgressChart transactions={filteredSavings} />
            <InvestmentPerformanceChart transactions={filteredSavings} />
            <SavingsRateChart incomeTransactions={filteredIncome} savingsTransactions={filteredSavings} />
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

