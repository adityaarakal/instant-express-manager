import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import { useAggregatedPlannedMonthsStore } from '../store/useAggregatedPlannedMonthsStore';
import { usePlannerStore } from '../store/usePlannerStore';
import { MonthViewHeader } from '../components/planner/MonthViewHeader';
import { StatusRibbon } from '../components/planner/StatusRibbon';
import { AccountTable } from '../components/planner/AccountTable';
import { TotalsFooter } from '../components/planner/TotalsFooter';
import { MonthSearchFilter } from '../components/planner/MonthSearchFilter';
import { EmptyState } from '../components/common/EmptyState';
import type { AggregatedMonth } from '../types/plannedExpensesAggregated';

const formatMonthDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const Planner = memo(function Planner() {
  const navigate = useNavigate();
  const { getMonth, getAvailableMonths, getBucketTotals, updateBucketStatus } = useAggregatedPlannedMonthsStore();
  const { activeMonthId, setActiveMonth } = usePlannerStore();
  const [filteredMonths, setFilteredMonths] = useState<string[]>([]);

  // Keyboard shortcuts removed - no longer needed for Planner page

  const availableMonths = getAvailableMonths();

  // Auto-select first month if none selected
  useEffect(() => {
    if (!activeMonthId && availableMonths.length > 0) {
      setActiveMonth(availableMonths[0]);
    }
  }, [activeMonthId, availableMonths, setActiveMonth]);

  const activeMonth = activeMonthId ? getMonth(activeMonthId) : null;
  const totals = activeMonthId ? getBucketTotals(activeMonthId) : null;

  // Filter months based on search
  useEffect(() => {
    setFilteredMonths(availableMonths);
  }, [availableMonths]);

  if (availableMonths.length === 0) {
    return (
      <Stack spacing={3}>
        <EmptyState
          icon={<EditCalendarIcon sx={{ fontSize: 48 }} />}
          title="No Planned Months"
          description="No transaction data is available. Add transactions to see monthly planning views."
          action={{
            label: 'Add Transaction',
            onClick: () => {
              navigate('/transactions');
            },
            icon: <UploadFileIcon />,
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <MonthSearchFilter
          months={useMemo(
            () =>
              availableMonths
                .map((id) => {
                  const month = getMonth(id);
                  return month
                    ? {
                        id: month.id,
                        monthStart: month.monthStart,
                        accounts: month.accounts,
                      }
                    : null;
                })
                .filter(
                  (m): m is { id: string; monthStart: string; accounts: AggregatedMonth['accounts'] } => m !== null
                ),
            [availableMonths, getMonth]
          )}
          onFilterChange={useCallback(
            (filtered) => {
              setFilteredMonths(filtered.map((m) => m.id));
            },
            []
          )}
        />
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="month-select-label">Select Month</InputLabel>
            <Select
              labelId="month-select-label"
              value={activeMonthId ?? ''}
              label="Select Month"
              onChange={(e) => setActiveMonth(e.target.value)}
            >
              {filteredMonths.map((monthId) => {
                const month = getMonth(monthId);
                return month ? (
                  <MenuItem key={monthId} value={monthId}>
                    {formatMonthDate(month.monthStart)}
                  </MenuItem>
                ) : null;
              })}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {activeMonth && totals ? (
        <Stack spacing={3}>
          <MonthViewHeader
            month={activeMonth}
          />
          <StatusRibbon
            month={activeMonth}
            onStatusChange={(bucketId, status) => {
              updateBucketStatus(activeMonth.id, bucketId, status);
            }}
          />
          <AccountTable month={activeMonth} />
          <TotalsFooter month={activeMonth} totals={totals} />
        </Stack>
      ) : (
        <Paper elevation={1} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Select a month to view its planned expenses.
          </Typography>
        </Paper>
      )}
    </Stack>
  );
});
