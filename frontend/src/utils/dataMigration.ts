/**
 * Data Migration Utility
 * Handles schema versioning and data migration
 */

import { useSchemaVersionStore, CURRENT_SCHEMA_VERSION } from '../store/useSchemaVersionStore';
import { performanceMonitor } from './performanceMonitoring';

export interface MigrationResult {
  success: boolean;
  migrated: boolean;
  fromVersion: string;
  toVersion: string;
  errors?: string[];
}

/**
 * Compare two semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  return 0;
}

/**
 * Migrate data from one version to another
 * Currently handles simple version updates (future: add actual schema migrations)
 */
export async function migrateData(): Promise<MigrationResult> {
  return performanceMonitor.trackOperationAsync('migrateData', async () => {
    const schemaVersionStore = useSchemaVersionStore.getState();
    const currentStoredVersion = schemaVersionStore.schemaVersion;
    const targetVersion = CURRENT_SCHEMA_VERSION;

    // If versions match, no migration needed
    if (currentStoredVersion === targetVersion) {
      return {
        success: true,
        migrated: false,
        fromVersion: currentStoredVersion,
        toVersion: targetVersion,
      };
    }

    const errors: string[] = [];

    try {
      // Check if stored version is older than current
      if (compareVersions(currentStoredVersion, targetVersion) < 0) {
        // Need to migrate from older version to newer
        
        // For now, we just update the schema version
        // In the future, add actual migration logic here based on version differences
        // Example:
        // if (compareVersions(currentStoredVersion, '1.1.0') < 0) {
        //   await migrateTo1_1_0();
        // }
        // if (compareVersions(currentStoredVersion, '1.2.0') < 0) {
        //   await migrateTo1_2_0();
        // }

        // Update schema version to current
        schemaVersionStore.setSchemaVersion(targetVersion);

        return {
          success: true,
          migrated: true,
          fromVersion: currentStoredVersion,
          toVersion: targetVersion,
        };
      } else {
        // Stored version is newer than current (shouldn't happen in normal flow)
        // This could happen if user downgrades the app
        errors.push(
          `Stored data version (${currentStoredVersion}) is newer than app version (${targetVersion}). ` +
          `Some features may not work correctly.`
        );

        return {
          success: false,
          migrated: false,
          fromVersion: currentStoredVersion,
          toVersion: targetVersion,
          errors,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown migration error';
      errors.push(`Migration failed: ${errorMessage}`);

      return {
        success: false,
        migrated: false,
        fromVersion: currentStoredVersion,
        toVersion: targetVersion,
        errors,
      };
    }
  });
}

/**
 * Initialize schema version for new installations
 */
export function initializeSchemaVersion(): void {
  const schemaVersionStore = useSchemaVersionStore.getState();
  
  // If schema version is not set (new installation), set it to current version
  if (!schemaVersionStore.schemaVersion || schemaVersionStore.schemaVersion === '') {
    schemaVersionStore.setSchemaVersion(CURRENT_SCHEMA_VERSION);
  }
}

/**
 * Validate data integrity on app load
 * Checks for common data inconsistencies
 */
export function validateDataIntegrity(): { isValid: boolean; errors: string[] } {
  return performanceMonitor.trackOperation('validateDataIntegrity', () => {
    const errors: string[] = [];

  try {
    // Import stores dynamically to avoid circular dependencies
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useBanksStore } = require('../store/useBanksStore');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useBankAccountsStore } = require('../store/useBankAccountsStore');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useIncomeTransactionsStore } = require('../store/useIncomeTransactionsStore');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useExpenseTransactionsStore } = require('../store/useExpenseTransactionsStore');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useSavingsInvestmentTransactionsStore } = require('../store/useSavingsInvestmentTransactionsStore');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useTransferTransactionsStore } = require('../store/useTransferTransactionsStore');

    const banks = useBanksStore.getState().banks;
    const accounts = useBankAccountsStore.getState().accounts;
    const incomeTransactions = useIncomeTransactionsStore.getState().transactions;
    const expenseTransactions = useExpenseTransactionsStore.getState().transactions;
    const savingsTransactions = useSavingsInvestmentTransactionsStore.getState().transactions;
    const transferTransactions = useTransferTransactionsStore.getState().transfers;

    // Validate bank account references
    accounts.forEach((account: { name: string; bankId: string }) => {
      const bank = banks.find((b: { id: string }) => b.id === account.bankId);
      if (!bank) {
        errors.push(`Account "${account.name}" references non-existent bank ID: ${account.bankId}`);
      }
    });

    // Validate transaction account references
    [...incomeTransactions, ...expenseTransactions, ...savingsTransactions].forEach((transaction: { accountId: string }) => {
      const account = accounts.find((a: { id: string }) => a.id === transaction.accountId);
      if (!account) {
        errors.push(`Transaction references non-existent account ID: ${transaction.accountId}`);
      }
    });

    // Validate transfer account references
    transferTransactions.forEach((transfer: { fromAccountId: string; toAccountId: string }) => {
      const fromAccount = accounts.find((a: { id: string }) => a.id === transfer.fromAccountId);
      const toAccount = accounts.find((a: { id: string }) => a.id === transfer.toAccountId);
      if (!fromAccount) {
        errors.push(`Transfer references non-existent from account ID: ${transfer.fromAccountId}`);
      }
      if (!toAccount) {
        errors.push(`Transfer references non-existent to account ID: ${transfer.toAccountId}`);
      }
    });

    // Additional validations can be added here
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      errors.push(`Data validation error: ${errorMessage}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  });
}

