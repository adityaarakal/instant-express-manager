/**
 * Tests for bulk operations transaction utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createBulkStatusUpdateTransaction,
  executeBulkStatusUpdateWithTransaction,
  type BulkOperationTransaction,
} from '../bulkOperationsTransaction';
import { useAggregatedPlannedMonthsStore } from '../../store/useAggregatedPlannedMonthsStore';

// Mock store
vi.mock('../../store/useAggregatedPlannedMonthsStore', () => ({
  useAggregatedPlannedMonthsStore: {
    getState: vi.fn(),
  },
}));

describe('bulkOperationsTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBulkStatusUpdateTransaction', () => {
    it('should create transaction with operations for all buckets in months', () => {
      const mockMonths = [
        {
          id: '2024-01',
          bucketOrder: ['bucket1', 'bucket2'],
        },
        {
          id: '2024-02',
          bucketOrder: ['bucket1'],
        },
      ];

      const mockStatuses = {
        '2024-01': {
          bucket1: 'Pending',
          bucket2: 'Paid',
        },
        '2024-02': {
          bucket1: 'Pending',
        },
      };

      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        getMonth: vi.fn((id: string) => mockMonths.find((m) => m.id === id)),
        statusByBucket: mockStatuses,
      } as any);

      const transaction = createBulkStatusUpdateTransaction(['2024-01', '2024-02'], 'paid');

      expect(transaction.operations).toHaveLength(3); // 2 buckets + 1 bucket
      expect(transaction.operations[0].monthId).toBe('2024-01');
      expect(transaction.operations[0].bucketId).toBe('bucket1');
      expect(transaction.operations[0].previousStatus).toBe('pending');
      expect(transaction.operations[0].newStatus).toBe('paid');
      expect(typeof transaction.rollback).toBe('function');
    });

    it('should handle months with no previous status', () => {
      const mockMonths = [
        {
          id: '2024-01',
          bucketOrder: ['bucket1'],
        },
      ];

      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        getMonth: vi.fn(() => mockMonths[0]),
        statusByBucket: {}, // No previous statuses
      } as any);

      const transaction = createBulkStatusUpdateTransaction(['2024-01'], 'paid');

      expect(transaction.operations).toHaveLength(1);
      expect(transaction.operations[0].previousStatus).toBeUndefined();
      expect(transaction.operations[0].newStatus).toBe('paid');
    });

    it('should skip months that don\'t exist', () => {
      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        getMonth: vi.fn(() => null),
        statusByBucket: {},
      } as any);

      const transaction = createBulkStatusUpdateTransaction(['2024-01', '2024-02'], 'paid');

      expect(transaction.operations).toHaveLength(0);
    });
  });

  describe('executeBulkStatusUpdateWithTransaction', () => {
    it('should execute all operations successfully', () => {
      const mockUpdateBucketStatus = vi.fn();

      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        updateBucketStatus: mockUpdateBucketStatus,
      } as any);

      const transaction: BulkOperationTransaction = {
        operations: [
          { monthId: '2024-01', bucketId: 'bucket1', previousStatus: 'pending', newStatus: 'paid' },
          { monthId: '2024-01', bucketId: 'bucket2', previousStatus: 'paid', newStatus: 'paid' },
        ],
        rollback: vi.fn(),
      };

      const result = executeBulkStatusUpdateWithTransaction(transaction);

      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockUpdateBucketStatus).toHaveBeenCalledTimes(2);
    });

    it('should handle errors and rollback on partial failure', () => {
      const mockUpdateBucketStatus = vi
        .fn()
        .mockImplementationOnce(() => {
          // First call succeeds
        })
        .mockImplementationOnce(() => {
          throw new Error('Update failed');
        });

      const mockRollback = vi.fn();

      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        updateBucketStatus: mockUpdateBucketStatus,
      } as any);

      const transaction: BulkOperationTransaction = {
        operations: [
          { monthId: '2024-01', bucketId: 'bucket1', previousStatus: 'pending', newStatus: 'paid' },
          { monthId: '2024-01', bucketId: 'bucket2', previousStatus: 'paid', newStatus: 'paid' },
        ],
        rollback: mockRollback,
      };

      const result = executeBulkStatusUpdateWithTransaction(transaction);

      expect(result.successCount).toBe(0); // All rolled back
      expect(result.errorCount).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
      // The rollback message is added as a separate error
      expect(result.errors.some((e) => e.includes('rolled back'))).toBe(true);
      expect(mockRollback).toHaveBeenCalled();
    });

    it('should not rollback if all operations fail', () => {
      const mockUpdateBucketStatus = vi.fn().mockImplementation(() => {
        throw new Error('Update failed');
      });

      const mockRollback = vi.fn();

      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        updateBucketStatus: mockUpdateBucketStatus,
      } as any);

      const transaction: BulkOperationTransaction = {
        operations: [
          { monthId: '2024-01', bucketId: 'bucket1', previousStatus: 'pending', newStatus: 'paid' },
        ],
        rollback: mockRollback,
      };

      const result = executeBulkStatusUpdateWithTransaction(transaction);

      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(1);
      // Rollback is only called if there were successful operations
      expect(mockRollback).not.toHaveBeenCalled();
    });

    it('should include error messages in result', () => {
      const mockUpdateBucketStatus = vi.fn().mockImplementation(() => {
        throw new Error('Custom error message');
      });

      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        updateBucketStatus: mockUpdateBucketStatus,
      } as any);

      const transaction: BulkOperationTransaction = {
        operations: [
          { monthId: '2024-01', bucketId: 'bucket1', previousStatus: 'pending', newStatus: 'paid' },
        ],
        rollback: vi.fn(),
      };

      const result = executeBulkStatusUpdateWithTransaction(transaction);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('2024-01');
      expect(result.errors[0]).toContain('bucket1');
      expect(result.errors[0]).toContain('Custom error message');
    });
  });
});

