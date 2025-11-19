/**
 * Data Migration Utility
 * 
 * Migrates data from old PlannedMonthSnapshot structure to new transaction-based structure.
 * This is a one-time migration utility for users upgrading from the old system.
 * 
 * @deprecated This migration utility is optional and only needed if migrating from old data.
 * The new system is designed to work without any old data.
 */

import type { PlannedMonthSnapshot } from '../types/plannedExpenses';
import type { BankAccount } from '../types/bankAccounts';
import { useBanksStore } from '../store/useBanksStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';

export interface MigrationResult {
  success: boolean;
  banksCreated: number;
  accountsCreated: number;
  incomeTransactionsCreated: number;
  expenseTransactionsCreated: number;
  savingsTransactionsCreated: number;
  errors: string[];
  warnings: string[];
}

export interface MigrationOptions {
  /** Default bank name to use if no bank exists */
  defaultBankName?: string;
  /** Default bank type */
  defaultBankType?: 'Bank' | 'CreditCard' | 'Wallet';
  /** Whether to create transactions for pending allocations */
  includePendingTransactions?: boolean;
  /** Whether to preserve manual adjustments */
  preserveManualAdjustments?: boolean;
}

const DEFAULT_OPTIONS: Required<MigrationOptions> = {
  defaultBankName: 'Migrated Bank',
  defaultBankType: 'Bank',
  includePendingTransactions: true,
  preserveManualAdjustments: true,
};

/**
 * Migrates old PlannedMonthSnapshot data to new transaction-based structure
 */
