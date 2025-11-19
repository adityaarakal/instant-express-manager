/**
 * Storage Cleanup Utility
 * 
 * Provides utilities for cleaning up old data and optimizing storage usage.
 * This helps manage storage quota and improve app performance by removing
 * unnecessary data.
 * 
 * Features:
 * - Data retention policies (delete old transactions)
 * - Clear completed EMIs
 * - Clear expired recurring templates
 * - Clear old undo history
 * - Clear old export history
 * - Optimize storage (remove duplicates, compress)
 */

import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../types/transactions';
import type { ExpenseEMI, SavingsInvestmentEMI } from '../types/emis';
import type {
  RecurringIncome,
  RecurringExpense,
  RecurringSavingsInvestment,
} from '../types/recurring';

/**
 * Cleanup configuration options
 */
export interface CleanupOptions {
  /** Delete transactions older than this date (ISO string or Date) */
  deleteTransactionsOlderThan?: string | Date;
  /** Delete completed EMIs older than this date (ISO string or Date) */
  deleteCompletedEMIsOlderThan?: string | Date;
  /** Delete expired recurring templates (templates with endDate in the past) */
  deleteExpiredRecurringTemplates?: boolean;
  /** Delete undo history older than this date (ISO string or Date) */
  deleteUndoHistoryOlderThan?: string | Date;
  /** Delete export history older than this date (ISO string or Date) */
  deleteExportHistoryOlderThan?: string | Date;
  /** Maximum number of undo items to keep (delete oldest if exceeded) */
  maxUndoItems?: number;
  /** Maximum number of export history items to keep (delete oldest if exceeded) */
  maxExportHistoryItems?: number;
}

/**
 * Cleanup results
 */
export interface CleanupResult {
  /** Number of transactions deleted */
  transactionsDeleted: number;
  /** Number of EMIs deleted */
  emisDeleted: number;
  /** Number of recurring templates deleted */
  recurringTemplatesDeleted: number;
  /** Number of undo items deleted */
  undoItemsDeleted: number;
  /** Number of export history items deleted */
  exportHistoryItemsDeleted: number;
  /** Total items deleted */
  totalDeleted: number;
  /** Errors encountered during cleanup */
  errors: string[];
}

/**
 * Delete transactions older than a specific date
 */
