/**
 * Savings Rate Tracking Chart
 * Shows savings rate (savings/income) over time
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
import type { IncomeTransaction, SavingsInvestmentTransaction } from '../../types/transactions';
import { ChartWrapper, CustomTooltip, formatCurrencyTooltip, formatPercentageTooltip } from './ChartWrapper';

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

  return (
    <ChartWrapper
      title="Savings Rate Over Time"
      chartId="savings-rate-chart"
      hasData={monthlyData.length > 0}
      height={400}
      emptyMessage="No data available for the selected date range"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `${value}%`} />
          <RechartsTooltip
            content={
              <CustomTooltip
                formatter={(value, name) => {
                  if (name === 'rate') {
                    return [formatPercentageTooltip(value), 'Savings Rate'];
                  }
                  return [formatCurrencyTooltip(value), name === 'income' ? 'Income' : 'Savings'];
                }}
              />
            }
          />
          <Legend />
          <Line type="monotone" dataKey="rate" stroke="#00C49F" strokeWidth={2} name="Savings Rate %" />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});

