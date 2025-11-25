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
import type { BankAccount } from '../../types/bankAccounts';
import type { ExpenseTransaction } from '../../types/transactions';
import { ChartWrapper, CustomTooltip, formatCurrencyTooltip } from './ChartWrapper';

interface CreditCardAnalysisChartProps {
  accounts: BankAccount[];
  transactions: ExpenseTransaction[];
}

export const CreditCardAnalysisChart = memo(function CreditCardAnalysisChart({ accounts, transactions }: CreditCardAnalysisChartProps) {
  const cardData = useMemo(() => {
    return accounts.map((account) => {
      const cardTransactions = transactions.filter(
        (t) => t.accountId === account.id && t.status === 'Paid',
      );
      const totalSpent = cardTransactions.reduce((sum, t) => sum + t.amount, 0);
      const utilization = account.creditLimit
        ? (account.currentBalance / account.creditLimit) * 100
        : 0;

      return {
        name: account.name,
        outstanding: Math.round(account.currentBalance),
        limit: Math.round(account.creditLimit || 0),
        spent: Math.round(totalSpent),
        utilization: Math.round(utilization),
      };
    });
  }, [accounts, transactions]);

  const totalOutstanding = useMemo(
    () => cardData.reduce((sum, d) => sum + d.outstanding, 0),
    [cardData],
  );
  const totalLimit = useMemo(() => cardData.reduce((sum, d) => sum + d.limit, 0), [cardData]);
  const totalSpent = useMemo(() => cardData.reduce((sum, d) => sum + d.spent, 0), [cardData]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Chip label={`Total Outstanding: ${formatCurrencyTooltip(totalOutstanding)}`} color="error" />
        <Chip label={`Total Limit: ${formatCurrencyTooltip(totalLimit)}`} color="default" />
        <Chip label={`Total Spent: ${formatCurrencyTooltip(totalSpent)}`} color="warning" />
        <Chip
          label={`Overall Utilization: ${totalLimit > 0 ? Math.round((totalOutstanding / totalLimit) * 100) : 0}%`}
          color={totalLimit > 0 && totalOutstanding / totalLimit > 0.8 ? 'error' : 'default'}
        />
      </Stack>

      <ChartWrapper
        title="Credit Card Analysis"
        chartId="credit-card-analysis-chart"
        hasData={cardData.length > 0}
        height={400}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cardData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <RechartsTooltip
              content={
                <CustomTooltip
                  formatter={(value, name) => [
                    formatCurrencyTooltip(value),
                    name === 'outstanding' ? 'Outstanding' : name === 'limit' ? 'Credit Limit' : 'Total Spent',
                  ]}
                />
              }
            />
            <Legend />
            <Bar dataKey="outstanding" fill="#ff8042" name="Outstanding" />
            <Bar dataKey="limit" fill="#8884d8" name="Credit Limit" />
            <Bar dataKey="spent" fill="#82ca9d" name="Total Spent" />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </Stack>
  );
});

