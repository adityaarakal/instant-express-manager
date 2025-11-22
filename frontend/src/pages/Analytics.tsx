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
  Menu,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { exportAnalyticsToExcel } from '../utils/excelExport';
import { EmptyState } from '../components/common/EmptyState';

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
const PieChart = lazy(() =>
  import('../components/analytics/PieChart').then((module) => ({ default: module.PieChart }))
);
const AreaChart = lazy(() =>
  import('../components/analytics/AreaChart').then((module) => ({ default: module.AreaChart }))
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dateRange, setDateRange] = useState<DateRange>('last12months');
  const [activeTab, setActiveTab] = useState(0);
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

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

  const hasNoData = filteredIncome.length === 0 && filteredExpenses.length === 0 && filteredSavings.length === 0;

  if (hasNoData) {
    return (
      <Stack spacing={3}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: 2 
          }}
        >
          <Typography variant="h4" sx={{ flexShrink: 0 }}>Analytics</Typography>
        </Box>
        <EmptyState
          icon={<TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />}
          title="No Analytics Data Available"
          description="Add transactions to see comprehensive analytics, charts, and insights about your financial data."
          actions={[
            {
              label: 'Add Transaction',
              onClick: () => {
                // Use window.location for external navigation to preserve base path
                const basePath = window.location.pathname.startsWith('/instant-express-manager') 
                  ? '/instant-express-manager' 
                  : '';
                window.location.href = `${basePath}/transactions`;
              },
            },
          ]}
          tips={[
            {
              text: 'Analytics automatically generates charts and insights from your transaction data.',
            },
            {
              text: 'Add income, expense, and savings transactions to see trends and patterns.',
            },
            {
              text: 'Use different date ranges to analyze your financial data over time.',
            },
          ]}
          quickStart={[
            'Add income and expense transactions',
            'Wait for transactions to be recorded',
            'Return to Analytics to see charts and insights',
            'Explore different date ranges and chart types',
          ]}
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: { xs: 'nowrap', sm: 'wrap' },
          gap: { xs: 1.5, sm: 2 },
          mb: { xs: 1, sm: 0 },
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            flexShrink: 0,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            fontWeight: 700,
          }}
        >
          Analytics
        </Typography>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1, sm: 1.5 }} 
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}
        >
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: { xs: '100%', sm: 200 },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
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
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: { xs: '60vh', sm: 'none' },
                    maxWidth: { xs: '90vw', sm: 'none' },
                  },
                },
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
              fullWidth={isMobile}
              sx={{
                minHeight: { xs: 44, sm: 40 },
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                px: { xs: 1.5, sm: 2 },
                whiteSpace: { xs: 'nowrap', sm: 'nowrap' },
              }}
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
            endIcon={<ArrowDropDownIcon />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            fullWidth={isMobile}
            sx={{
              minHeight: { xs: 44, sm: 40 },
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              px: { xs: 1.5, sm: 2 },
              whiteSpace: 'nowrap',
            }}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
            PaperProps={{
              sx: {
                maxWidth: { xs: '90vw', sm: 'none' },
              },
            }}
          >
            <MenuItem
              onClick={() => {
                setExportMenuAnchor(null);
                // Export analytics data as JSON
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
              Export as JSON
            </MenuItem>
            <MenuItem
              onClick={() => {
                setExportMenuAnchor(null);
                // Export analytics data as Excel
                exportAnalyticsToExcel({
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
                  income: filteredIncome,
                  expenses: filteredExpenses,
                  savings: filteredSavings,
                  dateRange: `${start} to ${end}`,
                });
              }}
            >
              Export as Excel (.xlsx)
            </MenuItem>
          </Menu>
        </Stack>
      </Box>

      <Dialog 
        open={customDateDialogOpen} 
        onClose={() => setCustomDateDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: '90vh' },
            width: { xs: '100%', sm: 'auto' },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            fontWeight: 700,
            pb: { xs: 1, sm: 2 },
          }}
        >
          Custom Date Range
        </DialogTitle>
        <DialogContent
          sx={{
            px: { xs: 2, sm: 3 },
            pb: { xs: 2, sm: 3 },
          }}
        >
          <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ mt: { xs: 0, sm: 1 } }}>
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
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            pb: { xs: 2, sm: 3 },
            gap: { xs: 1, sm: 1.5 },
            flexDirection: { xs: 'column-reverse', sm: 'row' },
          }}
        >
          <Button 
            onClick={() => setCustomDateDialogOpen(false)}
            fullWidth={isMobile}
            sx={{
              minHeight: { xs: 44, sm: 40 },
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              px: { xs: 1.5, sm: 2 },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCustomDateRange}
            variant="contained"
            disabled={!customStartDate || !customEndDate || customStartDate > customEndDate}
            fullWidth={isMobile}
            sx={{
              minHeight: { xs: 44, sm: 40 },
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              px: { xs: 1.5, sm: 2 },
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      <Paper elevation={1} sx={{ p: { xs: 1.5, sm: 2 } }}>
        {isMobile ? (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={activeTab}
                onChange={(e) => setActiveTab(Number(e.target.value))}
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  '& .MuiSelect-select': {
                    py: 1.5,
                  },
                }}
              >
                <MenuItem value={0}>Income</MenuItem>
                <MenuItem value={1}>Expenses</MenuItem>
                <MenuItem value={2}>Savings</MenuItem>
                <MenuItem value={3}>Credit Cards</MenuItem>
                <MenuItem value={4}>Budget vs Actual</MenuItem>
                <MenuItem value={5}>Advanced Charts</MenuItem>
              </Select>
            </FormControl>
          </Box>
        ) : (
          <Tabs 
            value={activeTab} 
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 72,
                fontSize: '0.875rem',
                px: 2,
                minWidth: 120,
              },
            }}
          >
            <Tab label="Income" />
            <Tab label="Expenses" />
            <Tab label="Savings" />
            <Tab label="Credit Cards" />
            <Tab label="Budget vs Actual" />
            <Tab label="Advanced Charts" />
          </Tabs>
        )}
      </Paper>

      {activeTab === 0 && (
        <Suspense fallback={<ChartLoader />}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <IncomeTrendsChart transactions={filteredIncome} />
            <IncomeVsExpenseChart incomeTransactions={filteredIncome} expenseTransactions={filteredExpenses} />
          </Stack>
        </Suspense>
      )}

      {activeTab === 1 && (
        <Suspense fallback={<ChartLoader />}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <ExpenseBreakdownChart transactions={filteredExpenses} />
            <SpendingTrendsChart transactions={filteredExpenses} />
            {(() => {
              // Prepare data for area chart (monthly expense trends)
              const monthlyData: Array<Record<string, string | number>> = [];
              const categoryTotals: Record<string, Record<string, number>> = {};
              
              filteredExpenses.forEach((t) => {
                if (t.status === 'Paid') {
                  const month = t.date.substring(0, 7);
                  if (!categoryTotals[month]) {
                    categoryTotals[month] = {};
                  }
                  categoryTotals[month][t.category] = (categoryTotals[month][t.category] || 0) + t.amount;
                }
              });

              const allCategories = Array.from(
                new Set(filteredExpenses.map((t) => t.category))
              );

              Object.keys(categoryTotals)
                .sort()
                .forEach((month) => {
                  const monthName = new Date(month + '-01').toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  });
                  const monthData: Record<string, string | number> = { month: monthName };
                  allCategories.forEach((category) => {
                    monthData[category] = categoryTotals[month][category] || 0;
                  });
                  monthlyData.push(monthData);
                });

              const areas = allCategories.slice(0, 5).map((category, index) => ({
                dataKey: category,
                name: category,
                color: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'][index % 5],
              }));

              return monthlyData.length > 0 ? (
                <AreaChart
                  data={monthlyData}
                  title="Expense Trends by Category (Area Chart)"
                  chartId="expense-area-chart"
                  xAxisKey="month"
                  areas={areas}
                />
              ) : null;
            })()}
          </Stack>
        </Suspense>
      )}

      {activeTab === 2 && (
        <Suspense fallback={<ChartLoader />}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <SavingsProgressChart transactions={filteredSavings} />
            <InvestmentPerformanceChart transactions={filteredSavings} />
            <SavingsRateChart incomeTransactions={filteredIncome} savingsTransactions={filteredSavings} />
          </Stack>
        </Suspense>
      )}

      {activeTab === 3 && (
        <Suspense fallback={<ChartLoader />}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <CreditCardAnalysisChart accounts={creditCards} transactions={filteredExpenses} />
          </Stack>
        </Suspense>
      )}

      {activeTab === 4 && (
        <Suspense fallback={<ChartLoader />}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <BudgetVsActualChart
              incomeTransactions={filteredIncome}
              expenseTransactions={filteredExpenses}
              savingsTransactions={filteredSavings}
            />
          </Stack>
        </Suspense>
      )}

      {activeTab === 5 && (
        <Suspense fallback={<ChartLoader />}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            {(() => {
              // Income by Category Pie Chart
              const incomeByCategory: Record<string, number> = {};
              filteredIncome.forEach((t) => {
                if (t.status === 'Received') {
                  incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
                }
              });
              const incomePieData = Object.entries(incomeByCategory)
                .map(([name, value]) => ({ name, value: Math.round(value) }))
                .sort((a, b) => b.value - a.value);

              // Expense by Category Pie Chart
              const expenseByCategory: Record<string, number> = {};
              filteredExpenses.forEach((t) => {
                if (t.status === 'Paid') {
                  expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
                }
              });
              const expensePieData = Object.entries(expenseByCategory)
                .map(([name, value]) => ({ name, value: Math.round(value) }))
                .sort((a, b) => b.value - a.value);

              // Savings by Type Pie Chart
              const savingsByType: Record<string, number> = {};
              filteredSavings.forEach((t) => {
                if (t.status === 'Completed') {
                  savingsByType[t.type] = (savingsByType[t.type] || 0) + t.amount;
                }
              });
              const savingsPieData = Object.entries(savingsByType)
                .map(([name, value]) => ({ name, value: Math.round(value) }))
                .sort((a, b) => b.value - a.value);

              return (
                <>
                  {incomePieData.length > 0 && (
                    <PieChart
                      data={incomePieData}
                      title="Income by Category"
                      chartId="income-pie-chart"
                      showExport={true}
                    />
                  )}
                  {expensePieData.length > 0 && (
                    <PieChart
                      data={expensePieData}
                      title="Expenses by Category"
                      chartId="expense-pie-chart"
                      showExport={true}
                    />
                  )}
                  {savingsPieData.length > 0 && (
                    <PieChart
                      data={savingsPieData}
                      title="Savings by Type"
                      chartId="savings-pie-chart"
                      showExport={true}
                    />
                  )}
                  {(() => {
                    // Income vs Expense Area Chart
                    const monthlyData: Array<{ month: string; income: number; expenses: number }> = [];
                    const dataMap: Record<string, { income: number; expenses: number }> = {};

                    filteredIncome.forEach((t) => {
                      if (t.status === 'Received') {
                        const month = t.date.substring(0, 7);
                        if (!dataMap[month]) {
                          dataMap[month] = { income: 0, expenses: 0 };
                        }
                        dataMap[month].income += t.amount;
                      }
                    });

                    filteredExpenses.forEach((t) => {
                      if (t.status === 'Paid') {
                        const month = t.date.substring(0, 7);
                        if (!dataMap[month]) {
                          dataMap[month] = { income: 0, expenses: 0 };
                        }
                        dataMap[month].expenses += t.amount;
                      }
                    });

                    Object.keys(dataMap)
                      .sort()
                      .forEach((month) => {
                        const monthName = new Date(month + '-01').toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        });
                        monthlyData.push({
                          month: monthName,
                          income: dataMap[month].income,
                          expenses: dataMap[month].expenses,
                        });
                      });

                    return monthlyData.length > 0 ? (
                      <AreaChart
                        data={monthlyData}
                        title="Income vs Expenses Trend (Area Chart)"
                        chartId="income-expense-area-chart"
                        xAxisKey="month"
                        areas={[
                          { dataKey: 'income', name: 'Income', color: '#82ca9d' },
                          { dataKey: 'expenses', name: 'Expenses', color: '#ff8042' },
                        ]}
                        showExport={true}
                      />
                    ) : null;
                  })()}
                </>
              );
            })()}
          </Stack>
        </Suspense>
      )}
    </Stack>
  );
});

