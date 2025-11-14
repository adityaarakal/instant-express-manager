# Financial Management App – Execution Tasks

> **IMPORTANT:** This app is a **standalone financial management system** that replaces the entire Excel workbook. All data entry and management happens within the app. **NO Excel import/export required** - the Excel workbook serves only as a reference for understanding data structure and business logic.

This document lists every major task required to build the complete financial management application. Tasks are ordered by priority and dependencies.

---

## Phase 1 — Core Data Models & Stores

### Task 1 – Define Complete Data Models *(Completed)*
- [x] Create TypeScript interfaces for all entities:
  - [x] Bank
  - [x] BankAccount
  - [x] IncomeTransaction
  - [x] ExpenseTransaction
  - [x] SavingsInvestmentTransaction
  - [x] ExpenseEMI
  - [x] SavingsInvestmentEMI
  - [x] RecurringIncome
  - [x] RecurringExpense
  - [x] RecurringSavingsInvestment
- [x] Update `frontend/src/types/` with all new interfaces
- [ ] Remove old `PlannedMonthSnapshot` model (replaced by aggregation) - *Deferred to Task 16*

### Task 2 – Create Banks & Bank Accounts Stores *(Completed)*
- [x] Create `useBanksStore` with CRUD operations
- [x] Create `useBankAccountsStore` with CRUD operations
- [x] Add persistence with localforage
- [x] Add selectors for filtering, searching

### Task 3 – Create Transaction Stores *(Completed)*
- [x] Create `useIncomeTransactionsStore` with CRUD operations
- [x] Create `useExpenseTransactionsStore` with CRUD operations
- [x] Create `useSavingsInvestmentTransactionsStore` with CRUD operations
- [x] Add persistence with localforage
- [x] Add selectors for filtering by date, account, category, status
- [x] Add aggregations (totals by month, category, etc.)

---

## Phase 2 — EMIs & Recurring Templates

### Task 4 – Create EMI Stores *(Completed)*
- [x] Create `useExpenseEMIsStore` with CRUD operations
- [x] Create `useSavingsInvestmentEMIsStore` with CRUD operations
- [x] Implement auto-generation logic:
  - [x] Daily check for due EMIs
  - [x] Create transactions when due
  - [x] Update installment counts
  - [x] Mark as Completed when finished
- [x] Add persistence with localforage

### Task 5 – Create Recurring Template Stores *(Completed)*
- [x] Create `useRecurringIncomesStore` with CRUD operations
- [x] Create `useRecurringExpensesStore` with CRUD operations
- [x] Create `useRecurringSavingsInvestmentsStore` with CRUD operations
- [x] Implement auto-generation logic:
  - [x] Daily check for due recurring items
  - [x] Create transactions when due
  - [x] Calculate next due date based on frequency
  - [x] Mark as Completed when end date reached
- [x] Add persistence with localforage

---

## Phase 3 — Aggregation Views

### Task 6 – Redesign Planned Expenses as Aggregation *(Completed)*
- [x] Update `usePlannedMonthsStore` to aggregate from transactions:
  - [x] Calculate inflow from Income Transactions
  - [x] Calculate allocations from Expense Transactions
  - [x] Calculate savings from Savings/Investment Transactions
  - [x] Calculate remaining cash per account
  - [x] Group by month and account
- [x] Remove direct editing of allocations (edits happen in Transactions)
- [x] Keep status toggles (Pending/Paid) - these update transaction status
- [x] Update UI to show aggregated data

### Task 7 – Update Dashboard *(Completed)*
- [x] Rebuild dashboard to use new transaction stores
- [x] Calculate metrics from transactions:
  - [x] Total Income (from Income Transactions)
  - [x] Total Expenses (from Expense Transactions)
  - [x] Total Savings (from Savings/Investment Transactions)
  - [x] Credit Card Outstanding (from Bank Accounts)
  - [x] Upcoming Due Dates (from transactions)
- [x] Update charts to use transaction data

---

## Phase 4 — CRUD UIs

### Task 8 – Banks & Bank Accounts UI *(Completed)*
- [x] Create Banks page with:
  - [x] List of banks
  - [x] Create/Edit/Delete bank dialog
  - [x] Search and filter
- [x] Create Bank Accounts page with:
  - [x] List of bank accounts
  - [x] Create/Edit/Delete account dialog
  - [x] Filter by bank, account type
  - [x] Balance tracking
  - [x] Credit card specific fields

### Task 9 – Transactions UI *(Completed)*
- [x] Create Transactions page with tabs:
  - [x] Income Transactions
  - [x] Expense Transactions
  - [x] Savings/Investment Transactions
- [x] For each tab:
  - [x] List with basic display
  - [x] Create/Edit/Delete transaction dialog
  - [x] List with filters (date range, account, category, status)
  - [x] Bulk actions (mark as paid, delete multiple)
  - [x] Export to CSV

### Task 10 – EMIs UI *(Completed)*
- [x] Create EMIs page with tabs:
  - [x] Expense EMIs
  - [x] Savings/Investment EMIs
