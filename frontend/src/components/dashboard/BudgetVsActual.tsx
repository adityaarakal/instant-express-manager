import { useMemo, memo } from 'react';
import { Card, CardContent, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import type { PlannedMonthSnapshot } from '../../types/plannedExpenses';
import { usePlannedMonthsStore } from '../../store/usePlannedMonthsStore';
import { calculateBucketTotals } from '../../utils/totals';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

interface BudgetVsActualProps {
  monthId: string | null;
}

export const BudgetVsActual = memo(function BudgetVsActual({ monthId }: BudgetVsActualProps) {
  const { getMonth, getBucketTotals } = usePlannedMonthsStore();

  const comparison = useMemo(() => {
    if (!monthId) {
      return null;
    }

    const month = getMonth(monthId);
    if (!month) {
      return null;
    }

    const totals = getBucketTotals(monthId);
    const buckets = DEFAULT_BUCKETS.filter((bucket) =>
      month.bucketOrder.includes(bucket.id),
    );

    const comparisons = buckets.map((bucket) => {
      const planned = totals.all[bucket.id] ?? 0;
      const actual = totals.paid[bucket.id] ?? 0;
      const pending = totals.pending[bucket.id] ?? 0;
      const variance = actual - planned;
      const variancePercent = planned > 0 ? (variance / planned) * 100 : 0;
      const completionPercent = planned > 0 ? (actual / planned) * 100 : 0;

      return {
        bucketId: bucket.id,
        bucketName: bucket.name,
        bucketColor: bucket.color,
        planned,
        actual,
        pending,
        variance,
        variancePercent,
        completionPercent,
      };
    });

    const totalPlanned = comparisons.reduce((sum, c) => sum + c.planned, 0);
    const totalActual = comparisons.reduce((sum, c) => sum + c.actual, 0);
    const totalVariance = totalActual - totalPlanned;
    const totalVariancePercent = totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0;

    return {
      month,
      comparisons,
      totals: {
        planned: totalPlanned,
        actual: totalActual,
        variance: totalVariance,
        variancePercent: totalVariancePercent,
      },
    };
  }, [monthId, getMonth, getBucketTotals]);

  if (!comparison) {
    return (
      <Card elevation={1} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Select a month to view budget vs actual comparison.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={1} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Budget vs Actual
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Intl.DateTimeFormat('en-IN', {
                month: 'long',
                year: 'numeric',
              }).format(new Date(comparison.month.monthStart))}
            </Typography>
          </Box>

          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Planned
                </Typography>
                <Typography variant="h6">{formatCurrency(comparison.totals.planned)}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Actual (Paid)
                </Typography>
                <Typography variant="h6">{formatCurrency(comparison.totals.actual)}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Variance
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {comparison.totals.variance >= 0 ? (
                    <TrendingUpIcon color="success" fontSize="small" />
                  ) : (
                    <TrendingDownIcon color="error" fontSize="small" />
                  )}
                  <Typography
                    variant="h6"
                    color={comparison.totals.variance >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(Math.abs(comparison.totals.variance))}
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  color={comparison.totals.variancePercent >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercentage(comparison.totals.variancePercent)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Bucket
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      Planned
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      Actual
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      Pending
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      Variance
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      Progress
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparison.comparisons.map((comp) => (
                  <TableRow key={comp.bucketId} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: comp.bucketColor,
                          }}
                        />
                        <Typography variant="body2">{comp.bucketName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{formatCurrency(comp.planned)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(comp.actual)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(comp.pending)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                        {comp.variance >= 0 ? (
                          <TrendingUpIcon color="success" fontSize="small" />
                        ) : (
                          <TrendingDownIcon color="error" fontSize="small" />
                        )}
                        <Typography
                          variant="body2"
                          color={comp.variance >= 0 ? 'success.main' : 'error.main'}
                        >
                          {formatCurrency(Math.abs(comp.variance))}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="caption"
                        color={comp.variancePercent >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatPercentage(comp.variancePercent)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${comp.completionPercent.toFixed(0)}%`}
                        size="small"
                        color={comp.completionPercent >= 100 ? 'success' : 'default'}
                        variant={comp.completionPercent >= 100 ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </CardContent>
    </Card>
  );
});

