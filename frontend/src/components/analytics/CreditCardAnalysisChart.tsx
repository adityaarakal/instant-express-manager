import { useMemo } from 'react';
import { Paper, Typography, Box, Stack, Chip } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { BankAccount } from '../../types/bankAccounts';
import type { ExpenseTransaction } from '../../types/transactions';

interface CreditCardAnalysisChartProps {
  accounts: BankAccount[];
  transactions: ExpenseTransaction[];
}

export function CreditCardAnalysisChart({ accounts, transactions }: CreditCardAnalysisChartProps) {
  const cardData = useMemo(() => {
    return accounts.map((account) => {
      const cardTransactions = transactions.filter(
        (t) => t.accountId === account.id && t.status === 'Paid',
      );
      const totalSpent = cardTransactions.reduce((sum, t) => sum + t.amount, 0);
      const utilization = account.creditLimit
        ? (account.currentBalance / account.creditLimit) * 100
        : 0;

      return {
        name: account.name,
        outstanding: Math.round(account.currentBalance),
        limit: Math.round(account.creditLimit || 0),
        spent: Math.round(totalSpent),
        utilization: Math.round(utilization),
      };
    });
  }, [accounts, transactions]);

  const totalOutstanding = useMemo(
    () => cardData.reduce((sum, d) => sum + d.outstanding, 0),
    [cardData],
  );
  const totalLimit = useMemo(() => cardData.reduce((sum, d) => sum + d.limit, 0), [cardData]);
  const totalSpent = useMemo(() => cardData.reduce((sum, d) => sum + d.spent, 0), [cardData]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Chip label={`Total Outstanding: ₹${totalOutstanding.toLocaleString('en-IN')}`} color="error" />
        <Chip label={`Total Limit: ₹${totalLimit.toLocaleString('en-IN')}`} color="default" />
        <Chip label={`Total Spent: ₹${totalSpent.toLocaleString('en-IN')}`} color="warning" />
        <Chip
          label={`Overall Utilization: ${totalLimit > 0 ? Math.round((totalOutstanding / totalLimit) * 100) : 0}%`}
          color={totalLimit > 0 && totalOutstanding / totalLimit > 0.8 ? 'error' : 'default'}
        />
      </Stack>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Credit Card Analysis
        </Typography>
        <Box sx={{ width: '100%', height: 400, mt: 2 }}>
          <ResponsiveContainer>
            <BarChart data={cardData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
              <Legend />
              <Bar dataKey="outstanding" fill="#ff8042" name="Outstanding" />
              <Bar dataKey="limit" fill="#8884d8" name="Credit Limit" />
              <Bar dataKey="spent" fill="#82ca9d" name="Total Spent" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Stack>
  );
}

