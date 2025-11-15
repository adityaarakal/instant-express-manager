import { useMemo, memo } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SavingsInvestmentTransaction } from '../../types/transactions';

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
    <Paper elevation={1} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Savings Progress Over Time
      </Typography>
      <Box sx={{ width: '100%', height: 400, mt: 2 }}>
        <ResponsiveContainer>
          <AreaChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) => [
                `₹${value.toLocaleString('en-IN')}`,
                name === 'amount' ? 'Monthly' : 'Cumulative',
              ]}
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
      </Box>
    </Paper>
  );
});

