/**
 * Tests for balance recalculation utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recalculateAccountBalance,
  recalculateAndUpdateAccountBalance,
  recalculateAllAccountBalances,
  validateAccountBalance,
  validateAllAccountBalances,
} from '../balanceRecalculation';
import { useBankAccountsStore } from '../../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../../store/useSavingsInvestmentTransactionsStore';
import { useTransferTransactionsStore } from '../../store/useTransferTransactionsStore';

// Mock stores
vi.mock('../../store/useBankAccountsStore', () => ({
  useBankAccountsStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../../store/useIncomeTransactionsStore', () => ({
  useIncomeTransactionsStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../../store/useExpenseTransactionsStore', () => ({
  useExpenseTransactionsStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../../store/useSavingsInvestmentTransactionsStore', () => ({
  useSavingsInvestmentTransactionsStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../../store/useTransferTransactionsStore', () => ({
  useTransferTransactionsStore: {
    getState: vi.fn(),
  },
}));

describe('balanceRecalculation', () => {
  const mockAccount = {
    id: 'account-1',
    name: 'Test Account',
    bankId: 'bank-1',
    accountType: 'Savings' as const,
    currentBalance: 1000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recalculateAccountBalance', () => {
    it('should return 0 if account not found', () => {
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        getAccount: vi.fn(() => null),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        transfers: [],
      } as any);

      const result = recalculateAccountBalance('non-existent');
      expect(result).toBe(0);
    });

    it('should calculate balance from income transactions', () => {
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        getAccount: vi.fn(() => mockAccount),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [
          { id: 't1', accountId: 'account-1', amount: 5000, status: 'Received' },
          { id: 't2', accountId: 'account-1', amount: 3000, status: 'Received' },
        ],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        transfers: [],
      } as any);

      const result = recalculateAccountBalance('account-1');
      expect(result).toBe(8000); // 5000 + 3000
    });

    it('should subtract expense transactions', () => {
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        getAccount: vi.fn(() => mockAccount),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [
          { id: 't1', accountId: 'account-1', amount: 10000, status: 'Received' },
        ],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [
          { id: 't2', accountId: 'account-1', amount: 2000, status: 'Paid' },
          { id: 't3', accountId: 'account-1', amount: 3000, status: 'Paid' },
        ],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        transfers: [],
      } as any);

      const result = recalculateAccountBalance('account-1');
      expect(result).toBe(5000); // 10000 - 2000 - 3000
    });

    it('should subtract savings/investment transactions', () => {
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        getAccount: vi.fn(() => mockAccount),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [
          { id: 't1', accountId: 'account-1', amount: 10000, status: 'Received' },
        ],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [
          { id: 't2', accountId: 'account-1', amount: 2000, status: 'Completed' },
        ],
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        transfers: [],
      } as any);

      const result = recalculateAccountBalance('account-1');
      expect(result).toBe(8000); // 10000 - 2000
    });

    it('should handle transfer transactions', () => {
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        getAccount: vi.fn(() => mockAccount),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        transfers: [
          { id: 't1', fromAccountId: 'account-1', toAccountId: 'account-2', amount: 1000, status: 'Completed' },
          { id: 't2', fromAccountId: 'account-2', toAccountId: 'account-1', amount: 500, status: 'Completed' },
        ],
      } as any);

      const result = recalculateAccountBalance('account-1');
      expect(result).toBe(-500); // -1000 + 500
    });

    it('should only count transactions with correct status', () => {
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        getAccount: vi.fn(() => mockAccount),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [
          { id: 't1', accountId: 'account-1', amount: 5000, status: 'Received' },
          { id: 't2', accountId: 'account-1', amount: 3000, status: 'Pending' }, // Should not count
        ],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [
          { id: 't3', accountId: 'account-1', amount: 1000, status: 'Paid' },
          { id: 't4', accountId: 'account-1', amount: 500, status: 'Pending' }, // Should not count
        ],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        transfers: [],
      } as any);

      const result = recalculateAccountBalance('account-1');
      expect(result).toBe(4000); // 5000 - 1000 (only Received and Paid count)
    });

    it('should round to 2 decimal places', () => {
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        getAccount: vi.fn(() => mockAccount),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [
          { id: 't1', accountId: 'account-1', amount: 10.123, status: 'Received' },
          { id: 't2', accountId: 'account-1', amount: 20.456, status: 'Received' },
        ],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        transfers: [],
      } as any);

      const result = recalculateAccountBalance('account-1');
      expect(result).toBe(30.58); // Rounded to 2 decimal places
    });
  });

  describe('recalculateAndUpdateAccountBalance', () => {
    it('should update account balance', () => {
      const mockUpdateAccountBalance = vi.fn();

      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        getAccount: vi.fn(() => mockAccount),
        updateAccountBalance: mockUpdateAccountBalance,
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [
          { id: 't1', accountId: 'account-1', amount: 5000, status: 'Received' },
        ],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        transfers: [],
      } as any);

      recalculateAndUpdateAccountBalance('account-1');

      expect(mockUpdateAccountBalance).toHaveBeenCalledWith('account-1', 5000);
    });
  });

  describe('recalculateAllAccountBalances', () => {
    it('should recalculate all account balances', () => {
      const mockAccounts = [
        { ...mockAccount, id: 'account-1' },
        { ...mockAccount, id: 'account-2' },
      ];

      const mockUpdateAccountBalance = vi.fn();

      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        accounts: mockAccounts,
        getAccount: vi.fn((id: string) => mockAccounts.find((a) => a.id === id)),
        updateAccountBalance: mockUpdateAccountBalance,
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        transfers: [],
      } as any);

      recalculateAllAccountBalances();

      expect(mockUpdateAccountBalance).toHaveBeenCalledTimes(2);
      expect(mockUpdateAccountBalance).toHaveBeenCalledWith('account-1', 0);
      expect(mockUpdateAccountBalance).toHaveBeenCalledWith('account-2', 0);
    });
  });

  describe('validateAccountBalance', () => {
    it('should return valid if balance matches', () => {
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        getAccount: vi.fn(() => ({ ...mockAccount, currentBalance: 5000 })),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [
          { id: 't1', accountId: 'account-1', amount: 5000, status: 'Received' },
        ],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        transfers: [],
      } as any);

      const result = validateAccountBalance('account-1');

      expect(result.isValid).toBe(true);
      expect(result.currentBalance).toBe(5000);
      expect(result.calculatedBalance).toBe(5000);
      expect(result.difference).toBeLessThan(0.01);
    });

    it('should return invalid if balance does not match', () => {
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        getAccount: vi.fn(() => ({ ...mockAccount, currentBalance: 10000 })),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [
          { id: 't1', accountId: 'account-1', amount: 5000, status: 'Received' },
        ],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        transfers: [],
      } as any);

      const result = validateAccountBalance('account-1');

      expect(result.isValid).toBe(false);
      expect(result.currentBalance).toBe(10000);
      expect(result.calculatedBalance).toBe(5000);
      expect(result.difference).toBe(5000);
    });

    it('should return invalid if account not found', () => {
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        getAccount: vi.fn(() => null),
      } as any);

      const result = validateAccountBalance('non-existent');

      expect(result.isValid).toBe(false);
      expect(result.currentBalance).toBe(0);
      expect(result.calculatedBalance).toBe(0);
      expect(result.difference).toBe(0);
    });
  });

  describe('validateAllAccountBalances', () => {
    it('should return list of accounts with discrepancies', () => {
      const mockAccounts = [
        { ...mockAccount, id: 'account-1', currentBalance: 10000 },
        { ...mockAccount, id: 'account-2', currentBalance: 5000 },
      ];

      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        accounts: mockAccounts,
        getAccount: vi.fn((id: string) => mockAccounts.find((a) => a.id === id)),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [
          { id: 't1', accountId: 'account-1', amount: 5000, status: 'Received' },
          { id: 't2', accountId: 'account-2', amount: 5000, status: 'Received' },
        ],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        transfers: [],
      } as any);

      const result = validateAllAccountBalances();

      expect(result).toHaveLength(1); // Only account-1 has discrepancy
      expect(result[0].accountId).toBe('account-1');
      expect(result[0].currentBalance).toBe(10000);
      expect(result[0].calculatedBalance).toBe(5000);
      expect(result[0].difference).toBe(5000);
    });

    it('should return empty array if all balances are valid', () => {
      const mockAccounts = [
        { ...mockAccount, id: 'account-1', currentBalance: 5000 },
        { ...mockAccount, id: 'account-2', currentBalance: 5000 },
      ];

      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        accounts: mockAccounts,
        getAccount: vi.fn((id: string) => mockAccounts.find((a) => a.id === id)),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [
          { id: 't1', accountId: 'account-1', amount: 5000, status: 'Received' },
          { id: 't2', accountId: 'account-2', amount: 5000, status: 'Received' },
        ],
      } as any);

      vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      vi.mocked(useTransferTransactionsStore.getState).mockReturnValue({
        transfers: [],
      } as any);

      const result = validateAllAccountBalances();

      expect(result).toHaveLength(0);
    });
  });
});

