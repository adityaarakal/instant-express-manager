import { useMemo, memo } from 'react';
import { Stack } from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { IncomeTransaction } from '../../types/transactions';
import { ChartWrapper, CustomTooltip, formatCurrencyTooltip } from './ChartWrapper';

interface IncomeTrendsChartProps {
  transactions: IncomeTransaction[];
}

export const IncomeTrendsChart = memo(function IncomeTrendsChart({ transactions }: IncomeTrendsChartProps) {
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
      <ChartWrapper
        title="Income Trends by Month"
        chartId="income-trends-month-chart"
        hasData={monthlyData.length > 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <RechartsTooltip
              content={<CustomTooltip formatter={(value) => [formatCurrencyTooltip(value), 'Income']} />}
            />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Income" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ChartWrapper
        title="Income by Category"
        chartId="income-category-chart"
        hasData={categoryData.length > 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <RechartsTooltip
              content={<CustomTooltip formatter={(value) => [formatCurrencyTooltip(value), 'Income']} />}
            />
            <Bar dataKey="value" fill="#8884d8" name="Income" />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </Stack>
  );
});