- [x] For each tab:
  - [x] List of EMIs with status
  - [x] Create/Edit/Delete EMI dialog
  - [x] View generated transactions
  - [x] Installment progress tracking
  - [x] Pause/Resume functionality

### Task 11 – Recurring Templates UI *(Completed)*
- [x] Create Recurring page with tabs:
  - [x] Recurring Incomes
  - [x] Recurring Expenses
  - [x] Recurring Savings/Investments
- [x] For each tab:
  - [x] List of templates with next due date
  - [x] Create/Edit/Delete template dialog
  - [x] View generated transactions
  - [x] Pause/Resume functionality

---

## Phase 5 — Planner & Analytics

### Task 12 – Redesign Planner Page *(Completed)*
- [x] Update Planner to show aggregated monthly view
- [x] Display:
  - [x] Month header (inflow, fixed factor)
  - [x] Account table (from transactions)
  - [x] Bucket totals (from expense transactions)
  - [x] Status toggles (update transaction status)
- [x] Remove direct editing (redirect to Transactions page)
- [x] Add "Add Transaction" quick actions

### Task 13 – Analytics Page *(Completed)*
- [x] Create Analytics page with:
  - [x] Income trends (by category, by month)
  - [x] Expense breakdowns (by category, by bucket)
  - [x] Savings progress charts
  - [x] Investment performance
  - [x] Credit card analysis
  - [x] Budget vs Actual comparisons
  - [x] Date range filters

---

## Phase 6 — Auto-Generation & Background Jobs

### Task 14 – Implement Auto-Generation Service *(Completed)*
- [x] Create service to check for due EMIs daily
- [x] Create service to check for due Recurring templates daily
- [x] Run on app startup
- [x] Run periodically (every hour or on visibility change)
- [x] Handle edge cases (past due dates, completed items)

### Task 15 – Data Validation & Business Rules *(Completed)*
- [x] Implement remaining cash calculation
- [x] Implement due date zeroing logic
- [x] Add validation:
  - [x] Prevent negative account balances (with warning)
  - [x] Validate date ranges
  - [x] Validate amounts
- [x] Add warnings for data inconsistencies

---

## Phase 7 — Migration & Cleanup

### Task 16 – Remove Old Code *(Completed)*
- [x] Remove Excel import/export functionality
- [x] Remove old `PlannedMonthSnapshot` data model (marked as deprecated, kept for backward compatibility)
- [x] Remove seed data based on old model
- [x] Clean up unused components (ImportDialog, ExportDialog, TemplatesDialog, ManualAdjustmentsDialog)
- [x] Update all references (Planner, MonthViewHeader)
- [x] Remove old store (usePlannedMonthsStore)
- [x] Remove old utility files (totals.ts, export.ts)
- [x] Remove old test files

### Task 17 – One-Time Data Migration (Optional) *(Pending)*
- [ ] Create migration script to convert old data to new structure
- [ ] Map old months to transactions
- [ ] Preserve account information
- [ ] Document migration process

---

## Phase 8 — Testing & Documentation

### Task 18 – Testing *(Foundation Established)*
- [x] Set up Vitest configuration
- [x] Create test setup with mocks
- [x] Unit tests for Banks store
- [x] Unit tests for BankAccounts store
- [x] Unit tests for IncomeTransactionsStore (13 tests)
- [x] Unit tests for ExpenseTransactionsStore (19 tests)
- [x] Unit tests for SavingsInvestmentTransactionsStore (17 tests)
- [x] Unit tests for ExpenseEMIsStore (17 tests)
- [x] Unit tests for SavingsInvestmentEMIsStore (15 tests)
- [x] Unit tests for dashboard metrics
- [x] Unit tests for formulas
- [x] Unit tests for Recurring stores (Incomes, Expenses, SavingsInvestments) - 42 tests total (14 each)
- [ ] Unit tests for auto-generation logic
- [ ] Integration tests for CRUD flows
- [ ] E2E tests for critical paths

### Task 19 – Documentation Update *(Completed)*
- [x] Update README with new architecture
- [x] Update USER_GUIDE with new workflows
- [x] Update DEVELOPER_GUIDE with new structure
- [x] Document all entities and relationships (ENTITY_RELATIONSHIPS.md)
- [x] Create comprehensive gap analysis (GAP_ANALYSIS.md)
- [x] Create implementation review (IMPLEMENTATION_REVIEW.md)
- [ ] Create migration guide (Optional - only needed if migrating old data)

---

## Current Status

- ✅ Requirements documented
- ✅ Architecture designed
- ✅ Data models defined
- ✅ Stores created (all 11 stores)
- ✅ Core UIs built (Banks, Accounts, Transactions, EMIs, Recurring, Planner, Dashboard, Analytics)
- ✅ Transaction filters and export (Task 9)
- ✅ Old code cleanup (Task 16 - partial, old stores kept for compatibility)
- ✅ Analytics page (Task 13)
- ✅ Data Validation & Business Rules (Task 15)

---

**Note:** This is a complete redesign. The old "Planned Expenses" focused implementation is being replaced with a transaction-based, full CRUD financial management system.
