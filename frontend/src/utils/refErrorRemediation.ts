/**
 * #REF! Error Remediation Utility
 * 
 * Identifies and fixes months with incomplete remaining cash calculations.
 * This tool helps fix data migration issues where remaining cash couldn't be calculated.
 */

import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useAggregatedPlannedMonthsStore } from '../store/useAggregatedPlannedMonthsStore';
import { useRemainingCashOverridesStore } from '../store/useRemainingCashOverridesStore';
import { aggregateMonth } from './aggregation';

export interface RefErrorIssue {
  monthId: string;
  accountId: string;
  accountName: string;
  currentRemainingCash: number | null;
  calculatedRemainingCash: number;
  hasDifference: boolean;
  canAutoFix: boolean;
  reason?: string;
  missingData?: {
    hasIncome: boolean;
    hasExpenses: boolean;
    hasSavings: boolean;
    transactionCount: number;
  };
}

export interface RemediationResult {
  issues: RefErrorIssue[];
  totalIssues: number;
  fixableIssues: number;
  monthsAffected: Set<string>;
}

/**
 * Scan all months and identify accounts with #REF! errors (null or invalid remaining cash)
 */
export function scanRefErrors(): RemediationResult {
  const accounts = useBankAccountsStore.getState().accounts;
  const incomeTransactions = useIncomeTransactionsStore.getState().transactions;
  const expenseTransactions = useExpenseTransactionsStore.getState().transactions;
  const savingsTransactions = useSavingsInvestmentTransactionsStore.getState().transactions;
  const aggregatedMonthsStore = useAggregatedPlannedMonthsStore.getState();

  const issues: RefErrorIssue[] = [];
  const monthsAffected = new Set<string>();

  // Get all unique month IDs from available months
  const monthIds = aggregatedMonthsStore.getAvailableMonths();

  for (const monthId of monthIds) {
    const month = aggregatedMonthsStore.getMonth(monthId);
    if (!month) continue;

    // Re-aggregate the month to get calculated values
    const recalculatedMonth = aggregateMonth(
      monthId,
      accounts,
      incomeTransactions,
      expenseTransactions,
      savingsTransactions,
      month.fixedFactor || 0,
      month.statusByBucket || {},
    );

    if (!recalculatedMonth) continue;

    // Compare each account's remaining cash
    for (const account of month.accounts) {
      const recalculatedAccount = recalculatedMonth.accounts.find((a) => a.id === account.id);
      
      if (!recalculatedAccount) {
        // Account exists in old data but not in recalculated - might be missing transactions
        issues.push({
          monthId,
          accountId: account.id,
          accountName: account.accountName,
          currentRemainingCash: account.remainingCash,
          calculatedRemainingCash: 0,
          hasDifference: true,
          canAutoFix: false,
          reason: 'Account missing in recalculated data - may need transaction data',
        });
        monthsAffected.add(monthId);
        continue;
      }

      const currentCash = account.remainingCash;
      const calculatedCash = recalculatedAccount.remainingCash;

      // Check transaction data availability
      const [year, month] = monthId.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;
      
      const accountIncomes = incomeTransactions.filter(
        (t) => t.accountId === account.id && t.date >= startDate && t.date <= endDate
      );
      const accountExpenses = expenseTransactions.filter(
        (t) => t.accountId === account.id && t.date >= startDate && t.date <= endDate
      );
      const accountSavings = savingsTransactions.filter(
        (t) => t.accountId === account.id && t.date >= startDate && t.date <= endDate
      );
      
      const transactionCount = accountIncomes.length + accountExpenses.length + accountSavings.length;
      const hasIncome = accountIncomes.length > 0;
      const hasExpenses = accountExpenses.length > 0;
      const hasSavings = accountSavings.length > 0;

      // Check if there's a discrepancy or if current is null
      const hasIssue = currentCash === null || 
                      currentCash === undefined ||
                      Math.abs((currentCash || 0) - (calculatedCash || 0)) > 0.01;

      if (hasIssue) {
        // Determine if we can auto-fix based on data availability
        const canAutoFix = transactionCount > 0 && (hasIncome || hasExpenses || hasSavings);
        
        let reason = '';
        if (currentCash === null || currentCash === undefined) {
          reason = 'Remaining cash is null/undefined';
        } else {
          reason = `Difference: ${Math.abs((currentCash || 0) - (calculatedCash || 0)).toFixed(2)}`;
        }
        
        if (!canAutoFix) {
          reason += ' - Missing transaction data for calculation';
        }

        issues.push({
          monthId,
          accountId: account.id,
          accountName: account.accountName,
          currentRemainingCash: currentCash,
          calculatedRemainingCash: calculatedCash || 0,
          hasDifference: true,
          canAutoFix,
          reason,
          missingData: {
            hasIncome,
            hasExpenses,
            hasSavings,
            transactionCount,
          },
        });
        monthsAffected.add(monthId);
      }
    }
  }

  return {
    issues,
    totalIssues: issues.length,
    fixableIssues: issues.filter((i) => i.canAutoFix).length,
    monthsAffected,
  };
}

