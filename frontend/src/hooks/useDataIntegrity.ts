/**
 * Data Integrity Hook
 * 
 * Automatically validates and fixes data integrity issues on app startup.
 * Checks for orphaned data, balance discrepancies, and other inconsistencies.
 * 
 * @module useDataIntegrity
 */

import { useEffect, useState } from 'react';
import { validateDataIntegrity } from '../utils/dataMigration';
import { findOrphanedData, cleanupOrphanedData } from '../utils/orphanedDataCleanup';
import { validateAllAccountBalances, recalculateAllAccountBalances } from '../utils/balanceRecalculation';
import { useToastStore } from '../store/useToastStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useTransferTransactionsStore } from '../store/useTransferTransactionsStore';

/**
 * Hook to automatically check and fix data integrity issues.
 * Runs on app startup in development mode, or can be enabled in production.
 * 
 * @param {boolean} [autoFix=false] - If true, automatically fixes issues found. If false, only reports them.
 * @returns {Object} Hook return object
 * @returns {boolean} returns.isChecking - True while integrity check is in progress
 * @returns {Date | null} returns.lastCheckTime - Timestamp of last integrity check
 * @returns {Function} returns.checkDataIntegrity - Manual function to trigger integrity check
 * 
 * @example
 * function App() {
 *   const { isChecking, lastCheckTime, checkDataIntegrity } = useDataIntegrity(true);
 *   
 *   return (
 *     <div>
 *       {isChecking && <p>Checking data integrity...</p>}
 *       {lastCheckTime && <p>Last check: {lastCheckTime.toLocaleString()}</p>}
 *       <button onClick={checkDataIntegrity}>Check Now</button>
 *     </div>
 *   );
 * }
 */
export function useDataIntegrity(autoFix: boolean = false) {
  const { showWarning, showError, showSuccess } = useToastStore();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  useEffect(() => {
    // Only run in development mode by default, or if explicitly enabled
    const shouldRun = process.env.NODE_ENV === 'development' || autoFix;

    if (!shouldRun) {
      return;
    }

    // Run check after a short delay to allow stores to initialize
    const timeoutId = setTimeout(() => {
      setIsChecking(true);
      checkDataIntegrity();
    }, 1000);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFix]);

  const checkDataIntegrity = async () => {
    try {
      // 1. Check for orphaned data
      const orphanedData = findOrphanedData();
      if (orphanedData.totalOrphaned > 0) {
        console.warn('Orphaned data found:', orphanedData);
        if (process.env.NODE_ENV === 'development') {
          showWarning(
            `Found ${orphanedData.totalOrphaned} orphaned record(s). Check console for details.`,
            5000,
          );
        }

        // Auto-fix orphaned transactions if enabled
        if (autoFix) {
          const result = cleanupOrphanedData(orphanedData);
          if (result.cleaned > 0) {
            showSuccess(`Cleaned up ${result.cleaned} orphaned record(s)`);
          }
          if (result.errors.length > 0) {
            showError(`Errors during cleanup: ${result.errors.length} error(s)`);
          }
        }
      }

      // 2. Validate data integrity (orphaned references)
      const integrityCheck = validateDataIntegrity();
      if (!integrityCheck.isValid) {
        console.error('Data integrity issues found:', integrityCheck.errors);
        if (process.env.NODE_ENV === 'development') {
          showError(
            `Data integrity issues found: ${integrityCheck.errors.length} error(s). Check console for details.`,
            8000,
          );
        }
      }

      // 3. Validate account balances
      const balanceDiscrepancies = validateAllAccountBalances();
      if (balanceDiscrepancies.length > 0) {
        console.warn('Account balance discrepancies found:', balanceDiscrepancies);
        if (process.env.NODE_ENV === 'development') {
          showWarning(
            `Found ${balanceDiscrepancies.length} account(s) with balance discrepancies. Check console for details.`,
            5000,
          );
        }

        // Auto-fix balance discrepancies if enabled
        if (autoFix) {
          // First, fix initialBalance for accounts where it was incorrectly set during migration
          // For accounts with transactions, initialBalance should be: currentBalance - transactionEffects
          const accounts = useBankAccountsStore.getState().accounts;
          const incomeTransactions = useIncomeTransactionsStore.getState().transactions;
          const expenseTransactions = useExpenseTransactionsStore.getState().transactions;
          const savingsTransactions = useSavingsInvestmentTransactionsStore.getState().transactions;
          const transferTransactions = useTransferTransactionsStore.getState().transfers;
          
          let fixedInitialBalances = 0;
          accounts.forEach((account) => {
            // Calculate transaction effects for this account
            const incomeReceived = incomeTransactions
              .filter(t => t.accountId === account.id && t.status === 'Received')
              .reduce((sum, t) => sum + t.amount, 0);
            const expensesPaid = expenseTransactions
              .filter(t => t.accountId === account.id && t.status === 'Paid')
              .reduce((sum, t) => sum + t.amount, 0);
            const savingsCompleted = savingsTransactions
              .filter(t => t.accountId === account.id && t.status === 'Completed')
              .reduce((sum, t) => sum + t.amount, 0);
            const transfersSent = transferTransactions
              .filter(t => t.fromAccountId === account.id && t.status === 'Completed')
              .reduce((sum, t) => sum + t.amount, 0);
            const transfersReceived = transferTransactions
              .filter(t => t.toAccountId === account.id && t.status === 'Completed')
              .reduce((sum, t) => sum + t.amount, 0);
            
            const transactionEffects = incomeReceived - expensesPaid - savingsCompleted - transfersSent + transfersReceived;
            
            // Calculate what initialBalance should be: currentBalance - transactionEffects
            const correctInitialBalance = account.currentBalance - transactionEffects;
            
            // If initialBalance is wrong (difference > 0.01), fix it
            if (Math.abs(account.initialBalance - correctInitialBalance) > 0.01) {
              useBankAccountsStore.getState().fixInitialBalance(account.id, correctInitialBalance);
              fixedInitialBalances++;
            }
          });
          
          // Now recalculate all balances with correct initialBalance
          recalculateAllAccountBalances();
          
          if (fixedInitialBalances > 0) {
            showSuccess(`Fixed ${fixedInitialBalances} account(s) initialBalance and recalculated all balances`);
          } else {
            showSuccess(`Recalculated balances for all accounts`);
          }
        }
      }

      setLastCheckTime(new Date());
    } catch (error) {
      console.error('Error during data integrity check:', error);
      if (process.env.NODE_ENV === 'development') {
        showError('Error during data integrity check. See console for details.');
      }
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isChecking,
    lastCheckTime,
    checkDataIntegrity,
  };
}

