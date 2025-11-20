/**
 * Month Duplication Validation
 * Validates and provides safety checks for month duplication operations
 */

import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useAggregatedPlannedMonthsStore } from '../store/useAggregatedPlannedMonthsStore';
import { getMonthStartDateString, getMonthEndDateString } from './datePrecision';

export interface MonthDuplicationSnapshot {
  sourceMonthId: string;
  targetMonthId: string;
  transactionCount: number;
  statusCount: number;
  timestamp: string;
}

/**
 * Create a snapshot of source month data before duplication
 * This allows validation and rollback if needed
 */
export function createMonthDuplicationSnapshot(
  sourceMonthId: string,
  targetMonthId: string,
): MonthDuplicationSnapshot {
  const { getMonth, statusByBucket } = useAggregatedPlannedMonthsStore.getState();
  const { transactions } = useExpenseTransactionsStore.getState();

  const sourceMonth = getMonth(sourceMonthId);
  if (!sourceMonth) {
    throw new Error(`Source month ${sourceMonthId} not found`);
  }

  // Count transactions that will be duplicated
  const sourceStartDate = getMonthStartDateString(sourceMonthId);
  const sourceEndDate = getMonthEndDateString(sourceMonthId);

  const transactionsToDuplicate = transactions.filter((t) => {
    return t.date >= sourceStartDate && t.date <= sourceEndDate && t.bucket;
  });

  const sourceStatuses = statusByBucket[sourceMonthId] || {};

  return {
    sourceMonthId,
    targetMonthId,
    transactionCount: transactionsToDuplicate.length,
    statusCount: Object.keys(sourceStatuses).length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate that target month doesn't have conflicting data
 * Returns warnings if target month already has transactions
 */
export function validateMonthDuplicationTarget(
  targetMonthId: string,
): {
  isValid: boolean;
  warnings: string[];
  existingTransactionCount: number;
} {
  const { transactions } = useExpenseTransactionsStore.getState();
  const targetStartDate = getMonthStartDateString(targetMonthId);
  const targetEndDate = getMonthEndDateString(targetMonthId);

  const existingTransactions = transactions.filter((t) => {
    return t.date >= targetStartDate && t.date <= targetEndDate;
  });

  const warnings: string[] = [];
  if (existingTransactions.length > 0) {
    warnings.push(
      `Target month already has ${existingTransactions.length} transaction(s). Duplication will add to existing data.`,
    );
  }

  return {
    isValid: true, // Always valid, just warnings
    warnings,
    existingTransactionCount: existingTransactions.length,
  };
}

/**
 * Validate duplicated month data after duplication
 * Checks that all expected transactions and statuses were created
 */
export function validateDuplicatedMonth(
  snapshot: MonthDuplicationSnapshot,
): {
  isValid: boolean;
  errors: string[];
  transactionCount: number;
  statusCount: number;
} {
  const { getMonth, statusByBucket } = useAggregatedPlannedMonthsStore.getState();
  const { transactions } = useExpenseTransactionsStore.getState();

  const targetMonth = getMonth(snapshot.targetMonthId);
  const errors: string[] = [];

  if (!targetMonth) {
    errors.push(`Target month ${snapshot.targetMonthId} not found after duplication`);
    return {
      isValid: false,
      errors,
      transactionCount: 0,
      statusCount: 0,
    };
  }

  // Count transactions in target month
  const targetStartDate = getMonthStartDateString(snapshot.targetMonthId);
  const targetEndDate = getMonthEndDateString(snapshot.targetMonthId);

  const duplicatedTransactions = transactions.filter((t) => {
    return t.date >= targetStartDate && t.date <= targetEndDate && t.bucket;
  });

  const targetStatuses = statusByBucket[snapshot.targetMonthId] || {};

  // Validate transaction count (should be at least as many as source, possibly more if target had existing)
  if (duplicatedTransactions.length < snapshot.transactionCount) {
    errors.push(
      `Expected ${snapshot.transactionCount} transactions, but found ${duplicatedTransactions.length} in target month`,
    );
  }

  // Validate status count
  if (Object.keys(targetStatuses).length < snapshot.statusCount) {
    errors.push(
      `Expected ${snapshot.statusCount} bucket statuses, but found ${Object.keys(targetStatuses).length} in target month`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    transactionCount: duplicatedTransactions.length,
    statusCount: Object.keys(targetStatuses).length,
  };
}

