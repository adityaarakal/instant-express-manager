# Initial Balance Integrity Fix

## Problem Statement

When creating bank accounts, the initial balance entered by users was being cleared during balance sync operations. This was a critical data integrity issue because:

1. **Initial balances are important**: Users may have existing balances in their accounts before adding any transactions
2. **Balance sync was clearing initial balances**: The `recalculateAccountBalance` function started from 0, ignoring initial balances
3. **Data integrity compromised**: Consolidated balances and all calculations were incorrect when initial balances were not considered

## Root Cause

The `recalculateAccountBalance` function in `balanceRecalculation.ts` was starting from 0 and only calculating balance changes from transactions:

```typescript
// OLD CODE (WRONG)
let balance = 0; // Started from 0, ignoring initial balance
```

This meant that when balance sync ran, it would recalculate balances purely from transactions, effectively clearing any initial balance that existed before transactions were added.

## Solution

### 1. Added `initialBalance` Field to BankAccount Type

Added a new required field `initialBalance` to the `BankAccount` interface:

```typescript
export interface BankAccount {
  // ... other fields
  currentBalance: number;
  initialBalance: number; // Opening balance when account was created - never changes
  // ... other fields
}
```

**Key Properties:**
- `initialBalance` is set when the account is created
- It **never changes** after account creation
- It represents the opening balance that existed before any transactions

### 2. Updated Balance Recalculation Logic

Modified `recalculateAccountBalance` to start from `initialBalance` instead of 0:

```typescript
// NEW CODE (CORRECT)
const initialBalance = account.initialBalance ?? 0;
let balance = initialBalance; // Start from initial balance
```

This ensures that:
- Initial balances are always included in calculations
- Balance sync preserves initial balances
- All balance calculations are accurate

### 3. Account Creation Logic

When creating a new account, `initialBalance` is automatically set to `currentBalance`:

```typescript
const initialBalance = accountData.currentBalance ?? 0;
const newAccount: BankAccount = {
  ...accountData,
  initialBalance, // Preserves opening balance permanently
  // ...
};
```

### 4. Account Update Logic

When updating an account, `initialBalance` is **preserved** and never changed:

```typescript
updateAccount: (id: string, updates: Partial<Omit<BankAccount, 'id' | 'createdAt' | 'initialBalance'>>) => {
  // initialBalance is excluded from updates - it can never be changed
  // It's automatically preserved in the update logic
}
```

### 5. Data Migration

Added migration logic to handle existing accounts without `initialBalance`:

```typescript
migrate: (persistedState: unknown, version: number) => {
  if (version < 2 && persistedState?.state?.accounts) {
    const migratedAccounts = state.state.accounts.map((account) => ({
      ...account,
      // Set initialBalance to currentBalance for existing accounts
      initialBalance: account.initialBalance ?? account.currentBalance ?? 0,
    }));
    return { ...persistedState, state: { ...state.state, accounts: migratedAccounts } };
  }
  return persistedState;
}
```

**Migration Strategy:**
- For existing accounts, `initialBalance` is set to their current `currentBalance`
- This preserves their opening balance retroactively
- Ensures backward compatibility

### 6. Balance Sync Preservation

The balance sync function now correctly includes `initialBalance` in calculations:

```typescript
export function syncAccountBalancesFromTransactions(): SyncResult[] {
  // Uses recalculateAccountBalance which now includes initialBalance
  const calculatedBalance = recalculateAccountBalance(account.id);
  // This balance includes initialBalance + transaction effects
}
```

## Impact

### Before Fix:
- ❌ Initial balances were cleared during balance sync
- ❌ Consolidated balances were incorrect
- ❌ Balance calculations ignored opening balances
- ❌ Data integrity compromised

### After Fix:
- ✅ Initial balances are always preserved
- ✅ Consolidated balances include initial balances correctly
- ✅ Balance sync doesn't clear initial balances
- ✅ All balance calculations are accurate
- ✅ Data integrity maintained across all operations

## Testing Checklist

- [x] Create new account with initial balance → `initialBalance` is set correctly
- [x] Update account → `initialBalance` is preserved
- [x] Run balance sync → Initial balance is not cleared
- [x] Recalculate balance → Includes initial balance in calculation
- [x] Consolidated balance on Dashboard → Includes initial balances
- [x] Data migration → Existing accounts get `initialBalance` set correctly
- [x] Backup/Restore → `initialBalance` is preserved

## Files Modified

1. `frontend/src/types/bankAccounts.ts` - Added `initialBalance` field
2. `frontend/src/store/useBankAccountsStore.ts` - Updated creation, update, and migration logic
3. `frontend/src/utils/balanceRecalculation.ts` - Start from `initialBalance` instead of 0
4. `frontend/src/pages/BankAccounts.tsx` - Set `initialBalance` on account creation
5. `frontend/src/utils/dataMigration.ts` - Preserve `initialBalance` during migration
6. `frontend/src/utils/commandHelpers.ts` - Updated undo operations

## Version

- **Version**: 1.0.113
- **Store Version**: 2 (migration from version 1)

## Notes

- `initialBalance` is a **read-only** field after account creation
- It represents the opening balance that existed before any transactions
- All balance calculations now correctly include this initial balance
- This ensures data integrity and accurate financial tracking

