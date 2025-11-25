import { useMemo, memo } from 'react';
import { Stack, Chip } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SavingsInvestmentTransaction } from '../../types/transactions';
import { ChartWrapper, CustomTooltip, formatCurrencyTooltip } from './ChartWrapper';

interface InvestmentPerformanceChartProps {
  transactions: SavingsInvestmentTransaction[];
}

export const InvestmentPerformanceChart = memo(function InvestmentPerformanceChart({ transactions }: InvestmentPerformanceChartProps) {
  const destinationData = useMemo(() => {
    const destination: Record<string, { invested: number; withdrawn: number }> = {};
    transactions.forEach((t) => {
      if (!destination[t.destination]) {
        destination[t.destination] = { invested: 0, withdrawn: 0 };
      }
      if (t.type === 'SIP' || t.type === 'LumpSum') {
        destination[t.destination].invested += t.amount;
      } else if (t.type === 'Withdrawal') {
        destination[t.destination].withdrawn += t.amount;
      }
    });

    return Object.entries(destination)
      .map(([name, data]) => ({
        name,
        invested: Math.round(data.invested),
        withdrawn: Math.round(data.withdrawn),
        net: Math.round(data.invested - data.withdrawn),
      }))
      .sort((a, b) => b.invested - a.invested);
  }, [transactions]);

  const totalInvested = useMemo(
    () => destinationData.reduce((sum, d) => sum + d.invested, 0),
    [destinationData],
  );
  const totalWithdrawn = useMemo(
    () => destinationData.reduce((sum, d) => sum + d.withdrawn, 0),
    [destinationData],
  );
  const netValue = totalInvested - totalWithdrawn;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Chip label={`Total Invested: ${formatCurrencyTooltip(totalInvested)}`} color="primary" />
        <Chip label={`Total Withdrawn: ${formatCurrencyTooltip(totalWithdrawn)}`} color="warning" />
        <Chip label={`Net Value: ${formatCurrencyTooltip(netValue)}`} color={netValue >= 0 ? 'success' : 'error'} />
      </Stack>
      <ChartWrapper
        title="Investment Performance by Destination"
        chartId="investment-performance-chart"
        hasData={destinationData.length > 0}
        height={400}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={destinationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <RechartsTooltip
              content={
                <CustomTooltip
                  formatter={(value, name) => [
                    formatCurrencyTooltip(value),
                    name === 'invested' ? 'Invested' : name === 'withdrawn' ? 'Withdrawn' : 'Net',
                  ]}
                />
              }
            />
            <Legend />
            <Bar dataKey="invested" fill="#8884d8" name="Invested" />
            <Bar dataKey="withdrawn" fill="#ff8042" name="Withdrawn" />
            <Bar dataKey="net" fill="#82ca9d" name="Net" />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </Stack>
  );
});

