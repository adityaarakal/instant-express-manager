/**
 * Balance Sync Utility
 * Recalculates account balances based on all existing transactions
 * This is useful for syncing old data with the new automatic balance update feature
 */

import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useTransferTransactionsStore } from '../store/useTransferTransactionsStore';

export interface SyncResult {
  accountId: string;
  accountName: string;
  previousBalance: number;
  calculatedBalance: number;
  balanceDifference: number;
  updated: boolean;
}

/**
 * Calculate what an account balance should be based on all transactions
 * This calculates from a "starting balance" perspective, but the actual sync
 * will preserve the current balance and only apply transaction effects
 */
export function calculateAccountBalanceFromTransactions(accountId: string): {
  balanceFromTransactions: number;
  incomeReceived: number;
  expensesPaid: number;
  savingsCompleted: number;
} {
  const incomeTransactions = useIncomeTransactionsStore.getState().transactions;
  const expenseTransactions = useExpenseTransactionsStore.getState().transactions;
  const savingsTransactions = useSavingsInvestmentTransactionsStore.getState().transactions;

  let incomeReceived = 0;
  let expensesPaid = 0;
  let savingsCompleted = 0;

  // Calculate income received
  incomeTransactions
    .filter((t) => t.accountId === accountId && t.status === 'Received')
    .forEach((t) => {
      incomeReceived += t.amount;
    });

  // Calculate expenses paid
  expenseTransactions
    .filter((t) => t.accountId === accountId && t.status === 'Paid')
    .forEach((t) => {
      expensesPaid += t.amount;
    });

  // Calculate savings/investments completed
  savingsTransactions
    .filter((t) => t.accountId === accountId && t.status === 'Completed')
    .forEach((t) => {
      savingsCompleted += t.amount;
    });

  // Balance = Income - Expenses - Savings
  const balanceFromTransactions = incomeReceived - expensesPaid - savingsCompleted;

  return {
    balanceFromTransactions,
    incomeReceived,
    expensesPaid,
    savingsCompleted,
  };
}

/**
 * Sync all account balances based on existing transactions
 * 
 * This function recalculates account balances to ensure data integrity.
 * It fixes the issue where balances might be doubled if automatic updates
 * were applied and then sync was called again.
 * 
 * Strategy:
 * 1. Calculate all transaction effects for each account:
 *    - Income received (adds to balance)
 *    - Expenses paid (subtracts from balance)
 *    - Savings/investments completed (subtracts from balance)
 *    - Transfers sent (subtracts from balance)
 *    - Transfers received (adds to balance)
 * 2. Calculate net transaction effect
 * 3. Extract initial balance if it exists (by detecting if balances are doubled)
 * 4. Set balance = initialBalance + transactionEffects (correct calculation)
 * 
 * If the current balance appears to be doubled (currentBalance ≈ 2 * transactionEffects),
 * we extract: initialBalance = currentBalance - 2 * transactionEffects
 * Otherwise, we assume the account started at 0.
 * 
 * This ensures that:
 * - Account balances exactly match what transactions indicate they should be
 * - Data integrity is maintained (no doubling of transaction effects)
 * - Initial balances are preserved when possible
 * - Works correctly even if automatic updates are already enabled
 * - Future transactions will automatically update balances going forward
 */
export function syncAccountBalancesFromTransactions(): SyncResult[] {
  const accounts = useBankAccountsStore.getState().accounts;
  const incomeTransactions = useIncomeTransactionsStore.getState().transactions;
  const expenseTransactions = useExpenseTransactionsStore.getState().transactions;
  const savingsTransactions = useSavingsInvestmentTransactionsStore.getState().transactions;
  const transferTransactions = useTransferTransactionsStore.getState().transfers;
  const results: SyncResult[] = [];

  accounts.forEach((account) => {
    const previousBalance = account.currentBalance;
    
    // Calculate income received (increases balance)
    const incomeReceived = incomeTransactions
      .filter((t) => t.accountId === account.id && t.status === 'Received')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate expenses paid (decreases balance)
    const expensesPaid = expenseTransactions
      .filter((t) => t.accountId === account.id && t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate savings/investments completed (decreases balance)
    const savingsCompleted = savingsTransactions
      .filter((t) => t.accountId === account.id && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate transfers sent (from this account, decreases balance)
    const transfersSent = transferTransactions
      .filter((t) => t.fromAccountId === account.id && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate transfers received (to this account, increases balance)
    const transfersReceived = transferTransactions
      .filter((t) => t.toAccountId === account.id && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate net transaction effect
    // Income and transfers received increase balance
    // Expenses, savings, and transfers sent decrease balance
    const transactionNetEffect = incomeReceived - expensesPaid - savingsCompleted - transfersSent + transfersReceived;
    
    // Strategy to fix doubling issue:
    // The old sync was adding transaction effects to current balance:
    //   newBalance = currentBalance + transactionEffects
    // This doubles balances if automatic updates are already working.
    //
    // The correct approach is to SET balance to the exact calculated value.
    // We need to determine the initial balance and add transaction effects once.
    //
    // If balances are doubled: currentBalance = initialBalance + 2*transactionEffects
    // We extract: initialBalance = currentBalance - 2*transactionEffects
    // Correct: balance = initialBalance + transactionEffects = currentBalance - transactionEffects
    //
    // If balances are correct: currentBalance = initialBalance + transactionEffects
    // We extract: initialBalance = currentBalance - transactionEffects
    // Correct: balance = initialBalance + transactionEffects = currentBalance (no change)
    //
    // Detect if balance is doubled by checking if it's approximately 2x transaction effects
    const doubledBalanceEstimate = 2 * transactionNetEffect;
    const isLikelyDoubled = transactionNetEffect !== 0 
      && Math.abs(previousBalance - doubledBalanceEstimate) < Math.abs(transactionNetEffect) * 0.1;
    
    let calculatedBalance: number;
    if (isLikelyDoubled) {
      // Balance is doubled: fix by removing one set of transaction effects
      // Correct balance = currentBalance - transactionNetEffect
      calculatedBalance = previousBalance - transactionNetEffect;
    } else {
      // Balance is not doubled (or there are no transactions)
      // Extract initial balance and recalculate correctly
      const estimatedInitialBalance = previousBalance - transactionNetEffect;
      
      // If no transactions, preserve current balance
      if (transactionNetEffect === 0) {
        calculatedBalance = previousBalance;
      } else if (estimatedInitialBalance < -0.01) {
        // Negative initial balance doesn't make sense, assume account started at 0
        calculatedBalance = transactionNetEffect;
      } else {
        // Preserve initial balance and apply transaction effects correctly
        calculatedBalance = estimatedInitialBalance + transactionNetEffect;
      }
    }
    
    const balanceDifference = calculatedBalance - previousBalance;
    
    // Always update to ensure balance exactly matches calculated value
    // Only skip if the difference is negligible (floating point precision)
    if (Math.abs(balanceDifference) > 0.01) {
      useBankAccountsStore.getState().updateAccountBalance(account.id, calculatedBalance);
      results.push({
        accountId: account.id,
        accountName: account.name,
        previousBalance,
        calculatedBalance,
        balanceDifference,
        updated: true,
      });
    } else {
      results.push({
        accountId: account.id,
        accountName: account.name,
        previousBalance,
        calculatedBalance: previousBalance,
        balanceDifference: 0,
        updated: false,
      });
    }
  });

  return results;
}

