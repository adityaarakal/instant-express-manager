/**
 * Month Duplication Utility
 * Handles copying month data (allocations, statuses) to a new month
 */

import { useAggregatedPlannedMonthsStore } from '../store/useAggregatedPlannedMonthsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';

/**
 * Duplicate a month's allocations and statuses to a new month
 */
export function duplicateMonth(
  sourceMonthId: string,
  targetMonthId: string,
): void {
  const { getMonth, statusByBucket } = useAggregatedPlannedMonthsStore.getState();
  const { transactions, createTransaction } = useExpenseTransactionsStore.getState();

  // Get source month data
  const sourceMonth = getMonth(sourceMonthId);
  if (!sourceMonth) {
    throw new Error(`Source month ${sourceMonthId} not found`);
  }

  // Get source month statuses
  const sourceStatuses = statusByBucket[sourceMonthId] || {};

  // Calculate target month date range
  const [targetYear, targetMonth] = targetMonthId.split('-').map(Number);

  // Get source month transactions to duplicate
  const [sourceYear, sourceMonthNum] = sourceMonthId.split('-').map(Number);
  const sourceStartDate = new Date(sourceYear, sourceMonthNum - 1, 1);
  const sourceEndDate = new Date(sourceYear, sourceMonthNum, 0);

  // Find all expense transactions in source month
  const sourceTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return tDate >= sourceStartDate && tDate <= sourceEndDate && t.bucket;
  });

  // Create transactions for target month
  sourceTransactions.forEach((sourceTransaction) => {
    // Calculate the day of month for the source transaction
    const sourceDate = new Date(sourceTransaction.date);
    const dayOfMonth = sourceDate.getDate();
    
    // Create target date (same day of month, but in target month)
    const targetDate = new Date(targetYear, targetMonth - 1, dayOfMonth);
    
    // If day doesn't exist in target month (e.g., Feb 30), use last day of month
    if (targetDate.getMonth() !== targetMonth - 1) {
      targetDate.setDate(0); // Last day of previous month (which is target month)
    }

    // Create new transaction with same data but new date
    createTransaction({
      accountId: sourceTransaction.accountId,
      amount: sourceTransaction.amount,
      date: targetDate.toISOString().split('T')[0],
      category: sourceTransaction.category,
      description: sourceTransaction.description,
      status: sourceTransaction.status,
      bucket: sourceTransaction.bucket,
      notes: sourceTransaction.notes,
    });
  });

  // Copy statuses to target month
  const { updateBucketStatus } = useAggregatedPlannedMonthsStore.getState();
  Object.entries(sourceStatuses).forEach(([bucketId, status]) => {
    updateBucketStatus(targetMonthId, bucketId, status);
  });
}

/**
 * Get available months for duplication (excluding the current month)
 */
export function getAvailableMonthsForDuplication(excludeMonthId: string): Array<{ monthId: string; label: string }> {
  const { getAvailableMonths } = useAggregatedPlannedMonthsStore.getState();
  const availableMonths = getAvailableMonths();
  
  return availableMonths
    .filter((monthId) => monthId !== excludeMonthId)
    .map((monthId) => {
      const [year, month] = monthId.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      const label = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      return { monthId, label };
    })
    .sort((a, b) => b.monthId.localeCompare(a.monthId)); // Sort descending (newest first)
}

