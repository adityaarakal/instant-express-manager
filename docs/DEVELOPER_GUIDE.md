# Developer Guide - Instant Express Manager

## Project Overview

This is a React PWA built with TypeScript, Material UI, and Zustand for state management. The app is a comprehensive standalone financial management system with full CRUD operations for banks, accounts, transactions, EMIs, and recurring templates.

## Architecture

### State Management

- **Zustand Stores**: Multiple stores for each entity type
  - `useBanksStore`: Manages banks
  - `useBankAccountsStore`: Manages bank accounts
  - `useIncomeTransactionsStore`: Manages income transactions
  - `useExpenseTransactionsStore`: Manages expense transactions
  - `useSavingsInvestmentTransactionsStore`: Manages savings/investment transactions
  - `useTransferTransactionsStore`: Manages internal account transfers
  - `useExpenseEMIsStore`: Manages expense EMIs
  - `useSavingsInvestmentEMIsStore`: Manages savings/investment EMIs
  - `useRecurringIncomesStore`: Manages recurring income templates
  - `useRecurringExpensesStore`: Manages recurring expense templates
  - `useRecurringSavingsInvestmentsStore`: Manages recurring savings/investment templates
  - `usePlannerStore`: UI state (active month, filters)
  - `useSettingsStore`: User preferences
  - `useToastStore`: Toast notifications
  - `useUndoStore`: Undo functionality
- **Persistence**: All stores use `localforage` for IndexedDB persistence
- **Storage Keys**: Each store has its own storage key (e.g., `banks`, `bank-accounts`, `income-transactions`)

### Data Flow

1. **Store Initialization**: Stores initialize with empty arrays or default data
2. **User Actions**: CRUD operations flow through store actions
3. **Persistence**: Changes automatically saved to IndexedDB via Zustand persist middleware
4. **UI Updates**: React components subscribe to store changes
5. **Validation**: Business rules enforced in store actions
6. **Auto-Generation**: Services generate transactions from EMIs and recurring templates

### Component Structure

```
components/
├── analytics/        # Analytics chart components
├── common/          # Shared components (ErrorBoundary, Toast, etc.)
├── dashboard/       # Dashboard-specific components
├── layout/          # Layout components (AppBar, Navigation)
├── planner/         # Planner-specific components
└── transactions/    # Transaction-specific components
```

## Key Files

### Stores

All stores follow a similar pattern:

```typescript
interface StoreState {
  items: Entity[];
  createItem: (data: CreateData) => void;
  updateItem: (id: string, data: UpdateData) => void;
  deleteItem: (id: string) => void;
  // ... other actions
}
```

Key stores:
- `src/store/useBanksStore.ts`: Bank CRUD operations
- `src/store/useBankAccountsStore.ts`: Account CRUD operations with validation and balance management
- `src/store/useIncomeTransactionsStore.ts`: Income transaction CRUD with automatic balance updates
- `src/store/useExpenseTransactionsStore.ts`: Expense transaction CRUD with automatic balance updates
- `src/store/useSavingsInvestmentTransactionsStore.ts`: Savings/investment transaction CRUD with automatic balance updates
- `src/store/useExpenseEMIsStore.ts`: Expense EMI CRUD with auto-generation, conversion to Recurring, and deduction date management
- `src/store/useSavingsInvestmentEMIsStore.ts`: Savings/investment EMI CRUD with conversion to Recurring and deduction date management
- `src/store/useRecurringIncomesStore.ts`: Recurring income template CRUD with deduction date management
- `src/store/useRecurringExpensesStore.ts`: Recurring expense template CRUD with conversion to EMI and deduction date management
- `src/store/useRecurringSavingsInvestmentsStore.ts`: Recurring savings/investment template CRUD with conversion to EMI and deduction date management

**Deduction Date Methods**:
- `updateDeductionDate(emiId/templateId, newDate, updateOption)`: Update deduction date with options:
  - `'this-date-only'`: Only updates the deduction date
  - `'all-future'`: Shifts all future pending transactions by the offset
  - `'reset-schedule'`: Recalculates all future transactions from the new date

### Services

- `src/services/autoGenerationService.ts`: Auto-generates transactions from EMIs and recurring templates
  - `generateEMITransactions`: Generates transactions for active EMIs
- `src/utils/emiRecurringConversion.ts`: Conversion utilities between EMIs and Recurring Templates
  - `convertExpenseEMIToRecurring`: Converts ExpenseEMI to RecurringExpense
  - `convertSavingsEMIToRecurring`: Converts SavingsInvestmentEMI to RecurringSavingsInvestment
  - `convertRecurringExpenseToEMI`: Converts RecurringExpense to ExpenseEMI
  - `convertRecurringSavingsToEMI`: Converts RecurringSavingsInvestment to SavingsInvestmentEMI
  - `getNextDueDateFromEMI`: Calculates next due date for recurring template from EMI (uses deductionDate if set)
