/**
 * Aggregation utilities for Planned Expenses
 * Converts transactions into aggregated month views
 */

import type {
  AggregatedMonth,
  AggregatedAccount,
  BucketTotals,
} from '../types/plannedExpensesAggregated';
import type { BankAccount } from '../types/bankAccounts';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../types/transactions';
import { calculateRemainingCash } from './formulas';
import { DEFAULT_BUCKETS } from '../config/plannedExpenses';
import { useDueDateOverridesStore } from '../store/useDueDateOverridesStore';
import { useRemainingCashOverridesStore } from '../store/useRemainingCashOverridesStore';
import { getTodayDateString, isDueDatePassed } from './datePrecision';
import { sumCurrency } from './financialPrecision';

/**
 * Aggregate transactions into a monthly view
 * Filters transactions by month, calculates totals, and organizes by account and bucket
 * @param monthId - Month identifier in format "YYYY-MM"
 * @param accounts - List of bank accounts to aggregate
 * @param incomeTransactions - All income transactions
 * @param expenseTransactions - All expense transactions
 * @param savingsTransactions - All savings/investment transactions
 * @param fixedFactor - Fixed factor value for the month
 * @param statusByBucket - Status mapping for each bucket (Pending/Paid)
 * @returns Aggregated month data or null if monthId is invalid
 */
