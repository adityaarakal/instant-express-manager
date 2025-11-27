/**
 * Transaction filtering utilities
 * Provides helper functions for filtering transactions by month based on effective dates
 */

import type { ExpenseTransaction, IncomeTransaction, SavingsInvestmentTransaction } from '../types/transactions';

/**
 * Get the effective date for filtering a transaction by month
 * For expenses: Uses dueDate if available, otherwise uses date
 * For income and savings: Always uses date
 * 
 * @param transaction - The transaction to get the effective date for
 * @returns The effective date string (YYYY-MM-DD format)
 */
export function getEffectiveTransactionDate(
  transaction: ExpenseTransaction | IncomeTransaction | SavingsInvestmentTransaction
): string {
  // For expenses, use dueDate if available, otherwise use date
  if ('dueDate' in transaction && transaction.dueDate) {
    return transaction.dueDate;
  }
  // For all transactions, fall back to date
  return transaction.date;
}

/**
 * Check if a transaction falls within a given month range
 * Uses effective date (dueDate for expenses, date otherwise)
 * 
 * @param transaction - The transaction to check
 * @param startDate - Start date of the month (YYYY-MM-DD)
 * @param endDate - End date of the month (YYYY-MM-DD)
 * @returns True if the transaction falls within the month range
 */
export function isTransactionInMonth(
  transaction: ExpenseTransaction | IncomeTransaction | SavingsInvestmentTransaction,
  startDate: string,
  endDate: string
): boolean {
  const effectiveDate = getEffectiveTransactionDate(transaction);
  return effectiveDate >= startDate && effectiveDate <= endDate;
}

/**
 * Get the month ID (YYYY-MM) for a transaction based on its effective date
 * 
 * @param transaction - The transaction to get the month ID for
 * @returns Month ID in format "YYYY-MM"
 */
export function getTransactionMonthId(
  transaction: ExpenseTransaction | IncomeTransaction | SavingsInvestmentTransaction
): string {
  const effectiveDate = getEffectiveTransactionDate(transaction);
  const date = new Date(effectiveDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

