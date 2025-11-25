import { useMemo, useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Stack,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import { useIncomeTransactionsStore } from '../../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../../store/useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from '../../store/useBankAccountsStore';
import { useBanksStore } from '../../store/useBanksStore';
import { calculateDashboardMetrics } from '../../utils/dashboard';

export type ReportType = 'monthly-summary' | 'income-breakdown' | 'expense-breakdown' | 'savings-summary' | 'account-balances' | 'full-report';

interface PrintSummaryReportsProps {
  open: boolean;
  onClose: () => void;
  selectedMonthId?: string;
}

export function PrintSummaryReports({ open, onClose, selectedMonthId }: PrintSummaryReportsProps) {
  const [reportType, setReportType] = useState<ReportType>('monthly-summary');
  const previewRef = useRef<HTMLDivElement>(null);

  const incomeTransactions = useIncomeTransactionsStore((state) => state.transactions);
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const savingsTransactions = useSavingsInvestmentTransactionsStore((state) => state.transactions);
  const accounts = useBankAccountsStore((state) => state.accounts);
  const banks = useBanksStore((state) => state.banks);

  // Get current month if not provided
  const getCurrentMonthId = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const monthId = selectedMonthId || getCurrentMonthId();

  const formatMonthDate = (monthId: string): string => {
    const [year, month] = monthId.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat('en-IN', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Filter transactions by month
  const monthTransactions = useMemo(() => {
    const [year, month] = monthId.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    return {
      income: incomeTransactions.filter(
        (t) => t.status === 'Received' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd
      ),
      expenses: expenseTransactions.filter(
        (t) => t.status === 'Paid' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd
      ),
      savings: savingsTransactions.filter(
        (t) => t.status === 'Completed' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd
      ),
    };
  }, [incomeTransactions, expenseTransactions, savingsTransactions, monthId]);

  const metrics = useMemo(() => {
    return calculateDashboardMetrics(
      monthTransactions.income,
      monthTransactions.expenses,
      monthTransactions.savings,
      accounts,
      monthId,
    );
  }, [monthTransactions, accounts, monthId]);

  const bankBalanceMetrics = useMemo(() => {
    let totalBalance = 0;
    let totalOutstanding = 0;
    let totalCreditLimit = 0;

    accounts.forEach((account) => {
      if (account.accountType === 'CreditCard') {
        const availableCredit = (account.creditLimit || 0) - (account.outstandingBalance || 0);
        totalBalance += availableCredit;
        totalOutstanding += account.outstandingBalance || 0;
        totalCreditLimit += account.creditLimit || 0;
      } else {
        totalBalance += account.currentBalance;
      }
    });

    return { totalBalance, totalOutstanding, totalCreditLimit };
  }, [accounts]);

  // Income breakdown by category
  const incomeByCategory = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    monthTransactions.income.forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    return Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthTransactions.income]);

  // Expense breakdown by category
  const expenseByCategory = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    monthTransactions.expenses.forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    return Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthTransactions.expenses]);

  // Expense breakdown by bucket
  const expenseByBucket = useMemo(() => {
    const bucketMap: Record<string, number> = {};
    monthTransactions.expenses.forEach((t) => {
      bucketMap[t.bucket] = (bucketMap[t.bucket] || 0) + t.amount;
    });
    return Object.entries(bucketMap)
      .map(([bucket, amount]) => ({ bucket, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthTransactions.expenses]);

  // Savings breakdown by destination
  const savingsByDestination = useMemo(() => {
    const destinationMap: Record<string, number> = {};
    monthTransactions.savings.forEach((t) => {
      destinationMap[t.destination] = (destinationMap[t.destination] || 0) + t.amount;
    });
    return Object.entries(destinationMap)
      .map(([destination, amount]) => ({ destination, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthTransactions.savings]);

  const handlePrint = () => {
    if (!previewRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to use print preview');
      return;
    }

    const content = previewRef.current.innerHTML;
    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportType} - ${formatMonthDate(monthId)}</title>
          <style>
            ${styles}
            @media print {
              body { margin: 0; padding: 16px; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 250);
    };
  };

  const renderReport = () => {
    switch (reportType) {
      case 'monthly-summary':
        return (
          <Box>
            <div className="print-header">
              <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
                Monthly Summary Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatMonthDate(monthId)}
              </Typography>
              <Typography variant="caption" className="print-metadata">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </Typography>
            </div>

            <Stack spacing={2} sx={{ mt: 3 }}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Financial Overview</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Total Income</strong></TableCell>
                        <TableCell align="right">{formatCurrency(metrics.totalIncome)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Total Expenses</strong></TableCell>
                        <TableCell align="right">{formatCurrency(metrics.totalExpenses)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Total Savings</strong></TableCell>
                        <TableCell align="right">{formatCurrency(metrics.totalSavings)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Net Savings</strong></TableCell>
                        <TableCell align="right">{formatCurrency(metrics.monthlyIncome - metrics.monthlyExpenses - metrics.monthlySavings)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Savings Rate</strong></TableCell>
                        <TableCell align="right">
                          {metrics.totalIncome > 0
                            ? `${((metrics.totalSavings / metrics.totalIncome) * 100).toFixed(1)}%`
                            : '0%'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Account Balances</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Total Available Balance</strong></TableCell>
                        <TableCell align="right">{formatCurrency(bankBalanceMetrics.totalBalance)}</TableCell>
                      </TableRow>
                      {bankBalanceMetrics.totalOutstanding > 0 && (
                        <>
                          <TableRow>
                            <TableCell><strong>Credit Card Outstanding</strong></TableCell>
                            <TableCell align="right">{formatCurrency(bankBalanceMetrics.totalOutstanding)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Total Credit Limit</strong></TableCell>
                            <TableCell align="right">{formatCurrency(bankBalanceMetrics.totalCreditLimit)}</TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Stack>

            <div className="print-footer">
              <Typography variant="caption">
                Instant Express Manager - Monthly Summary Report
              </Typography>
            </div>
          </Box>
        );

      case 'income-breakdown':
        return (
          <Box>
            <div className="print-header">
              <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
                Income Breakdown Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatMonthDate(monthId)}
              </Typography>
              <Typography variant="caption" className="print-metadata">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </Typography>
            </div>

            <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Income by Category - Total: {formatCurrency(metrics.totalIncome)}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell align="right"><strong>Amount</strong></TableCell>
                      <TableCell align="right"><strong>Percentage</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {incomeByCategory.map((item) => (
                      <TableRow key={item.category}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                        <TableCell align="right">
                          {metrics.totalIncome > 0
                            ? `${((item.amount / metrics.totalIncome) * 100).toFixed(1)}%`
                            : '0%'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <div className="print-footer">
              <Typography variant="caption">
                Instant Express Manager - Income Breakdown Report
              </Typography>
            </div>
          </Box>
        );

      case 'expense-breakdown':
        return (
          <Box>
            <div className="print-header">
              <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
                Expense Breakdown Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatMonthDate(monthId)}
              </Typography>
              <Typography variant="caption" className="print-metadata">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </Typography>
            </div>

            <Stack spacing={2} sx={{ mt: 3 }}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Expenses by Category - Total: {formatCurrency(metrics.totalExpenses)}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Category</strong></TableCell>
                        <TableCell align="right"><strong>Amount</strong></TableCell>
                        <TableCell align="right"><strong>Percentage</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenseByCategory.map((item) => (
                        <TableRow key={item.category}>
                          <TableCell>{item.category}</TableCell>
                          <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                          <TableCell align="right">
                            {metrics.totalExpenses > 0
                              ? `${((item.amount / metrics.totalExpenses) * 100).toFixed(1)}%`
                              : '0%'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Expenses by Bucket - Total: {formatCurrency(metrics.totalExpenses)}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Bucket</strong></TableCell>
                        <TableCell align="right"><strong>Amount</strong></TableCell>
                        <TableCell align="right"><strong>Percentage</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenseByBucket.map((item) => (
                        <TableRow key={item.bucket}>
                          <TableCell>{item.bucket}</TableCell>
                          <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                          <TableCell align="right">
                            {metrics.totalExpenses > 0
                              ? `${((item.amount / metrics.totalExpenses) * 100).toFixed(1)}%`
                              : '0%'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Stack>

            <div className="print-footer">
              <Typography variant="caption">
                Instant Express Manager - Expense Breakdown Report
              </Typography>
            </div>
          </Box>
        );

      case 'savings-summary':
        return (
          <Box>
            <div className="print-header">
              <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
                Savings Summary Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatMonthDate(monthId)}
              </Typography>
              <Typography variant="caption" className="print-metadata">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </Typography>
            </div>

            <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Savings by Destination - Total: {formatCurrency(metrics.totalSavings)}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Destination</strong></TableCell>
                      <TableCell align="right"><strong>Amount</strong></TableCell>
                      <TableCell align="right"><strong>Percentage</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {savingsByDestination.map((item) => (
                      <TableRow key={item.destination}>
                        <TableCell>{item.destination}</TableCell>
                        <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                        <TableCell align="right">
                          {metrics.totalSavings > 0
                            ? `${((item.amount / metrics.totalSavings) * 100).toFixed(1)}%`
                            : '0%'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <div className="print-footer">
              <Typography variant="caption">
                Instant Express Manager - Savings Summary Report
              </Typography>
            </div>
          </Box>
        );

      case 'account-balances':
        return (
          <Box>
            <div className="print-header">
              <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
                Account Balances Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As of {new Date().toLocaleDateString()}
              </Typography>
              <Typography variant="caption" className="print-metadata">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </Typography>
            </div>

            <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>All Accounts</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Account Name</strong></TableCell>
                      <TableCell><strong>Bank</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell align="right"><strong>Balance</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accounts.map((account) => {
                      const bank = banks.find((b) => b.id === account.bankId);
                      return (
                        <TableRow key={account.id}>
                          <TableCell>{account.name}</TableCell>
                          <TableCell>{bank?.name || 'N/A'}</TableCell>
                          <TableCell>{account.accountType}</TableCell>
                          <TableCell align="right">
                            {account.accountType === 'CreditCard'
                              ? formatCurrency((account.creditLimit || 0) - (account.outstandingBalance || 0))
                              : formatCurrency(account.currentBalance)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Total Available Balance</strong></TableCell>
                      <TableCell align="right">{formatCurrency(bankBalanceMetrics.totalBalance)}</TableCell>
                    </TableRow>
                    {bankBalanceMetrics.totalOutstanding > 0 && (
                      <>
                        <TableRow>
                          <TableCell><strong>Credit Card Outstanding</strong></TableCell>
                          <TableCell align="right">{formatCurrency(bankBalanceMetrics.totalOutstanding)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Total Credit Limit</strong></TableCell>
                          <TableCell align="right">{formatCurrency(bankBalanceMetrics.totalCreditLimit)}</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <div className="print-footer">
              <Typography variant="caption">
                Instant Express Manager - Account Balances Report
              </Typography>
            </div>
          </Box>
        );

      case 'full-report':
        return (
          <Box>
            <div className="print-header">
              <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
                Complete Financial Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatMonthDate(monthId)}
              </Typography>
              <Typography variant="caption" className="print-metadata">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </Typography>
            </div>

            <Stack spacing={2} sx={{ mt: 3 }}>
              {/* Financial Overview */}
              <Paper elevation={1} sx={{ p: 2 }} className="print-summary">
                <Typography variant="h6" sx={{ mb: 2 }}>Financial Overview</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Total Income</strong></TableCell>
                        <TableCell align="right">{formatCurrency(metrics.totalIncome)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Total Expenses</strong></TableCell>
                        <TableCell align="right">{formatCurrency(metrics.totalExpenses)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Total Savings</strong></TableCell>
                        <TableCell align="right">{formatCurrency(metrics.totalSavings)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Net Savings</strong></TableCell>
                        <TableCell align="right">{formatCurrency(metrics.monthlyIncome - metrics.monthlyExpenses - metrics.monthlySavings)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Savings Rate</strong></TableCell>
                        <TableCell align="right">
                          {metrics.totalIncome > 0
                            ? `${((metrics.totalSavings / metrics.totalIncome) * 100).toFixed(1)}%`
                            : '0%'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Income Breakdown */}
              {incomeByCategory.length > 0 && (
                <Paper elevation={1} sx={{ p: 2 }} className="print-summary">
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Income by Category
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Category</strong></TableCell>
                          <TableCell align="right"><strong>Amount</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {incomeByCategory.map((item) => (
                          <TableRow key={item.category}>
                            <TableCell>{item.category}</TableCell>
                            <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Expense Breakdown */}
              {expenseByCategory.length > 0 && (
                <Paper elevation={1} sx={{ p: 2 }} className="print-summary">
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Expenses by Category
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Category</strong></TableCell>
                          <TableCell align="right"><strong>Amount</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expenseByCategory.map((item) => (
                          <TableRow key={item.category}>
                            <TableCell>{item.category}</TableCell>
                            <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Savings Breakdown */}
              {savingsByDestination.length > 0 && (
                <Paper elevation={1} sx={{ p: 2 }} className="print-summary">
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Savings by Destination
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Destination</strong></TableCell>
                          <TableCell align="right"><strong>Amount</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {savingsByDestination.map((item) => (
                          <TableRow key={item.destination}>
                            <TableCell>{item.destination}</TableCell>
                            <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Account Balances */}
              <Paper elevation={1} sx={{ p: 2 }} className="print-summary">
                <Typography variant="h6" sx={{ mb: 2 }}>Account Balances</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Total Available Balance</strong></TableCell>
                        <TableCell align="right">{formatCurrency(bankBalanceMetrics.totalBalance)}</TableCell>
                      </TableRow>
                      {bankBalanceMetrics.totalOutstanding > 0 && (
                        <>
                          <TableRow>
                            <TableCell><strong>Credit Card Outstanding</strong></TableCell>
                            <TableCell align="right">{formatCurrency(bankBalanceMetrics.totalOutstanding)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Total Credit Limit</strong></TableCell>
                            <TableCell align="right">{formatCurrency(bankBalanceMetrics.totalCreditLimit)}</TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Stack>

            <div className="print-footer">
              <Typography variant="caption">
                Instant Express Manager - Complete Financial Report
              </Typography>
            </div>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Print Summary Reports</span>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              label="Report Type"
            >
              <MenuItem value="monthly-summary">Monthly Summary</MenuItem>
              <MenuItem value="income-breakdown">Income Breakdown</MenuItem>
              <MenuItem value="expense-breakdown">Expense Breakdown</MenuItem>
              <MenuItem value="savings-summary">Savings Summary</MenuItem>
              <MenuItem value="account-balances">Account Balances</MenuItem>
              <MenuItem value="full-report">Full Report</MenuItem>
            </Select>
          </FormControl>

          <Box
            ref={previewRef}
            sx={{
              backgroundColor: 'white',
              color: 'black',
              p: 2,
              minHeight: '400px',
              '@media print': {
                backgroundColor: 'white',
                color: 'black',
              },
            }}
          >
            {renderReport()}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}

