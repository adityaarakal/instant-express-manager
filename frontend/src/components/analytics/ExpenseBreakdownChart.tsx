import { useMemo, memo } from 'react';
import { Paper, Typography, Box, Stack } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ExpenseTransaction } from '../../types/transactions';

interface ExpenseBreakdownChartProps {
  transactions: ExpenseTransaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const ExpenseBreakdownChart = memo(function ExpenseBreakdownChart({ transactions }: ExpenseBreakdownChartProps) {
  const categoryData = useMemo(() => {
    const category: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.status === 'Paid') {
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

  const bucketData = useMemo(() => {
    const bucket: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.status === 'Paid') {
        bucket[t.bucket] = (bucket[t.bucket] || 0) + t.amount;
      }
    });

    return Object.entries(bucket)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  return (
    <Stack spacing={3} direction={{ xs: 'column', md: 'row' }}>
      <Paper elevation={1} sx={{ p: 3, flex: 1 }}>
        <Typography variant="h6" gutterBottom>
          Expenses by Category
        </Typography>
        <Box sx={{ width: '100%', height: 300, mt: 2 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: { name: string; percent?: number; value: number }) => {
                  const percent = entry.percent || 0;
                  return `${entry.name} ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, flex: 1 }}>
        <Typography variant="h6" gutterBottom>
          Expenses by Bucket
        </Typography>
        <Box sx={{ width: '100%', height: 300, mt: 2 }}>
          <ResponsiveContainer>
            <BarChart data={bucketData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
              <Bar dataKey="value" fill="#8884d8" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Stack>
  );
});

