/**
 * Savings Rate Tracking Chart
 * Shows savings rate (savings/income) over time
 */

import { useMemo, memo } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { IncomeTransaction, SavingsInvestmentTransaction } from '../../types/transactions';

interface SavingsRateChartProps {
  incomeTransactions: IncomeTransaction[];
  savingsTransactions: SavingsInvestmentTransaction[];
}

export const SavingsRateChart = memo(function SavingsRateChart({
  incomeTransactions,
  savingsTransactions,
}: SavingsRateChartProps) {
  const monthlyData = useMemo(() => {
    const monthly: Record<string, { month: string; income: number; savings: number; rate: number }> = {};

    incomeTransactions.forEach((t) => {
      if (t.status === 'Received') {
        const month = t.date.substring(0, 7);
        if (!monthly[month]) {
          monthly[month] = {
            month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            income: 0,
            savings: 0,
            rate: 0,
          };
        }
        monthly[month].income += t.amount;
      }
    });

    savingsTransactions.forEach((t) => {
      if (t.status === 'Completed') {
        const month = t.date.substring(0, 7);
        if (!monthly[month]) {
          monthly[month] = {
            month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            income: 0,
            savings: 0,
            rate: 0,
          };
        }
        monthly[month].savings += t.amount;
      }
    });

    // Calculate savings rate
    return Object.values(monthly)
      .map((item) => ({
        ...item,
        rate: item.income > 0 ? Math.round((item.savings / item.income) * 100) : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [incomeTransactions, savingsTransactions]);

  if (monthlyData.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Savings Rate Tracking
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">No data available for the selected date range</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Savings Rate Over Time
      </Typography>
      <Box sx={{ mt: 2 }}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip formatter={(value: number, name: string) => {
              if (name === 'rate') return `${value}%`;
              return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(value);
            }} />
            <Legend />
            <Line type="monotone" dataKey="rate" stroke="#00C49F" strokeWidth={2} name="Savings Rate %" />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
});

