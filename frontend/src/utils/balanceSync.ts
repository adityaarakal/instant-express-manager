/**
 * Balance Sync Utility
 * Recalculates account balances based on all existing transactions
 * This is useful for syncing old data with the new automatic balance update feature
 */

import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';

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
 * This function syncs account balances for existing data where transactions were created
 * before automatic balance updates were implemented.
 * 
 * Strategy:
 * 1. Treat the account's current balance as the "base balance" (starting balance before auto-updates)
 * 2. Calculate all transaction effects: (income received - expenses paid - savings completed)
 * 3. Set new balance = base balance + transaction effects
 * 
 * This ensures that:
 * - Accounts with existing "Received"/"Paid"/"Completed" transactions have their balances updated
 * - The base balance (starting point) is preserved
 * - Future transactions will automatically update balances going forward
 */
export function syncAccountBalancesFromTransactions(): SyncResult[] {
  const accounts = useBankAccountsStore.getState().accounts;
  const incomeTransactions = useIncomeTransactionsStore.getState().transactions;
  const expenseTransactions = useExpenseTransactionsStore.getState().transactions;
  const savingsTransactions = useSavingsInvestmentTransactionsStore.getState().transactions;
  const results: SyncResult[] = [];

  accounts.forEach((account) => {
    const previousBalance = account.currentBalance;
    
    // Calculate transaction effects
    const incomeReceived = incomeTransactions
      .filter((t) => t.accountId === account.id && t.status === 'Received')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expensesPaid = expenseTransactions
      .filter((t) => t.accountId === account.id && t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const savingsCompleted = savingsTransactions
      .filter((t) => t.accountId === account.id && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate net effect of transactions
    // Income increases balance, expenses and savings decrease balance
    const transactionNetEffect = incomeReceived - expensesPaid - savingsCompleted;
    
    // Treat current balance as the base balance (before automatic updates)
    // New balance = base + transaction effects
    const baseBalance = previousBalance;
    const calculatedBalance = baseBalance + transactionNetEffect;
    
    const balanceDifference = calculatedBalance - previousBalance;
    
    // Only update if there's a difference (transaction effects exist)
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

