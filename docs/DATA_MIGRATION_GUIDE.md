# Data Migration Guide

## Overview

This guide explains how to migrate data from the old `PlannedMonthSnapshot` structure to the new transaction-based structure. **This migration is optional** and only needed if you have existing data from the old system.

## When Migration is Needed

Migration is needed if:
- You have existing data stored in the old `PlannedMonthSnapshot` format
- You want to preserve historical allocations and transactions
- You're upgrading from a previous version that used the old structure

**Note**: If you're starting fresh, you don't need to run migration. The new system works without any old data.

## Migration Process

### Step 1: Backup Your Data

Before running migration, **always backup your data**:

1. Use the app's built-in backup feature (Settings → Backup/Restore)
2. Or manually export your data if available

### Step 2: Understand What Gets Migrated

The migration utility converts:

| Old Structure | New Structure |
|--------------|---------------|
| `PlannedMonthSnapshot.accounts` | `BankAccount` entities |
| `inflowTotal` | `IncomeTransaction` |
| `bucketAmounts` | `ExpenseTransaction` entries |
| `savingsTransfer` | `SavingsInvestmentTransaction` |
| `manualAdjustments` | Additional transactions |
| `statusByBucket` | Transaction status |
| `dueDates` | Transaction dates |

### Step 3: Run Migration

The migration utility is available in the codebase at `frontend/src/utils/dataMigration.ts`. To use it:

```typescript
import { migratePlannedMonthSnapshot, validateMigrationData } from './utils/dataMigration';
import type { PlannedMonthSnapshot } from './types/plannedExpenses';

// 1. Validate the data first
const validation = validateMigrationData(oldSnapshot);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  return;
}

// 2. Run migration with options
const result = await migratePlannedMonthSnapshot(oldSnapshot, {
  defaultBankName: 'My Bank',
  defaultBankType: 'Bank',
  includePendingTransactions: true,
  preserveManualAdjustments: true,
});

// 3. Check results
if (result.success) {
  console.log('Migration successful!');
  console.log(`Created: ${result.accountsCreated} accounts, ${result.incomeTransactionsCreated} income transactions`);
} else {
  console.error('Migration failed:', result.errors);
}
```

### Step 4: Verify Migration

After migration, verify:

1. **Accounts**: Check that all accounts were created correctly
   - Go to Banks & Accounts page
   - Verify account names and balances

2. **Transactions**: Check that transactions were created
   - Go to Transactions page
   - Verify income, expense, and savings transactions
   - Check dates and amounts match the old data

3. **Planner View**: Check that the planner shows correct data
   - Go to Planner page
   - Verify monthly totals match expectations
   - Check bucket allocations

## Migration Options

### `defaultBankName`
- **Type**: `string`
- **Default**: `'Migrated Bank'`
- **Description**: Name of the bank to create if no banks exist

### `defaultBankType`
- **Type**: `'Bank' | 'CreditCard' | 'Wallet'`
- **Default**: `'Bank'`
- **Description**: Type of bank to create

### `includePendingTransactions`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to create transactions for pending allocations. If `false`, only paid transactions are created.

### `preserveManualAdjustments`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to convert manual adjustments to transactions

## Account Type Mapping

The migration utility automatically maps old account types to new types:

| Old Type | New Type | Notes |
|----------|----------|-------|
| `salary` | `Savings` | Default for salary accounts |
| `credit-card` | `CreditCard` | Credit card accounts |
| `investment` | `Investment` | Investment accounts |
| `loan` | `Loan` | Loan accounts |
| `wallet` | `Wallet` | Wallet accounts |
| `savings` | `Savings` | Savings accounts |
| `other` | `Savings` | Default fallback |

The utility also uses account name patterns to determine type (e.g., accounts with "credit" in the name become `CreditCard`).

## Limitations

### What Doesn't Migrate

1. **Formulas**: Old formulas are not preserved. The new system calculates values from transactions.
2. **Reference Errors**: Old reference errors are logged but not preserved as transactions.
3. **Source Row Information**: Excel source row information is not preserved.
4. **Bucket Definitions**: Old bucket definitions need to be recreated in Settings.

### Data Loss Scenarios

- If validation fails, migration won't proceed
- If account creation fails, related transactions won't be created
- Manual adjustments with invalid account references will be skipped

## Troubleshooting

### Migration Fails with Validation Errors

**Problem**: `validateMigrationData` returns errors.

**Solution**: 
- Check that `monthStart` is a valid date
- Ensure all accounts have IDs
- Verify the snapshot structure matches `PlannedMonthSnapshot` type

### Accounts Created but No Transactions

**Problem**: Accounts are created but transactions are missing.

**Solution**:
- Check that `inflowTotal` is not null/zero
- Verify `bucketAmounts` have non-zero values
- Check `includePendingTransactions` option
- Review migration result warnings

### Wrong Account Types

**Problem**: Accounts are created with incorrect types.

**Solution**:
- Review account name patterns
- Manually update account types after migration
- Adjust the `mapOldAccountTypeToNew` function if needed

### Duplicate Accounts

**Problem**: Migration creates duplicate accounts.

**Solution**:
- Check if accounts already exist before running migration
- Use account names that don't conflict
- Consider clearing existing data before migration (with backup!)

## Rollback

If migration fails or produces incorrect results:

1. **Restore from Backup**: Use the backup created in Step 1
2. **Clear Migrated Data**: Use Settings → Clear All Data (irreversible!)
3. **Re-run Migration**: Fix issues and try again

## Best Practices

1. **Always Backup First**: Never migrate without a backup
2. **Test on Sample Data**: Test migration with a small sample first
3. **Validate Before Migrating**: Always run `validateMigrationData` first
4. **Review Results**: Check migration results before proceeding
5. **Keep Old Data**: Don't delete old data until you've verified migration

## Support

If you encounter issues during migration:

1. Check the migration result `errors` and `warnings` arrays
2. Review the console for detailed error messages
3. Verify your data structure matches `PlannedMonthSnapshot` type
4. Consider migrating in smaller batches if you have large datasets

## Example Migration Script

```typescript
// Example: Migrating multiple months
import { migratePlannedMonthSnapshot } from './utils/dataMigration';
import type { PlannedMonthSnapshot } from './types/plannedExpenses';

async function migrateAllMonths(snapshots: PlannedMonthSnapshot[]) {
  const results = [];
  
  for (const snapshot of snapshots) {
    console.log(`Migrating month: ${snapshot.monthStart}`);
    
    const result = await migratePlannedMonthSnapshot(snapshot, {
      defaultBankName: 'My Bank',
      includePendingTransactions: true,
    });
    
    results.push(result);
    
    if (!result.success) {
      console.error(`Failed to migrate ${snapshot.monthStart}:`, result.errors);
    } else {
      console.log(`Successfully migrated ${snapshot.monthStart}`);
    }
  }
  
  return results;
}
```

## Conclusion

Migration is a one-time process. Once your data is migrated to the new transaction-based structure, you won't need to run migration again. The new system is designed to work independently of the old structure.

If you don't have old data or don't need to preserve historical allocations, you can skip migration entirely and start using the new system directly.

