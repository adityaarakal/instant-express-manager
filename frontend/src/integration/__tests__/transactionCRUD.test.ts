/**
 * Integration tests for Transaction CRUD operations
 * Tests the complete flow of creating, updating, and deleting transactions
 * along with account balance updates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useBanksStore } from '../../store/useBanksStore';
import { useBankAccountsStore } from '../../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import type { IncomeTransaction } from '../../types/transactions';

describe('Transaction CRUD Integration', () => {
  let bankId: string;
  let accountId: string;

  beforeEach(() => {
    // Clear all stores
    useBanksStore.getState().banks = [];
    useBankAccountsStore.getState().accounts = [];
    useIncomeTransactionsStore.getState().transactions = [];
    useExpenseTransactionsStore.getState().transactions = [];

    // Create a bank and account for each test
    useBanksStore.getState().createBank({ name: 'Test Bank', type: 'Bank' as const });
    const bank = useBanksStore.getState().banks[0];
    bankId = bank.id;

    useBankAccountsStore.getState().createAccount({
      bankId: bank.id,
      name: 'Test Account',
      accountType: 'Savings',
      currentBalance: 1000,
      accountNumber: '123456',
    });
    const account = useBankAccountsStore.getState().accounts[0];
    accountId = account.id;
  });

  describe('Income Transaction CRUD', () => {
    it('should create income transaction and update account balance', () => {
      const { createTransaction } = useIncomeTransactionsStore.getState();
      const initialBalance = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId)!.currentBalance;

      createTransaction({
        date: '2025-01-15',
        amount: 5000,
        accountId,
        category: 'Salary',
        description: 'Monthly Salary',
        status: 'Received',
      });

      expect(useIncomeTransactionsStore.getState().transactions).toHaveLength(1);
      const transaction = useIncomeTransactionsStore.getState().transactions[0];
      expect(transaction.amount).toBe(5000);

      // Verify account balance is updated (Received transaction increases balance)
      const updatedAccount = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId);
      expect(updatedAccount?.currentBalance).toBe(initialBalance + 5000);
    });

    it('should update income transaction status and adjust balance', () => {
      const { createTransaction, updateTransaction } = useIncomeTransactionsStore.getState();
      const initialBalance = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId)!.currentBalance;

      // Create pending transaction
      createTransaction({
        date: '2025-01-15',
        amount: 5000,
        accountId,
        category: 'Salary',
        description: 'Monthly Salary',
        status: 'Pending',
      });

      const transaction = useIncomeTransactionsStore.getState().transactions[0];

      // Balance should not change for pending
      let account = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId);
      expect(account?.currentBalance).toBe(initialBalance);

      // Mark as received
      updateTransaction(transaction.id, { status: 'Received' });

      // Balance should now increase
      account = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId);
      expect(account?.currentBalance).toBe(initialBalance + 5000);

      // Mark as pending again
      updateTransaction(transaction.id, { status: 'Pending' });

      // Balance should decrease back
      account = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId);
      expect(account?.currentBalance).toBe(initialBalance);
    });

    it('should delete income transaction and revert balance change', () => {
      const { createTransaction, deleteTransaction } = useIncomeTransactionsStore.getState();
      const initialBalance = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId)!.currentBalance;

      // Create received transaction
      createTransaction({
        date: '2025-01-15',
        amount: 5000,
        accountId,
        category: 'Salary',
        description: 'Monthly Salary',
        status: 'Received',
      });

      const transaction = useIncomeTransactionsStore.getState().transactions[0];

      // Verify balance increased
      let account = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId);
      expect(account?.currentBalance).toBe(initialBalance + 5000);

      // Delete transaction
      deleteTransaction(transaction.id);

      // Verify balance reverted
      account = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId);
      expect(account?.currentBalance).toBe(initialBalance);
      expect(useIncomeTransactionsStore.getState().transactions).toHaveLength(0);
    });
  });

  describe('Expense Transaction CRUD', () => {
    it('should create expense transaction and update account balance', () => {
      const { createTransaction } = useExpenseTransactionsStore.getState();
      const initialBalance = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId)!.currentBalance;

      createTransaction({
        date: '2025-01-15',
        amount: 500,
        accountId,
        category: 'Utilities',
        bucket: 'Expense',
        description: 'Electricity Bill',
        status: 'Paid',
      });

      expect(useExpenseTransactionsStore.getState().transactions).toHaveLength(1);
      const transaction = useExpenseTransactionsStore.getState().transactions[0];
      expect(transaction.amount).toBe(500);

      // Verify account balance is updated (Paid transaction decreases balance)
      const updatedAccount = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId);
      expect(updatedAccount?.currentBalance).toBe(initialBalance - 500);
    });

    it('should update expense transaction status and adjust balance', () => {
      const { createTransaction, updateTransaction } = useExpenseTransactionsStore.getState();
      const initialBalance = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId)!.currentBalance;

      // Create pending transaction
      createTransaction({
        date: '2025-01-15',
        amount: 500,
        accountId,
        category: 'Utilities',
        bucket: 'Expense',
        description: 'Electricity Bill',
        status: 'Pending',
      });

      const transaction = useExpenseTransactionsStore.getState().transactions[0];

      // Balance should not change for pending
      let account = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId);
      expect(account?.currentBalance).toBe(initialBalance);

      // Mark as paid
      updateTransaction(transaction.id, { status: 'Paid' });

      // Balance should now decrease
      account = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId);
      expect(account?.currentBalance).toBe(initialBalance - 500);

      // Mark as pending again
      updateTransaction(transaction.id, { status: 'Pending' });

      // Balance should increase back
      account = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId);
      expect(account?.currentBalance).toBe(initialBalance);
    });

    it('should delete expense transaction and revert balance change', () => {
      const { createTransaction, deleteTransaction } = useExpenseTransactionsStore.getState();
      const initialBalance = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId)!.currentBalance;

      // Create paid transaction
      createTransaction({
        date: '2025-01-15',
        amount: 500,
        accountId,
        category: 'Utilities',
        bucket: 'Expense',
        description: 'Electricity Bill',
        status: 'Paid',
      });

      const transaction = useExpenseTransactionsStore.getState().transactions[0];

      // Verify balance decreased
      let account = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId);
      expect(account?.currentBalance).toBe(initialBalance - 500);

      // Delete transaction
      deleteTransaction(transaction.id);

      // Verify balance reverted
      account = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId);
      expect(account?.currentBalance).toBe(initialBalance);
      expect(useExpenseTransactionsStore.getState().transactions).toHaveLength(0);
    });
  });

  describe('Mixed Transaction Flow', () => {
    it('should handle income and expense transactions together', () => {
      const { createTransaction: createIncome } = useIncomeTransactionsStore.getState();
      const { createTransaction: createExpense } = useExpenseTransactionsStore.getState();
      const initialBalance = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId)!.currentBalance;

      // Add income
      createIncome({
        date: '2025-01-15',
        amount: 5000,
        accountId,
        category: 'Salary',
        description: 'Monthly Salary',
        status: 'Received',
      });

      // Add expense
      createExpense({
        date: '2025-01-16',
        amount: 500,
        accountId,
        category: 'Utilities',
        bucket: 'Expense',
        description: 'Electricity Bill',
        status: 'Paid',
      });

      // Verify final balance
      const account = useBankAccountsStore.getState().accounts.find((a) => a.id === accountId);
      expect(account?.currentBalance).toBe(initialBalance + 5000 - 500);

      // Verify both transactions exist
      expect(useIncomeTransactionsStore.getState().transactions).toHaveLength(1);
      expect(useExpenseTransactionsStore.getState().transactions).toHaveLength(1);
    });
  });
});

