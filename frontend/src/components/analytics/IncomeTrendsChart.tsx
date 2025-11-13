import { useMemo } from 'react';
import { Paper, Typography, Box, Stack } from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { IncomeTransaction } from '../../types/transactions';

interface IncomeTrendsChartProps {
  transactions: IncomeTransaction[];
}

export function IncomeTrendsChart({ transactions }: IncomeTrendsChartProps) {
  const monthlyData = useMemo(() => {
    const monthly: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.status === 'Received') {
        const month = t.date.substring(0, 7); // YYYY-MM
        monthly[month] = (monthly[month] || 0) + t.amount;
      }
    });

    return Object.entries(monthly)
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        amount: Math.round(amount),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const categoryData = useMemo(() => {
    const category: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.status === 'Received') {
        category[t.category] = (category[t.category] || 0) + t.amount;
      }
    });

    return Object.entries(category)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  return (
    <Stack spacing={3}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Income Trends by Month
        </Typography>
        <Box sx={{ width: '100%', height: 300, mt: 2 }}>
          <ResponsiveContainer>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Income" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Income by Category
        </Typography>
        <Box sx={{ width: '100%', height: 300, mt: 2 }}>
          <ResponsiveContainer>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
              <Bar dataKey="value" fill="#8884d8" name="Income" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Stack>
  );
}

