import { useMemo, memo } from 'react';
import { Paper, Typography, Box } from '@mui/material';
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
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../../types/transactions';

interface BudgetVsActualChartProps {
  incomeTransactions: IncomeTransaction[];
  expenseTransactions: ExpenseTransaction[];
  savingsTransactions: SavingsInvestmentTransaction[];
}

export const BudgetVsActualChart = memo(function BudgetVsActualChart({
  incomeTransactions,
  expenseTransactions,
  savingsTransactions,
}: BudgetVsActualChartProps) {
  const monthlyComparison = useMemo(() => {
    const monthly: Record<
      string,
      { month: string; income: number; expenses: number; savings: number; net: number }
    > = {};

    incomeTransactions.forEach((t) => {
      if (t.status === 'Received') {
        const month = t.date.substring(0, 7);
        if (!monthly[month]) {
          monthly[month] = {
            month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            income: 0,
            expenses: 0,
            savings: 0,
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
            savings: 0,
            net: 0,
          };
        }
        monthly[month].expenses += t.amount;
      }
    });

    savingsTransactions.forEach((t) => {
      if (t.status === 'Completed') {
        const month = t.date.substring(0, 7);
        if (!monthly[month]) {
          monthly[month] = {
            month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            income: 0,
            expenses: 0,
            savings: 0,
            net: 0,
          };
        }
        monthly[month].savings += t.amount;
      }
    });

    return Object.values(monthly)
      .map((m) => ({
        ...m,
        income: Math.round(m.income),
        expenses: Math.round(m.expenses),
        savings: Math.round(m.savings),
        net: Math.round(m.income - m.expenses - m.savings),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [incomeTransactions, expenseTransactions, savingsTransactions]);

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Budget vs Actual - Monthly Comparison
      </Typography>
      <Box sx={{ width: '100%', height: 400, mt: 2 }}>
        <ResponsiveContainer>
          <BarChart data={monthlyComparison}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
            <Legend />
            <Bar dataKey="income" fill="#82ca9d" name="Income" />
            <Bar dataKey="expenses" fill="#ff8042" name="Expenses" />
            <Bar dataKey="savings" fill="#8884d8" name="Savings" />
            <Bar dataKey="net" fill="#ffc658" name="Net" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
});

