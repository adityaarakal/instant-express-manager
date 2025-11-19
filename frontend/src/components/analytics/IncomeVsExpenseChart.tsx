/**
 * Income vs Expense Comparison Chart
 * Shows side-by-side comparison of income and expenses over time
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
import type { IncomeTransaction, ExpenseTransaction } from '../../types/transactions';

interface IncomeVsExpenseChartProps {
  incomeTransactions: IncomeTransaction[];
  expenseTransactions: ExpenseTransaction[];
}

export const IncomeVsExpenseChart = memo(function IncomeVsExpenseChart({
  incomeTransactions,
  expenseTransactions,
}: IncomeVsExpenseChartProps) {
  const monthlyData = useMemo(() => {
    const monthly: Record<string, { month: string; income: number; expenses: number; net: number }> = {};

    incomeTransactions.forEach((t) => {
      if (t.status === 'Received') {
        const month = t.date.substring(0, 7);
        if (!monthly[month]) {
          monthly[month] = {
            month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            income: 0,
            expenses: 0,
            net: 0,
          };
        }
        monthly[month].income += t.amount;
      }
    });

    expenseTransactions.forEach((t) => {
      if (t.status === 'Paid') {
        const month = t.date.substring(0, 7);
        if (!monthly[month]) {
          monthly[month] = {
            month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            income: 0,
            expenses: 0,
            net: 0,
          };
        }
        monthly[month].expenses += t.amount;
      }
    });

    // Calculate net and sort by month
    return Object.values(monthly)
      .map((item) => ({
        ...item,
        net: item.income - item.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [incomeTransactions, expenseTransactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (monthlyData.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Income vs Expenses
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
        Income vs Expenses Comparison
      </Typography>
      <Box sx={{ mt: 2 }}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#00C49F" strokeWidth={2} name="Income" />
            <Line type="monotone" dataKey="expenses" stroke="#FF8042" strokeWidth={2} name="Expenses" />
            <Line type="monotone" dataKey="net" stroke="#0088FE" strokeWidth={2} name="Net" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
});

