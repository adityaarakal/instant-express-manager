/**
 * Auto-generation service
 * Runs checks for due EMIs and Recurring templates
 * Should be called on app startup and periodically
 */

import { useExpenseEMIsStore } from '../store/useExpenseEMIsStore';
import { useSavingsInvestmentEMIsStore } from '../store/useSavingsInvestmentEMIsStore';
import { useRecurringIncomesStore } from '../store/useRecurringIncomesStore';
import { useRecurringExpensesStore } from '../store/useRecurringExpensesStore';
import { useRecurringSavingsInvestmentsStore } from '../store/useRecurringSavingsInvestmentsStore';

/**
 * Check and generate transactions for all active EMIs and Recurring templates
 * Call this on app startup and periodically (e.g., every hour or on visibility change)
 */
export function checkAndGenerateAllTransactions() {
  // Check EMIs
  useExpenseEMIsStore.getState().checkAndGenerateTransactions();
  useSavingsInvestmentEMIsStore.getState().checkAndGenerateTransactions();
  
  // Check Recurring templates
  useRecurringIncomesStore.getState().checkAndGenerateTransactions();
  useRecurringExpensesStore.getState().checkAndGenerateTransactions();
  useRecurringSavingsInvestmentsStore.getState().checkAndGenerateTransactions();
}

/**
 * Set up periodic auto-generation checks
 * Runs every hour and when page becomes visible
 */
export function setupAutoGeneration() {
  // Run immediately on setup
  checkAndGenerateAllTransactions();
  
  // Run every hour
  const intervalId = setInterval(() => {
    checkAndGenerateAllTransactions();
  }, 60 * 60 * 1000); // 1 hour
  
  // Run when page becomes visible (user returns to tab)
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      checkAndGenerateAllTransactions();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