export function aggregateMonth(
  monthId: string,
  accounts: BankAccount[],
  incomeTransactions: IncomeTransaction[],
  expenseTransactions: ExpenseTransaction[],
  savingsTransactions: SavingsInvestmentTransaction[],
  fixedFactor: number,
  statusByBucket: Record<string, 'Pending' | 'Paid'> = {},
): AggregatedMonth | null {
  const [year, month] = monthId.split('-');
  const monthStart = `${year}-${month}-01`;
  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-31`;

  // Filter transactions for this month
  const monthIncomes = incomeTransactions.filter(
    (t) => t.date >= startDate && t.date <= endDate
  );
  const monthExpenses = expenseTransactions.filter(
    (t) => t.date >= startDate && t.date <= endDate
  );
  const monthSavings = savingsTransactions.filter(
    (t) => t.date >= startDate && t.date <= endDate
  );

  // Calculate total inflow with currency precision
  const inflowTotal = sumCurrency(monthIncomes.map((t) => t.amount));

  // Get all unique buckets from expenses
  const bucketIds = new Set<string>();
  monthExpenses.forEach((t) => bucketIds.add(t.bucket));
  const bucketOrder = DEFAULT_BUCKETS.filter((b) => bucketIds.has(b.id)).map((b) => b.id);

  // Aggregate by account
  const aggregatedAccounts: AggregatedAccount[] = accounts.map((account) => {
    const accountIncomes = monthIncomes.filter((t) => t.accountId === account.id);
    const accountExpenses = monthExpenses.filter((t) => t.accountId === account.id);
    const accountSavings = monthSavings.filter((t) => t.accountId === account.id);

    // Calculate savings transfer (sum of savings/investment transactions)
    const savingsTransfer = accountSavings.reduce((sum, t) => sum + t.amount, 0) || null;

    // Calculate bucket amounts from expense transactions
    // Apply due date zeroing logic: if due date has passed, amount becomes 0
    // Unless there's an override for this month/account/bucket
    const bucketAmounts: Record<string, number | null> = {};
    const bucketDueDates: Record<string, string | null> = {};
    const today = getTodayDateString(); // Use consistent date string to avoid timezone issues
    const hasOverride = useDueDateOverridesStore.getState().hasOverride;
    bucketOrder.forEach((bucketId) => {
      const bucketExpenses = accountExpenses.filter((t) => t.bucket === bucketId);
      const isOverridden = hasOverride(monthId, account.id, bucketId);
      
      // Use currency precision for summing
      const amounts = bucketExpenses.map((t) => {
        // Apply due date zeroing: if due date has passed, don't count the amount
        // Unless override is set for this month/account/bucket
        if (isOverridden) {
          return t.amount; // If overridden, use original amount
        }
        // Use date string comparison to avoid timezone issues
        if (t.dueDate && isDueDatePassed(t.dueDate, today)) {
          return 0;
        }
        return t.amount;
      });
      
      const total = sumCurrency(amounts);
      bucketAmounts[bucketId] = total > 0 ? total : null;

      // Get earliest due date for this account-bucket combination
      const dueDates = bucketExpenses
        .map((t) => t.dueDate)
        .filter((d): d is string => d !== null && d !== undefined)
        .sort();
      bucketDueDates[bucketId] = dueDates.length > 0 ? dueDates[0] : null;
    });

    // Calculate remaining cash with currency precision
    const accountInflow = sumCurrency(accountIncomes.map((t) => t.amount));
    const fixedBalance = account.currentBalance; // Use current balance as fixed balance
    
    // Check for manual override first
    const overrideStore = useRemainingCashOverridesStore.getState();
    const manualOverride = overrideStore.getOverride(monthId, account.id);
    
    let remainingCash: number;
    if (manualOverride !== undefined) {
      // Use manual override if set (can be null, which means 0)
      remainingCash = manualOverride ?? 0;
    } else {
      // Calculate from transactions
      remainingCash = calculateRemainingCash({
        baseValue: accountInflow,
        fixedBalances: [fixedBalance || 0],
        savingsTransfers: savingsTransfer ? [savingsTransfer] : [],
        manualAdjustments: [],
      });
    }

    return {
      id: account.id,
      accountName: account.name,
      accountType: account.accountType,
      fixedBalance: fixedBalance || null,
      savingsTransfer,
      remainingCash,
      bucketAmounts,
      bucketDueDates,
      notes: account.notes,
    };
  });

  // Get due dates from expense transactions (earliest due date per bucket)
  const dueDates: Record<string, string | null> = {};
  bucketOrder.forEach((bucketId) => {
    const bucketExpenses = monthExpenses.filter((t) => t.bucket === bucketId && t.dueDate);
    if (bucketExpenses.length > 0) {
      const sorted = bucketExpenses.sort((a, b) => 
        (a.dueDate || '').localeCompare(b.dueDate || '')
      );
      dueDates[bucketId] = sorted[0].dueDate || null;
    } else {
      dueDates[bucketId] = null;
    }
  });

  return {
    id: monthId,
    monthStart,
    inflowTotal,
    fixedFactor,
    accounts: aggregatedAccounts,
    bucketOrder,
    statusByBucket,
    dueDates,
    manualAdjustments: [], // Will be populated separately if needed
    refErrors: [], // Migration-related, can be populated separately
  };
}

/**
 * Calculate bucket totals for a month by status (pending, paid, all)
 * @param month - The aggregated month data
 * @param expenseTransactions - All expense transactions to filter by month
 * @returns Object containing pending, paid, and all totals for each bucket
 */
export function calculateAggregatedBucketTotals(
  month: AggregatedMonth,
  expenseTransactions: ExpenseTransaction[],
): BucketTotals {
  const [year, monthNum] = month.id.split('-');
  const startDate = `${year}-${monthNum}-01`;
  const endDate = `${year}-${monthNum}-31`;

  const monthExpenses = expenseTransactions.filter(
    (t) => t.date >= startDate && t.date <= endDate
  );

  const pending: Record<string, number> = {};
  const paid: Record<string, number> = {};
  const all: Record<string, number> = {};

  month.bucketOrder.forEach((bucketId) => {
    const bucketExpenses = monthExpenses.filter((t) => t.bucket === bucketId);

    const pendingAmount = bucketExpenses
      .filter((t) => t.status === 'Pending')
      .reduce((sum, t) => sum + t.amount, 0);
    const paidAmount = bucketExpenses
      .filter((t) => t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalAmount = bucketExpenses.reduce((sum, t) => sum + t.amount, 0);

    pending[bucketId] = pendingAmount;
    paid[bucketId] = paidAmount;
    all[bucketId] = totalAmount;
  });

  return { pending, paid, all };
}

/**
 * Get all available months from transactions
 * Extracts unique months from all transaction dates and sorts them in descending order
 * (latest first) to prioritize current/recent months
 * @param incomeTransactions - All income transactions
 * @param expenseTransactions - All expense transactions
 * @param savingsTransactions - All savings/investment transactions
 * @returns Array of month IDs (format: "YYYY-MM") sorted latest first
 */
export function getAvailableMonths(
  incomeTransactions: IncomeTransaction[],
  expenseTransactions: ExpenseTransaction[],
  savingsTransactions: SavingsInvestmentTransaction[],
): string[] {
  const monthSet = new Set<string>();

  [...incomeTransactions, ...expenseTransactions, ...savingsTransactions].forEach((t) => {
    const date = new Date(t.date);
    const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(monthId);
  });

  // Sort in descending order (latest first) to prioritize current/recent months
  return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
}

/**
 * Get the latest available month from transactions
 * Returns current month if it has transactions, otherwise the most recent month with transactions
 * @param incomeTransactions - All income transactions
 * @param expenseTransactions - All expense transactions
 * @param savingsTransactions - All savings/investment transactions
 * @returns Latest available month ID (format: "YYYY-MM") or null if no transactions exist
 */
export function getLatestAvailableMonth(
  incomeTransactions: IncomeTransaction[],
  expenseTransactions: ExpenseTransaction[],
  savingsTransactions: SavingsInvestmentTransaction[],
): string | null {
  const availableMonths = getAvailableMonths(incomeTransactions, expenseTransactions, savingsTransactions);
  
  if (availableMonths.length === 0) {
    return null;
  }
  
  // Available months are already sorted latest first, so return the first one
  // But also check if current month exists - if so, prefer that
  const now = new Date();
  const currentMonthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  if (availableMonths.includes(currentMonthId)) {
    return currentMonthId;
  }
  
  // Return the latest available month
  return availableMonths[0];
}