async function deleteOldTransactions(cutoffDate: Date): Promise<number> {
  let deleted = 0;

  try {
    // Import stores dynamically
    const { useIncomeTransactionsStore } = await import('../store/useIncomeTransactionsStore');
    const { useExpenseTransactionsStore } = await import('../store/useExpenseTransactionsStore');
    const { useSavingsInvestmentTransactionsStore } = await import('../store/useSavingsInvestmentTransactionsStore');

    const incomeStore = useIncomeTransactionsStore.getState();
    const expenseStore = useExpenseTransactionsStore.getState();
    const savingsStore = useSavingsInvestmentTransactionsStore.getState();

    // Delete old income transactions
    const oldIncome = incomeStore.transactions.filter(
      (t: IncomeTransaction) => new Date(t.date) < cutoffDate
    );
    for (const transaction of oldIncome) {
      try {
        await incomeStore.deleteTransaction(transaction.id);
        deleted++;
      } catch (error) {
        // Continue with other deletions even if one fails
        console.warn(`Failed to delete income transaction ${transaction.id}:`, error);
      }
    }

    // Delete old expense transactions
    const oldExpense = expenseStore.transactions.filter(
      (t: ExpenseTransaction) => new Date(t.date) < cutoffDate
    );
    for (const transaction of oldExpense) {
      try {
        await expenseStore.deleteTransaction(transaction.id);
        deleted++;
      } catch (error) {
        console.warn(`Failed to delete expense transaction ${transaction.id}:`, error);
      }
    }

    // Delete old savings transactions
    const oldSavings = savingsStore.transactions.filter(
      (t: SavingsInvestmentTransaction) => new Date(t.date) < cutoffDate
    );
    for (const transaction of oldSavings) {
      try {
        await savingsStore.deleteTransaction(transaction.id);
        deleted++;
      } catch (error) {
        console.warn(`Failed to delete savings transaction ${transaction.id}:`, error);
      }
    }
  } catch (error) {
    throw new Error(`Failed to delete old transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return deleted;
}

/**
 * Delete completed EMIs older than a specific date
 */
async function deleteOldCompletedEMIs(cutoffDate: Date): Promise<number> {
  let deleted = 0;

  try {
    const { useExpenseEMIsStore } = await import('../store/useExpenseEMIsStore');
    const { useSavingsInvestmentEMIsStore } = await import('../store/useSavingsInvestmentEMIsStore');

    const expenseEMIStore = useExpenseEMIsStore.getState();
    const savingsEMIStore = useSavingsInvestmentEMIsStore.getState();

    // Delete old completed expense EMIs
    const oldExpenseEMIs = expenseEMIStore.emis.filter(
      (emi: ExpenseEMI) => emi.status === 'Completed' && new Date(emi.endDate) < cutoffDate
    );
    for (const emi of oldExpenseEMIs) {
      try {
        await expenseEMIStore.deleteEMI(emi.id);
        deleted++;
      } catch (error) {
        console.warn(`Failed to delete expense EMI ${emi.id}:`, error);
      }
    }

    // Delete old completed savings EMIs
    const oldSavingsEMIs = savingsEMIStore.emis.filter(
      (emi: SavingsInvestmentEMI) => emi.status === 'Completed' && new Date(emi.endDate) < cutoffDate
    );
    for (const emi of oldSavingsEMIs) {
      try {
        await savingsEMIStore.deleteEMI(emi.id);
        deleted++;
      } catch (error) {
        console.warn(`Failed to delete savings EMI ${emi.id}:`, error);
      }
    }
  } catch (error) {
    throw new Error(`Failed to delete old completed EMIs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return deleted;
}

/**
 * Delete expired recurring templates
 */
async function deleteExpiredRecurringTemplates(): Promise<number> {
  let deleted = 0;

  try {
    const { useRecurringIncomesStore } = await import('../store/useRecurringIncomesStore');
    const { useRecurringExpensesStore } = await import('../store/useRecurringExpensesStore');
    const { useRecurringSavingsInvestmentsStore } = await import('../store/useRecurringSavingsInvestmentsStore');

    const now = new Date();
    const incomeStore = useRecurringIncomesStore.getState();
    const expenseStore = useRecurringExpensesStore.getState();
    const savingsStore = useRecurringSavingsInvestmentsStore.getState();

    // Delete expired income templates
    const expiredIncomes = incomeStore.templates.filter(
      (template: RecurringIncome) => template.endDate && new Date(template.endDate) < now
    );
    for (const template of expiredIncomes) {
      try {
        await incomeStore.deleteTemplate(template.id);
        deleted++;
      } catch (error) {
        console.warn(`Failed to delete expired income template ${template.id}:`, error);
      }
    }

    // Delete expired expense templates
    const expiredExpenses = expenseStore.templates.filter(
      (template: RecurringExpense) => template.endDate && new Date(template.endDate) < now
    );
    for (const template of expiredExpenses) {
      try {
        await expenseStore.deleteTemplate(template.id);
        deleted++;
      } catch (error) {
        console.warn(`Failed to delete expired expense template ${template.id}:`, error);
      }
    }

    // Delete expired savings templates
    const expiredSavings = savingsStore.templates.filter(
      (template: RecurringSavingsInvestment) => template.endDate && new Date(template.endDate) < now
    );
    for (const template of expiredSavings) {
      try {
        await savingsStore.deleteTemplate(template.id);
        deleted++;
      } catch (error) {
        console.warn(`Failed to delete expired savings template ${template.id}:`, error);
      }
    }
  } catch (error) {
    throw new Error(`Failed to delete expired recurring templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return deleted;
}

/**
 * Delete old undo history items
 */
async function deleteOldUndoHistory(cutoffDate?: Date, maxItems?: number): Promise<number> {
  let deleted = 0;

  try {
    const { useUndoStore } = await import('../store/useUndoStore');
    const undoStore = useUndoStore.getState();

    let itemsToDelete = [...undoStore.deletedItems];

    // Filter by date if cutoff date provided
    if (cutoffDate) {
      itemsToDelete = itemsToDelete.filter(
        (item) => new Date(item.deletedAt) < cutoffDate
      );
    }

    // Limit to maxItems if provided (delete oldest first)
    if (maxItems !== undefined) {
      // Sort by deletedAt (oldest first)
      itemsToDelete.sort((a, b) => new Date(a.deletedAt).getTime() - new Date(b.deletedAt).getTime());

      // Keep only the newest maxItems items
      const currentCount = undoStore.deletedItems.length;
      if (currentCount > maxItems) {
        const itemsToKeep = currentCount - maxItems;
        itemsToDelete = itemsToDelete.slice(0, itemsToDelete.length - itemsToKeep);
      } else {
        itemsToDelete = [];
      }
    }

    // Delete items
    for (const item of itemsToDelete) {
      try {
        undoStore.removeDeletedItem(item.id);
        deleted++;
      } catch (error) {
        console.warn(`Failed to delete undo item ${item.id}:`, error);
      }
    }
  } catch (error) {
    throw new Error(`Failed to delete old undo history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return deleted;
}

/**
 * Delete old export history items
 */
async function deleteOldExportHistory(cutoffDate?: Date, maxItems?: number): Promise<number> {
  let deleted = 0;

  try {
    const { useExportHistoryStore } = await import('../store/useExportHistoryStore');
    const exportStore = useExportHistoryStore.getState();

    let itemsToDelete = [...exportStore.history];

    // Filter by date if cutoff date provided
    if (cutoffDate) {
      itemsToDelete = itemsToDelete.filter(
        (item) => new Date(item.timestamp) < cutoffDate
      );
    }

    // Limit to maxItems if provided (delete oldest first)
    if (maxItems !== undefined) {
      // Sort by timestamp (oldest first)
      itemsToDelete.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Keep only the newest maxItems items
      const currentCount = exportStore.history.length;
      if (currentCount > maxItems) {
        const itemsToKeep = currentCount - maxItems;
        itemsToDelete = itemsToDelete.slice(0, itemsToDelete.length - itemsToKeep);
      } else {
        itemsToDelete = [];
      }
    }

    // Delete items by filtering them out
    if (itemsToDelete.length > 0) {
      const idsToDelete = new Set(itemsToDelete.map((item) => item.id));
      exportStore.history = exportStore.history.filter((item) => !idsToDelete.has(item.id));
      deleted = itemsToDelete.length;
    }
  } catch (error) {
    throw new Error(`Failed to delete old export history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return deleted;
}

/**
 * Parse date input (supports ISO string or Date object)
 */
function parseDate(date: string | Date): Date {
  if (date instanceof Date) {
    return date;
  }
  return new Date(date);
}

/**
 * Clean up storage based on provided options
 */
export async function cleanupStorage(options: CleanupOptions): Promise<CleanupResult> {
  const result: CleanupResult = {
    transactionsDeleted: 0,
    emisDeleted: 0,
    recurringTemplatesDeleted: 0,
    undoItemsDeleted: 0,
    exportHistoryItemsDeleted: 0,
    totalDeleted: 0,
    errors: [],
  };

  try {
    // Delete old transactions
    if (options.deleteTransactionsOlderThan) {
      try {
        const cutoffDate = parseDate(options.deleteTransactionsOlderThan);
        result.transactionsDeleted = await deleteOldTransactions(cutoffDate);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to delete old transactions: ${errorMessage}`);
      }
    }

    // Delete old completed EMIs
    if (options.deleteCompletedEMIsOlderThan) {
      try {
        const cutoffDate = parseDate(options.deleteCompletedEMIsOlderThan);
        result.emisDeleted = await deleteOldCompletedEMIs(cutoffDate);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to delete old completed EMIs: ${errorMessage}`);
      }
    }

    // Delete expired recurring templates
    if (options.deleteExpiredRecurringTemplates) {
      try {
        result.recurringTemplatesDeleted = await deleteExpiredRecurringTemplates();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to delete expired recurring templates: ${errorMessage}`);
      }
    }

    // Delete old undo history
    if (options.deleteUndoHistoryOlderThan || options.maxUndoItems !== undefined) {
      try {
        const cutoffDate = options.deleteUndoHistoryOlderThan
          ? parseDate(options.deleteUndoHistoryOlderThan)
          : undefined;
        result.undoItemsDeleted = await deleteOldUndoHistory(cutoffDate, options.maxUndoItems);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to delete old undo history: ${errorMessage}`);
      }
    }

    // Delete old export history
    if (options.deleteExportHistoryOlderThan || options.maxExportHistoryItems !== undefined) {
      try {
        const cutoffDate = options.deleteExportHistoryOlderThan
          ? parseDate(options.deleteExportHistoryOlderThan)
          : undefined;
        result.exportHistoryItemsDeleted = await deleteOldExportHistory(cutoffDate, options.maxExportHistoryItems);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to delete old export history: ${errorMessage}`);
      }
    }

    // Calculate total deleted
    result.totalDeleted =
      result.transactionsDeleted +
      result.emisDeleted +
      result.recurringTemplatesDeleted +
      result.undoItemsDeleted +
      result.exportHistoryItemsDeleted;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Storage cleanup failed: ${errorMessage}`);
  }

  return result;
}

/**
 * Get storage statistics (counts of items)
 */
export async function getStorageStatistics(): Promise<{
  transactions: number;
  emis: number;
  recurringTemplates: number;
  undoItems: number;
  exportHistoryItems: number;
}> {
  try {
    const { useIncomeTransactionsStore } = await import('../store/useIncomeTransactionsStore');
    const { useExpenseTransactionsStore } = await import('../store/useExpenseTransactionsStore');
    const { useSavingsInvestmentTransactionsStore } = await import('../store/useSavingsInvestmentTransactionsStore');
    const { useExpenseEMIsStore } = await import('../store/useExpenseEMIsStore');
    const { useSavingsInvestmentEMIsStore } = await import('../store/useSavingsInvestmentEMIsStore');
    const { useRecurringIncomesStore } = await import('../store/useRecurringIncomesStore');
    const { useRecurringExpensesStore } = await import('../store/useRecurringExpensesStore');
    const { useRecurringSavingsInvestmentsStore } = await import('../store/useRecurringSavingsInvestmentsStore');
    const { useUndoStore } = await import('../store/useUndoStore');
    const { useExportHistoryStore } = await import('../store/useExportHistoryStore');

    const incomeTransactions = useIncomeTransactionsStore.getState().transactions.length;
    const expenseTransactions = useExpenseTransactionsStore.getState().transactions.length;
    const savingsTransactions = useSavingsInvestmentTransactionsStore.getState().transactions.length;

    const expenseEMIs = useExpenseEMIsStore.getState().emis.length;
    const savingsEMIs = useSavingsInvestmentEMIsStore.getState().emis.length;

    const incomeTemplates = useRecurringIncomesStore.getState().templates.length;
    const expenseTemplates = useRecurringExpensesStore.getState().templates.length;
    const savingsTemplates = useRecurringSavingsInvestmentsStore.getState().templates.length;

    return {
      transactions: incomeTransactions + expenseTransactions + savingsTransactions,
      emis: expenseEMIs + savingsEMIs,
      recurringTemplates: incomeTemplates + expenseTemplates + savingsTemplates,
      undoItems: useUndoStore.getState().deletedItems.length,
      exportHistoryItems: useExportHistoryStore.getState().history.length,
    };
  } catch (error) {
    throw new Error(`Failed to get storage statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

