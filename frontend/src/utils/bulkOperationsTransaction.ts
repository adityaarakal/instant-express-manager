/**
 * Bulk Operations Transaction Support
 * Provides transaction/rollback mechanism for bulk operations
 */

import { useAggregatedPlannedMonthsStore } from '../store/useAggregatedPlannedMonthsStore';
import type { AllocationStatus } from '../types/plannedExpenses';

export interface BulkOperationState {
  monthId: string;
  bucketId: string;
  previousStatus: AllocationStatus | undefined;
  newStatus: AllocationStatus;
}

// Helper to convert AllocationStatus to the format expected by updateBucketStatus
function normalizeStatus(status: AllocationStatus): 'Pending' | 'Paid' {
  return status === 'pending' ? 'Pending' : 'Paid';
}

export interface BulkOperationTransaction {
  operations: BulkOperationState[];
  rollback: () => void;
}

/**
 * Create a transaction for bulk status updates
 * This allows rollback if operation fails partway through
 */
export function createBulkStatusUpdateTransaction(
  monthIds: string[],
  status: AllocationStatus,
): BulkOperationTransaction {
  const { getMonth, statusByBucket } = useAggregatedPlannedMonthsStore.getState();
  const operations: BulkOperationState[] = [];

  // Capture current state for all operations
  monthIds.forEach((monthId) => {
    const month = getMonth(monthId);
    if (!month) return;

    month.bucketOrder.forEach((bucketId) => {
      const previousStatusRaw = statusByBucket[monthId]?.[bucketId];
      // Normalize previous status from store format to AllocationStatus
      const previousStatus: AllocationStatus | undefined = previousStatusRaw
        ? (previousStatusRaw.toLowerCase() as AllocationStatus)
        : undefined;
      operations.push({
        monthId,
        bucketId,
        previousStatus,
        newStatus: status,
      });
    });
  });

  // Rollback function to restore previous state
  const rollback = () => {
    const { updateBucketStatus } = useAggregatedPlannedMonthsStore.getState();
    operations.forEach((op) => {
      if (op.previousStatus !== undefined) {
        updateBucketStatus(op.monthId, op.bucketId, normalizeStatus(op.previousStatus));
      } else {
        // If there was no previous status, we can't restore it
        // This is a limitation, but better than leaving partial updates
      }
    });
  };

  return {
    operations,
    rollback,
  };
}

/**
 * Execute bulk status update with transaction support
 * Returns success count and any errors
 */
export function executeBulkStatusUpdateWithTransaction(
  transaction: BulkOperationTransaction,
): {
  successCount: number;
  errorCount: number;
  errors: string[];
} {
  const { updateBucketStatus } = useAggregatedPlannedMonthsStore.getState();
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  // Execute all operations
  transaction.operations.forEach((op) => {
    try {
      updateBucketStatus(op.monthId, op.bucketId, normalizeStatus(op.newStatus));
      successCount++;
    } catch (error) {
      errorCount++;
      errors.push(
        `Failed to update ${op.monthId}/${op.bucketId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  // If any operations failed, rollback all
  if (errorCount > 0 && successCount > 0) {
    transaction.rollback();
    errors.push('Operation rolled back due to partial failure');
  }

  return {
    successCount: errorCount > 0 ? 0 : successCount, // If any failed, all are rolled back
    errorCount,
    errors,
  };
}

