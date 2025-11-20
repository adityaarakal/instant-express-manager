/**
 * Balance Recalculation Utility
 * Recalculates account balances from transactions instead of incremental updates
 * This prevents race conditions and ensures data consistency
 */

import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useTransferTransactionsStore } from '../store/useTransferTransactionsStore';

/**
 * Recalculate balance for a single account from all transactions
 * This is the source of truth for account balances
 */
export function recalculateAccountBalance(accountId: string): number {
  const incomeTransactions = useIncomeTransactionsStore.getState().transactions;
  const expenseTransactions = useExpenseTransactionsStore.getState().transactions;
  const savingsTransactions = useSavingsInvestmentTransactionsStore.getState().transactions;
  const transferTransactions = useTransferTransactionsStore.getState().transfers;
  const account = useBankAccountsStore.getState().getAccount(accountId);

  if (!account) {
    return 0;
  }

  // Start with 0 - balances are calculated purely from transactions
  // If an account has an initial balance, it should be set as the account's currentBalance
  // and this recalculation will maintain it by calculating the difference
  let balance = 0;

  // Add income received
  const incomeReceived = incomeTransactions
    .filter((t) => t.accountId === accountId && t.status === 'Received')
    .reduce((sum, t) => sum + t.amount, 0);

  // Subtract expenses paid
  const expensesPaid = expenseTransactions
    .filter((t) => t.accountId === accountId && t.status === 'Paid')
    .reduce((sum, t) => sum + t.amount, 0);

  // Subtract savings/investments completed
  const savingsCompleted = savingsTransactions
    .filter((t) => t.accountId === accountId && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  // Handle transfers
  const transfersSent = transferTransactions
    .filter((t) => t.fromAccountId === accountId && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const transfersReceived = transferTransactions
    .filter((t) => t.toAccountId === accountId && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate final balance
  balance = balance + incomeReceived - expensesPaid - savingsCompleted - transfersSent + transfersReceived;

  return Math.round(balance * 100) / 100; // Round to 2 decimal places
}

/**
 * Recalculate and update balance for a single account
 */
export function recalculateAndUpdateAccountBalance(accountId: string): void {
  const calculatedBalance = recalculateAccountBalance(accountId);
  useBankAccountsStore.getState().updateAccountBalance(accountId, calculatedBalance);
}

/**
 * Recalculate and update balances for all accounts
 * Useful for ensuring data consistency after bulk operations or data migration
 */
export function recalculateAllAccountBalances(): void {
  const accounts = useBankAccountsStore.getState().accounts;
  accounts.forEach((account) => {
    recalculateAndUpdateAccountBalance(account.id);
  });
}

/**
 * Validate that account balance matches calculated balance
 * Returns true if balance is correct, false if there's a discrepancy
 */
export function validateAccountBalance(accountId: string): {
  isValid: boolean;
  currentBalance: number;
  calculatedBalance: number;
  difference: number;
} {
  const account = useBankAccountsStore.getState().getAccount(accountId);
  if (!account) {
    return {
      isValid: false,
      currentBalance: 0,
      calculatedBalance: 0,
      difference: 0,
    };
  }

  const currentBalance = account.currentBalance;
  const calculatedBalance = recalculateAccountBalance(accountId);
  const difference = Math.abs(currentBalance - calculatedBalance);
  const isValid = difference < 0.01; // Allow for floating point precision

  return {
    isValid,
    currentBalance,
    calculatedBalance,
    difference,
  };
}

/**
 * Validate all account balances
 * Returns list of accounts with balance discrepancies
 */
export function validateAllAccountBalances(): Array<{
  accountId: string;
  accountName: string;
  currentBalance: number;
  calculatedBalance: number;
  difference: number;
}> {
  const accounts = useBankAccountsStore.getState().accounts;
  const discrepancies: Array<{
    accountId: string;
    accountName: string;
    currentBalance: number;
    calculatedBalance: number;
    difference: number;
  }> = [];

  accounts.forEach((account) => {
    const validation = validateAccountBalance(account.id);
    if (!validation.isValid) {
      discrepancies.push({
        accountId: account.id,
        accountName: account.name,
        currentBalance: validation.currentBalance,
        calculatedBalance: validation.calculatedBalance,
        difference: validation.difference,
      });
    }
  });

  return discrepancies;
}

