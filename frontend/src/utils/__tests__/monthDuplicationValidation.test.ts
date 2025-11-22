/**
 * Tests for month duplication validation utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMonthDuplicationSnapshot,
  validateMonthDuplicationTarget,
  validateDuplicatedMonth,
} from '../monthDuplicationValidation';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import { useAggregatedPlannedMonthsStore } from '../../store/useAggregatedPlannedMonthsStore';

// Mock stores
vi.mock('../../store/useExpenseTransactionsStore', () => ({
  useExpenseTransactionsStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../../store/useAggregatedPlannedMonthsStore', () => ({
  useAggregatedPlannedMonthsStore: {
    getState: vi.fn(),
  },
}));

describe('monthDuplicationValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMonthDuplicationSnapshot', () => {
    it('should create snapshot with transaction and status counts', () => {
      const mockMonth = {
        id: '2024-01',
        monthStart: '2024-01-01',
        bucketOrder: ['bucket1', 'bucket2'],
        accounts: [],
      };

      const mockTransactions = [
        { id: 't1', date: '2024-01-15', bucket: 'bucket1' },
        { id: 't2', date: '2024-01-20', bucket: 'bucket2' },
      ];

      const mockStatuses = {
        '2024-01': {
          bucket1: 'Pending',
          bucket2: 'Paid',
        },
      };

      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        getMonth: vi.fn((id: string) => (id === '2024-01' ? mockMonth : null)),
        statusByBucket: mockStatuses,
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: mockTransactions,
      } as any);

      const snapshot = createMonthDuplicationSnapshot('2024-01', '2024-02');

      expect(snapshot.sourceMonthId).toBe('2024-01');
      expect(snapshot.targetMonthId).toBe('2024-02');
      expect(snapshot.transactionCount).toBe(2);
      expect(snapshot.statusCount).toBe(2);
      expect(snapshot.timestamp).toBeDefined();
    });

    it('should throw error if source month not found', () => {
      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        getMonth: vi.fn(() => null),
        statusByBucket: {},
      } as any);

      expect(() => {
        createMonthDuplicationSnapshot('2024-01', '2024-02');
      }).toThrow('Source month 2024-01 not found');
    });

    it('should only count transactions with buckets', () => {
      const mockMonth = {
        id: '2024-01',
        monthStart: '2024-01-01',
        bucketOrder: ['bucket1'],
        accounts: [],
      };

      const mockTransactions = [
        { id: 't1', date: '2024-01-15', bucket: 'bucket1' },
        { id: 't2', date: '2024-01-20', bucket: null },
        { id: 't3', date: '2024-01-25', bucket: 'bucket1' },
      ];

      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        getMonth: vi.fn(() => mockMonth),
        statusByBucket: {},
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: mockTransactions,
      } as any);

      const snapshot = createMonthDuplicationSnapshot('2024-01', '2024-02');
      expect(snapshot.transactionCount).toBe(2); // Only transactions with buckets
    });
  });

  describe('validateMonthDuplicationTarget', () => {
    it('should return valid if target month has no transactions', () => {
      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      const result = validateMonthDuplicationTarget('2024-02');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.existingTransactionCount).toBe(0);
    });

    it('should warn if target month has existing transactions', () => {
      const mockTransactions = [
        { id: 't1', date: '2024-02-15', bucket: 'bucket1' },
        { id: 't2', date: '2024-02-20', bucket: 'bucket2' },
      ];

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: mockTransactions,
      } as any);

      const result = validateMonthDuplicationTarget('2024-02');

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('already has');
      expect(result.existingTransactionCount).toBe(2);
    });

    it('should only count transactions in target month', () => {
      const mockTransactions = [
        { id: 't1', date: '2024-02-15', bucket: 'bucket1' },
        { id: 't2', date: '2024-01-20', bucket: 'bucket2' }, // Different month
        { id: 't3', date: '2024-02-25', bucket: 'bucket1' },
      ];

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: mockTransactions,
      } as any);

      const result = validateMonthDuplicationTarget('2024-02');
      expect(result.existingTransactionCount).toBe(2);
    });
  });

  describe('validateDuplicatedMonth', () => {
    it('should validate successfully if all data matches', () => {
      const snapshot = {
        sourceMonthId: '2024-01',
        targetMonthId: '2024-02',
        transactionCount: 2,
        statusCount: 2,
        timestamp: new Date().toISOString(),
      };

      const mockMonth = {
        id: '2024-02',
        monthStart: '2024-02-01',
        bucketOrder: ['bucket1', 'bucket2'],
        accounts: [],
      };

      const mockTransactions = [
        { id: 't1', date: '2024-02-15', bucket: 'bucket1' },
        { id: 't2', date: '2024-02-20', bucket: 'bucket2' },
      ];

      const mockStatuses = {
        '2024-02': {
          bucket1: 'Pending',
          bucket2: 'Paid',
        },
      };

      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        getMonth: vi.fn(() => mockMonth),
        statusByBucket: mockStatuses,
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: mockTransactions,
      } as any);

      const result = validateDuplicatedMonth(snapshot);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.transactionCount).toBe(2);
      expect(result.statusCount).toBe(2);
    });

    it('should return errors if target month not found', () => {
      const snapshot = {
        sourceMonthId: '2024-01',
        targetMonthId: '2024-02',
        transactionCount: 2,
        statusCount: 2,
        timestamp: new Date().toISOString(),
      };

      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        getMonth: vi.fn(() => null),
        statusByBucket: {},
      } as any);

      const result = validateDuplicatedMonth(snapshot);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('not found');
    });

    it('should return errors if transaction count is less than expected', () => {
      const snapshot = {
        sourceMonthId: '2024-01',
        targetMonthId: '2024-02',
        transactionCount: 3,
        statusCount: 2,
        timestamp: new Date().toISOString(),
      };

      const mockMonth = {
        id: '2024-02',
        monthStart: '2024-02-01',
        bucketOrder: ['bucket1', 'bucket2'],
        accounts: [],
      };

      const mockTransactions = [
        { id: 't1', date: '2024-02-15', bucket: 'bucket1' },
        // Only 1 transaction, but expected 3
      ];

      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        getMonth: vi.fn(() => mockMonth),
        statusByBucket: {},
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: mockTransactions,
      } as any);

      const result = validateDuplicatedMonth(snapshot);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('transaction'))).toBe(true);
    });

    it('should return errors if status count is less than expected', () => {
      const snapshot = {
        sourceMonthId: '2024-01',
        targetMonthId: '2024-02',
        transactionCount: 2,
        statusCount: 3,
        timestamp: new Date().toISOString(),
      };

      const mockMonth = {
        id: '2024-02',
        monthStart: '2024-02-01',
        bucketOrder: ['bucket1', 'bucket2'],
        accounts: [],
      };

      const mockStatuses = {
        '2024-02': {
          bucket1: 'Pending',
          // Only 1 status, but expected 3
        },
      };

      vi.mocked(useAggregatedPlannedMonthsStore.getState).mockReturnValue({
        getMonth: vi.fn(() => mockMonth),
        statusByBucket: mockStatuses,
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      const result = validateDuplicatedMonth(snapshot);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('status'))).toBe(true);
    });
  });
});

