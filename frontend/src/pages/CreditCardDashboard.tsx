import { useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentIcon from '@mui/icons-material/Payment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useBanksStore } from '../store/useBanksStore';
import { EmptyState } from '../components/common/EmptyState';
import { CreditCardAnalysisChart } from '../components/analytics/CreditCardAnalysisChart';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getDaysUntilDue = (dueDate: string | null | undefined): number | null => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const CreditCardDashboard = memo(function CreditCardDashboard() {
  const navigate = useNavigate();
  const accounts = useBankAccountsStore((state) => state.accounts);
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const banks = useBanksStore((state) => state.banks);

  const creditCards = useMemo(
    () => accounts.filter((acc) => acc.accountType === 'CreditCard'),
    [accounts],
  );

  // Get bank name for each card
  const getBankName = (bankId: string): string => {
    const bank = banks.find((b) => b.id === bankId);
    return bank?.name || 'Unknown Bank';
  };

  // Calculate card statistics
  const cardStats = useMemo(() => {
    return creditCards.map((card) => {
      const cardTransactions = expenseTransactions.filter((t) => t.accountId === card.id);
      const paidTransactions = cardTransactions.filter((t) => t.status === 'Paid');
      const pendingTransactions = cardTransactions.filter((t) => t.status === 'Pending');

      const totalSpent = paidTransactions.reduce((sum, t) => sum + t.amount, 0);
      const pendingAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);
      const utilization = card.creditLimit
        ? (card.currentBalance / card.creditLimit) * 100
        : 0;

      const daysUntilDue = getDaysUntilDue(card.dueDate);
      const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
      const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7;

      // Get recent payment history (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentPayments = paidTransactions
        .filter((t) => new Date(t.date) >= sixMonthsAgo)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      return {
        card,
        totalSpent,
        pendingAmount,
        utilization,
        daysUntilDue,
        isOverdue,
        isDueSoon,
        recentPayments,
        transactionCount: cardTransactions.length,
      };
    });
  }, [creditCards, expenseTransactions]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalOutstanding = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
    const totalLimit = creditCards.reduce((sum, card) => sum + (card.creditLimit || 0), 0);
    const totalAvailable = totalLimit - totalOutstanding;
    const overallUtilization = totalLimit > 0 ? (totalOutstanding / totalLimit) * 100 : 0;

    const overdueCards = cardStats.filter((stat) => stat.isOverdue).length;
    const dueSoonCards = cardStats.filter((stat) => stat.isDueSoon && !stat.isOverdue).length;

    return {
      totalOutstanding,
      totalLimit,
      totalAvailable,
      overallUtilization,
      overdueCards,
      dueSoonCards,
      totalCards: creditCards.length,
    };
  }, [creditCards, cardStats]);

  if (creditCards.length === 0) {
    return (
      <Stack spacing={3}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          <Typography variant="h4" sx={{ flexShrink: 0 }}>Credit Card Dashboard</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/accounts')}
            sx={{ flexShrink: 0 }}
          >
            Add Credit Card
          </Button>
        </Box>
        <EmptyState
          icon={<CreditCardIcon sx={{ fontSize: 48 }} />}
          title="No Credit Cards"
          description="You haven't added any credit cards yet. Add a credit card account to start tracking your credit card expenses and payments."
          action={{
            label: 'Add Credit Card',
            onClick: () => navigate('/accounts'),
            icon: <AddIcon />,
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: { xs: 'nowrap', sm: 'wrap' },
          gap: 2,
        }}
      >
        <Typography variant="h4" sx={{ flexShrink: 0 }}>Credit Card Dashboard</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => navigate('/accounts')}
          sx={{ flexShrink: 0 }}
        >
          Add Credit Card
        </Button>
      </Box>

      {/* Overall Statistics */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Outstanding
              </Typography>
              <Typography variant="h5" color="error">
                {formatCurrency(overallStats.totalOutstanding)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Across {overallStats.totalCards} card{overallStats.totalCards !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Credit Limit
              </Typography>
              <Typography variant="h5">
                {formatCurrency(overallStats.totalLimit)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Available: {formatCurrency(overallStats.totalAvailable)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Overall Utilization
              </Typography>
              <Typography
                variant="h5"
                color={
                  overallStats.overallUtilization > 80
                    ? 'error'
                    : overallStats.overallUtilization > 50
                      ? 'warning.main'
                      : 'success.main'
                }
              >
                {overallStats.overallUtilization.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {overallStats.overallUtilization > 80
                  ? 'High utilization'
                  : overallStats.overallUtilization > 50
                    ? 'Moderate utilization'
                    : 'Low utilization'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Payment Status
              </Typography>
              <Typography variant="h5" color={overallStats.overdueCards > 0 ? 'error' : overallStats.dueSoonCards > 0 ? 'warning.main' : 'success.main'}>
                {overallStats.overdueCards > 0
                  ? `${overallStats.overdueCards} Overdue`
                  : overallStats.dueSoonCards > 0
                    ? `${overallStats.dueSoonCards} Due Soon`
                    : 'All Paid'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {overallStats.overdueCards > 0
                  ? 'Action required'
                  : overallStats.dueSoonCards > 0
                    ? 'Upcoming payments'
                    : 'No pending payments'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Alerts for overdue/due soon */}
      {overallStats.overdueCards > 0 && (
        <Alert severity="error">
          <AlertTitle>Overdue Payments</AlertTitle>
          You have {overallStats.overdueCards} credit card{overallStats.overdueCards !== 1 ? 's' : ''} with overdue payments. Please make payments immediately to avoid penalties.
        </Alert>
      )}
      {overallStats.overdueCards === 0 && overallStats.dueSoonCards > 0 && (
        <Alert severity="warning">
          <AlertTitle>Upcoming Due Dates</AlertTitle>
          You have {overallStats.dueSoonCards} credit card{overallStats.dueSoonCards !== 1 ? 's' : ''} with payments due within the next 7 days.
        </Alert>
      )}

      {/* Credit Cards List */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Credit Cards
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Card Name</TableCell>
                <TableCell>Bank</TableCell>
                <TableCell align="right">Outstanding</TableCell>
                <TableCell align="right">Credit Limit</TableCell>
                <TableCell align="right">Utilization</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cardStats.map((stat) => (
                <TableRow key={stat.card.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {stat.card.name}
                    </Typography>
                    {stat.card.accountNumber && (
                      <Typography variant="caption" color="text.secondary">
                        ****{stat.card.accountNumber.slice(-4)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{getBankName(stat.card.bankId)}</TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={stat.card.currentBalance > 0 ? 'error' : 'text.primary'}
                      fontWeight="medium"
                    >
                      {formatCurrency(stat.card.currentBalance)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(stat.card.creditLimit || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${stat.utilization.toFixed(1)}%`}
                      size="small"
                      color={
                        stat.utilization > 80
                          ? 'error'
                          : stat.utilization > 50
                            ? 'warning'
                            : 'success'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {stat.card.dueDate ? (
                      <Box>
                        <Typography variant="body2">{formatDate(stat.card.dueDate)}</Typography>
                        {stat.daysUntilDue !== null && (
                          <Typography
                            variant="caption"
                            color={
                              stat.isOverdue
                                ? 'error'
                                : stat.isDueSoon
                                  ? 'warning.main'
                                  : 'text.secondary'
                            }
                          >
                            {stat.isOverdue
                              ? `${Math.abs(stat.daysUntilDue)} days overdue`
                              : stat.isDueSoon
                                ? `${stat.daysUntilDue} days left`
                                : `${stat.daysUntilDue} days remaining`}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not set
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {stat.isOverdue ? (
                      <Chip label="Overdue" color="error" size="small" icon={<WarningIcon />} />
                    ) : stat.isDueSoon ? (
                      <Chip label="Due Soon" color="warning" size="small" />
                    ) : (
                      <Chip label="Current" color="success" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Transactions">
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigate('/transactions', { state: { accountId: stat.card.id } });
                        }}
                        aria-label="View transactions"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Record Payment">
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigate('/transactions', {
                            state: { accountId: stat.card.id, action: 'addPayment' },
                          });
                        }}
                        aria-label="Record payment"
                      >
                        <PaymentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Payment History for Cards */}
      {cardStats
        .filter((stat) => stat.recentPayments.length > 0)
        .slice(0, 1)
        .map((stat) => (
          <Paper key={stat.card.id} elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Payment History - {stat.card.name}
            </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stat.recentPayments.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.date)}</TableCell>
                    <TableCell>{tx.description || 'Payment'}</TableCell>
                    <TableCell align="right">{formatCurrency(tx.amount)}</TableCell>
                    <TableCell>
                      <Chip label={tx.status} color="success" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </Paper>
        ))}

      {/* Credit Card Analytics Chart */}
      <CreditCardAnalysisChart accounts={creditCards} transactions={expenseTransactions} />

      {/* Due Date Calendar View */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CalendarTodayIcon color="primary" />
          <Typography variant="h6">Upcoming Due Dates</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
          {cardStats
            .filter((stat) => stat.card.dueDate)
            .sort((a, b) => {
              const aDays = a.daysUntilDue ?? 999;
              const bDays = b.daysUntilDue ?? 999;
              return aDays - bDays;
            })
            .map((stat) => (
              <Box key={stat.card.id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' } }}>
                <Card
                  variant="outlined"
                  sx={{
                    borderColor:
                      stat.isOverdue
                        ? 'error.main'
                        : stat.isDueSoon
                          ? 'warning.main'
                          : 'divider',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {stat.card.name}
                      </Typography>
                      {stat.isOverdue ? (
                        <Chip label="Overdue" color="error" size="small" />
                      ) : stat.isDueSoon ? (
                        <Chip label="Due Soon" color="warning" size="small" />
                      ) : null}
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Due Date: {formatDate(stat.card.dueDate)}
                    </Typography>
                    <Typography variant="h6" color={stat.isOverdue ? 'error' : 'text.primary'}>
                      {formatCurrency(stat.card.currentBalance)}
                    </Typography>
                    {stat.daysUntilDue !== null && (
                      <Typography
                        variant="caption"
                        color={
                          stat.isOverdue
                            ? 'error'
                            : stat.isDueSoon
                              ? 'warning.main'
                              : 'text.secondary'
                        }
                      >
                        {stat.isOverdue
                          ? `${Math.abs(stat.daysUntilDue)} days overdue`
                          : `${stat.daysUntilDue} days remaining`}
                      </Typography>
                    )}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PaymentIcon />}
                        onClick={() => {
                          navigate('/transactions', {
                            state: { accountId: stat.card.id, action: 'addPayment' },
                          });
                        }}
                      >
                        Pay Now
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => {
                          navigate('/transactions', { state: { accountId: stat.card.id } });
                        }}
                      >
                        View
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
        </Stack>
        {cardStats.filter((stat) => stat.card.dueDate).length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No due dates set for credit cards. Add due dates in account settings.
            </Typography>
          </Box>
        )}
      </Paper>
    </Stack>
  );
});

