import { useBanksStore } from '../store/useBanksStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useExpenseEMIsStore } from '../store/useExpenseEMIsStore';
import { useSavingsInvestmentEMIsStore } from '../store/useSavingsInvestmentEMIsStore';
import { useRecurringIncomesStore } from '../store/useRecurringIncomesStore';
import { useRecurringExpensesStore } from '../store/useRecurringExpensesStore';
import { useRecurringSavingsInvestmentsStore } from '../store/useRecurringSavingsInvestmentsStore';
import { useExportHistoryStore } from '../store/useExportHistoryStore';
import { performanceMonitor } from './performanceMonitoring';

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    banks: ReturnType<typeof useBanksStore.getState>['banks'];
    bankAccounts: ReturnType<typeof useBankAccountsStore.getState>['accounts'];
    incomeTransactions: ReturnType<typeof useIncomeTransactionsStore.getState>['transactions'];
    expenseTransactions: ReturnType<typeof useExpenseTransactionsStore.getState>['transactions'];
    savingsInvestmentTransactions: ReturnType<typeof useSavingsInvestmentTransactionsStore.getState>['transactions'];
    expenseEMIs: ReturnType<typeof useExpenseEMIsStore.getState>['emis'];
    savingsInvestmentEMIs: ReturnType<typeof useSavingsInvestmentEMIsStore.getState>['emis'];
    recurringIncomes: ReturnType<typeof useRecurringIncomesStore.getState>['templates'];
    recurringExpenses: ReturnType<typeof useRecurringExpensesStore.getState>['templates'];
    recurringSavingsInvestments: ReturnType<typeof useRecurringSavingsInvestmentsStore.getState>['templates'];
  };
}

/**
 * Get current app version
 * Uses __APP_VERSION__ from vite.config.ts (injected at build time)
 * Falls back to reading from package.json or default version
 */
function getAppVersion(): string {
  // Try to get version from Vite-injected constant
  if (typeof __APP_VERSION__ !== 'undefined') {
    return __APP_VERSION__;
  }
  
  // Fallback: try to get from version.json (for production)
  try {
    // In browser, we can't read package.json directly
    // Use a default or fetch from version.json endpoint
    return '1.0.0'; // Default fallback
  } catch {
    return '1.0.0'; // Final fallback
  }
}

/**
 * Exports all application data to a JSON backup
 */
export function exportBackup(): BackupData {
  return performanceMonitor.trackOperation('exportBackup', () => {
    const backup: BackupData = {
      version: getAppVersion(),
      timestamp: new Date().toISOString(),
      data: {
        banks: useBanksStore.getState().banks,
        bankAccounts: useBankAccountsStore.getState().accounts,
        incomeTransactions: useIncomeTransactionsStore.getState().transactions,
        expenseTransactions: useExpenseTransactionsStore.getState().transactions,
        savingsInvestmentTransactions: useSavingsInvestmentTransactionsStore.getState().transactions,
        expenseEMIs: useExpenseEMIsStore.getState().emis,
        savingsInvestmentEMIs: useSavingsInvestmentEMIsStore.getState().emis,
        recurringIncomes: useRecurringIncomesStore.getState().templates,
        recurringExpenses: useRecurringExpensesStore.getState().templates,
        recurringSavingsInvestments: useRecurringSavingsInvestmentsStore.getState().templates,
      },
    };

    return backup;
  });
}

/**
 * Downloads the backup as a JSON file
 */
