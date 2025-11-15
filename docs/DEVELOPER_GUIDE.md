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
- `src/store/useExpenseEMIsStore.ts`: Expense EMI CRUD with auto-generation
- `src/store/useSavingsInvestmentEMIsStore.ts`: Savings/investment EMI CRUD
- `src/store/useRecurringIncomesStore.ts`: Recurring income template CRUD
- `src/store/useRecurringExpensesStore.ts`: Recurring expense template CRUD
- `src/store/useRecurringSavingsInvestmentsStore.ts`: Recurring savings/investment template CRUD

### Services

- `src/services/autoGenerationService.ts`: Auto-generates transactions from EMIs and recurring templates
  - `generateEMITransactions`: Generates transactions for active EMIs
  - `generateRecurringTransactions`: Generates transactions for active recurring templates

### Utilities

- `src/utils/accountBalanceUpdates.ts`: Automatic account balance updates
  - `updateAccountBalanceForTransaction`: Updates account balance when transactions are created/updated
  - `reverseAccountBalanceForTransaction`: Reverses balance changes when transactions are deleted
  - Automatically handles income (increases balance when "Received"), expenses (decreases when "Paid"), and savings/investments (decreases when "Completed")
  - Reverses balance changes when status changes back to "Pending"
  - Handles account transfers (updates both old and new accounts)
  - Integrated into all transaction stores

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

- `src/utils/transactionExport.ts`: CSV export
  - `exportTransactionsToCSV`: Exports transactions to CSV format

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
- **ExpenseEMI**: Expense EMI (name, amount, account, installments, etc.)
- **SavingsInvestmentEMI**: Savings/investment EMI (name, amount, account, installments, etc.)
- **RecurringIncome**: Recurring income template (name, amount, frequency, etc.)
- **RecurringExpense**: Recurring expense template (name, amount, frequency, etc.)
- **RecurringSavingsInvestment**: Recurring savings/investment template (name, amount, frequency, etc.)

### Entity Relationships

- **Bank** → **BankAccount** (one-to-many)
- **BankAccount** → **Transaction** (one-to-many)
- **BankAccount** → **EMI** (one-to-many)
- **BankAccount** → **Recurring Template** (one-to-many)
- **EMI** → **Transaction** (one-to-many, via `emiId`)
- **Recurring Template** → **Transaction** (one-to-many, via `recurringTemplateId`)

See `docs/ENTITY_RELATIONSHIPS.md` for complete relationship documentation.

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
