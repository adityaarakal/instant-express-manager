/**
 * Integration tests for useDataIntegrity hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDataIntegrity } from '../useDataIntegrity';
import { findOrphanedData, cleanupOrphanedData } from '../../utils/orphanedDataCleanup';
import { validateDataIntegrity } from '../../utils/dataMigration';
import { validateAllAccountBalances, recalculateAllAccountBalances } from '../../utils/balanceRecalculation';
import { useToastStore } from '../../store/useToastStore';

// Mock all dependencies
vi.mock('../../utils/orphanedDataCleanup');
vi.mock('../../utils/dataMigration');
vi.mock('../../utils/balanceRecalculation');
vi.mock('../../store/useToastStore');

describe('useDataIntegrity', () => {
  const mockShowWarning = vi.fn();
  const mockShowError = vi.fn();
  const mockShowSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default toast store mock
    vi.mocked(useToastStore).mockReturnValue({
      showWarning: mockShowWarning,
      showError: mockShowError,
      showSuccess: mockShowSuccess,
    } as any);

    // Setup default mocks for utility functions
    vi.mocked(findOrphanedData).mockReturnValue({
      orphanedIncomeTransactions: [],
      orphanedExpenseTransactions: [],
      orphanedSavingsTransactions: [],
      orphanedTransferTransactions: [],
      orphanedAccounts: [],
      orphanedEMIs: [],
      orphanedRecurringTemplates: [],
      totalOrphaned: 0,
    });

    vi.mocked(validateDataIntegrity).mockReturnValue({
      isValid: true,
      errors: [],
    });

    vi.mocked(validateAllAccountBalances).mockReturnValue([]);
  });

  describe('Manual Check Function', () => {
    it('should expose checkDataIntegrity function for manual invocation', async () => {
      const { result } = renderHook(() => useDataIntegrity(false));

      // Wait for hook to initialize
      await waitFor(() => {
        expect(result.current).not.toBeNull();
        expect(result.current.checkDataIntegrity).toBeDefined();
      });

      // Clear previous calls
      vi.clearAllMocks();

      // Manually trigger check
      await result.current.checkDataIntegrity();

      expect(findOrphanedData).toHaveBeenCalled();
      expect(validateDataIntegrity).toHaveBeenCalled();
      expect(validateAllAccountBalances).toHaveBeenCalled();
    });

    it('should detect orphaned data and show warning in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      vi.mocked(findOrphanedData).mockReturnValue({
        orphanedIncomeTransactions: ['t1', 't2'],
        orphanedExpenseTransactions: [],
        orphanedSavingsTransactions: [],
        orphanedTransferTransactions: [],
        orphanedAccounts: [],
        orphanedEMIs: [],
        orphanedRecurringTemplates: [],
        totalOrphaned: 2,
      });

      const { result } = renderHook(() => useDataIntegrity(false));

      await waitFor(() => {
        expect(result.current.checkDataIntegrity).toBeDefined();
      });

      await result.current.checkDataIntegrity();

      expect(mockShowWarning).toHaveBeenCalledWith(
        expect.stringContaining('2 orphaned record(s)'),
        5000,
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show warning in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      vi.mocked(findOrphanedData).mockReturnValue({
        orphanedIncomeTransactions: ['t1'],
        orphanedExpenseTransactions: [],
        orphanedSavingsTransactions: [],
        orphanedTransferTransactions: [],
        orphanedAccounts: [],
        orphanedEMIs: [],
        orphanedRecurringTemplates: [],
        totalOrphaned: 1,
      });

      const { result } = renderHook(() => useDataIntegrity(false));

      await waitFor(() => {
        expect(result.current.checkDataIntegrity).toBeDefined();
      });

      await result.current.checkDataIntegrity();

      expect(mockShowWarning).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should auto-fix orphaned data when autoFix is enabled', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const orphanedReport = {
        orphanedIncomeTransactions: ['t1'],
        orphanedExpenseTransactions: [],
        orphanedSavingsTransactions: [],
        orphanedTransferTransactions: [],
        orphanedAccounts: [],
        orphanedEMIs: [],
        orphanedRecurringTemplates: [],
        totalOrphaned: 1,
      };

      vi.mocked(findOrphanedData).mockReturnValue(orphanedReport);
      vi.mocked(cleanupOrphanedData).mockReturnValue({
        cleaned: 1,
        errors: [],
      });

      const { result } = renderHook(() => useDataIntegrity(true));

      await waitFor(() => {
        expect(result.current.checkDataIntegrity).toBeDefined();
      });

      await result.current.checkDataIntegrity();

      expect(cleanupOrphanedData).toHaveBeenCalledWith(orphanedReport);
      expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringContaining('Cleaned up 1 orphaned record(s)'));

      process.env.NODE_ENV = originalEnv;
    });

    it('should show error if cleanup fails', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const orphanedReport = {
        orphanedIncomeTransactions: ['t1'],
        orphanedExpenseTransactions: [],
        orphanedSavingsTransactions: [],
        orphanedTransferTransactions: [],
        orphanedAccounts: [],
        orphanedEMIs: [],
        orphanedRecurringTemplates: [],
        totalOrphaned: 1,
      };

      vi.mocked(findOrphanedData).mockReturnValue(orphanedReport);
      vi.mocked(cleanupOrphanedData).mockReturnValue({
        cleaned: 0,
        errors: ['Failed to delete t1'],
      });

      const { result } = renderHook(() => useDataIntegrity(true));

      await waitFor(() => {
        expect(result.current.checkDataIntegrity).toBeDefined();
      });

      await result.current.checkDataIntegrity();

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('1 error(s)'),
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Data Integrity Validation', () => {
    it('should detect data integrity issues and show error in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      vi.mocked(validateDataIntegrity).mockReturnValue({
        isValid: false,
        errors: ['Invalid account reference', 'Missing bank'],
      });

      const { result } = renderHook(() => useDataIntegrity(false));

      await waitFor(() => {
        expect(result.current.checkDataIntegrity).toBeDefined();
      });

      await result.current.checkDataIntegrity();

      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('2 error(s)'),
        8000,
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show error if data is valid', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      vi.mocked(validateDataIntegrity).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const { result } = renderHook(() => useDataIntegrity(false));

      await waitFor(() => {
        expect(result.current.checkDataIntegrity).toBeDefined();
      });

      await result.current.checkDataIntegrity();

      expect(mockShowError).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Balance Discrepancy Detection', () => {
    it('should detect balance discrepancies and show warning in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      vi.mocked(validateAllAccountBalances).mockReturnValue([
        {
          accountId: 'account-1',
          accountName: 'Account 1',
          currentBalance: 10000,
          calculatedBalance: 5000,
          difference: 5000,
        },
      ]);

      const { result } = renderHook(() => useDataIntegrity(false));

      await waitFor(() => {
        expect(result.current.checkDataIntegrity).toBeDefined();
      });

      await result.current.checkDataIntegrity();

      expect(mockShowWarning).toHaveBeenCalledWith(
        expect.stringContaining('1 account(s) with balance discrepancies'),
        5000,
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should auto-fix balance discrepancies when autoFix is enabled', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      vi.mocked(validateAllAccountBalances).mockReturnValue([
        {
          accountId: 'account-1',
          accountName: 'Account 1',
          currentBalance: 10000,
          calculatedBalance: 5000,
          difference: 5000,
        },
      ]);

      const { result } = renderHook(() => useDataIntegrity(true));

      await waitFor(() => {
        expect(result.current.checkDataIntegrity).toBeDefined();
      });

      await result.current.checkDataIntegrity();

      expect(recalculateAllAccountBalances).toHaveBeenCalled();
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Recalculated balances'),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not auto-fix balance discrepancies when autoFix is disabled', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      vi.mocked(validateAllAccountBalances).mockReturnValue([
        {
          accountId: 'account-1',
          accountName: 'Account 1',
          currentBalance: 10000,
          calculatedBalance: 5000,
          difference: 5000,
        },
      ]);

      const { result } = renderHook(() => useDataIntegrity(false));

      await waitFor(() => {
        expect(result.current.checkDataIntegrity).toBeDefined();
      });

      await result.current.checkDataIntegrity();

      expect(recalculateAllAccountBalances).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully and show error message in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      vi.mocked(findOrphanedData).mockImplementation(() => {
        throw new Error('Test error');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useDataIntegrity(false));

      await waitFor(() => {
        expect(result.current.checkDataIntegrity).toBeDefined();
      });

      await result.current.checkDataIntegrity();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error during data integrity check:',
        expect.any(Error),
      );
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining('Error during data integrity check'),
      );

      consoleErrorSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should set isChecking state correctly', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { result } = renderHook(() => useDataIntegrity(false));

      await waitFor(() => {
        expect(result.current).not.toBeNull();
        expect(result.current.isChecking).toBeDefined();
      });

      expect(result.current.isChecking).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });

    it('should set lastCheckTime after successful check', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { result } = renderHook(() => useDataIntegrity(false));

      await waitFor(() => {
        expect(result.current.checkDataIntegrity).toBeDefined();
      });

      expect(result.current.lastCheckTime).toBeNull();

      await result.current.checkDataIntegrity();

      await waitFor(() => {
        expect(result.current.lastCheckTime).not.toBeNull();
      });

      expect(result.current.lastCheckTime).toBeInstanceOf(Date);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Return Values', () => {
    it('should return isChecking, lastCheckTime, and checkDataIntegrity', async () => {
      const { result } = renderHook(() => useDataIntegrity(false));

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current).toHaveProperty('isChecking');
      expect(result.current).toHaveProperty('lastCheckTime');
      expect(result.current).toHaveProperty('checkDataIntegrity');
      expect(typeof result.current.isChecking).toBe('boolean');
      expect(result.current.lastCheckTime === null || result.current.lastCheckTime instanceof Date).toBe(true);
      expect(typeof result.current.checkDataIntegrity).toBe('function');
    });
  });
});