export function downloadBackup(): void {
  const backup = exportBackup();
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `financial-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Track export history
  const totalTransactions =
    backup.data.incomeTransactions.length +
    backup.data.expenseTransactions.length +
    backup.data.savingsInvestmentTransactions.length;
  useExportHistoryStore.getState().addExport({
    type: 'backup',
    filename,
    transactionCount: totalTransactions,
  });
}

/**
 * Validates backup data structure
 */
export function validateBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const backup = data as { version?: unknown; timestamp?: unknown; data?: unknown };
  if (!backup.version || typeof backup.version !== 'string') {
    return false;
  }

  if (!backup.timestamp || typeof backup.timestamp !== 'string') {
    return false;
  }

  if (!backup.data || typeof backup.data !== 'object' || backup.data === null) {
    return false;
  }

  // Check that all required data arrays exist
  const requiredKeys = [
    'banks',
    'bankAccounts',
    'incomeTransactions',
    'expenseTransactions',
    'savingsInvestmentTransactions',
    'expenseEMIs',
    'savingsInvestmentEMIs',
    'recurringIncomes',
    'recurringExpenses',
    'recurringSavingsInvestments',
  ];

  const backupData = backup.data as Record<string, unknown>;
  for (const key of requiredKeys) {
    if (!Array.isArray(backupData[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Imports backup data into all stores
 * @param backupData The backup data to import
 * @param replaceExisting If true, replaces all existing data. If false, merges with existing data.
 * @returns Object with import status and migration info
 */
export function importBackup(
  backupData: BackupData,
  replaceExisting: boolean = false
): { success: boolean; migrated: boolean; backupVersion: string; warnings?: string[] } {
  if (!validateBackup(backupData)) {
    throw new Error('Invalid backup file format');
  }

  const warnings: string[] = [];
  
  // Check if backup version is older than current app version
  const currentVersion = getAppVersion();
  const backupVersion = backupData.version;
  
  // Compare versions (simple semantic version comparison)
  const compareVersions = (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    return 0;
  };

  const versionComparison = compareVersions(backupVersion, currentVersion);
  
  if (versionComparison < 0) {
    // Backup is from an older version
    warnings.push(
      `Backup was created with version ${backupVersion}, current app version is ${currentVersion}. ` +
      `Data will be imported and may be migrated automatically.`
    );
  } else if (versionComparison > 0) {
    // Backup is from a newer version (unusual)
    warnings.push(
      `Warning: Backup was created with version ${backupVersion}, which is newer than current app version ${currentVersion}. ` +
      `Some features may not work correctly. Consider updating the app.`
    );
  }

  if (replaceExisting) {
    // Replace all data
    useBanksStore.setState({ banks: backupData.data.banks });
    useBankAccountsStore.setState({ accounts: backupData.data.bankAccounts });
    useIncomeTransactionsStore.setState({ transactions: backupData.data.incomeTransactions });
    useExpenseTransactionsStore.setState({ transactions: backupData.data.expenseTransactions });
    useSavingsInvestmentTransactionsStore.setState({ transactions: backupData.data.savingsInvestmentTransactions });
    useExpenseEMIsStore.setState({ emis: backupData.data.expenseEMIs });
    useSavingsInvestmentEMIsStore.setState({ emis: backupData.data.savingsInvestmentEMIs });
    useRecurringIncomesStore.setState({ templates: backupData.data.recurringIncomes });
    useRecurringExpensesStore.setState({ templates: backupData.data.recurringExpenses });
    useRecurringSavingsInvestmentsStore.setState({ templates: backupData.data.recurringSavingsInvestments });
  } else {
    // Merge with existing data (avoid duplicates by ID)
    const existingBanks = useBanksStore.getState().banks;
    const existingAccounts = useBankAccountsStore.getState().accounts;
    const existingIncomeTransactions = useIncomeTransactionsStore.getState().transactions;
    const existingExpenseTransactions = useExpenseTransactionsStore.getState().transactions;
    const existingSavingsTransactions = useSavingsInvestmentTransactionsStore.getState().transactions;
    const existingExpenseEMIs = useExpenseEMIsStore.getState().emis;
    const existingSavingsEMIs = useSavingsInvestmentEMIsStore.getState().emis;
    const existingRecurringIncomes = useRecurringIncomesStore.getState().templates;
    const existingRecurringExpenses = useRecurringExpensesStore.getState().templates;
    const existingRecurringSavings = useRecurringSavingsInvestmentsStore.getState().templates;

    // Merge banks (keep existing if ID matches)
    const mergedBanks = [
      ...existingBanks,
      ...backupData.data.banks.filter((b) => !existingBanks.find((eb) => eb.id === b.id)),
    ];

    // Merge accounts
    const mergedAccounts = [
      ...existingAccounts,
      ...backupData.data.bankAccounts.filter((a) => !existingAccounts.find((ea) => ea.id === a.id)),
    ];

    // Merge transactions
    const mergedIncomeTransactions = [
      ...existingIncomeTransactions,
      ...backupData.data.incomeTransactions.filter((t) => !existingIncomeTransactions.find((et) => et.id === t.id)),
    ];

    const mergedExpenseTransactions = [
      ...existingExpenseTransactions,
      ...backupData.data.expenseTransactions.filter((t) => !existingExpenseTransactions.find((et) => et.id === t.id)),
    ];

    const mergedSavingsTransactions = [
      ...existingSavingsTransactions,
      ...backupData.data.savingsInvestmentTransactions.filter((t) => !existingSavingsTransactions.find((et) => et.id === t.id)),
    ];

    // Merge EMIs
    const mergedExpenseEMIs = [
      ...existingExpenseEMIs,
      ...backupData.data.expenseEMIs.filter((e) => !existingExpenseEMIs.find((ee) => ee.id === e.id)),
    ];

    const mergedSavingsEMIs = [
      ...existingSavingsEMIs,
      ...backupData.data.savingsInvestmentEMIs.filter((e) => !existingSavingsEMIs.find((ee) => ee.id === e.id)),
    ];

    // Merge recurring templates
    const mergedRecurringIncomes = [
      ...existingRecurringIncomes,
      ...backupData.data.recurringIncomes.filter((t) => !existingRecurringIncomes.find((et) => et.id === t.id)),
    ];

    const mergedRecurringExpenses = [
      ...existingRecurringExpenses,
      ...backupData.data.recurringExpenses.filter((t) => !existingRecurringExpenses.find((et) => et.id === t.id)),
    ];

    const mergedRecurringSavings = [
      ...existingRecurringSavings,
      ...backupData.data.recurringSavingsInvestments.filter((t) => !existingRecurringSavings.find((et) => et.id === t.id)),
    ];

    // Apply merged data
    useBanksStore.setState({ banks: mergedBanks });
    useBankAccountsStore.setState({ accounts: mergedAccounts });
    useIncomeTransactionsStore.setState({ transactions: mergedIncomeTransactions });
    useExpenseTransactionsStore.setState({ transactions: mergedExpenseTransactions });
    useSavingsInvestmentTransactionsStore.setState({ transactions: mergedSavingsTransactions });
    useExpenseEMIsStore.setState({ emis: mergedExpenseEMIs });
    useSavingsInvestmentEMIsStore.setState({ emis: mergedSavingsEMIs });
    useRecurringIncomesStore.setState({ templates: mergedRecurringIncomes });
    useRecurringExpensesStore.setState({ templates: mergedRecurringExpenses });
    useRecurringSavingsInvestmentsStore.setState({ templates: mergedRecurringSavings });
  }

  // After import, update schema version to current
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useSchemaVersionStore } = require('../store/useSchemaVersionStore');
  useSchemaVersionStore.getState().setSchemaVersion(currentVersion);

  return {
    success: true,
    migrated: versionComparison < 0,
    backupVersion,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Reads a backup file and returns the parsed data
 */
export function readBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (validateBackup(data)) {
          resolve(data);
        } else {
          reject(new Error('Invalid backup file format'));
        }
      } catch (error) {
        reject(new Error('Failed to parse backup file'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read backup file'));
    };
    reader.readAsText(file);
  });
}

