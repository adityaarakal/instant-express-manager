/**
 * Bulk Operations Utility
 * Handles bulk operations on multiple months
 */

import { useAggregatedPlannedMonthsStore } from '../store/useAggregatedPlannedMonthsStore';
import { useToastStore } from '../store/useToastStore';
import {
  createBulkStatusUpdateTransaction,
  executeBulkStatusUpdateWithTransaction,
} from './bulkOperationsTransaction';

/**
 * Bulk update bucket statuses for selected months
 */
export function bulkUpdateBucketStatuses(
  monthIds: string[],
  bucketId: string,
  status: 'Pending' | 'Paid',
): void {
  const { updateBucketStatus } = useAggregatedPlannedMonthsStore.getState();
  const { showSuccess, showError } = useToastStore.getState();

  try {
    let successCount = 0;
    let errorCount = 0;

    monthIds.forEach((monthId) => {
      try {
        updateBucketStatus(monthId, bucketId, status);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to update status for month ${monthId}:`, error);
      }
    });

    if (errorCount === 0) {
      showSuccess(`Successfully updated ${successCount} month${successCount !== 1 ? 's' : ''}`);
    } else {
      showError(`Updated ${successCount} month${successCount !== 1 ? 's' : ''}, ${errorCount} failed`);
    }
  } catch (error) {
    showError(`Bulk update failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Bulk update all bucket statuses to "Paid" for selected months
 * Uses transaction support to ensure all-or-nothing updates
 */
export function bulkMarkAllAsPaid(monthIds: string[]): void {
  const { showSuccess, showError } = useToastStore.getState();

  try {
    // Create transaction for all operations
    const transaction = createBulkStatusUpdateTransaction(monthIds, 'paid');

    // Execute with transaction support
    const result = executeBulkStatusUpdateWithTransaction(transaction);

    if (result.errorCount === 0) {
      showSuccess(
        `Marked all buckets as paid for ${monthIds.length} month${monthIds.length !== 1 ? 's' : ''} (${result.successCount} total updates)`,
      );
    } else {
      showError(
        `Bulk mark as paid failed: ${result.errors.length} error(s). All changes were rolled back.`,
      );
    }
  } catch (error) {
    showError(`Bulk mark as paid failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Bulk update all bucket statuses to "Pending" for selected months
 * Uses transaction support to ensure all-or-nothing updates
 */
export function bulkMarkAllAsPending(monthIds: string[]): void {
  const { showSuccess, showError } = useToastStore.getState();

  try {
    // Create transaction for all operations
    const transaction = createBulkStatusUpdateTransaction(monthIds, 'pending');

    // Execute with transaction support
    const result = executeBulkStatusUpdateWithTransaction(transaction);

    if (result.errorCount === 0) {
      showSuccess(
        `Marked all buckets as pending for ${monthIds.length} month${monthIds.length !== 1 ? 's' : ''} (${result.successCount} total updates)`,
      );
    } else {
      showError(
        `Bulk mark as pending failed: ${result.errors.length} error(s). All changes were rolled back.`,
      );
    }
  } catch (error) {
    showError(`Bulk mark as pending failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Export selected months to CSV
 */
export async function bulkExportMonths(monthIds: string[]): Promise<void> {
  const { showSuccess, showError } = useToastStore.getState();

  try {
    // This is a placeholder - actual export implementation would go here
    // For now, just show a message
    showSuccess(`Export functionality for ${monthIds.length} month${monthIds.length !== 1 ? 's' : ''} will be implemented`);
  } catch (error) {
    showError(`Bulk export failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

