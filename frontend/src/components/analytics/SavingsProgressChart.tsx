import { useMemo, memo } from 'react';
import {
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SavingsInvestmentTransaction } from '../../types/transactions';
import { ChartWrapper, CustomTooltip, formatCurrencyTooltip } from './ChartWrapper';

interface SavingsProgressChartProps {
  transactions: SavingsInvestmentTransaction[];
}

export const SavingsProgressChart = memo(function SavingsProgressChart({ transactions }: SavingsProgressChartProps) {
  const monthlyData = useMemo(() => {
    const monthly: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.status === 'Completed' && (t.type === 'SIP' || t.type === 'LumpSum')) {
        const month = t.date.substring(0, 7); // YYYY-MM
        monthly[month] = (monthly[month] || 0) + t.amount;
      }
    });

    const sorted = Object.entries(monthly)
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        amount: Math.round(amount),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate cumulative
    let cumulative = 0;
    return sorted.map((item) => {
      cumulative += item.amount;
      return {
        ...item,
        cumulative: Math.round(cumulative),
      };
    });
  }, [transactions]);

  return (
    <ChartWrapper
      title="Savings Progress Over Time"
      chartId="savings-progress-chart"
      hasData={monthlyData.length > 0}
      height={400}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <RechartsTooltip
            content={
              <CustomTooltip
                formatter={(value, name) => [
                  formatCurrencyTooltip(value),
                  name === 'amount' ? 'Monthly Savings' : 'Cumulative Savings',
                ]}
              />
            }
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="amount"
            stackId="1"
            stroke="#8884d8"
            fill="#8884d8"
            name="Monthly Savings"
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#82ca9d"
            strokeWidth={2}
            name="Cumulative Savings"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});

