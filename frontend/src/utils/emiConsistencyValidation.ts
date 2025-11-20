/**
 * EMI Consistency Validation Utilities
 * Ensures EMI installment counts match actual transactions
 */

import { useExpenseEMIsStore } from '../store/useExpenseEMIsStore';
import { useSavingsInvestmentEMIsStore } from '../store/useSavingsInvestmentEMIsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';

export interface EMIConsistencyIssue {
  emiId: string;
  emiName: string;
  emiType: 'expense' | 'savings';
  currentCompletedInstallments: number;
  actualTransactionCount: number;
  discrepancy: number;
}

/**
 * Recalculate completedInstallments for an expense EMI based on actual transactions
 */
export function recalculateExpenseEMIInstallments(emiId: string): number {
  const transactions = useExpenseTransactionsStore.getState().transactions;
  const transactionsForEMI = transactions.filter((t) => t.emiId === emiId);
  return transactionsForEMI.length;
}

/**
 * Recalculate completedInstallments for a savings EMI based on actual transactions
 */
export function recalculateSavingsEMIInstallments(emiId: string): number {
  const transactions = useSavingsInvestmentTransactionsStore.getState().transactions;
  const transactionsForEMI = transactions.filter((t) => t.emiId === emiId);
  return transactionsForEMI.length;
}

/**
 * Find all EMIs with inconsistent installment counts
 */
export function findEMIConsistencyIssues(): EMIConsistencyIssue[] {
  const issues: EMIConsistencyIssue[] = [];

  // Check expense EMIs
  const expenseEMIs = useExpenseEMIsStore.getState().emis;
  expenseEMIs.forEach((emi) => {
    const actualCount = recalculateExpenseEMIInstallments(emi.id);
    if (actualCount !== emi.completedInstallments) {
      issues.push({
        emiId: emi.id,
        emiName: emi.name,
        emiType: 'expense',
        currentCompletedInstallments: emi.completedInstallments,
        actualTransactionCount: actualCount,
        discrepancy: actualCount - emi.completedInstallments,
      });
    }
  });

  // Check savings EMIs
  const savingsEMIs = useSavingsInvestmentEMIsStore.getState().emis;
  savingsEMIs.forEach((emi) => {
    const actualCount = recalculateSavingsEMIInstallments(emi.id);
    if (actualCount !== emi.completedInstallments) {
      issues.push({
        emiId: emi.id,
        emiName: emi.name,
        emiType: 'savings',
        currentCompletedInstallments: emi.completedInstallments,
        actualTransactionCount: actualCount,
        discrepancy: actualCount - emi.completedInstallments,
      });
    }
  });

  return issues;
}

/**
 * Fix EMI installment count inconsistencies
 */
export function fixEMIConsistencyIssues(issues: EMIConsistencyIssue[]): {
  fixed: number;
  errors: string[];
} {
  let fixed = 0;
  const errors: string[] = [];

  issues.forEach((issue) => {
    try {
      if (issue.emiType === 'expense') {
        useExpenseEMIsStore.getState().updateEMI(issue.emiId, {
          completedInstallments: issue.actualTransactionCount,
        });
      } else {
        useSavingsInvestmentEMIsStore.getState().updateEMI(issue.emiId, {
          completedInstallments: issue.actualTransactionCount,
        });
      }
      fixed++;
    } catch (error) {
      errors.push(
        `Failed to fix EMI ${issue.emiName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  return { fixed, errors };
}

