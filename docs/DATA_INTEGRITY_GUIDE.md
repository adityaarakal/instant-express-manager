# Data Integrity Guide

**Last Updated**: 2025-01-20  
**Version**: 1.0.63

This guide explains the data integrity system in Instant Express Manager, how it works, and how to use the tools to maintain data consistency.

---

## Table of Contents

1. [Overview](#overview)
2. [Automatic Data Integrity Checks](#automatic-data-integrity-checks)
3. [Using the Data Health Check Component](#using-the-data-health-check-component)
4. [Understanding Data Integrity Issues](#understanding-data-integrity-issues)
5. [Fixing Common Issues](#fixing-common-issues)
6. [Balance Recalculation](#balance-recalculation)
7. [Orphaned Data Cleanup](#orphaned-data-cleanup)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Instant Express Manager application includes a comprehensive data integrity system that automatically detects and helps fix data inconsistencies. This system ensures that:

- All transactions reference valid accounts
- Account balances match calculated values from transactions
- EMI installment counts are consistent with actual transactions
- No orphaned data exists (data referencing deleted entities)
- Data relationships are valid and consistent

### Key Components

1. **Automatic Checks**: Runs on app startup in development mode
2. **Data Health Check Component**: Manual UI for checking and fixing issues
3. **Balance Recalculation**: Ensures account balances are accurate
4. **Orphaned Data Cleanup**: Removes invalid references
5. **EMI Consistency Validation**: Ensures EMI counts match transactions

---

## Automatic Data Integrity Checks

The application automatically performs data integrity checks on startup when running in **development mode**. This is handled by the `useDataIntegrity` hook.

### How It Works

1. **Automatic Detection**: On app startup, the system checks for:
   - Orphaned data (transactions referencing deleted accounts)
   - Balance discrepancies (stored balance vs calculated balance)
   - Data integrity issues (invalid references, missing relationships)

2. **Notifications**: In development mode, you'll see toast notifications if issues are found:
   - ⚠️ **Warnings**: For orphaned data and balance discrepancies
   - ❌ **Errors**: For critical data integrity issues

3. **Auto-Fix Option**: You can enable automatic fixing by setting `useDataIntegrity(true)` in `App.tsx`:
   ```typescript
   // In frontend/src/App.tsx
   useDataIntegrity(true); // Set to true to auto-fix issues
   ```

### Development vs Production

- **Development Mode**: Checks run automatically and show notifications
- **Production Mode**: Checks are disabled by default (set `autoFix: true` to enable)

---

## Using the Data Health Check Component

The `DataHealthCheck` component provides a user-friendly interface for checking and fixing data integrity issues. It's available in the **Settings** page.

### Accessing Data Health Check

1. Navigate to **Settings** (gear icon in the sidebar)
2. Scroll to the **Data Health Check** section
3. The component will automatically run checks and display results

### What It Checks

The Data Health Check component performs the following checks:

1. **Data Inconsistencies**: General validation errors and warnings
2. **Orphaned Data**: Transactions, accounts, EMIs, or recurring templates referencing deleted entities
3. **Balance Discrepancies**: Accounts where stored balance doesn't match calculated balance
4. **Data Integrity**: Invalid references and missing relationships

### Understanding the Display

#### ✅ All Good
If no issues are found, you'll see:
```
✅ Data Health Check
All data looks good! No inconsistencies found.
```

#### ⚠️ Issues Found
If issues are detected, you'll see:

1. **Action Buttons**:
   - **Refresh**: Reload the page to re-run checks
   - **Cleanup Orphaned Data**: Remove orphaned records (if any found)
   - **Recalculate Balances**: Fix balance discrepancies (if any found)

2. **Issue Alerts**:
   - **Error Alerts** (red): Critical issues that need attention
   - **Warning Alerts** (yellow): Non-critical issues that should be reviewed

---

## Understanding Data Integrity Issues

### 1. Orphaned Data

**What it is**: Data that references entities that no longer exist.

**Common scenarios**:
- Transaction referencing a deleted account
- Account referencing a deleted bank
- EMI referencing a deleted account
- Recurring template referencing a deleted account

**Example**:
```
Orphaned Data (5)
Found orphaned records:
  3 income transaction(s)
  2 expense transaction(s)
```

**Impact**: Orphaned data doesn't break the app but can cause:
- Inaccurate reports and analytics
- Confusion when viewing transactions
- Wasted storage space

### 2. Balance Discrepancies

**What it is**: When an account's stored balance doesn't match the balance calculated from transactions.

**Common causes**:
- Manual balance edits that weren't synced
- Race conditions during rapid transaction updates
- Data migration issues
- Initial balance not properly set

**Example**:
```
Balance Discrepancies (2)
Found 2 account(s) with balance discrepancies:
  Savings Account: Current ₹50,000.00 vs Calculated ₹50,250.00 (Difference: ₹250.00)
  Checking Account: Current ₹25,000.00 vs Calculated ₹24,750.00 (Difference: ₹250.00)
```

**Impact**: Incorrect balances can lead to:
- Wrong financial calculations
- Incorrect remaining cash calculations
- Misleading dashboard metrics

### 3. Data Integrity Issues

**What it is**: Invalid references or missing relationships in the data structure.

**Common scenarios**:
- Missing required fields
- Invalid foreign key references
- Circular dependencies
- Invalid data types

**Example**:
```
Data Integrity Issues (3)
- Account 'acc-123' references non-existent bank 'bank-456'
- Transaction 'txn-789' has invalid date format
- EMI 'emi-321' has negative installment count
```

**Impact**: Can cause:
- Application errors
- Data corruption
- Inability to perform operations

### 4. EMI Consistency Issues

**What it is**: When an EMI's `completedInstallments` count doesn't match the actual number of generated transactions.

**Common causes**:
- Manual transaction deletion
- Failed transaction generation
- Data migration issues

**Example**:
```
EMI Consistency Issues (1)
- EMI 'Home Loan': Shows 12 installments but only 10 transactions exist
```

**Impact**: Can cause:
- Incorrect EMI progress tracking
- Wrong remaining installment calculations
- Inaccurate financial planning

---

## Fixing Common Issues

### Fixing Orphaned Data

**Step 1**: Identify the issue
- Check the Data Health Check component for orphaned data count
- Review the detailed list of orphaned records

**Step 2**: Review orphaned records
- Open browser console to see detailed information
- Identify which accounts/banks were deleted

**Step 3**: Clean up orphaned data
1. Click **"Cleanup Orphaned Data"** button in Data Health Check
2. Review the confirmation dialog showing what will be deleted
3. Click **"Cleanup Orphaned Data"** to confirm
4. Wait for the cleanup to complete
5. Page will automatically refresh

**⚠️ Warning**: This action permanently deletes orphaned records and cannot be undone. Make sure you have a backup if needed.

**Alternative**: If you want to keep the data, you can:
- Recreate the deleted account/bank
- Manually edit transactions to reference valid accounts
- Export data before cleanup for reference

### Fixing Balance Discrepancies

**Step 1**: Identify discrepancies
- Check the Data Health Check component for balance discrepancies
- Review the list showing current vs calculated balances

**Step 2**: Understand the difference
- Positive difference: Stored balance is higher than calculated
- Negative difference: Stored balance is lower than calculated

**Step 3**: Recalculate balances
1. Click **"Recalculate Balances"** button in Data Health Check
2. Review the confirmation dialog showing affected accounts
3. Click **"Recalculate All Balances"** to confirm
4. Wait for recalculation to complete
5. Page will automatically refresh

**How it works**: The system recalculates each account's balance from scratch by:
- Adding all income transactions with status 'Received'
- Subtracting all expense transactions with status 'Paid'
- Subtracting all savings/investment transactions with status 'Completed'
- Subtracting transfers sent (fromAccountId)
- Adding transfers received (toAccountId)

**Note**: This uses transactions as the source of truth, so ensure all transactions are correctly recorded.

### Fixing Data Integrity Issues

**Step 1**: Review the errors
- Check the error list in Data Health Check
- Identify the specific issues

**Step 2**: Fix manually
- Most data integrity issues require manual fixes:
  - Recreate missing entities (banks, accounts)
  - Fix invalid references
  - Correct data types
  - Remove circular dependencies

**Step 3**: Re-run checks
- Click **"Refresh"** to re-run checks
- Verify issues are resolved

### Fixing EMI Consistency Issues

**Step 1**: Identify inconsistent EMIs
- Check for EMI consistency issues (may require console inspection)
- Note which EMIs have discrepancies

**Step 2**: Review transactions
- Check if transactions were manually deleted
- Verify EMI transaction generation is working

**Step 3**: Fix manually
- Recreate missing transactions if needed
- Or update EMI's `completedInstallments` to match actual transaction count

---

## Balance Recalculation

### How Balance Recalculation Works

Account balances are calculated from transactions, not stored incrementally. This approach:

- ✅ Prevents race conditions
- ✅ Ensures data consistency
- ✅ Makes transactions the source of truth
- ✅ Handles edge cases better

### Calculation Formula

For each account:
```
Balance = 
  + Sum of Income Transactions (status = 'Received')
  - Sum of Expense Transactions (status = 'Paid')
  - Sum of Savings/Investment Transactions (status = 'Completed')
  - Sum of Transfers Sent (fromAccountId, status = 'Completed')
  + Sum of Transfers Received (toAccountId, status = 'Completed')
```

### When to Recalculate

Recalculate balances when:
- You notice balance discrepancies
- After bulk operations
- After data migration
- After manual balance edits
- When transactions seem incorrect

### Manual Recalculation

You can manually recalculate a single account's balance using the API:

```typescript
import { recalculateAccountBalance } from '../utils/balanceRecalculation';

const balance = recalculateAccountBalance('account-id');
```

Or recalculate all accounts:

```typescript
import { recalculateAllAccountBalances } from '../utils/balanceRecalculation';

recalculateAllAccountBalances();
```

---

## Orphaned Data Cleanup

### What Gets Cleaned Up

The orphaned data cleanup removes:

1. **Orphaned Transactions**:
   - Income transactions referencing deleted accounts
   - Expense transactions referencing deleted accounts
   - Savings/investment transactions referencing deleted accounts
   - Transfer transactions referencing deleted accounts

2. **Orphaned Accounts**:
   - Accounts referencing deleted banks

3. **Orphaned EMIs**:
   - EMIs referencing deleted accounts

4. **Orphaned Recurring Templates**:
   - Recurring income templates referencing deleted accounts
   - Recurring expense templates referencing deleted accounts
   - Recurring savings templates referencing deleted accounts

### Cleanup Process

1. **Detection**: System scans all data for invalid references
2. **Reporting**: Lists all orphaned records by type
3. **Confirmation**: User confirms before deletion
4. **Cleanup**: Permanently deletes orphaned records
5. **Verification**: Page refreshes to show updated status

### Before Cleanup

**⚠️ Important**: Before cleaning up orphaned data:

1. **Backup your data**: Export a backup in case you need to restore
2. **Review the list**: Check which records will be deleted
3. **Consider alternatives**: 
   - Recreate deleted accounts/banks if needed
   - Manually fix references if you want to keep the data

### After Cleanup

- Orphaned records are permanently deleted
- Data Health Check will show reduced or zero orphaned data
- Reports and analytics will be more accurate

---

## Best Practices

### 1. Regular Health Checks

- **Weekly**: Run Data Health Check to catch issues early
- **After bulk operations**: Check after importing data or bulk edits
- **After deletions**: Verify no orphaned data after deleting accounts/banks

### 2. Backup Before Fixes

- Always export a backup before:
  - Cleaning up orphaned data
  - Recalculating balances
  - Performing bulk operations

### 3. Monitor Balance Discrepancies

- Check balances regularly
- Investigate discrepancies immediately
- Understand why discrepancies occurred

### 4. Proper Account Management

- **Before deleting accounts**: 
  - Review all transactions
  - Consider exporting data
  - Understand impact on related data

- **When creating accounts**:
  - Set initial balance correctly
  - Or add a dummy transaction for initial balance

### 5. Transaction Status Management

- Keep transaction statuses accurate:
  - Mark income as 'Received' when money is received
  - Mark expenses as 'Paid' when payment is made
  - Mark savings as 'Completed' when investment is made

### 6. Data Entry Best Practices

- **Enter transactions promptly**: Don't let data get stale
- **Verify amounts**: Double-check transaction amounts
- **Use correct accounts**: Ensure transactions reference correct accounts
- **Set proper dates**: Use accurate transaction dates

### 7. Regular Backups

- Export backups regularly (weekly/monthly)
- Store backups in multiple locations
- Test restore process occasionally

---

## Troubleshooting

### Issue: Balance discrepancies keep appearing

**Possible causes**:
- Transactions with incorrect status
- Missing transactions
- Manual balance edits

**Solutions**:
1. Review transactions for the account
2. Verify transaction statuses are correct
3. Check for missing transactions
4. Recalculate balances
5. Avoid manual balance edits (let system calculate)

### Issue: Orphaned data appears after deleting account

**This is expected behavior**: When you delete an account, all transactions referencing it become orphaned.

**Solutions**:
1. **Before deletion**: Export transactions or reassign to another account
2. **After deletion**: Use cleanup to remove orphaned transactions
3. **Alternative**: Recreate the account if you need the transactions

### Issue: Data Health Check shows errors but I can't fix them

**Possible causes**:
- Complex data integrity issues
- Missing required entities
- Invalid data structure

**Solutions**:
1. Review error messages carefully
2. Check browser console for detailed information
3. Manually fix issues (recreate entities, fix references)
4. Export backup before making changes
5. Contact support if issues persist

### Issue: Balances are always wrong

**Possible causes**:
- Transactions not properly recorded
- Wrong transaction statuses
- Missing initial balance

**Solutions**:
1. Review all transactions for the account
2. Verify transaction statuses
3. Add initial balance transaction if needed
4. Recalculate balances
5. Check for missing transactions

### Issue: Can't delete account due to transactions

**This is by design**: Accounts with transactions cannot be deleted to prevent orphaned data.

**Solutions**:
1. Delete or reassign all transactions first
2. Then delete the account
3. Or keep the account and mark it as inactive

---

## Technical Details

### Data Integrity Utilities

The following utilities are available for programmatic access:

#### Orphaned Data Cleanup

```typescript
import { findOrphanedData, cleanupOrphanedData } from '../utils/orphanedDataCleanup';

// Find orphaned data
const orphanedData = findOrphanedData();
console.log(`Found ${orphanedData.totalOrphaned} orphaned records`);

// Cleanup orphaned data
const result = cleanupOrphanedData(orphanedData);
console.log(`Cleaned ${result.cleaned} records`);
```

#### Balance Recalculation

```typescript
import { 
  recalculateAccountBalance, 
  validateAllAccountBalances,
  recalculateAllAccountBalances 
} from '../utils/balanceRecalculation';

// Recalculate single account
const balance = recalculateAccountBalance('account-id');

// Validate all balances
const discrepancies = validateAllAccountBalances();

// Recalculate all balances
recalculateAllAccountBalances();
```

#### Data Integrity Validation

```typescript
import { validateDataIntegrity } from '../utils/dataMigration';

const result = validateDataIntegrity();
if (!result.isValid) {
  console.error('Data integrity issues:', result.errors);
}
```

#### EMI Consistency Validation

```typescript
import { findEMIConsistencyIssues } from '../utils/emiConsistencyValidation';

const issues = findEMIConsistencyIssues();
console.log(`Found ${issues.length} EMI consistency issues`);
```

---

## Summary

The data integrity system in Instant Express Manager ensures your financial data remains consistent and accurate. By:

- ✅ Running regular health checks
- ✅ Fixing issues promptly
- ✅ Following best practices
- ✅ Maintaining proper backups

You can ensure your financial data is always reliable and accurate.

**Remember**: When in doubt, export a backup before making changes!

---

**For more information, see**:
- `docs/API_REFERENCE.md` - API documentation for data integrity utilities
- `frontend/src/utils/orphanedDataCleanup.ts` - Orphaned data cleanup implementation
- `frontend/src/utils/balanceRecalculation.ts` - Balance recalculation implementation
- `frontend/src/components/common/DataHealthCheck.tsx` - Data Health Check component