export async function migratePlannedMonthSnapshot(
  snapshot: PlannedMonthSnapshot,
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const result: MigrationResult = {
    success: false,
    banksCreated: 0,
    accountsCreated: 0,
    incomeTransactionsCreated: 0,
    expenseTransactionsCreated: 0,
    savingsTransactionsCreated: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Step 1: Create or get default bank
    let bankId: string;
    const existingBanks = useBanksStore.getState().banks;
    if (existingBanks.length === 0) {
      useBanksStore.getState().createBank({
        name: opts.defaultBankName,
        type: opts.defaultBankType,
      });
      bankId = useBanksStore.getState().banks[0].id;
      result.banksCreated = 1;
    } else {
      bankId = existingBanks[0].id;
      result.warnings.push('Using existing bank instead of creating new one');
    }

    // Step 2: Create bank accounts from snapshot accounts
    const accountMap = new Map<string, string>(); // old accountId -> new accountId
    const monthStart = new Date(snapshot.monthStart);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0); // Last day of month

    for (const oldAccount of snapshot.accounts) {
      try {
        // Map old account type to new account type
        const accountType = mapOldAccountTypeToNew(oldAccount.accountName, oldAccount.accountName);
        
        // Calculate initial balance from fixedBalance or use 0
        const initialBalance = oldAccount.fixedBalance ?? 0;

        useBankAccountsStore.getState().createAccount({
          bankId,
          name: oldAccount.accountName,
          accountType,
          currentBalance: initialBalance,
          accountNumber: oldAccount.id, // Use old ID as account number for reference
        });

        const newAccount = useBankAccountsStore.getState().accounts.find(
          (acc) => acc.name === oldAccount.accountName && acc.bankId === bankId
        );

        if (newAccount) {
          accountMap.set(oldAccount.id, newAccount.id);
          result.accountsCreated++;
        } else {
          result.errors.push(`Failed to create account: ${oldAccount.accountName}`);
        }
      } catch (error) {
        result.errors.push(`Error creating account ${oldAccount.accountName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Step 3: Create income transaction from inflowTotal
    if (snapshot.inflowTotal && snapshot.inflowTotal > 0) {
      try {
        // Use first account for income
        const firstAccountId = Array.from(accountMap.values())[0];
        if (firstAccountId) {
          useIncomeTransactionsStore.getState().createTransaction({
            date: snapshot.monthStart,
            amount: snapshot.inflowTotal,
            accountId: firstAccountId,
            category: 'Salary',
            description: `Migrated income for ${snapshot.monthStart}`,
            status: 'Received', // Assume received if it's in the snapshot
          });
          result.incomeTransactionsCreated++;
        } else {
          result.warnings.push('No accounts available for income transaction');
        }
      } catch (error) {
        result.errors.push(`Error creating income transaction: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Step 4: Create expense transactions from bucketAmounts
    for (const oldAccount of snapshot.accounts) {
      const newAccountId = accountMap.get(oldAccount.id);
      if (!newAccountId) continue;

      for (const [bucketId, amount] of Object.entries(oldAccount.bucketAmounts)) {
        if (amount === null || amount === 0) continue;

        const status = snapshot.statusByBucket[bucketId] || 'pending';
        const shouldCreate = opts.includePendingTransactions || status === 'paid';

        if (shouldCreate) {
          try {
            // Map bucketId to valid bucket type
            const bucket = mapBucketToValidType(bucketId);
            
            useExpenseTransactionsStore.getState().createTransaction({
              date: snapshot.dueDates[bucketId] || snapshot.monthStart,
              amount: Math.abs(amount),
              accountId: newAccountId,
              category: 'Other',
              bucket: bucket,
              description: `Migrated ${bucketId} allocation`,
              status: status === 'paid' ? 'Paid' : 'Pending',
            });
            result.expenseTransactionsCreated++;
          } catch (error) {
            result.errors.push(`Error creating expense transaction for bucket ${bucketId}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      // Step 5: Create savings/investment transaction from savingsTransfer
      if (oldAccount.savingsTransfer && oldAccount.savingsTransfer !== 0) {
        try {
          useSavingsInvestmentTransactionsStore.getState().createTransaction({
            date: snapshot.monthStart,
            amount: Math.abs(oldAccount.savingsTransfer),
            accountId: newAccountId,
            destination: 'Migrated Savings',
            type: 'LumpSum',
            description: `Migrated savings transfer`,
            status: 'Completed',
          });
          result.savingsTransactionsCreated++;
        } catch (error) {
          result.errors.push(`Error creating savings transaction: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // Step 6: Handle manual adjustments (if preserved)
    if (opts.preserveManualAdjustments && snapshot.manualAdjustments) {
      for (const adjustment of snapshot.manualAdjustments) {
        try {
          const accountId = adjustment.accountId 
            ? accountMap.get(adjustment.accountId)
            : Array.from(accountMap.values())[0];

          if (accountId) {
            // Create as expense transaction (negative adjustment) or income (positive)
            if (adjustment.amount < 0) {
              useExpenseTransactionsStore.getState().createTransaction({
                date: adjustment.createdAt,
                amount: Math.abs(adjustment.amount),
                accountId,
                category: 'Other',
                bucket: 'Expense',
                description: `Manual adjustment: ${adjustment.description}`,
                status: 'Paid',
              });
              result.expenseTransactionsCreated++;
            } else {
              useIncomeTransactionsStore.getState().createTransaction({
                date: adjustment.createdAt,
                amount: adjustment.amount,
                accountId,
                category: 'Other',
                description: `Manual adjustment: ${adjustment.description}`,
                status: 'Received',
              });
              result.incomeTransactionsCreated++;
            }
          }
        } catch (error) {
          result.warnings.push(`Could not migrate manual adjustment: ${adjustment.description}`);
        }
      }
    }

    result.success = result.errors.length === 0;
    
    if (result.warnings.length > 0) {
      result.warnings.push('Migration completed with warnings. Please review the migrated data.');
    }

    return result;
  } catch (error) {
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

/**
 * Maps old account type to new BankAccount accountType
 */
function mapOldAccountTypeToNew(
  accountName: string,
  oldType?: string
): BankAccount['accountType'] {
  const nameLower = accountName.toLowerCase();
  
  if (nameLower.includes('credit') || nameLower.includes('card')) {
    return 'CreditCard';
  }
  if (nameLower.includes('savings') || nameLower.includes('deposit')) {
    return 'Savings';
  }
  if (nameLower.includes('current') || nameLower.includes('checking')) {
    return 'Current';
  }
  if (nameLower.includes('wallet')) {
    return 'Wallet';
  }
  // Note: Investment and Loan accounts map to Savings in new system
  // as BankAccount type only supports: Savings | Current | CreditCard | Wallet

  // Default mapping based on old type
  switch (oldType) {
    case 'salary':
      return 'Savings';
    case 'credit-card':
      return 'CreditCard';
    case 'investment':
    case 'loan':
      return 'Savings'; // Map to Savings as Investment/Loan not supported
    case 'wallet':
      return 'Wallet';
    default:
      return 'Savings'; // Default fallback
  }
}

/**
 * Maps bucket ID to valid ExpenseTransaction bucket type
 */
function mapBucketToValidType(bucketId: string): 'Balance' | 'Savings' | 'MutualFunds' | 'CCBill' | 'Maintenance' | 'Expense' {
  const bucketLower = bucketId.toLowerCase();
  
  if (bucketLower.includes('balance')) return 'Balance';
  if (bucketLower.includes('savings')) return 'Savings';
  if (bucketLower.includes('mutual') || bucketLower.includes('fund')) return 'MutualFunds';
  if (bucketLower.includes('cc') || bucketLower.includes('credit') || bucketLower.includes('bill')) return 'CCBill';
  if (bucketLower.includes('maintenance')) return 'Maintenance';
  if (bucketLower.includes('expense')) return 'Expense';
  
  // Default to Expense
  return 'Expense';
}

/**
 * Checks if migration is needed by looking for old PlannedMonthSnapshot data
 */
export async function checkMigrationNeeded(): Promise<boolean> {
  // Check if there are any old PlannedMonthSnapshot entries in storage
  // This would require checking the old storage keys
  // For now, return false as migration is optional
  return false;
}

/**
 * Initialize schema version for new installations
 * This is a placeholder for future schema versioning
 */
export function initializeSchemaVersion(): void {
  // Placeholder for schema version initialization
  // Can be extended to track data schema versions
}

/**
 * Migrate data from old structure to new structure
 * This is called automatically on app startup
 */
export async function migrateData(): Promise<{
  migrated: boolean;
  fromVersion?: string;
  toVersion?: string;
  errors: string[];
}> {
  // Placeholder for automatic migration
  // Currently returns no migration needed
  return {
    migrated: false,
    errors: [],
  };
}

/**
 * Validate data integrity across all stores
 */
export function validateDataIntegrity() {
  const errors: string[] = [];
  
  // Check that all account references in transactions are valid
  const accounts = useBankAccountsStore.getState().accounts;
  const accountIds = new Set(accounts.map((acc) => acc.id));
  
  // Validate income transactions
  const incomeTransactions = useIncomeTransactionsStore.getState().transactions;
  incomeTransactions.forEach((tx) => {
    if (!accountIds.has(tx.accountId)) {
      errors.push(`Income transaction ${tx.id} references non-existent account ${tx.accountId}`);
    }
  });
  
  // Validate expense transactions
  const expenseTransactions = useExpenseTransactionsStore.getState().transactions;
  expenseTransactions.forEach((tx) => {
    if (!accountIds.has(tx.accountId)) {
      errors.push(`Expense transaction ${tx.id} references non-existent account ${tx.accountId}`);
    }
  });
  
  // Validate savings/investment transactions
  const savingsTransactions = useSavingsInvestmentTransactionsStore.getState().transactions;
  savingsTransactions.forEach((tx) => {
    if (!accountIds.has(tx.accountId)) {
      errors.push(`Savings transaction ${tx.id} references non-existent account ${tx.accountId}`);
    }
  });
  
  // Check that all bank references in accounts are valid
  const banks = useBanksStore.getState().banks;
  const bankIds = new Set(banks.map((bank) => bank.id));
  
  for (const acc of accounts) {
    if (!bankIds.has(acc.bankId)) {
      errors.push('Account ' + acc.id + ' references non-existent bank ' + acc.bankId);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
  } as { isValid: boolean; errors: string[] };
}

/**
 * Validates that migration can be performed safely
 */
export function validateMigrationData(snapshot: PlannedMonthSnapshot): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!snapshot.monthStart) {
    errors.push('Missing monthStart date');
  }

  if (!snapshot.accounts || snapshot.accounts.length === 0) {
    errors.push('No accounts found in snapshot');
  }

  if (snapshot.inflowTotal === null || snapshot.inflowTotal === undefined) {
    warnings.push('No inflow total found - income transaction will be skipped');
  }

  if (snapshot.accounts.some((acc) => !acc.id)) {
    errors.push('Some accounts are missing IDs');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