- `src/utils/dateCalculations.ts`: Date calculation utilities for EMIs and Recurring Templates
  - `calculateEMINextDueDate`: Calculate next due date from start date and installments
  - `calculateNextDateFromDate`: Calculate next date from a given date based on frequency
  - `calculateDateOffset`: Calculate date offset in days
  - `addDaysToDate`: Add days to a date
  - `getEffectiveEMIDeductionDate`: Get effective deduction date for EMI (uses deductionDate if set, otherwise calculates)
  - `getEffectiveRecurringDeductionDate`: Get effective deduction date for Recurring (uses deductionDate if set, otherwise uses nextDueDate)
- `src/components/common/ConversionWizard.tsx`: UI wizard for converting between EMIs and Recurring Templates
  - `generateRecurringTransactions`: Generates transactions for active recurring templates

### Month Selection Behavior

The application prioritizes **latest and current months** across all monthly views:

- **Dashboard**: Always defaults to current month for monthly metrics
- **Planner**: Defaults to current month (or latest available month if current has no data)
- **Month Selectors**: All month dropdowns show months sorted in descending order (latest first)
- **Copy Month Dialog**: Defaults to current/latest month as target
- **Month Comparison Dialog**: Defaults to current/latest month for comparison

This ensures users always see the most recent and relevant data by default, while still allowing them to navigate to older months if needed.

#### `getAvailableMonths` (in `src/utils/aggregation.ts`)
- Returns months sorted in **descending order** (latest first) to prioritize current/recent months
- Used throughout the app to ensure month lists show newest months at the top

### Utilities

- `src/utils/accountBalanceUpdates.ts`: Automatic account balance updates for income/expense/savings transactions
- `src/utils/transferBalanceUpdates.ts`: Automatic account balance updates for transfer transactions
  - `updateAccountBalancesForTransfer`: Updates both from and to account balances when transfer is completed
  - `reverseAccountBalancesForTransfer`: Reverses balance changes when transfer is deleted or status changes to Pending
  - `updateAccountBalancesForTransferUpdate`: Handles balance updates when transfer amount or accounts change
  - `updateAccountBalanceForTransaction`: Updates account balance when transactions are created/updated
  - `reverseAccountBalanceForTransaction`: Reverses balance changes when transactions are deleted
  - Automatically handles income (increases balance when "Received"), expenses (decreases when "Paid"), and savings/investments (decreases when "Completed")
  - Reverses balance changes when status changes back to "Pending"
  - Handles account transfers (updates both old and new accounts)
  - Integrated into all transaction stores

- `src/utils/balanceSync.ts`: Balance sync utility for existing data
  - `calculateAccountBalanceFromTransactions`: Calculates what an account balance should be based on transactions
  - `syncAccountBalancesFromTransactions`: Syncs all account balances based on existing transactions
  - Useful for syncing old data with new automatic balance update feature
  - Treats current balance as base and applies transaction effects on top
  - Returns detailed sync results showing which accounts were updated

- `src/utils/aggregation.ts`: Planner aggregation logic
  - `aggregateMonthData`: Aggregates transactions into monthly view
  - `calculateBucketTotals`: Calculates bucket totals from transactions

- `src/utils/backupService.ts`: Backup/restore functionality
  - `exportBackup`: Exports all store data to JSON
  - `importBackup`: Imports data with replace/merge options
  - `validateBackup`: Validates backup file structure

- `src/utils/errorHandling.ts`: Error message formatting
  - `getUserFriendlyError`: Formats errors for user display
  - `formatErrorMessage`: Converts technical errors to user-friendly messages

- `src/utils/entityRelationships.ts`: Entity relationship utilities
  - `getEntityDependencies`: Gets entities that depend on a given entity
  - `checkEntityReferences`: Checks if entity is referenced by others

- `src/utils/transactionExport.ts`: CSV export utilities
  - `exportIncomeTransactionsToCSV`: Exports income transactions to CSV
  - `exportExpenseTransactionsToCSV`: Exports expense transactions to CSV
  - `exportSavingsTransactionsToCSV`: Exports savings/investment transactions to CSV
  - `exportTransferTransactionsToCSV`: Exports transfer transactions to CSV
  - `downloadCSV`: Downloads CSV file to user's device

- `src/utils/undoRestore.ts`: Undo functionality
  - `restoreDeletedItem`: Restores a deleted item from undo store

- `src/utils/validation.ts`: Data validation
  - `validateDate`: Validates date format
  - `validateDateRange`: Validates date ranges
  - `validateAmount`: Validates amount values
  - `checkDataInconsistencies`: Comprehensive data health check

### Types

