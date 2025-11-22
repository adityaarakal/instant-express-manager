/**
 * Orphaned Data Cleanup Utility
 * Identifies and cleans up orphaned data (transactions referencing deleted accounts, etc.)
 */

import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useBanksStore } from '../store/useBanksStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useTransferTransactionsStore } from '../store/useTransferTransactionsStore';
import { useExpenseEMIsStore } from '../store/useExpenseEMIsStore';
import { useSavingsInvestmentEMIsStore } from '../store/useSavingsInvestmentEMIsStore';
import { useRecurringIncomesStore } from '../store/useRecurringIncomesStore';
import { useRecurringExpensesStore } from '../store/useRecurringExpensesStore';
import { useRecurringSavingsInvestmentsStore } from '../store/useRecurringSavingsInvestmentsStore';

export interface OrphanedDataReport {
  orphanedIncomeTransactions: string[];
  orphanedExpenseTransactions: string[];
  orphanedSavingsTransactions: string[];
  orphanedTransferTransactions: string[];
  orphanedAccounts: string[];
  orphanedEMIs: string[];
  orphanedRecurringTemplates: string[];
  totalOrphaned: number;
}

/**
 * Find all orphaned data (references to non-existent accounts/banks)
 */
export function findOrphanedData(): OrphanedDataReport {
  const accounts = useBankAccountsStore.getState().accounts;
  const banks = useBanksStore.getState().banks;
  const accountIds = new Set(accounts.map((acc) => acc.id));
  const bankIds = new Set(banks.map((bank) => bank.id));

  // Find orphaned transactions
  const incomeTransactions = useIncomeTransactionsStore.getState().transactions;
  const expenseTransactions = useExpenseTransactionsStore.getState().transactions;
  const savingsTransactions = useSavingsInvestmentTransactionsStore.getState().transactions;
  const transferTransactions = useTransferTransactionsStore.getState().transfers;

  const orphanedIncomeTransactions = incomeTransactions
    .filter((t) => !accountIds.has(t.accountId))
    .map((t) => t.id);

  const orphanedExpenseTransactions = expenseTransactions
    .filter((t) => !accountIds.has(t.accountId))
    .map((t) => t.id);

  const orphanedSavingsTransactions = savingsTransactions
    .filter((t) => !accountIds.has(t.accountId))
    .map((t) => t.id);

  const orphanedTransferTransactions = transferTransactions
    .filter((t) => !accountIds.has(t.fromAccountId) || !accountIds.has(t.toAccountId))
    .map((t) => t.id);

  // Find orphaned accounts (accounts referencing non-existent banks)
  const orphanedAccounts = accounts
    .filter((acc) => !bankIds.has(acc.bankId))
    .map((acc) => acc.id);

  // Find orphaned EMIs
  const expenseEMIs = useExpenseEMIsStore.getState().emis;
  const savingsEMIs = useSavingsInvestmentEMIsStore.getState().emis;
  const orphanedEMIs = [
    ...expenseEMIs.filter((emi) => !accountIds.has(emi.accountId)).map((emi) => emi.id),
    ...savingsEMIs.filter((emi) => !accountIds.has(emi.accountId)).map((emi) => emi.id),
  ];

  // Find orphaned recurring templates
  const recurringIncomes = useRecurringIncomesStore.getState().templates;
  const recurringExpenses = useRecurringExpensesStore.getState().templates;
  const recurringSavings = useRecurringSavingsInvestmentsStore.getState().templates;
  const orphanedRecurringTemplates = [
    ...recurringIncomes.filter((t) => !accountIds.has(t.accountId)).map((t) => t.id),
    ...recurringExpenses.filter((t) => !accountIds.has(t.accountId)).map((t) => t.id),
    ...recurringSavings.filter((t) => !accountIds.has(t.accountId)).map((t) => t.id),
  ];

  const totalOrphaned =
    orphanedIncomeTransactions.length +
    orphanedExpenseTransactions.length +
    orphanedSavingsTransactions.length +
    orphanedTransferTransactions.length +
    orphanedAccounts.length +
    orphanedEMIs.length +
    orphanedRecurringTemplates.length;

  return {
    orphanedIncomeTransactions,
    orphanedExpenseTransactions,
    orphanedSavingsTransactions,
    orphanedTransferTransactions,
    orphanedAccounts,
    orphanedEMIs,
    orphanedRecurringTemplates,
    totalOrphaned,
  };
}

/**
 * Clean up orphaned data
 * WARNING: This will permanently delete orphaned records
 */
export function cleanupOrphanedData(report: OrphanedDataReport): {
  cleaned: number;
  errors: string[];
} {
  const errors: string[] = [];
  let cleaned = 0;

  // Clean up orphaned income transactions
  report.orphanedIncomeTransactions.forEach((id) => {
    try {
      useIncomeTransactionsStore.getState().deleteTransaction(id);
      cleaned++;
    } catch (error) {
      errors.push(`Failed to delete orphaned income transaction ${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Clean up orphaned expense transactions
  report.orphanedExpenseTransactions.forEach((id) => {
    try {
      useExpenseTransactionsStore.getState().deleteTransaction(id);
      cleaned++;
    } catch (error) {
      errors.push(`Failed to delete orphaned expense transaction ${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Clean up orphaned savings transactions
  report.orphanedSavingsTransactions.forEach((id) => {
    try {
      useSavingsInvestmentTransactionsStore.getState().deleteTransaction(id);
      cleaned++;
    } catch (error) {
      errors.push(`Failed to delete orphaned savings transaction ${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Clean up orphaned transfer transactions
  report.orphanedTransferTransactions.forEach((id) => {
    try {
      useTransferTransactionsStore.getState().deleteTransfer(id);
      cleaned++;
    } catch (error) {
      errors.push(`Failed to delete orphaned transfer transaction ${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Note: We don't auto-delete orphaned accounts, EMIs, or recurring templates
  // as these might be intentional or need user review

  return { cleaned, errors };
}

