import { useMemo } from 'react';
import { Box, Paper, Typography, useTheme, useMediaQuery } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { CashFlowProjection } from '../../store/useForecastingStore';
import { formatCurrency } from '../../utils/financialPrecision';

interface CashFlowProjectionChartProps {
  projections: CashFlowProjection[];
}

export function CashFlowProjectionChart({ projections }: CashFlowProjectionChartProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const chartData = useMemo(() => {
    return projections.map((proj) => {
      const [year, month] = proj.monthId.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-IN', {
        month: 'short',
      });

      return {
        month: monthName,
        income: proj.projectedIncome,
        expenses: proj.projectedExpenses,
        savings: proj.projectedSavings,
        balance: proj.projectedBalance,
        netFlow: proj.projectedIncome - proj.projectedExpenses - proj.projectedSavings,
      };
    });
  }, [projections]);

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          elevation={3}
          sx={{
            p: 1.5,
            backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {label}
          </Typography>
          {payload?.map((entry, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color, mb: 0.5 }}
            >
              {entry.name}: {formatCurrency(entry.value)}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  if (projections.length === 0) {
    return null;
  }

  return (
    <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'action.hover' }}>
      <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
        Cash Flow Projection
      </Typography>
      <Box sx={{ width: '100%', height: { xs: 300, sm: 400 } }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: isMobile ? 10 : 12 }}
              stroke={theme.palette.text.secondary}
            />
            <YAxis
              tick={{ fontSize: isMobile ? 10 : 12 }}
              stroke={theme.palette.text.secondary}
              tickFormatter={(value) => {
                if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
                if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
                return `₹${value}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke={theme.palette.success.main}
              strokeWidth={2}
              name="Income"
              dot={{ r: isMobile ? 3 : 4 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke={theme.palette.error.main}
              strokeWidth={2}
              name="Expenses"
              dot={{ r: isMobile ? 3 : 4 }}
            />
            <Line
              type="monotone"
              dataKey="savings"
              stroke={theme.palette.info.main}
              strokeWidth={2}
              name="Savings"
              dot={{ r: isMobile ? 3 : 4 }}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              name="Balance"
              dot={{ r: isMobile ? 3 : 4 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

