/**
 * Spending Trends by Category Over Time
 * Shows how spending in each category changes over time
 */

import { useMemo, memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ExpenseTransaction } from '../../types/transactions';
import { ChartWrapper, CustomTooltip, formatCurrencyTooltip } from './ChartWrapper';

interface SpendingTrendsChartProps {
  transactions: ExpenseTransaction[];
}

export const SpendingTrendsChart = memo(function SpendingTrendsChart({ transactions }: SpendingTrendsChartProps) {
  const categoryTrends = useMemo(() => {
    const monthlyCategory: Record<string, Record<string, number>> = {};

    transactions.forEach((t) => {
      if (t.status === 'Paid') {
        const month = t.date.substring(0, 7);
        if (!monthlyCategory[month]) {
          monthlyCategory[month] = {};
        }
        monthlyCategory[month][t.category] = (monthlyCategory[month][t.category] || 0) + t.amount;
      }
    });

    // Get all unique categories
    const allCategories = new Set<string>();
    Object.values(monthlyCategory).forEach((categories) => {
      Object.keys(categories).forEach((cat) => allCategories.add(cat));
    });

    // Build data array
    const months = Object.keys(monthlyCategory).sort();
    return months.map((month) => {
      const data: Record<string, string | number> = {
        month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      };
      allCategories.forEach((cat) => {
        data[cat] = Math.round(monthlyCategory[month][cat] || 0);
      });
      return data;
    });
  }, [transactions]);

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  // Get category names (excluding 'month')
  const categories = Object.keys(categoryTrends[0] || {}).filter((key) => key !== 'month');

  return (
    <ChartWrapper
      title="Spending Trends by Category Over Time"
      chartId="spending-trends-chart"
      hasData={categoryTrends.length > 0}
      height={400}
      emptyMessage="No data available for the selected date range"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={categoryTrends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => formatCurrencyTooltip(value)} />
          <RechartsTooltip
            content={<CustomTooltip formatter={(value) => [formatCurrencyTooltip(value), '']} />}
          />
          <Legend />
          {categories.map((category, index) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              name={category}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});

