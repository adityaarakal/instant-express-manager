/**
 * Income vs Expense Comparison Chart
 * Shows side-by-side comparison of income and expenses over time
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
import type { IncomeTransaction, ExpenseTransaction } from '../../types/transactions';
import { ChartWrapper, CustomTooltip, formatCurrencyTooltip } from './ChartWrapper';

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

  return (
    <ChartWrapper
      title="Income vs Expenses Comparison"
      chartId="income-vs-expense-chart"
      hasData={monthlyData.length > 0}
      height={400}
      emptyMessage="No data available for the selected date range"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => formatCurrencyTooltip(value)} />
          <RechartsTooltip
            content={
              <CustomTooltip
                formatter={(value, name) => [
                  formatCurrencyTooltip(value),
                  name === 'income' ? 'Income' : name === 'expenses' ? 'Expenses' : 'Net',
                ]}
              />
            }
          />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#00C49F" strokeWidth={2} name="Income" />
          <Line type="monotone" dataKey="expenses" stroke="#FF8042" strokeWidth={2} name="Expenses" />
          <Line type="monotone" dataKey="net" stroke="#0088FE" strokeWidth={2} name="Net" strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});

