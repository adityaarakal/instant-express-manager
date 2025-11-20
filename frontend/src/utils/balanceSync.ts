/**
 * Balance Sync Utility
 * Recalculates account balances based on all existing transactions
 * This is useful for syncing old data with the new automatic balance update feature
 */

import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { recalculateAccountBalance } from './balanceRecalculation';

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
 * It uses the new balance recalculation utility which always calculates from transactions.
 * 
 * Strategy:
 * 1. For each account, recalculate balance from all transactions
 * 2. Compare with current balance
 * 3. Update if there's a discrepancy
 * 
 * This ensures that:
 * - Account balances exactly match what transactions indicate they should be
 * - Data integrity is maintained
 * - Works correctly even if automatic updates are already enabled
 * - Future transactions will automatically update balances going forward
 */
export function syncAccountBalancesFromTransactions(): SyncResult[] {
  const accounts = useBankAccountsStore.getState().accounts;
  const results: SyncResult[] = [];

  accounts.forEach((account) => {
    const previousBalance = account.currentBalance;
    
    // Use the new recalculation utility which always calculates from transactions
    const calculatedBalance = recalculateAccountBalance(account.id);
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

