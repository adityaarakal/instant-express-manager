/**
 * Balance Recalculation Utility
 * 
 * Recalculates account balances from transactions instead of incremental updates.
 * This prevents race conditions and ensures data consistency.
 * 
 * @module balanceRecalculation
 */

import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useTransferTransactionsStore } from '../store/useTransferTransactionsStore';

/**
 * Recalculates balance for a single account from all transactions.
 * This is the source of truth for account balances.
 * 
 * Calculates balance by:
 * - Adding all income transactions with status 'Received'
 * - Subtracting all expense transactions with status 'Paid'
 * - Subtracting all savings/investment transactions with status 'Completed'
 * - Subtracting transfers sent (fromAccountId)
 * - Adding transfers received (toAccountId)
 * 
 * @param {string} accountId - The account ID to recalculate balance for
 * @returns {number} The recalculated balance (rounded to 2 decimal places)
 * 
 * @example
 * const balance = recalculateAccountBalance('account-123');
 * // Returns the calculated balance based on all transactions
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

  // Start with initial balance - this is the opening balance when the account was created
  // This ensures that accounts with existing balances before any transactions are handled correctly
  const initialBalance = account.initialBalance ?? 0;
  let balance = initialBalance;

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
 * Recalculates and updates balance for a single account.
 * 
 * @param {string} accountId - The account ID to recalculate and update
 * @returns {void}
 * 
 * @example
 * recalculateAndUpdateAccountBalance('account-123');
 * // Balance is recalculated and updated in the store
 */
export function recalculateAndUpdateAccountBalance(accountId: string): void {
  const calculatedBalance = recalculateAccountBalance(accountId);
  useBankAccountsStore.getState().updateAccountBalance(accountId, calculatedBalance);
}

/**
 * Recalculates and updates balances for all accounts.
 * Useful for ensuring data consistency after bulk operations or data migration.
 * 
 * @returns {void}
 * 
 * @example
 * // After bulk operations, ensure all balances are correct
 * recalculateAllAccountBalances();
 */
export function recalculateAllAccountBalances(): void {
  const accounts = useBankAccountsStore.getState().accounts;
  accounts.forEach((account) => {
    recalculateAndUpdateAccountBalance(account.id);
  });
}

/**
 * Validates that account balance matches calculated balance.
 * 
 * @param {string} accountId - The account ID to validate
 * @returns {Object} Validation result object
 * @returns {boolean} returns.isValid - True if balance matches (within 0.01 tolerance)
 * @returns {number} returns.currentBalance - Current stored balance
 * @returns {number} returns.calculatedBalance - Calculated balance from transactions
 * @returns {number} returns.difference - Absolute difference between balances
 * 
 * @example
 * const result = validateAccountBalance('account-123');
 * if (!result.isValid) {
 *   console.log(`Balance discrepancy: ${result.difference}`);
 * }
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
 * Validates all account balances.
 * Returns list of accounts with balance discrepancies.
 * 
 * @returns {Array<Object>} Array of accounts with discrepancies
 * @returns {string} returns[].accountId - Account ID
 * @returns {string} returns[].accountName - Account name
 * @returns {number} returns[].currentBalance - Current stored balance
 * @returns {number} returns[].calculatedBalance - Calculated balance from transactions
 * @returns {number} returns[].difference - Absolute difference between balances
 * 
 * @example
 * const discrepancies = validateAllAccountBalances();
 * if (discrepancies.length > 0) {
 *   console.log(`Found ${discrepancies.length} accounts with balance discrepancies`);
 * }
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

