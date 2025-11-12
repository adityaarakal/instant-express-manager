import { memo, useMemo } from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DashboardMetrics } from '../../utils/dashboard';

interface SavingsTrendChartProps {
  trend: DashboardMetrics['savingsTrend'];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
      >
        <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].payload.month}</p>
        <p style={{ margin: 0, color: '#1976d2' }}>
          Savings: {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export const SavingsTrendChart = memo(function SavingsTrendChart({
  trend,
}: SavingsTrendChartProps) {
  const { totalSavings, averageSavings } = useMemo(() => {
    if (trend.length === 0) {
      return { totalSavings: 0, averageSavings: 0 };
    }
    const total = trend.reduce((sum, item) => sum + item.savings, 0);
    const average = total / trend.length;
    return { totalSavings: total, averageSavings: average };
  }, [trend]);

  if (trend.length === 0) {
    return null;
  }

  return (
    <Card elevation={1} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Savings Trend (Last 12 Months)
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total: <strong>{formatCurrency(totalSavings)}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Average: <strong>{formatCurrency(averageSavings)}</strong>
          </Typography>
        </Stack>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="savings"
              stroke="#1976d2"
              strokeWidth={2}
              name="Savings"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