- `src/types/banks.ts`: Bank type definitions
- `src/types/bankAccounts.ts`: Bank account type definitions
- `src/types/transactions.ts`: Transaction type definitions
  - `IncomeTransaction`: Income transaction type
  - `ExpenseTransaction`: Expense transaction type
  - `SavingsInvestmentTransaction`: Savings/investment transaction type
  - `TransferTransaction`: Internal account transfer type
- `src/types/emis.ts`: EMI type definitions
- `src/types/recurring.ts`: Recurring template type definitions
- `src/types/plannedExpensesAggregated.ts`: Planner aggregated data types

## Development Workflow

### Adding a New Entity

1. **Create Type Definition**: Add types in `src/types/`
2. **Create Store**: Create Zustand store with CRUD operations
3. **Add Persistence**: Configure Zustand persist middleware
4. **Add Validation**: Implement business rules in store actions
5. **Create UI Components**: Build page and form components
6. **Add Tests**: Write tests for store and components
7. **Update Docs**: Update relevant documentation

### Adding a New Feature

1. **Update Types**: Add types if needed
2. **Update Store**: Add actions/selectors in relevant store
3. **Create Components**: Build UI components
4. **Add Validation**: Add business rules
5. **Add Tests**: Write tests for new functionality
6. **Update Docs**: Update relevant documentation

### Testing

Run tests:
```bash
cd frontend
npm test
```

Test files follow pattern: `*.test.ts` or `*.test.tsx`

### Code Style

- TypeScript strict mode enabled
- ESLint for linting
- Prefer functional components with hooks
- Use Material UI for UI components
- Use Zustand for state management
- Use React Router for navigation

## Data Model

### Core Entities

All entities follow a similar pattern with:
- `id`: Unique identifier (UUID)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

Key entities:
- **Bank**: Bank information (name, type, country, notes)
- **BankAccount**: Account information (name, bank, type, balance, etc.)
- **IncomeTransaction**: Income transaction (date, amount, account, category, etc.)
- **ExpenseTransaction**: Expense transaction (date, amount, account, category, etc.)
- **SavingsInvestmentTransaction**: Savings/investment transaction (date, amount, account, type, etc.)
- **ExpenseEMI**: Expense EMI (name, amount, account, installments, startDate, endDate, deductionDate, etc.)
- **SavingsInvestmentEMI**: Savings/investment EMI (name, amount, account, installments, startDate, endDate, deductionDate, etc.)
- **RecurringIncome**: Recurring income template (name, amount, frequency, startDate, endDate, nextDueDate, deductionDate, etc.)
- **RecurringExpense**: Recurring expense template (name, amount, frequency, startDate, endDate, nextDueDate, deductionDate, etc.)
- **RecurringSavingsInvestment**: Recurring savings/investment template (name, amount, frequency, startDate, endDate, nextDueDate, deductionDate, etc.)

**Date Fields Explained**:
- **startDate**: Defines when the EMI/Recurring template period begins
- **endDate**: Defines when the EMI/Recurring template period ends (optional for Recurring templates)
- **deductionDate**: (Optional) Actual date when the next transaction will be deducted/credited. Independent of start/end dates. Used for auto-generation if set.
- **nextDueDate**: (Recurring only) Internal scheduling date. Used if deductionDate is not set.

### Entity Relationships

- **Bank** → **BankAccount** (one-to-many)
- **BankAccount** → **Transaction** (one-to-many)
- **BankAccount** → **EMI** (one-to-many)
- **BankAccount** → **Recurring Template** (one-to-many)
- **EMI** → **Transaction** (one-to-many, via `emiId`)
- **Recurring Template** → **Transaction** (one-to-many, via `recurringTemplateId`)

See `docs/ENTITY_RELATIONSHIPS.md` for complete relationship documentation.

## Automatic Account Balance Updates

### Overview

Account balances automatically update when transactions are created, updated, or deleted based on their status. This ensures that account balances always reflect the current state of transactions.

### Implementation

The automatic balance update system is implemented in:

1. **`src/utils/accountBalanceUpdates.ts`**: Core utility functions
   - `updateAccountBalanceForTransaction()`: Updates balance when transactions change
   - `reverseAccountBalanceForTransaction()`: Reverses balance changes when transactions are deleted

2. **Transaction Stores**: All transaction stores integrate balance updates
   - `useIncomeTransactionsStore.ts`: Updates balance when income is "Received"
   - `useExpenseTransactionsStore.ts`: Updates balance when expenses are "Paid"
   - `useSavingsInvestmentTransactionsStore.ts`: Updates balance when savings/investments are "Completed"

### Balance Update Rules

**Income Transactions:**
- Status "Received" → Balance increases by transaction amount
- Status "Pending" → No balance change

**Expense Transactions:**
- Status "Paid" → Balance decreases by transaction amount
- Status "Pending" → No balance change

