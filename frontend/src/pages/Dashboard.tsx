import { useMemo, memo, lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Stack, Box, CircularProgress, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Divider, Button, IconButton } from '@mui/material';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import SavingsIcon from '@mui/icons-material/Savings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { calculateDashboardMetrics } from '../utils/dashboard';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { DueSoonReminders } from '../components/dashboard/DueSoonReminders';
import { WidgetSettings } from '../components/dashboard/WidgetSettings';
import { useDashboardWidgetsStore } from '../store/useDashboardWidgetsStore';
import { PrintPreview } from '../components/common/PrintPreview';
import { PrintSummaryReports } from '../components/common/PrintSummaryReports';

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
        minHeight: { xs: '250px', sm: '300px', md: '350px' },
        width: '100%',
      }}
    >
      <CircularProgress size={40} />
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
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printReportsOpen, setPrintReportsOpen] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);
  
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

  const handlePrintPreview = () => {
    setPrintPreviewOpen(true);
  };

  const handlePrintReports = () => {
    setPrintReportsOpen(true);
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

  // Calculate total bank balances
  const bankBalanceMetrics = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => {
      if (acc.accountType === 'CreditCard') {
        // For credit cards, show available credit (limit - outstanding)
        return sum + (acc.creditLimit || 0) - (acc.outstandingBalance || 0);
      }
      return sum + acc.currentBalance;
    }, 0);
    
    const totalOutstanding = accounts
      .filter(acc => acc.accountType === 'CreditCard')
      .reduce((sum, acc) => sum + (acc.outstandingBalance || 0), 0);
    
    const totalCreditLimit = accounts
      .filter(acc => acc.accountType === 'CreditCard')
      .reduce((sum, acc) => sum + (acc.creditLimit || 0), 0);

    return { totalBalance, totalOutstanding, totalCreditLimit };
  }, [accounts]);

  return (
    <Stack 
      spacing={{ xs: 2, sm: 2.5, md: 3 }}
      sx={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Box 
        className="no-print" 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          flexWrap: 'wrap', 
          gap: { xs: 1.5, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            flexShrink: 0,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            fontWeight: 600,
          }}
        >
          Dashboard
        </Typography>
        <Stack 
          direction="row" 
          spacing={{ xs: 1, sm: 1.5 }} 
          alignItems="center" 
          sx={{ 
            flexShrink: 0,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <IconButton
            onClick={() => setWidgetSettingsOpen(true)}
            aria-label="Widget settings"
            size="medium"
            sx={{
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={handlePrintReports}
            size="medium"
            aria-label="Print summary reports"
            sx={{
              minHeight: 44,
              flex: { xs: 1, sm: 'none' },
            }}
          >
            Reports
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrintPreview}
            size="medium"
            aria-label="Print preview"
            sx={{
              minHeight: 44,
              flex: { xs: 1, sm: 'none' },
            }}
          >
            Preview
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            size="medium"
            aria-label="Print dashboard"
            sx={{
              minHeight: 44,
              flex: { xs: 1, sm: 'none' },
            }}
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
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          borderRadius: 2,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1.5, sm: 2 }} 
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{
            width: '100%',
            maxWidth: '100%',
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 1.5 }, 
              flexShrink: 0,
              width: { xs: '100%', sm: 'auto' },
              minWidth: 0,
              maxWidth: { xs: '100%', sm: 'none' },
            }}
          >
            <CalendarMonthIcon 
              color="primary" 
              sx={{ 
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                flexShrink: 0,
              }} 
            />
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 0,
                width: { xs: '100%', sm: 200 },
                flex: { xs: 1, sm: 'none' },
                maxWidth: { xs: '100%', sm: 200 },
              }}
            >
              <InputLabel>Select Month</InputLabel>
              <Select
                value={selectedMonthId}
                label="Select Month"
                onChange={(e) => setSelectedMonthId(e.target.value)}
                sx={{
                  width: '100%',
                  maxWidth: '100%',
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxWidth: { xs: '90vw', sm: 'none' },
                      maxHeight: { xs: '60vh', sm: 'none' },
                    },
                  },
                }}
              >
                {availableMonths.map((month) => (
                  <MenuItem 
                    key={month.id} 
                    value={month.id}
                    sx={{
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              alignSelf: { xs: 'flex-start', sm: 'center' },
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              width: { xs: '100%', sm: 'auto' },
              minWidth: 0,
            }}
          >
            Viewing metrics for: <strong>{formatMonthDate(selectedMonthId)}</strong>
          </Typography>
        </Stack>
      </Paper>

      {/* Consolidated Bank Balance Section */}
      <Box>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: { xs: 1.5, sm: 2 }, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          <AccountBalanceIcon fontSize="small" />
          Consolidated Bank Balance
        </Typography>
        <Paper 
          elevation={2} 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderRadius: 2,
            background: (theme) => 
              theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(20, 184, 166, 0.05) 100%)',
            border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Total Available Balance (All Banks)
            </Typography>
            <Typography 
              variant="h4" 
              color="primary.main"
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
              }}
            >
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(bankBalanceMetrics.totalBalance)}
            </Typography>
            {bankBalanceMetrics.totalOutstanding > 0 && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Credit Card Outstanding: <strong style={{ color: 'inherit' }}>{new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(bankBalanceMetrics.totalOutstanding)}</strong>
                </Typography>
                {bankBalanceMetrics.totalCreditLimit > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Total Credit Limit: <strong style={{ color: 'inherit' }}>{new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(bankBalanceMetrics.totalCreditLimit)}</strong>
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        </Paper>
      </Box>

      <Divider />

      {/* Monthly Metrics Section - Summary Cards Widget */}
      {enabledWidgets.some((w) => w.id === 'summary-cards') && (
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: { xs: 1.5, sm: 2 }, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}
          >
            <CalendarMonthIcon fontSize="small" />
            Monthly Metrics - {formatMonthDate(selectedMonthId)}
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'column', md: 'row' }}
            spacing={{ xs: 2, sm: 2.5, md: 3 }}
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
        <Typography 
          variant="h6" 
          sx={{ 
            mb: { xs: 1.5, sm: 2 }, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          <TrendingUpIcon fontSize="small" />
          Overall Metrics (All Time)
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'column', md: 'row' }}
          spacing={{ xs: 2, sm: 2.5, md: 3 }}
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
          Generated by Instant Express Manager | {new Date().toLocaleDateString('en-IN')} | Page {window.location.pathname.replace('/instant-express-manager', '') || '/'}
        </Typography>
      </Box>
      
      <WidgetSettings open={widgetSettingsOpen} onClose={() => setWidgetSettingsOpen(false)} />

      {/* Print Preview Dialog */}
      <PrintPreview
        open={printPreviewOpen}
        onClose={() => setPrintPreviewOpen(false)}
        title={`Print Preview - Dashboard - ${formatMonthDate(selectedMonthId)}`}
      >
        <div ref={printContentRef}>
          <div className="print-header">
            <Typography variant="h4" component="h1">
              Financial Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Month: {formatMonthDate(selectedMonthId)}
            </Typography>
            <Typography variant="caption" className="print-metadata">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </Typography>
          </div>
          {/* Dashboard content will be printed as-is */}
          <div className="print-only" style={{ display: 'block' }}>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Financial Overview</Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="body2" color="text.secondary">Total Income</Typography>
                    <Typography variant="h6" color="success.main">{new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(metrics.totalIncome)}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="body2" color="text.secondary">Total Expenses</Typography>
                    <Typography variant="h6" color="error.main">{new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(metrics.totalExpenses)}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="body2" color="text.secondary">Total Savings</Typography>
                    <Typography variant="h6" color="success.main">{new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(metrics.totalSavings)}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="body2" color="text.secondary">Net Savings</Typography>
                    <Typography variant="h6" color={(metrics.monthlyIncome - metrics.monthlyExpenses - metrics.monthlySavings) >= 0 ? 'success.main' : 'error.main'}>
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(metrics.monthlyIncome - metrics.monthlyExpenses - metrics.monthlySavings)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Account Balances</Typography>
                <Typography variant="body1">
                  Total Available Balance: <strong>{new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(bankBalanceMetrics.totalBalance)}</strong>
                </Typography>
                {bankBalanceMetrics.totalOutstanding > 0 && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Credit Card Outstanding: {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(bankBalanceMetrics.totalOutstanding)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Credit Limit: {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(bankBalanceMetrics.totalCreditLimit)}
                    </Typography>
                  </>
                )}
              </Paper>
            </Stack>
          </div>
          <div className="print-footer">
            <Typography variant="caption">
              Instant Express Manager - Dashboard Report
            </Typography>
          </div>
        </div>
      </PrintPreview>

      {/* Print Summary Reports Dialog */}
      <PrintSummaryReports
        open={printReportsOpen}
        onClose={() => setPrintReportsOpen(false)}
        selectedMonthId={selectedMonthId}
      />
    </Stack>
  );
});
