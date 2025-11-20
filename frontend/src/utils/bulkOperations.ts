/**
 * Bulk Operations Utility
 * Handles bulk operations on multiple months
 */

import { useAggregatedPlannedMonthsStore } from '../store/useAggregatedPlannedMonthsStore';
import { useToastStore } from '../store/useToastStore';

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
 */
export function bulkMarkAllAsPaid(monthIds: string[]): void {
  const { getMonth, updateBucketStatus } = useAggregatedPlannedMonthsStore.getState();
  const { showSuccess, showError } = useToastStore.getState();

  try {
    let totalUpdates = 0;
    let monthCount = 0;

    monthIds.forEach((monthId) => {
      const month = getMonth(monthId);
      if (!month) return;

      monthCount++;
      month.bucketOrder.forEach((bucketId) => {
        updateBucketStatus(monthId, bucketId, 'Paid');
        totalUpdates++;
      });
    });

    showSuccess(
      `Marked all buckets as paid for ${monthCount} month${monthCount !== 1 ? 's' : ''} (${totalUpdates} total updates)`,
    );
  } catch (error) {
    showError(`Bulk mark as paid failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Bulk update all bucket statuses to "Pending" for selected months
 */
export function bulkMarkAllAsPending(monthIds: string[]): void {
  const { getMonth, updateBucketStatus } = useAggregatedPlannedMonthsStore.getState();
  const { showSuccess, showError } = useToastStore.getState();

  try {
    let totalUpdates = 0;
    let monthCount = 0;

    monthIds.forEach((monthId) => {
      const month = getMonth(monthId);
      if (!month) return;

      monthCount++;
      month.bucketOrder.forEach((bucketId) => {
        updateBucketStatus(monthId, bucketId, 'Pending');
        totalUpdates++;
      });
    });

    showSuccess(
      `Marked all buckets as pending for ${monthCount} month${monthCount !== 1 ? 's' : ''} (${totalUpdates} total updates)`,
    );
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

