/**
 * Scheduled Exports Utility
 * Handles checking and executing scheduled exports
 */

import { useExportSchedulesStore, type ExportSchedule } from '../store/useExportSchedulesStore';
import { useExportHistoryStore } from '../store/useExportHistoryStore';
import {
  exportIncomeTransactionsToCSV,
  exportExpenseTransactionsToCSV,
  exportSavingsTransactionsToCSV,
  exportTransferTransactionsToCSV,
  downloadCSV,
} from './transactionExport';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useTransferTransactionsStore } from '../store/useTransferTransactionsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { registerBackgroundSync, isBackgroundSyncSupported } from './backgroundSync';

/**
 * Check if a schedule should run now
 */
export function shouldRunSchedule(schedule: ExportSchedule): boolean {
  if (!schedule.enabled) return false;
  
  const now = new Date();
  const nextRun = new Date(schedule.nextRun);
  
  // Run if next run time has passed (with 5 minute tolerance)
  return now >= nextRun;
}

/**
 * Execute a scheduled export
 */
export async function executeScheduledExport(schedule: ExportSchedule): Promise<void> {
  const {
    getIncomeTransactions,
    getExpenseTransactions,
    getSavingsInvestmentTransactions,
    getTransferTransactions,
  } = {
    getIncomeTransactions: useIncomeTransactionsStore.getState,
    getExpenseTransactions: useExpenseTransactionsStore.getState,
    getSavingsInvestmentTransactions: useSavingsInvestmentTransactionsStore.getState,
    getTransferTransactions: useTransferTransactionsStore.getState,
  };
  
  const getAccounts = useBankAccountsStore.getState;
  const { addExport } = useExportHistoryStore.getState();
  const { updateLastRun } = useExportSchedulesStore.getState();
  
  const accounts = getAccounts().accounts;
  const dateStr = new Date().toISOString().split('T')[0];
  
  let csvContent = '';
  let filename = '';
  let exportType: 'income' | 'expense' | 'savings' | 'transfers' = 'income';
  let transactionCount = 0;
  
  try {
    if (schedule.type === 'all') {
      // Export all types
      const incomeTransactions = getIncomeTransactions().transactions;
      const expenseTransactions = getExpenseTransactions().transactions;
      const savingsTransactions = getSavingsInvestmentTransactions().transactions;
      const transferTransactions = getTransferTransactions().transfers;
      
      const allTransactions = [
        ...incomeTransactions,
        ...expenseTransactions,
        ...savingsTransactions,
        ...transferTransactions,
      ];
      
      // Create combined CSV
      const incomeCSV = exportIncomeTransactionsToCSV(incomeTransactions, accounts);
      const expenseCSV = exportExpenseTransactionsToCSV(expenseTransactions, accounts);
      const savingsCSV = exportSavingsTransactionsToCSV(savingsTransactions, accounts);
      const transfersCSV = exportTransferTransactionsToCSV(transferTransactions, accounts);
      
      // Combine all CSV content
      csvContent = `${incomeCSV}\n\n${expenseCSV}\n\n${savingsCSV}\n\n${transfersCSV}`;
      filename = `scheduled-all-transactions-${dateStr}.csv`;
      transactionCount = allTransactions.length;
      exportType = 'income'; // Use income as default type for history
    } else if (schedule.type === 'income') {
      const transactions = getIncomeTransactions().transactions;
      csvContent = exportIncomeTransactionsToCSV(transactions, accounts);
      filename = `scheduled-income-${dateStr}.csv`;
      exportType = 'income';
      transactionCount = transactions.length;
    } else if (schedule.type === 'expense') {
      const transactions = getExpenseTransactions().transactions;
      csvContent = exportExpenseTransactionsToCSV(transactions, accounts);
      filename = `scheduled-expense-${dateStr}.csv`;
      exportType = 'expense';
      transactionCount = transactions.length;
    } else if (schedule.type === 'savings') {
      const transactions = getSavingsInvestmentTransactions().transactions;
      csvContent = exportSavingsTransactionsToCSV(transactions, accounts);
      filename = `scheduled-savings-${dateStr}.csv`;
      exportType = 'savings';
      transactionCount = transactions.length;
    } else if (schedule.type === 'transfers') {
      const transactions = getTransferTransactions().transfers;
      csvContent = exportTransferTransactionsToCSV(transactions, accounts);
      filename = `scheduled-transfers-${dateStr}.csv`;
      exportType = 'transfers';
      transactionCount = transactions.length;
    }
    
    // Download the file
    downloadCSV(csvContent, filename);
    
    // Record in export history
    addExport({
      type: exportType,
      filename,
      transactionCount,
    });
    
    // Calculate next run time
    const nextRun = calculateNextRunTime(schedule);
    updateLastRun(schedule.id, nextRun);
    
    // Register background sync for next run if supported
    if (isBackgroundSyncSupported()) {
      const nextSchedule = { ...schedule, nextRun };
      await registerBackgroundSync({ schedule: nextSchedule });
    }
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Scheduled Export Completed', {
        body: `${schedule.name}: Exported ${transactionCount} transactions to ${filename}`,
        icon: '/favicon.ico',
        tag: `export-${schedule.id}`,
      });
    }
  } catch (error) {
    console.error('Error executing scheduled export:', error);
    
    // Show error notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Scheduled Export Failed', {
        body: `${schedule.name}: Failed to export. Check console for details.`,
        icon: '/favicon.ico',
        tag: `export-error-${schedule.id}`,
      });
    }
    
    throw error;
  }
}

/**
 * Calculate next run time for a schedule
 */
function calculateNextRunTime(schedule: ExportSchedule): string {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  
  const nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (schedule.frequency) {
    case 'daily': {
      nextRun.setDate(nextRun.getDate() + 1);
      break;
    }
    
    case 'weekly': {
      const targetDay = schedule.dayOfWeek ?? 0;
      const currentDay = now.getDay();
      let daysUntilTarget = targetDay - currentDay;
      
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      break;
    }
    
    case 'monthly': {
      const targetDayOfMonth = schedule.dayOfMonth ?? 1;
      nextRun.setMonth(nextRun.getMonth() + 1);
      const daysInMonth = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate();
      nextRun.setDate(Math.min(targetDayOfMonth, daysInMonth));
      break;
    }
  }
  
  return nextRun.toISOString();
}

/**
 * Check and execute all due schedules
 */
export async function checkAndExecuteSchedules(): Promise<void> {
  const { getEnabledSchedules } = useExportSchedulesStore.getState();
  const schedules = getEnabledSchedules();
  
  const dueSchedules = schedules.filter(shouldRunSchedule);
  
  for (const schedule of dueSchedules) {
    try {
      await executeScheduledExport(schedule);
    } catch (error) {
      console.error(`Failed to execute schedule ${schedule.id}:`, error);
    }
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

