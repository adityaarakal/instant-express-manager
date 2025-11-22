/**
 * Tests for EMI consistency validation utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recalculateExpenseEMIInstallments,
  recalculateSavingsEMIInstallments,
  findEMIConsistencyIssues,
  fixEMIConsistencyIssues,
} from '../emiConsistencyValidation';
import { useExpenseEMIsStore } from '../../store/useExpenseEMIsStore';
import { useSavingsInvestmentEMIsStore } from '../../store/useSavingsInvestmentEMIsStore';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../../store/useSavingsInvestmentTransactionsStore';

// Mock stores
vi.mock('../../store/useExpenseEMIsStore');
vi.mock('../../store/useSavingsInvestmentEMIsStore');
vi.mock('../../store/useExpenseTransactionsStore');
vi.mock('../../store/useSavingsInvestmentTransactionsStore');

describe('emiConsistencyValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recalculateExpenseEMIInstallments', () => {
    it('should count transactions for expense EMI', () => {
      const mockTransactions = [
        { id: 't1', emiId: 'emi-1', accountId: 'account-1', amount: 1000, date: '2024-01-01', category: 'EMI', description: 'EMI', status: 'Paid' },
        { id: 't2', emiId: 'emi-1', accountId: 'account-1', amount: 1000, date: '2024-02-01', category: 'EMI', description: 'EMI', status: 'Paid' },
        { id: 't3', emiId: 'emi-2', accountId: 'account-1', amount: 500, date: '2024-01-01', category: 'EMI', description: 'EMI', status: 'Paid' },
      ];

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: mockTransactions,
      } as any);

      const result = recalculateExpenseEMIInstallments('emi-1');
      expect(result).toBe(2);
    });

    it('should return 0 if no transactions found', () => {
      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      const result = recalculateExpenseEMIInstallments('emi-1');
      expect(result).toBe(0);
    });
  });

  describe('recalculateSavingsEMIInstallments', () => {
    it('should count transactions for savings EMI', () => {
      const mockTransactions = [
        { id: 't1', emiId: 'emi-1', accountId: 'account-1', amount: 2000, date: '2024-01-01', category: 'Investment', description: 'EMI', status: 'Completed' },
        { id: 't2', emiId: 'emi-1', accountId: 'account-1', amount: 2000, date: '2024-02-01', category: 'Investment', description: 'EMI', status: 'Completed' },
      ];

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: mockTransactions,
      } as any);

      const result = recalculateSavingsEMIInstallments('emi-1');
      expect(result).toBe(2);
    });
  });

  describe('findEMIConsistencyIssues', () => {
    it('should find no issues when counts match', () => {
      const mockEMIs = [
        { id: 'emi-1', name: 'EMI 1', completedInstallments: 2, totalInstallments: 12, accountId: 'account-1', amount: 1000, startDate: '2024-01-01', endDate: '2024-12-01', createdAt: '', updatedAt: '' },
      ];

      const mockTransactions = [
        { id: 't1', emiId: 'emi-1', accountId: 'account-1', amount: 1000, date: '2024-01-01', category: 'EMI', description: 'EMI', status: 'Paid' },
        { id: 't2', emiId: 'emi-1', accountId: 'account-1', amount: 1000, date: '2024-02-01', category: 'EMI', description: 'EMI', status: 'Paid' },
      ];

      vi.mocked(useExpenseEMIsStore.getState).mockReturnValue({
        emis: mockEMIs,
      } as any);

      vi.mocked(useSavingsInvestmentEMIsStore.getState).mockReturnValue({
        emis: [],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: mockTransactions,
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      const result = findEMIConsistencyIssues();
      expect(result).toHaveLength(0);
    });

    it('should find issues when counts do not match', () => {
      const mockEMIs = [
        { id: 'emi-1', name: 'EMI 1', completedInstallments: 3, totalInstallments: 12, accountId: 'account-1', amount: 1000, startDate: '2024-01-01', endDate: '2024-12-01', createdAt: '', updatedAt: '' },
      ];

      const mockTransactions = [
        { id: 't1', emiId: 'emi-1', accountId: 'account-1', amount: 1000, date: '2024-01-01', category: 'EMI', description: 'EMI', status: 'Paid' },
        { id: 't2', emiId: 'emi-1', accountId: 'account-1', amount: 1000, date: '2024-02-01', category: 'EMI', description: 'EMI', status: 'Paid' },
      ];

      vi.mocked(useExpenseEMIsStore.getState).mockReturnValue({
        emis: mockEMIs,
      } as any);

      vi.mocked(useSavingsInvestmentEMIsStore.getState).mockReturnValue({
        emis: [],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: mockTransactions,
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      const result = findEMIConsistencyIssues();
      expect(result).toHaveLength(1);
      expect(result[0].emiId).toBe('emi-1');
      expect(result[0].emiType).toBe('expense');
      expect(result[0].currentCompletedInstallments).toBe(3);
      expect(result[0].actualTransactionCount).toBe(2);
      expect(result[0].discrepancy).toBe(-1);
    });

    it('should find issues for savings EMIs', () => {
      const mockEMIs = [
        { id: 'emi-1', name: 'Savings EMI 1', completedInstallments: 1, totalInstallments: 12, accountId: 'account-1', amount: 2000, startDate: '2024-01-01', endDate: '2024-12-01', createdAt: '', updatedAt: '' },
      ];

      const mockTransactions = [
        { id: 't1', emiId: 'emi-1', accountId: 'account-1', amount: 2000, date: '2024-01-01', category: 'Investment', description: 'EMI', status: 'Completed' },
        { id: 't2', emiId: 'emi-1', accountId: 'account-1', amount: 2000, date: '2024-02-01', category: 'Investment', description: 'EMI', status: 'Completed' },
      ];

      vi.mocked(useExpenseEMIsStore.getState).mockReturnValue({
        emis: [],
      } as any);

      vi.mocked(useSavingsInvestmentEMIsStore.getState).mockReturnValue({
        emis: mockEMIs,
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: mockTransactions,
      } as any);

      const result = findEMIConsistencyIssues();
      expect(result).toHaveLength(1);
      expect(result[0].emiType).toBe('savings');
      expect(result[0].discrepancy).toBe(1);
    });
  });

  describe('fixEMIConsistencyIssues', () => {
    it('should fix expense EMI issues', () => {
      const mockUpdateEMI = vi.fn();
      const issues = [
        {
          emiId: 'emi-1',
          emiName: 'EMI 1',
          emiType: 'expense' as const,
          currentCompletedInstallments: 3,
          actualTransactionCount: 2,
          discrepancy: -1,
        },
      ];

      vi.mocked(useExpenseEMIsStore.getState).mockReturnValue({
        updateEMI: mockUpdateEMI,
      } as any);

      const result = fixEMIConsistencyIssues(issues);

      expect(result.fixed).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockUpdateEMI).toHaveBeenCalledWith('emi-1', { completedInstallments: 2 });
    });

    it('should fix savings EMI issues', () => {
      const mockUpdateEMI = vi.fn();
      const issues = [
        {
          emiId: 'emi-1',
          emiName: 'Savings EMI 1',
          emiType: 'savings' as const,
          currentCompletedInstallments: 1,
          actualTransactionCount: 2,
          discrepancy: 1,
        },
      ];

      vi.mocked(useSavingsInvestmentEMIsStore.getState).mockReturnValue({
        updateEMI: mockUpdateEMI,
      } as any);

      const result = fixEMIConsistencyIssues(issues);

      expect(result.fixed).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockUpdateEMI).toHaveBeenCalledWith('emi-1', { completedInstallments: 2 });
    });

    it('should handle errors during fix', () => {
      const mockUpdateEMI = vi.fn().mockImplementation(() => {
        throw new Error('Update failed');
      });

      const issues = [
        {
          emiId: 'emi-1',
          emiName: 'EMI 1',
          emiType: 'expense' as const,
          currentCompletedInstallments: 3,
          actualTransactionCount: 2,
          discrepancy: -1,
        },
      ];

      vi.mocked(useExpenseEMIsStore.getState).mockReturnValue({
        updateEMI: mockUpdateEMI,
      } as any);

      const result = fixEMIConsistencyIssues(issues);

      expect(result.fixed).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('EMI 1');
      expect(result.errors[0]).toContain('Update failed');
    });
  });
});