**Savings/Investment Transactions:**
- Status "Completed" → Balance decreases by transaction amount (money moved out)
- Status "Pending" → No balance change

### Update Scenarios

1. **Creating Transaction**: If created with status "Received"/"Paid"/"Completed", balance updates immediately
2. **Updating Transaction Status**: Balance adjusts based on status change (e.g., "Pending" → "Received" adds to balance)
3. **Updating Transaction Amount**: Balance adjusts by the difference
4. **Changing Transaction Account**: Both old and new accounts update correctly
5. **Deleting Transaction**: If transaction was "Received"/"Paid"/"Completed", balance change is reversed

### Integration in Stores

Each transaction store calls the balance update utility in:
- `createTransaction()`: After creating transaction, if status is applicable
- `updateTransaction()`: After updating transaction, calculating the difference between old and new status/amount/account
- `deleteTransaction()`: Before deleting transaction, reversing balance change if applicable

### Auto-Generated Transactions

**EMIs and Recurring Templates:**
- Auto-generated transactions from EMIs and Recurring templates are created with `status: 'Pending'` by default
- This is intentional design - auto-generated transactions represent planned/scheduled transactions that haven't been confirmed yet
- Balance updates only occur when the user manually changes the status to "Received"/"Paid"/"Completed"
- The following stores generate transactions with "Pending" status:
  - `useExpenseEMIsStore`: Expense EMIs → `status: 'Pending'`
  - `useSavingsInvestmentEMIsStore`: Savings/Investment EMIs → `status: 'Pending'`
  - `useRecurringIncomesStore`: Recurring Income → `status: 'Pending'`
  - `useRecurringExpensesStore`: Recurring Expense → `status: 'Pending'`
  - `useRecurringSavingsInvestmentsStore`: Recurring Savings/Investment → `status: 'Pending'`

This ensures that balance updates only happen when transactions are actually confirmed, not just scheduled.

## Validation & Business Rules

### Store-Level Validation

All stores implement validation in their CRUD operations:
- **Foreign Key Validation**: Ensures referenced entities exist
- **Deletion Validation**: Prevents deletion if entity is referenced
- **Date Validation**: Validates date ranges and formats
- **Amount Validation**: Ensures amounts are positive and valid
- **EMI Validation**: Validates installment counts and progress

### Data Health Checks

Use `src/utils/validation.ts` for comprehensive data health checks:
- Orphaned transactions (missing account references)
- Orphaned EMIs (missing account references)
- Orphaned recurring templates (missing account references)
- Duplicate records
- Invalid date ranges
- Invalid references

## Build & Deployment

### Development

```bash
cd frontend
npm run dev
```

### Production Build

```bash
cd frontend
npm run build
```

Output: `frontend/dist/`

### PWA Configuration

- PWA disabled in dev mode (see `vite.config.ts`)
- Service worker generated only in production
- Manifest configured for installability

## Common Tasks

### Adding a New Transaction Category

1. Update type definition in `src/types/transactions.ts`:
   ```typescript
   type IncomeCategory = 'Salary' | 'Bonus' | 'NewCategory' | ...;
   ```

2. Update form components to include new category
3. Update filters to include new category

### Adding a New Validation Rule

1. Add validation function in `src/utils/validation.ts`
2. Call validation in store action
3. Show error toast if validation fails

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in `src/routes/AppRoutes.tsx`
3. Add navigation link in `src/components/layout/AppLayout.tsx`

### Debugging

- Use Zustand DevTools (enabled in dev)
- Check browser IndexedDB via DevTools
- Check console for errors
- Use React DevTools for component debugging
- Use Data Health Check in Settings page

## Error Handling

### Error Boundary

- `src/components/common/ErrorBoundary.tsx`: Catches React errors
- Provides user-friendly error UI with recovery options

### Error Messages

- `src/utils/errorHandling.ts`: Formats errors for user display
- All error messages use `getUserFriendlyError()` for consistency

### Toast Notifications

- `src/store/useToastStore.ts`: Manages toast notifications
- All CRUD operations show success/error toasts

## Performance Optimization

### Pagination

- All list pages use Material-UI TablePagination
- Default 25 items per page
- Configurable rows per page

### Memoization

- Use `React.memo` for expensive components
- Use `useMemo` for computed values
- Use `useCallback` for event handlers

### Lazy Loading

- Code splitting for routes
- Lazy load heavy components

## Contributing

1. Check `docs/tasks.md` for current status
2. Check `docs/GAP_ANALYSIS.md` for pending improvements
3. Create feature branch
4. Write tests
5. Update documentation
6. Submit PR

## Resources

- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [Material UI Docs](https://mui.com/)
- [Vite Docs](https://vitejs.dev/)
- [React Router Docs](https://reactrouter.com/)
- [localforage Docs](https://localforage.github.io/localforage/)
