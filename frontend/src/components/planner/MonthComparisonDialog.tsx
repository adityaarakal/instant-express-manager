import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import type { AggregatedMonth } from '../../types/plannedExpensesAggregated';
import { useAggregatedPlannedMonthsStore } from '../../store/useAggregatedPlannedMonthsStore';
import { DEFAULT_BUCKETS } from '../../config/plannedExpenses';

interface MonthComparisonDialogProps {
  open: boolean;
  onClose: () => void;
  currentMonthId: string;
  currentMonthStart: string;
}

const formatMonthDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '—';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const getDiffColor = (val1: number | null | undefined, val2: number | null | undefined): string => {
  if (val1 === null || val1 === undefined || val2 === null || val2 === undefined) {
    if (val1 !== val2) return 'warning.main';
    return 'inherit';
  }
  const diff = val1 - val2;
  if (Math.abs(diff) < 0.01) return 'inherit'; // Same value (within rounding)
  if (diff > 0) return 'success.main';
  return 'error.main';
};

const getDiffText = (val1: number | null | undefined, val2: number | null | undefined): string => {
  if (val1 === null || val1 === undefined || val2 === null || val2 === undefined) {
    if (val1 !== val2) return 'Changed';
    return '';
  }
  const diff = val1 - val2;
  if (Math.abs(diff) < 0.01) return '';
  const sign = diff > 0 ? '+' : '';
  return `(${sign}${formatCurrency(diff)})`;
};

export function MonthComparisonDialog({
  open,
  onClose,
  currentMonthId,
  currentMonthStart,
}: MonthComparisonDialogProps) {
  const [compareMonthId, setCompareMonthId] = useState<string>('');
  const { getMonth, getAvailableMonths } = useAggregatedPlannedMonthsStore();

  const availableMonths = getAvailableMonths();
  const compareMonthOptions = availableMonths
    .filter((monthId) => monthId !== currentMonthId)
    .map((monthId) => {
      const month = getMonth(monthId);
      return month
        ? {
            id: monthId,
            label: formatMonthDate(month.monthStart),
          }
        : null;
    })
    .filter((m): m is { id: string; label: string } => m !== null);

  const currentMonth = getMonth(currentMonthId);
  const compareMonth = compareMonthId ? getMonth(compareMonthId) : null;

  // Get all unique accounts from both months
  const allAccountIds = new Set<string>();
  if (currentMonth) {
    currentMonth.accounts.forEach((acc) => allAccountIds.add(acc.id));
  }
  if (compareMonth) {
    compareMonth.accounts.forEach((acc) => allAccountIds.add(acc.id));
  }

  // Get all buckets from both months
  const allBucketIds = new Set<string>();
  if (currentMonth) {
    currentMonth.bucketOrder.forEach((id) => allBucketIds.add(id));
  }
  if (compareMonth) {
    compareMonth.bucketOrder.forEach((id) => allBucketIds.add(id));
  }

  const buckets = DEFAULT_BUCKETS.filter((b) => allBucketIds.has(b.id));

  const getAccountData = (month: AggregatedMonth | null, accountId: string) => {
    if (!month) return null;
    return month.accounts.find((acc) => acc.id === accountId) || null;
  };

  if (compareMonthOptions.length === 0) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>Compare Months</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            No other months available to compare. Add transactions to create more months.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <CompareArrowsIcon />
          <Typography variant="h6">Compare Months</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="compare-month-label">Compare With</InputLabel>
            <Select
              labelId="compare-month-label"
              value={compareMonthId}
              label="Compare With"
              onChange={(e) => setCompareMonthId(e.target.value)}
            >
              <MenuItem value="">Select a month to compare</MenuItem>
              {compareMonthOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {currentMonth && compareMonth && (
            <>
              {/* Summary Comparison */}
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Summary Comparison
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Inflow Total
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="baseline">
                      <Typography variant="h6" color={getDiffColor(currentMonth.inflowTotal, compareMonth.inflowTotal)}>
                        {formatCurrency(currentMonth.inflowTotal)}
                      </Typography>
                      <Typography variant="caption" color={getDiffColor(currentMonth.inflowTotal, compareMonth.inflowTotal)}>
                        {getDiffText(currentMonth.inflowTotal, compareMonth.inflowTotal)}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Previous: {formatCurrency(compareMonth.inflowTotal)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Fixed Factor
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="baseline">
                      <Typography variant="h6" color={getDiffColor(currentMonth.fixedFactor, compareMonth.fixedFactor)}>
                        {formatCurrency(currentMonth.fixedFactor)}
                      </Typography>
                      <Typography variant="caption" color={getDiffColor(currentMonth.fixedFactor, compareMonth.fixedFactor)}>
                        {getDiffText(currentMonth.fixedFactor, compareMonth.fixedFactor)}
                      </Typography>
                    </Stack>
            <Typography variant="caption" color="text.secondary">
              Previous: {formatCurrency(compareMonth.fixedFactor)}
            </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Accounts Count
                    </Typography>
                    <Typography variant="h6">
                      {currentMonth.accounts.length} vs {compareMonth.accounts.length}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Account Comparison Table */}
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Account Comparison
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {formatMonthDate(currentMonthStart)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {formatMonthDate(compareMonth.monthStart)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight="bold">
                            Difference
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.from(allAccountIds).map((accountId) => {
                        const currentAcc = getAccountData(currentMonth, accountId);
                        const compareAcc = getAccountData(compareMonth, accountId);
                        const accountName = currentAcc?.accountName || compareAcc?.accountName || 'Unknown';

                        return (
                          <TableRow key={accountId}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {accountName}
                              </Typography>
                              {currentAcc ? (
                                <Typography variant="caption" color="text.secondary">
                                  Remaining: {formatCurrency(currentAcc.remainingCash)}
                                </Typography>
                              ) : (
                                <Chip label="Not in this month" size="small" color="warning" />
                              )}
                            </TableCell>
                            <TableCell>
                              {compareAcc ? (
                                <Typography variant="caption" color="text.secondary">
                                  Remaining: {formatCurrency(compareAcc.remainingCash)}
                                </Typography>
                              ) : (
                                <Chip label="Not in this month" size="small" color="warning" />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {currentAcc && compareAcc && (
                                <Typography
                                  variant="body2"
                                  color={getDiffColor(currentAcc.remainingCash, compareAcc.remainingCash)}
                                  fontWeight="medium"
                                >
                                  {getDiffText(currentAcc.remainingCash, compareAcc.remainingCash)}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Bucket Totals Comparison */}
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Bucket Totals Comparison
                </Typography>
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
                            {formatMonthDate(currentMonthStart)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight="bold">
                            {formatMonthDate(compareMonth.monthStart)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight="bold">
                            Difference
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {buckets.map((bucket) => {
                        // Calculate totals for current month
                        const currentTotal = currentMonth.accounts.reduce((sum, acc) => {
                          const amount = acc.bucketAmounts[bucket.id];
                          return sum + (amount ?? 0);
                        }, 0);

                        // Calculate totals for compare month
                        const compareTotal = compareMonth.accounts.reduce((sum, acc) => {
                          const amount = acc.bucketAmounts[bucket.id];
                          return sum + (amount ?? 0);
                        }, 0);

                        return (
                          <TableRow key={bucket.id}>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: bucket.color,
                                  }}
                                />
                                <Typography variant="body2">{bucket.name}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{formatCurrency(currentTotal)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{formatCurrency(compareTotal)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                color={getDiffColor(currentTotal, compareTotal)}
                                fontWeight="medium"
                              >
                                {getDiffText(currentTotal, compareTotal)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}

        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

