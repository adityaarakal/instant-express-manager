/**
 * Tests for orphaned data cleanup utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { findOrphanedData, cleanupOrphanedData, type OrphanedDataReport } from '../orphanedDataCleanup';
import { useBankAccountsStore } from '../../store/useBankAccountsStore';
import { useBanksStore } from '../../store/useBanksStore';
import { useIncomeTransactionsStore } from '../../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../../store/useSavingsInvestmentTransactionsStore';
import { useTransferTransactionsStore } from '../../store/useTransferTransactionsStore';
import { useExpenseEMIsStore } from '../../store/useExpenseEMIsStore';
import { useSavingsInvestmentEMIsStore } from '../../store/useSavingsInvestmentEMIsStore';
import { useRecurringIncomesStore } from '../../store/useRecurringIncomesStore';
import { useRecurringExpensesStore } from '../../store/useRecurringExpensesStore';
import { useRecurringSavingsInvestmentsStore } from '../../store/useRecurringSavingsInvestmentsStore';

// Mock all stores
vi.mock('../../store/useBankAccountsStore');
vi.mock('../../store/useBanksStore');
vi.mock('../../store/useIncomeTransactionsStore');
vi.mock('../../store/useExpenseTransactionsStore');
vi.mock('../../store/useSavingsInvestmentTransactionsStore');
vi.mock('../../store/useTransferTransactionsStore');
vi.mock('../../store/useExpenseEMIsStore');
vi.mock('../../store/useSavingsInvestmentEMIsStore');
vi.mock('../../store/useRecurringIncomesStore');
vi.mock('../../store/useRecurringExpensesStore');
vi.mock('../../store/useRecurringSavingsInvestmentsStore');

describe('orphanedDataCleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findOrphanedData', () => {
    it('should return empty report when no orphaned data exists', () => {
      const mockBanks = [{ id: 'bank-1', name: 'Test Bank', type: 'Bank' as const }];
      const mockAccounts = [
        { id: 'account-1', bankId: 'bank-1', name: 'Account 1', accountType: 'Savings' as const, currentBalance: 0, createdAt: '', updatedAt: '' },
      ];

      vi.mocked(useBanksStore.getState).mockReturnValue({ banks: mockBanks } as any);
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({ accounts: mockAccounts } as any);
      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({ transactions: [] } as any);
      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({ transactions: [] } as any);
      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({ transactions: [] } as any);
      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({ transfers: [] } as any);
      vi.mocked(useExpenseEMIsStore.getState).mockReturnValue({ emis: [] } as any);
      vi.mocked(useSavingsInvestmentEMIsStore.getState).mockReturnValue({ emis: [] } as any);
      vi.mocked(useRecurringIncomesStore.getState).mockReturnValue({ templates: [] } as any);
      vi.mocked(useRecurringExpensesStore.getState).mockReturnValue({ templates: [] } as any);
      vi.mocked(useRecurringSavingsInvestmentsStore.getState).mockReturnValue({ templates: [] } as any);

      const result = findOrphanedData();

      expect(result.totalOrphaned).toBe(0);
      expect(result.orphanedIncomeTransactions).toHaveLength(0);
      expect(result.orphanedExpenseTransactions).toHaveLength(0);
    });

    it('should find orphaned income transactions', () => {
      const mockBanks = [{ id: 'bank-1', name: 'Test Bank', type: 'Bank' as const }];
      const mockAccounts = [
        { id: 'account-1', bankId: 'bank-1', name: 'Account 1', accountType: 'Savings' as const, currentBalance: 0, createdAt: '', updatedAt: '' },
      ];
      const mockTransactions = [
        { id: 't1', accountId: 'account-1', amount: 1000, date: '2024-01-01', category: 'Salary', description: 'Salary', status: 'Received' },
        { id: 't2', accountId: 'non-existent', amount: 2000, date: '2024-01-01', category: 'Salary', description: 'Salary', status: 'Received' },
      ];

      vi.mocked(useBanksStore.getState).mockReturnValue({ banks: mockBanks } as any);
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({ accounts: mockAccounts } as any);
      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({ transactions: mockTransactions } as any);
      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({ transactions: [] } as any);
      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({ transactions: [] } as any);
      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({ transfers: [] } as any);
      vi.mocked(useExpenseEMIsStore.getState).mockReturnValue({ emis: [] } as any);
      vi.mocked(useSavingsInvestmentEMIsStore.getState).mockReturnValue({ emis: [] } as any);
      vi.mocked(useRecurringIncomesStore.getState).mockReturnValue({ templates: [] } as any);
      vi.mocked(useRecurringExpensesStore.getState).mockReturnValue({ templates: [] } as any);
      vi.mocked(useRecurringSavingsInvestmentsStore.getState).mockReturnValue({ templates: [] } as any);

      const result = findOrphanedData();

      expect(result.orphanedIncomeTransactions).toContain('t2');
      expect(result.totalOrphaned).toBe(1);
    });

    it('should find orphaned transfer transactions', () => {
      const mockBanks = [{ id: 'bank-1', name: 'Test Bank', type: 'Bank' as const }];
      const mockAccounts = [
        { id: 'account-1', bankId: 'bank-1', name: 'Account 1', accountType: 'Savings' as const, currentBalance: 0, createdAt: '', updatedAt: '' },
      ];
      const mockTransfers = [
        { id: 't1', fromAccountId: 'account-1', toAccountId: 'non-existent', amount: 1000, date: '2024-01-01', description: 'Transfer', status: 'Completed' },
        { id: 't2', fromAccountId: 'non-existent', toAccountId: 'account-1', amount: 500, date: '2024-01-01', description: 'Transfer', status: 'Completed' },
      ];

      vi.mocked(useBanksStore.getState).mockReturnValue({ banks: mockBanks } as any);
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({ accounts: mockAccounts } as any);
      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({ transactions: [] } as any);
      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({ transactions: [] } as any);
      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({ transactions: [] } as any);
      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({ transfers: mockTransfers } as any);
      vi.mocked(useExpenseEMIsStore.getState).mockReturnValue({ emis: [] } as any);
      vi.mocked(useSavingsInvestmentEMIsStore.getState).mockReturnValue({ emis: [] } as any);
      vi.mocked(useRecurringIncomesStore.getState).mockReturnValue({ templates: [] } as any);
      vi.mocked(useRecurringExpensesStore.getState).mockReturnValue({ templates: [] } as any);
      vi.mocked(useRecurringSavingsInvestmentsStore.getState).mockReturnValue({ templates: [] } as any);

      const result = findOrphanedData();

      expect(result.orphanedTransferTransactions).toContain('t1');
      expect(result.orphanedTransferTransactions).toContain('t2');
      expect(result.totalOrphaned).toBe(2);
    });

    it('should find orphaned accounts referencing non-existent banks', () => {
      const mockBanks: any[] = [];
      const mockAccounts = [
        { id: 'account-1', bankId: 'non-existent', name: 'Account 1', accountType: 'Savings' as const, currentBalance: 0, createdAt: '', updatedAt: '' },
      ];

      vi.mocked(useBanksStore.getState).mockReturnValue({ banks: mockBanks } as any);
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({ accounts: mockAccounts } as any);
      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({ transactions: [] } as any);
      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({ transactions: [] } as any);
      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({ transactions: [] } as any);
      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({ transfers: [] } as any);
      vi.mocked(useExpenseEMIsStore.getState).mockReturnValue({ emis: [] } as any);
      vi.mocked(useSavingsInvestmentEMIsStore.getState).mockReturnValue({ emis: [] } as any);
      vi.mocked(useRecurringIncomesStore.getState).mockReturnValue({ templates: [] } as any);
      vi.mocked(useRecurringExpensesStore.getState).mockReturnValue({ templates: [] } as any);
      vi.mocked(useRecurringSavingsInvestmentsStore.getState).mockReturnValue({ templates: [] } as any);

      const result = findOrphanedData();

      expect(result.orphanedAccounts).toContain('account-1');
      expect(result.totalOrphaned).toBe(1);
    });
  });

  describe('cleanupOrphanedData', () => {
    it('should clean up orphaned transactions successfully', () => {
      const mockDeleteTransaction = vi.fn();
      const mockDeleteTransfer = vi.fn();

      const report: OrphanedDataReport = {
        orphanedIncomeTransactions: ['t1'],
        orphanedExpenseTransactions: ['t2'],
        orphanedSavingsTransactions: ['t3'],
        orphanedTransferTransactions: ['t4'],
        orphanedAccounts: [],
        orphanedEMIs: [],
        orphanedRecurringTemplates: [],
        totalOrphaned: 4,
      };

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        deleteTransaction: mockDeleteTransaction,
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        deleteTransaction: mockDeleteTransaction,
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        deleteTransaction: mockDeleteTransaction,
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        deleteTransfer: mockDeleteTransfer,
      } as any);

      const result = cleanupOrphanedData(report);

      expect(result.cleaned).toBe(4);
      expect(result.errors).toHaveLength(0);
      expect(mockDeleteTransaction).toHaveBeenCalledTimes(3);
      expect(mockDeleteTransfer).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during cleanup', () => {
      const mockDeleteTransaction = vi.fn().mockImplementation((id: string) => {
        if (id === 't1') {
          throw new Error('Delete failed');
        }
      });

      const report: OrphanedDataReport = {
        orphanedIncomeTransactions: ['t1', 't2'],
        orphanedExpenseTransactions: [],
        orphanedSavingsTransactions: [],
        orphanedTransferTransactions: [],
        orphanedAccounts: [],
        orphanedEMIs: [],
        orphanedRecurringTemplates: [],
        totalOrphaned: 2,
      };

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        deleteTransaction: mockDeleteTransaction,
      } as any);

      const result = cleanupOrphanedData(report);

      expect(result.cleaned).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('t1');
      expect(result.errors[0]).toContain('Delete failed');
    });
  });
});

