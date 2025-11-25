import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
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
import PreviewIcon from '@mui/icons-material/Preview';
import { PrintPreview } from '../components/common/PrintPreview';
import { useAggregatedPlannedMonthsStore } from '../store/useAggregatedPlannedMonthsStore';
import { usePlannerStore } from '../store/usePlannerStore';
import { MonthViewHeader } from '../components/planner/MonthViewHeader';
import { StatusRibbon } from '../components/planner/StatusRibbon';
import { AccountTable } from '../components/planner/AccountTable';
import { TotalsFooter } from '../components/planner/TotalsFooter';
import { MonthSearchFilter } from '../components/planner/MonthSearchFilter';
import { AccountFilters } from '../components/planner/AccountFilters';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { EmptyState } from '../components/common/EmptyState';
import type { AggregatedMonth } from '../types/plannedExpensesAggregated';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { TableSkeleton } from '../components/common/TableSkeleton';

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
  const [selectedAccountType, setSelectedAccountType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [showNegativeOnly, setShowNegativeOnly] = useState<boolean>(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);
  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handlePrintPreview = () => {
    setPrintPreviewOpen(true);
  };

  // Enhanced keyboard navigation
  useKeyboardNavigation({
    enableArrowKeys: true,
    enableEnterToSave: false,
    enableEscapeToCancel: true,
    enabled: true,
    focusTargetRef: tableRef,
    onEscape: () => {
      // Clear filters on Escape
      setSelectedAccount(null);
      setSelectedBucket(null);
      setSelectedAccountType(null);
      setSelectedStatus(null);
      setMinAmount(null);
      setMaxAmount(null);
      setShowNegativeOnly(false);
    },
  });

  const availableMonths = getAvailableMonths();

  // Simulate initial load (since Zustand with localforage loads synchronously, this is just for UX)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

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
    setSelectedAccountType(null);
    setSelectedStatus(null);
    setMinAmount(null);
    setMaxAmount(null);
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
    const { accounts: bankAccounts } = useBankAccountsStore.getState();
    const accountsMap = new Map(bankAccounts.map((acc) => [acc.id, acc]));

    // Filter by account
    if (selectedAccount) {
      accounts = accounts.filter((account) => account.id === selectedAccount);
    }

    // Filter by account type
    if (selectedAccountType) {
      accounts = accounts.filter((account) => {
        const bankAccount = accountsMap.get(account.id);
        return bankAccount?.accountType === selectedAccountType;
      });
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

    // Filter by status (pending/paid) - check if bucket has pending or paid status
    if (selectedStatus) {
      accounts = accounts.filter((account) => {
        // Check if any bucket for this account matches the status
        return Object.keys(account.bucketAmounts).some((bucketId) => {
          const bucketStatus = activeMonth.statusByBucket[bucketId];
          return bucketStatus === selectedStatus;
        });
      });
    }

    // Filter by amount range (remaining cash)
    if (minAmount !== null) {
      accounts = accounts.filter(
        (account) => account.remainingCash !== null && account.remainingCash >= minAmount!
      );
    }
    if (maxAmount !== null) {
      accounts = accounts.filter(
        (account) => account.remainingCash !== null && account.remainingCash <= maxAmount!
      );
    }

    // Filter by negative cash only
    if (showNegativeOnly) {
      accounts = accounts.filter(
        (account) => account.remainingCash !== null && account.remainingCash < 0
      );
    }

    return accounts;
  }, [
    activeMonth,
    selectedAccount,
    selectedBucket,
    selectedAccountType,
    selectedStatus,
    minAmount,
    maxAmount,
    showNegativeOnly,
  ]);

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

  // Memoize months data outside JSX (before early return)
  const filteredMonthsData = useMemo(
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
  );

  // Memoize filter change handler (before early return)
  const handleFilterChange = useCallback(
    (filtered: Array<{ id: string; monthStart: string; accounts: Array<{ accountName: string }> }>) => {
      setFilteredMonths(filtered.map((m) => m.id));
    },
    []
  );

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
    <Stack spacing={{ xs: 2, sm: 3 }}>
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          borderRadius: 2 
        }} 
        className="no-print"
      >
        <Stack spacing={{ xs: 1.5, sm: 2 }}>
          <MonthSearchFilter
            months={filteredMonthsData}
            onFilterChange={handleFilterChange}
          />
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1.5, sm: 2 }} 
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: '100%', sm: 200 }, 
                flex: { xs: 1, sm: '0 1 auto' } 
              }}
            >
              <InputLabel id="month-select-label">Select Month</InputLabel>
              <Select
                labelId="month-select-label"
                value={activeMonthId ?? ''}
                label="Select Month"
                onChange={(e) => setActiveMonth(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: { xs: '60vh', sm: 'none' },
                      maxWidth: { xs: '90vw', sm: 'none' },
                    },
                  },
                }}
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
              <Stack 
                direction="row" 
                spacing={{ xs: 1, sm: 1.5 }}
                sx={{ 
                  justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                  flexShrink: 0,
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={handlePrintPreview}
                  size="small"
                  aria-label="Print preview"
                  sx={{
                    minHeight: { xs: 44, sm: 40 },
                    fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                    px: { xs: 1.5, sm: 2 },
                    flex: { xs: 1, sm: '0 1 auto' },
                  }}
                >
                  Preview
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  size="small"
                  aria-label="Print month view"
                  sx={{
                    minHeight: { xs: 44, sm: 40 },
                    fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                    px: { xs: 1.5, sm: 2 },
                    flex: { xs: 1, sm: '0 1 auto' },
                  }}
                >
                  Print
                </Button>
              </Stack>
            )}
          </Stack>
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
            selectedAccountType={selectedAccountType}
            selectedStatus={selectedStatus}
            minAmount={minAmount}
            maxAmount={maxAmount}
            showNegativeOnly={showNegativeOnly}
            onAccountChange={setSelectedAccount}
            onBucketChange={setSelectedBucket}
            onAccountTypeChange={setSelectedAccountType}
            onStatusChange={setSelectedStatus}
            onMinAmountChange={setMinAmount}
            onMaxAmountChange={setMaxAmount}
            onNegativeOnlyChange={setShowNegativeOnly}
            onClear={() => {
              setSelectedAccount(null);
              setSelectedBucket(null);
              setSelectedAccountType(null);
              setSelectedStatus(null);
              setMinAmount(null);
              setMaxAmount(null);
              setShowNegativeOnly(false);
            }}
          />
          {filteredMonth ? (
            <>
              {filteredMonth.accounts.length > 0 ? (
                <>
                  <div ref={tableRef} tabIndex={0} style={{ outline: 'none' }}>
                    {isLoading ? (
                    <TableSkeleton rows={5} columns={8} />
                  ) : (
                    <AccountTable month={filteredMonth} />
                  )}
                  </div>
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
      <PrintPreview
        open={printPreviewOpen}
        onClose={() => setPrintPreviewOpen(false)}
        title={`Print Preview - ${activeMonth ? formatMonthDate(activeMonth.monthStart) : 'Month View'}`}
      >
        <div ref={printContentRef}>
          {activeMonth && totals && (
            <>
              <div className="print-header">
                <Typography variant="h5" component="h1">
                  {formatMonthDate(activeMonth.monthStart)}
                </Typography>
                <Typography variant="caption" className="print-metadata">
                  Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </Typography>
              </div>
              {filteredMonth && filteredMonth.accounts.length > 0 && (
                <>
                  {isLoading ? (
                    <TableSkeleton rows={5} columns={8} />
                  ) : (
                    <AccountTable month={filteredMonth} />
                  )}
                  <TotalsFooter month={activeMonth} totals={totals} />
                </>
              )}
              <div className="print-footer">
                <Typography variant="caption">
                  Instant Express Manager - Monthly Planner Report
                </Typography>
              </div>
            </>
          )}
        </div>
      </PrintPreview>
    </Stack>
  );
});
