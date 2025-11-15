import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AlertTitle,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import PrintIcon from '@mui/icons-material/Print';
import { useAggregatedPlannedMonthsStore } from '../store/useAggregatedPlannedMonthsStore';
import { usePlannerStore } from '../store/usePlannerStore';
import { MonthViewHeader } from '../components/planner/MonthViewHeader';
import { StatusRibbon } from '../components/planner/StatusRibbon';
import { AccountTable } from '../components/planner/AccountTable';
import { TotalsFooter } from '../components/planner/TotalsFooter';
import { MonthSearchFilter } from '../components/planner/MonthSearchFilter';
import { AccountFilters } from '../components/planner/AccountFilters';
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
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [showNegativeOnly, setShowNegativeOnly] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  // Keyboard shortcuts removed - no longer needed for Planner page

  const availableMonths = getAvailableMonths();

  // Auto-select latest/current month if none selected - prioritize latest and future
  useEffect(() => {
    if (!activeMonthId && availableMonths.length > 0) {
      // Get current month or latest available month
      const now = new Date();
      const currentMonthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Prioritize current month if it exists in available months
      // Otherwise use the latest available month (first in sorted desc order)
      const monthToSelect = availableMonths.includes(currentMonthId) 
        ? currentMonthId 
        : availableMonths[0]; // Latest month (first in desc sorted list)
      
      setActiveMonth(monthToSelect);
    }
  }, [activeMonthId, availableMonths, setActiveMonth]);

  // Clear filters when month changes
  useEffect(() => {
    setSelectedAccount(null);
    setSelectedBucket(null);
    setShowNegativeOnly(false);
  }, [activeMonthId]);

  const activeMonth = activeMonthId ? getMonth(activeMonthId) : null;
  const totals = activeMonthId ? getBucketTotals(activeMonthId) : null;

  // Find accounts with negative remaining cash
  const negativeCashAccounts = useMemo(() => {
    if (!activeMonth) return [];
    return activeMonth.accounts.filter(
      (account) => account.remainingCash !== null && account.remainingCash < 0
    );
  }, [activeMonth]);

  // Filter accounts based on selected filters
  const filteredAccounts = useMemo(() => {
    if (!activeMonth) return [];
    let accounts = [...activeMonth.accounts];

    // Filter by account
    if (selectedAccount) {
      accounts = accounts.filter((account) => account.id === selectedAccount);
    }

    // Filter by bucket (show accounts that have allocations in this bucket)
    if (selectedBucket) {
      accounts = accounts.filter(
        (account) =>
          account.bucketAmounts[selectedBucket] !== null &&
          account.bucketAmounts[selectedBucket] !== undefined &&
          (account.bucketAmounts[selectedBucket] ?? 0) > 0
      );
    }

    // Filter by negative cash only
    if (showNegativeOnly) {
      accounts = accounts.filter(
        (account) => account.remainingCash !== null && account.remainingCash < 0
      );
    }

    return accounts;
  }, [activeMonth, selectedAccount, selectedBucket, showNegativeOnly]);

  // Create filtered month with filtered accounts
  const filteredMonth = useMemo(() => {
    if (!activeMonth) return null;
    if (filteredAccounts.length === activeMonth.accounts.length) return activeMonth;
    return {
      ...activeMonth,
      accounts: filteredAccounts,
    };
  }, [activeMonth, filteredAccounts]);

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
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }} className="no-print">
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
              {/* Sort months in descending order (latest first) to prioritize current/recent months */}
              {filteredMonths
                .sort((a, b) => b.localeCompare(a)) // Latest first
                .map((monthId) => {
                  const month = getMonth(monthId);
                  return month ? (
                    <MenuItem key={monthId} value={monthId}>
                      {formatMonthDate(month.monthStart)}
                    </MenuItem>
                  ) : null;
                })}
            </Select>
          </FormControl>
          {activeMonth && (
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              size="small"
              aria-label="Print month view"
            >
              Print
            </Button>
          )}
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
          {negativeCashAccounts.length > 0 && (
            <Alert severity="warning" icon={<WarningIcon />} className="no-print">
              <AlertTitle>Negative Remaining Cash Detected</AlertTitle>
              <Typography variant="body2" sx={{ mb: 1 }}>
                The following {negativeCashAccounts.length === 1 ? 'account has' : 'accounts have'} negative remaining cash:
              </Typography>
              <Stack component="ul" sx={{ m: 0, pl: 2 }}>
                {negativeCashAccounts.map((account) => (
                  <Typography key={account.id} component="li" variant="body2">
                    <strong>{account.accountName}</strong>: ₹
                    {Math.abs(account.remainingCash ?? 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    negative remaining cash
                  </Typography>
                ))}
              </Stack>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Consider adjusting transactions or adding income to balance the accounts.
              </Typography>
            </Alert>
          )}
          <AccountFilters
            month={activeMonth}
            selectedAccount={selectedAccount}
            selectedBucket={selectedBucket}
            showNegativeOnly={showNegativeOnly}
            onAccountChange={setSelectedAccount}
            onBucketChange={setSelectedBucket}
            onNegativeOnlyChange={setShowNegativeOnly}
            onClear={() => {
              setSelectedAccount(null);
              setSelectedBucket(null);
              setShowNegativeOnly(false);
            }}
          />
          {filteredMonth ? (
            <>
              {filteredMonth.accounts.length > 0 ? (
                <>
                  <AccountTable month={filteredMonth} />
          <TotalsFooter month={activeMonth} totals={totals} />
                </>
              ) : (
                <EmptyState
                  icon={<FilterListIcon sx={{ fontSize: 48 }} />}
                  title="No Accounts Match Filters"
                  description="No accounts found matching the current filters. Try adjusting your filter criteria."
                  action={{
                    label: 'Clear Filters',
                    onClick: () => {
                      setSelectedAccount(null);
                      setSelectedBucket(null);
                      setShowNegativeOnly(false);
                    },
                    icon: <ClearIcon />,
                  }}
                />
              )}
            </>
          ) : null}
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
