import { useMemo, memo } from 'react';
import { Stack } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from 'recharts';
import type { ExpenseTransaction } from '../../types/transactions';
import { ChartWrapper, CustomTooltip, formatCurrencyTooltip } from './ChartWrapper';

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
      <ChartWrapper
        title="Expenses by Category"
        chartId="expense-category-pie-chart"
        hasData={categoryData.length > 0}
        height={350}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: PieLabelRenderProps) => {
                const { name, percent } = props;
                const percentValue = typeof percent === 'number' ? percent * 100 : 0;
                return `${name} ${percentValue.toFixed(0)}%`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip
              content={<CustomTooltip formatter={(value) => [formatCurrencyTooltip(value), 'Expense']} />}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ChartWrapper
        title="Expenses by Bucket"
        chartId="expense-bucket-bar-chart"
        hasData={bucketData.length > 0}
        height={350}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bucketData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <RechartsTooltip
              content={<CustomTooltip formatter={(value) => [formatCurrencyTooltip(value), 'Expense']} />}
            />
            <Bar dataKey="value" fill="#8884d8" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </Stack>
  );
});

