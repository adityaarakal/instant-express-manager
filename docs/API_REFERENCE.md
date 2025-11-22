# API Reference

**Last Updated**: 2025-01-20  
**Version**: 1.0.61

This document provides comprehensive API documentation for the Instant Express Manager application. It covers all utility functions, Zustand stores, React hooks, and type definitions.

---

## Table of Contents

1. [Utility Functions](#utility-functions)
2. [Zustand Stores](#zustand-stores)
3. [React Hooks](#react-hooks)
4. [Type Definitions](#type-definitions)
5. [Error Handling](#error-handling)
6. [Data Validation](#data-validation)

---

## Utility Functions

### Financial Precision Utilities

**File**: `frontend/src/utils/financialPrecision.ts`

Utilities for handling floating-point precision issues in financial calculations.

#### `roundToCurrency(value: number): number`

Rounds a number to 2 decimal places (for currency) using proper rounding to avoid floating-point precision issues.

**Parameters**:
- `value` (number): The number to round

**Returns**: `number` - The rounded value

**Example**:
```typescript
roundToCurrency(10.999); // Returns 11.00
roundToCurrency(10.994); // Returns 10.99
```

#### `addCurrency(a: number, b: number): number`

Adds two currency values with proper precision.

**Parameters**:
- `a` (number): First currency value
- `b` (number): Second currency value

**Returns**: `number` - The sum with proper precision

**Example**:
```typescript
addCurrency(10.1, 0.2); // Returns 10.3 (not 10.300000000000001)
```

#### `subtractCurrency(a: number, b: number): number`

Subtracts two currency values with proper precision.

**Parameters**:
- `a` (number): Minuend
- `b` (number): Subtrahend

**Returns**: `number` - The difference with proper precision

#### `multiplyCurrency(value: number, multiplier: number): number`

Multiplies a currency value by a number with proper precision.

**Parameters**:
- `value` (number): Currency value
- `multiplier` (number): Multiplier

**Returns**: `number` - The product with proper precision

#### `sumCurrency(values: number[]): number`

Sums an array of currency values with proper precision using integer arithmetic.

**Parameters**:
- `values` (number[]): Array of currency values

**Returns**: `number` - The sum with proper precision

**Example**:
```typescript
sumCurrency([10.1, 0.2, 5.3]); // Returns 15.6
```

#### `areCurrencyValuesEqual(a: number, b: number, tolerance?: number): boolean`

Checks if two currency values are equal within a tolerance (default 0.01).

**Parameters**:
- `a` (number): First value
- `b` (number): Second value
- `tolerance` (number, optional): Tolerance for comparison (default: 0.01)

**Returns**: `boolean` - True if values are equal within tolerance

---

### Date Precision Utilities

**File**: `frontend/src/utils/datePrecision.ts`

Utilities for handling date precision and timezone issues.

#### `normalizeDateString(dateStr: string): string | null`

Normalizes a date string to YYYY-MM-DD format.

**Parameters**:
- `dateStr` (string): Date string in various formats

**Returns**: `string | null` - Normalized date string or null if invalid

**Example**:
```typescript
normalizeDateString('2024-01-15'); // Returns '2024-01-15'
normalizeDateString('01/15/2024'); // Returns '2024-01-15'
```

#### `getDateOnly(date: Date): Date`

Gets a date object with time set to midnight (00:00:00) to avoid timezone issues.

**Parameters**:
- `date` (Date): Date object

**Returns**: `Date` - Date with time set to midnight

#### `compareDates(date1: Date, date2: Date): number`

Compares two dates, returning -1, 0, or 1.

**Parameters**:
- `date1` (Date): First date
- `date2` (Date): Second date

**Returns**: `number` - -1 if date1 < date2, 0 if equal, 1 if date1 > date2

---

### Balance Recalculation Utilities

**File**: `frontend/src/utils/balanceRecalculation.ts`

Utilities for recalculating account balances from transactions to ensure data consistency.

#### `recalculateAccountBalance(accountId: string): number`

Recalculates balance for a single account from all transactions. This is the source of truth for account balances.

**Parameters**:
- `accountId` (string): The account ID

**Returns**: `number` - The recalculated balance

**Note**: This function calculates balance from scratch based on all transactions, preventing race conditions and ensuring accuracy.

#### `validateAllAccountBalances(): Array<{accountId: string; expectedBalance: number; actualBalance: number}>`

Validates all account balances against recalculated values.

**Returns**: `Array` - Array of discrepancies found (empty if all balances are correct)

#### `recalculateAllAccountBalances(): void`

Recalculates and updates balances for all accounts.

**Returns**: `void`

---

### Data Integrity Utilities

**File**: `frontend/src/utils/orphanedDataCleanup.ts`

Utilities for detecting and cleaning up orphaned data.

#### `findOrphanedData(): OrphanedDataResult`

Finds all orphaned data (data referencing non-existent entities).

**Returns**: `OrphanedDataResult` - Object containing counts of orphaned records by type

#### `cleanupOrphanedData(orphanedData: OrphanedDataResult): CleanupResult`

Cleans up orphaned data from the system.

**Parameters**:
- `orphanedData` (OrphanedDataResult): Result from `findOrphanedData()`

**Returns**: `CleanupResult` - Object with cleanup statistics and errors

---

### Projections Integration Utilities

**File**: `frontend/src/utils/projectionsIntegration.ts`

Utilities for importing and managing financial projections.

#### `importProjectionsFromCSV(file: File): Promise<{projections: ProjectionsImportRow[]; validation: ProjectionsImportValidationResult}>`

Imports projections from a CSV file.

**Parameters**:
- `file` (File): CSV file to import

**Returns**: `Promise` - Object containing parsed projections and validation results

**Example**:
```typescript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const { projections, validation } = await importProjectionsFromCSV(file);
```

#### `importProjectionsFromExcel(file: File): Promise<{projections: ProjectionsImportRow[]; validation: ProjectionsImportValidationResult}>`

Imports projections from an Excel file (.xlsx).

**Parameters**:
- `file` (File): Excel file to import

**Returns**: `Promise` - Object containing parsed projections and validation results

#### `autoPopulateInflowFromProjections(monthId: string): void`

Auto-populates inflow total for a month from projections data.

**Parameters**:
- `monthId` (string): Month ID in format "YYYY-MM"

**Returns**: `void`

#### `getSavingsProgress(monthId: string): {target: number | null; actual: number; progress: number}`

Calculates savings progress for a month.

**Parameters**:
- `monthId` (string): Month ID in format "YYYY-MM"

**Returns**: `Object` - Object with target, actual, and progress percentage

---

### Backup/Restore Utilities

**File**: `frontend/src/utils/backupService.ts`

Utilities for exporting and importing application data.

#### `exportBackup(): BackupData`

Exports all application data to a backup object.

**Returns**: `BackupData` - Complete backup data structure

#### `downloadBackup(): void`

Exports and downloads backup as a JSON file.

**Returns**: `void`

#### `validateBackup(data: unknown): data is BackupData`

Validates backup data structure.

**Parameters**:
- `data` (unknown): Data to validate

**Returns**: `boolean` - True if valid backup structure

#### `importBackup(backupData: BackupData, replaceExisting?: boolean): {success: boolean; migrated: boolean; backupVersion: string; warnings?: string[]; errors?: string[]}`

Imports backup data into the application.

**Parameters**:
- `backupData` (BackupData): Backup data to import
- `replaceExisting` (boolean, optional): If true, replaces all existing data; if false, merges (default: false)

**Returns**: `Object` - Import result with success status, migration info, and warnings/errors

#### `readBackupFile(file: File): Promise<BackupData>`

Reads and validates a backup file.

**Parameters**:
- `file` (File): Backup file to read

**Returns**: `Promise<BackupData>` - Parsed backup data

---

### IndexedDB Error Handling

**File**: `frontend/src/utils/indexedDBErrorHandling.ts`

Utilities for handling IndexedDB errors with retry logic.

#### `withRetry<T>(operation: () => Promise<T>, maxRetries?: number, delay?: number): Promise<T>`

Executes an operation with automatic retry on failure.

**Parameters**:
- `operation` (function): Async operation to execute
- `maxRetries` (number, optional): Maximum retry attempts (default: 3)
- `delay` (number, optional): Delay between retries in ms (default: 1000)

**Returns**: `Promise<T>` - Result of the operation

---

### Bulk Operations Utilities

**File**: `frontend/src/utils/bulkOperationsTransaction.ts`

Utilities for performing bulk operations with transactional rollback.

#### `executeBulkStatusUpdateWithTransaction(updates: Array<{monthId: string; bucketId: string; status: AllocationStatus}>): BulkOperationResult`

Executes bulk status updates with transactional rollback on failure.

**Parameters**:
- `updates` (Array): Array of update objects

**Returns**: `BulkOperationResult` - Result with success count, errors, and rollback status

---

### EMI Consistency Validation

**File**: `frontend/src/utils/emiConsistencyValidation.ts`

Utilities for validating EMI consistency.

#### `validateEMIConsistency(emiId: string): EMIConsistencyResult`

Validates that an EMI's `completedInstallments` matches actual generated transactions.

**Parameters**:
- `emiId` (string): EMI ID to validate

**Returns**: `EMIConsistencyResult` - Validation result with discrepancies if any

---

## Zustand Stores

All stores use Zustand with persistence to IndexedDB via localforage.

### Bank Accounts Store

**File**: `frontend/src/store/useBankAccountsStore.ts`

Manages bank account data and operations.

#### State

```typescript
{
  accounts: BankAccount[];
}
```

#### Methods

##### `createAccount(account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>): void`

Creates a new bank account.

**Parameters**:
- `account` (object): Account data (without id, createdAt, updatedAt)

**Throws**: `Error` if bankId doesn't exist or validation fails

##### `updateAccount(id: string, updates: Partial<Omit<BankAccount, 'id' | 'createdAt'>>): void`

Updates an existing bank account.

**Parameters**:
- `id` (string): Account ID
- `updates` (object): Partial account data to update

##### `deleteAccount(id: string): void`

Deletes a bank account.

**Parameters**:
- `id` (string): Account ID

**Note**: Validates that account has no associated transactions before deletion

##### `getAccount(id: string): BankAccount | undefined`

Gets an account by ID.

**Parameters**:
- `id` (string): Account ID

**Returns**: `BankAccount | undefined` - Account or undefined if not found

##### `getAccountsByBank(bankId: string): BankAccount[]`

Gets all accounts for a specific bank.

**Parameters**:
- `bankId` (string): Bank ID

**Returns**: `BankAccount[]` - Array of accounts

##### `getAccountsByType(type: BankAccount['accountType']): BankAccount[]`

Gets all accounts of a specific type.

**Parameters**:
- `type` (string): Account type

**Returns**: `BankAccount[]` - Array of accounts

##### `updateAccountBalance(id: string, newBalance: number): void`

Updates an account's balance.

**Parameters**:
- `id` (string): Account ID
- `newBalance` (number): New balance value

##### `getBankAccountSummary(accountId: string): BankAccountSummary`

Gets a comprehensive summary for an account.

**Parameters**:
- `accountId` (string): Account ID

**Returns**: `BankAccountSummary` - Summary object with transaction counts and balance impact

---

### Income Transactions Store

**File**: `frontend/src/store/useIncomeTransactionsStore.ts`

Manages income transaction data.

#### State

```typescript
{
  transactions: IncomeTransaction[];
}
```

#### Methods

##### `addTransaction(transaction: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'>): void`

Adds a new income transaction.

##### `updateTransaction(id: string, updates: Partial<IncomeTransaction>): void`

Updates an existing income transaction.

##### `deleteTransaction(id: string): void`

Deletes an income transaction.

##### `getTransaction(id: string): IncomeTransaction | undefined`

Gets a transaction by ID.

##### `getTransactionsByAccount(accountId: string): IncomeTransaction[]`

Gets all transactions for an account.

##### `getTransactionsByMonth(monthId: string): IncomeTransaction[]`

Gets all transactions for a month.

---

### Expense Transactions Store

**File**: `frontend/src/store/useExpenseTransactionsStore.ts`

Manages expense transaction data. Similar API to Income Transactions Store.

---

### Savings/Investment Transactions Store

**File**: `frontend/src/store/useSavingsInvestmentTransactionsStore.ts`

Manages savings and investment transaction data. Similar API to Income Transactions Store.

---

### Planner Store

**File**: `frontend/src/store/usePlannerStore.ts`

Manages monthly planner data and allocations.

#### Methods

##### `createMonth(monthId: string, data: Partial<PlannedMonth>): void`

Creates a new planned month.

##### `updateMonth(monthId: string, updates: Partial<PlannedMonth>): void`

Updates a planned month.

##### `getMonth(monthId: string): PlannedMonth | undefined`

Gets a planned month by ID.

##### `updateAllocation(monthId: string, bucketId: string, updates: Partial<Allocation>): void`

Updates an allocation within a month.

---

### Projections Store

**File**: `frontend/src/store/useProjectionsStore.ts`

Manages financial projections data.

#### Methods

##### `importProjections(projections: Projection[]): void`

Imports projection data.

##### `getProjection(monthId: string): Projection | undefined`

Gets a projection for a month.

##### `clearAll(): void`

Clears all projections.

---

### Toast Store

**File**: `frontend/src/store/useToastStore.ts`

Manages toast notifications.

#### Methods

##### `showSuccess(message: string, duration?: number): void`

Shows a success toast.

##### `showError(message: string, duration?: number): void`

Shows an error toast.

##### `showWarning(message: string, duration?: number): void`

Shows a warning toast.

##### `showInfo(message: string, duration?: number): void`

Shows an info toast.

---

## React Hooks

### useDataIntegrity

**File**: `frontend/src/hooks/useDataIntegrity.ts`

Automatically validates and fixes data integrity issues on app startup.

#### Usage

```typescript
function App() {
  const { isChecking, lastCheckTime, checkDataIntegrity } = useDataIntegrity(true);
  
  // Hook automatically runs on mount in development mode
  // Or when autoFix is true
  
  return (
    <div>
      {isChecking && <p>Checking data integrity...</p>}
      {lastCheckTime && <p>Last check: {lastCheckTime.toLocaleString()}</p>}
      <button onClick={checkDataIntegrity}>Check Now</button>
    </div>
  );
}
```

#### Parameters

- `autoFix` (boolean, optional): If true, automatically fixes issues (default: false)

#### Returns

```typescript
{
  isChecking: boolean;
  lastCheckTime: Date | null;
  checkDataIntegrity: () => Promise<void>;
}
```

---

### useUndoRedo

**File**: `frontend/src/hooks/useUndoRedo.ts`

Provides undo/redo functionality with keyboard shortcuts (Ctrl+Z / Ctrl+Y).

#### Usage

```typescript
function MyComponent() {
  const { undo, redo, canUndo, canRedo, lastAction } = useUndoRedo();
  
  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
      {lastAction && <p>Last action: {lastAction}</p>}
    </div>
  );
}
```

#### Returns

```typescript
{
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastAction: string | null;
}
```

**Keyboard Shortcuts**:
- `Ctrl+Z` (or `Cmd+Z` on Mac): Undo
- `Ctrl+Y` or `Ctrl+Shift+Z` (or `Cmd+Shift+Z` on Mac): Redo

---

### useKeyboardNavigation

**File**: `frontend/src/hooks/useKeyboardNavigation.ts`

Provides keyboard navigation functionality.

#### Usage

```typescript
function MyComponent() {
  useKeyboardNavigation({
    onEscape: () => closeDialog(),
    onEnter: () => submitForm(),
  });
}
```

---

### useNotifications

**File**: `frontend/src/hooks/useNotifications.ts`

Manages browser notifications for due dates and reminders.

#### Usage

```typescript
function MyComponent() {
  const { requestPermission, sendNotification } = useNotifications();
  
  useEffect(() => {
    requestPermission();
  }, []);
  
  const handleDueDate = () => {
    sendNotification('Payment Due', 'Your credit card payment is due today');
  };
}
```

---

### useScheduledExports

**File**: `frontend/src/hooks/useScheduledExports.ts`

Manages scheduled data exports.

#### Usage

```typescript
function MyComponent() {
  const { schedules, createSchedule, deleteSchedule } = useScheduledExports();
  
  // Hook automatically runs scheduled exports
}
```

---

## Type Definitions

### BankAccount

```typescript
interface BankAccount {
  id: string;
  bankId: string;
  accountName: string;
  accountNumber?: string;
  accountType: 'Savings' | 'Current' | 'Credit Card' | 'Loan';
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
}
```

### IncomeTransaction

```typescript
interface IncomeTransaction {
  id: string;
  accountId: string;
  monthId: string;
  amount: number;
  description: string;
  status: 'Pending' | 'Received';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

### ExpenseTransaction

```typescript
interface ExpenseTransaction {
  id: string;
  accountId: string;
  monthId: string;
  amount: number;
  description: string;
  status: 'Pending' | 'Paid';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

### PlannedMonth

```typescript
interface PlannedMonth {
  monthId: string; // Format: "YYYY-MM"
  inflowTotal: number;
  allocations: Allocation[];
  createdAt: string;
  updatedAt: string;
}
```

### Allocation

```typescript
interface Allocation {
  id: string;
  bucketId: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Skipped';
  dueDate?: string;
}
```

---

## Error Handling

### Error Handling Utilities

**File**: `frontend/src/utils/errorHandling.ts`

Utilities for consistent error handling across the application.

#### `handleError(error: unknown, context?: string): void`

Handles errors consistently with logging and user notifications.

**Parameters**:
- `error` (unknown): Error to handle
- `context` (string, optional): Context where error occurred

---

## Data Validation

### Validation Utilities

**File**: `frontend/src/utils/validation.ts`

Utilities for validating data before operations.

#### `validateAmount(amount: number, fieldName?: string): ValidationResult`

Validates an amount value.

**Parameters**:
- `amount` (number): Amount to validate
- `fieldName` (string, optional): Field name for error messages

**Returns**: `ValidationResult` - Object with isValid boolean and errors array

#### `validateAccountBalance(account: BankAccount): ValidationResult`

Validates an account balance.

**Parameters**:
- `account` (BankAccount): Account to validate

**Returns**: `ValidationResult` - Object with isValid boolean and errors array

---

## Notes

- All stores persist data to IndexedDB automatically
- All date operations should use date precision utilities to avoid timezone issues
- All financial calculations should use financial precision utilities to avoid floating-point errors
- All bulk operations support transactional rollback on failure
- All imports/exports include validation and error handling

---

**For more information, see the source code and inline JSDoc comments.**

