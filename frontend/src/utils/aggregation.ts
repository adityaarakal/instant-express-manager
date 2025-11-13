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

/**
 * Aggregate transactions into a monthly view
 */
export function aggregateMonth(
  monthId: string, // Format: "YYYY-MM"
  accounts: BankAccount[],
  incomeTransactions: IncomeTransaction[],
  expenseTransactions: ExpenseTransaction[],
  savingsTransactions: SavingsInvestmentTransaction[],
  fixedFactor: number,
  statusByBucket: Record<string, 'Pending' | 'Paid'> = {},
): AggregatedMonth | null => {
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

  // Calculate total inflow
  const inflowTotal = monthIncomes.reduce((sum, t) => sum + t.amount, 0);

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
    const bucketAmounts: Record<string, number | null> = {};
    bucketOrder.forEach((bucketId) => {
      const bucketExpenses = accountExpenses.filter((t) => t.bucket === bucketId);
      const total = bucketExpenses.reduce((sum, t) => sum + t.amount, 0);
      bucketAmounts[bucketId] = total > 0 ? total : null;
    });

    // Calculate remaining cash
    const accountInflow = accountIncomes.reduce((sum, t) => sum + t.amount, 0);
    const fixedBalance = account.currentBalance; // Use current balance as fixed balance
    const remainingCash = calculateRemainingCash({
      baseValue: accountInflow,
      fixedBalances: fixedBalance,
      savingsTransfers: savingsTransfer,
      manualAdjustments: [],
    });

    return {
      id: account.id,
      accountName: account.name,
      accountType: account.accountType,
      fixedBalance: fixedBalance || null,
      savingsTransfer,
      remainingCash,
      bucketAmounts,
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
 * Calculate bucket totals for a month
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
    const status = month.statusByBucket[bucketId] || 'Pending';

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

  return Array.from(monthSet).sort();
}

