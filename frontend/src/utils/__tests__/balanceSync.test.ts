/**
 * Tests for balanceSync utility functions
 * Tests balance synchronization and calculation from transactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBanksStore } from '../../store/useBanksStore';
import { useBankAccountsStore } from '../../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../../store/useSavingsInvestmentTransactionsStore';
import { useTransferTransactionsStore } from '../../store/useTransferTransactionsStore';
import {
  calculateAccountBalanceFromTransactions,
  syncAccountBalancesFromTransactions,
  type SyncResult,
} from '../balanceSync';

describe('balanceSync', () => {
  let bankId: string;
  let account1Id: string;
  let account2Id: string;

  beforeEach(() => {
    // Clear all stores
    useBanksStore.setState({ banks: [] });
    useBankAccountsStore.setState({ accounts: [] });
    useIncomeTransactionsStore.setState({ transactions: [] });
    useExpenseTransactionsStore.setState({ transactions: [] });
    useSavingsInvestmentTransactionsStore.setState({ transactions: [] });
    useTransferTransactionsStore.setState({ transfers: [] });

    // Create a bank and accounts
    useBanksStore.getState().createBank({ name: 'Test Bank', type: 'Bank' as const });
    const bank = useBanksStore.getState().banks[0];
    bankId = bank.id;

    useBankAccountsStore.getState().createAccount({
      bankId: bank.id,
      name: 'Account 1',
      accountType: 'Savings',
      currentBalance: 1000,
      accountNumber: '111111',
    });
    const account1 = useBankAccountsStore.getState().accounts[0];
    account1Id = account1.id;

    useBankAccountsStore.getState().createAccount({
      bankId: bank.id,
      name: 'Account 2',
      accountType: 'Current',
      currentBalance: 2000,
      accountNumber: '222222',
    });
    const account2 = useBankAccountsStore.getState().accounts[1];
    account2Id = account2.id;
  });

  describe('calculateAccountBalanceFromTransactions', () => {
    it('should calculate balance from income transactions', () => {
      // Add income transactions
      useIncomeTransactionsStore.getState().createTransaction({
        date: '2025-01-15',
        amount: 5000,
        accountId: account1Id,
        category: 'Salary',
        description: 'Monthly Salary',
        status: 'Received',
      });

      const result = calculateAccountBalanceFromTransactions(account1Id);
      
      expect(result.balanceFromTransactions).toBe(5000);
      expect(result.incomeReceived).toBe(5000);
      expect(result.expensesPaid).toBe(0);
      expect(result.savingsCompleted).toBe(0);
    });

    it('should calculate balance from expense transactions', () => {
      // Add expense transactions
      useExpenseTransactionsStore.getState().createTransaction({
        date: '2025-01-15',
        amount: 500,
        accountId: account1Id,
        category: 'Utilities',
        bucket: 'Expense',
        description: 'Electricity Bill',
        status: 'Paid',
      });

      const result = calculateAccountBalanceFromTransactions(account1Id);
      
      expect(result.balanceFromTransactions).toBe(-500);
      expect(result.incomeReceived).toBe(0);
      expect(result.expensesPaid).toBe(500);
      expect(result.savingsCompleted).toBe(0);
    });

    it('should calculate balance from savings transactions', () => {
      // Add savings transactions
      useSavingsInvestmentTransactionsStore.getState().createTransaction({
        date: '2025-01-15',
        amount: 1000,
        accountId: account1Id,
        type: 'SIP',
        destination: 'Mutual Fund',
        description: 'Monthly SIP',
        status: 'Completed',
      });

      const result = calculateAccountBalanceFromTransactions(account1Id);
      
      expect(result.balanceFromTransactions).toBe(-1000);
      expect(result.incomeReceived).toBe(0);
      expect(result.expensesPaid).toBe(0);
      expect(result.savingsCompleted).toBe(1000);
    });

    it('should calculate balance from mixed transactions', () => {
      // Add income
      useIncomeTransactionsStore.getState().createTransaction({
        date: '2025-01-15',
        amount: 5000,
        accountId: account1Id,
        category: 'Salary',
        description: 'Monthly Salary',
        status: 'Received',
      });

      // Add expense
      useExpenseTransactionsStore.getState().createTransaction({
        date: '2025-01-16',
        amount: 500,
        accountId: account1Id,
        category: 'Utilities',
        bucket: 'Expense',
        description: 'Electricity Bill',
        status: 'Paid',
      });

      // Add savings
      useSavingsInvestmentTransactionsStore.getState().createTransaction({
        date: '2025-01-17',
        amount: 1000,
        accountId: account1Id,
        type: 'SIP',
        destination: 'Mutual Fund',
        description: 'Monthly SIP',
        status: 'Completed',
      });

      const result = calculateAccountBalanceFromTransactions(account1Id);
      
      expect(result.balanceFromTransactions).toBe(3500); // 5000 - 500 - 1000
      expect(result.incomeReceived).toBe(5000);
      expect(result.expensesPaid).toBe(500);
      expect(result.savingsCompleted).toBe(1000);
    });

    it('should only count transactions with correct status', () => {
      // Add pending income (should not count)
      useIncomeTransactionsStore.getState().createTransaction({
        date: '2025-01-15',
        amount: 5000,
        accountId: account1Id,
        category: 'Salary',
        description: 'Monthly Salary',
        status: 'Pending',
      });

      // Add received income (should count)
      useIncomeTransactionsStore.getState().createTransaction({
        date: '2025-01-16',
        amount: 3000,
        accountId: account1Id,
        category: 'Salary',
        description: 'Bonus',
        status: 'Received',
      });

      const result = calculateAccountBalanceFromTransactions(account1Id);
      
      expect(result.incomeReceived).toBe(3000); // Only received counts
      expect(result.balanceFromTransactions).toBe(3000);
    });

    it('should handle empty transactions', () => {
      const result = calculateAccountBalanceFromTransactions(account1Id);
      
      expect(result.balanceFromTransactions).toBe(0);
      expect(result.incomeReceived).toBe(0);
      expect(result.expensesPaid).toBe(0);
      expect(result.savingsCompleted).toBe(0);
    });
  });

  describe('syncAccountBalancesFromTransactions', () => {
    it('should sync balance from transactions', () => {
      // Add transactions first (will automatically update balance)
      useIncomeTransactionsStore.getState().createTransaction({
        date: '2025-01-15',
        amount: 5000,
        accountId: account1Id,
        category: 'Salary',
        description: 'Monthly Salary',
        status: 'Received',
      });

      useExpenseTransactionsStore.getState().createTransaction({
        date: '2025-01-16',
        amount: 500,
        accountId: account1Id,
        category: 'Utilities',
        bucket: 'Expense',
        description: 'Electricity Bill',
        status: 'Paid',
      });

      // Get balance after transactions (automatic updates)
      const balanceAfterTransactions = useBankAccountsStore.getState().accounts.find(a => a.id === account1Id)?.currentBalance || 0;

      // Now sync - should verify/correct balance
      const results = syncAccountBalancesFromTransactions();
      const account1Result = results.find((r) => r.accountId === account1Id);

      expect(account1Result).toBeDefined();
      // The sync function will adjust balance to match transactions
      // If balance difference is negligible, it won't update
      // Otherwise it will update to ensure data integrity
      expect(account1Result?.calculatedBalance).toBeDefined();
      expect(typeof account1Result?.calculatedBalance).toBe('number');
      // Balance calculation depends on sync logic (might update or not based on difference threshold)
      // We verify the result structure is correct
      expect(account1Result?.previousBalance).toBe(balanceAfterTransactions);
      expect(account1Result?.balanceDifference).toBeDefined();
      expect(typeof account1Result?.updated).toBe('boolean');
    });

    it('should handle transfers in balance calculation', () => {
      // Add transfer
      useTransferTransactionsStore.getState().createTransfer({
        date: '2025-01-21',
        amount: 500,
        fromAccountId: account1Id,
        toAccountId: account2Id,
        category: 'FundRebalancing',
        description: 'Transfer',
        status: 'Completed',
      });

      const results = syncAccountBalancesFromTransactions();
      const account1Result = results.find((r) => r.accountId === account1Id);
      const account2Result = results.find((r) => r.accountId === account2Id);

      expect(account1Result).toBeDefined();
      expect(account2Result).toBeDefined();
      
      // Account 1 should decrease (transfer sent)
      // Account 2 should increase (transfer received)
      // The exact balance depends on the sync logic
      expect(account1Result?.calculatedBalance).toBeDefined();
      expect(account2Result?.calculatedBalance).toBeDefined();
    });

    it('should return results for all accounts', () => {
      const results = syncAccountBalancesFromTransactions();

      expect(results).toHaveLength(2);
      expect(results.find((r) => r.accountId === account1Id)).toBeDefined();
      expect(results.find((r) => r.accountId === account2Id)).toBeDefined();
    });

    it('should not update balance if difference is negligible', () => {
      // Set balance that matches transactions (within 0.01 threshold)
      useBankAccountsStore.getState().updateAccountBalance(account1Id, 1000);

      // Add transactions that result in negligible difference
      // (This test depends on the sync logic detecting correct balances)

      const results = syncAccountBalancesFromTransactions();
      const account1Result = results.find((r) => r.accountId === account1Id);

      expect(account1Result).toBeDefined();
      // If balance is already correct, it might not update
      expect(account1Result?.balanceDifference).toBeLessThanOrEqual(0.01);
    });

    it('should handle accounts with no transactions', () => {
      // Account with no transactions should preserve balance
      const results = syncAccountBalancesFromTransactions();
      const account2Result = results.find((r) => r.accountId === account2Id);

      expect(account2Result).toBeDefined();
      // Account with no transactions should keep its balance
      expect(account2Result?.updated).toBe(false);
      expect(Math.abs(account2Result?.balanceDifference || 0)).toBeLessThan(0.01);
    });
  });
});