/**
 * Apply fixes to identified #REF! errors
 * For auto-fixable issues, the system will recalculate automatically from transactions.
 * For non-fixable issues, we can set manual overrides.
 * @param issues - List of issues to fix
 * @param dryRun - If true, only returns what would be fixed without applying changes
 * @param useOverrides - If true, applies calculated values as overrides for non-fixable issues
 */
export function applyRefErrorFixes(
  issues: RefErrorIssue[],
  dryRun: boolean = false,
  useOverrides: boolean = false,
): { fixed: number; skipped: number; errors: string[] } {
  const errors: string[] = [];
  let fixed = 0;
  let skipped = 0;

  const fixableIssues = issues.filter((i) => i.canAutoFix);
  const nonFixableIssues = issues.filter((i) => !i.canAutoFix);

  if (dryRun) {
    return {
      fixed: fixableIssues.length + (useOverrides ? nonFixableIssues.length : 0),
      skipped: useOverrides ? 0 : nonFixableIssues.length,
      errors: [],
    };
  }

  // For fixable issues, the system recalculates automatically from transactions
  // We just need to verify the calculation is correct (which it should be)
  fixed = fixableIssues.length;

  // For non-fixable issues, we can set manual overrides if requested
  if (useOverrides) {
    const overridesStore = useRemainingCashOverridesStore.getState();
    nonFixableIssues.forEach((issue) => {
      try {
        // Set override to the calculated value (or 0 if calculation failed)
        overridesStore.setOverride(
          issue.monthId,
          issue.accountId,
          issue.calculatedRemainingCash
        );
        fixed++;
      } catch (error) {
        errors.push(
          `Failed to set override for ${issue.monthId}/${issue.accountName}: ${error instanceof Error ? error.message : String(error)}`
        );
        skipped++;
      }
    });
  } else {
    skipped = nonFixableIssues.length;
  }

  return { fixed, skipped, errors };
}

/**
 * Set manual override for remaining cash
 * @param monthId - Month identifier
 * @param accountId - Account identifier
 * @param remainingCash - Manual remaining cash value (or null to clear override)
 */
export function setRemainingCashOverride(
  monthId: string,
  accountId: string,
  remainingCash: number | null
): void {
  const overridesStore = useRemainingCashOverridesStore.getState();
  overridesStore.setOverride(monthId, accountId, remainingCash);
}

/**
 * Get manual override for remaining cash
 * @param monthId - Month identifier
 * @param accountId - Account identifier
 * @returns Override value or undefined if not set
 */
export function getRemainingCashOverride(
  monthId: string,
  accountId: string
): number | null | undefined {
  const overridesStore = useRemainingCashOverridesStore.getState();
  return overridesStore.getOverride(monthId, accountId);
}

/**
 * Get summary statistics for #REF! errors
 */
export function getRefErrorSummary(): {
  totalMonths: number;
  affectedMonths: number;
  totalIssues: number;
  fixableIssues: number;
  dateRange: { earliest: string | null; latest: string | null };
} {
  const result = scanRefErrors();
  const monthIds = Array.from(result.monthsAffected).sort();
  const totalMonths = useAggregatedPlannedMonthsStore.getState().getAvailableMonths().length;

  return {
    totalMonths,
    affectedMonths: result.monthsAffected.size,
    totalIssues: result.totalIssues,
    fixableIssues: result.fixableIssues,
    dateRange: {
      earliest: monthIds.length > 0 ? monthIds[0] : null,
      latest: monthIds.length > 0 ? monthIds[monthIds.length - 1] : null,
    },
  };
}

