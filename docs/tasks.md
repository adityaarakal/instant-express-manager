# Financial Management App – Execution Tasks

> **IMPORTANT:** This app is a **standalone financial management system** that replaces the entire Excel workbook. All data entry and management happens within the app. **NO Excel import/export required** - the Excel workbook serves only as a reference for understanding data structure and business logic.

This document lists every major task required to build the complete financial management application. Tasks are ordered by priority and dependencies.

---

## Phase 1 — Core Data Models & Stores

### Task 1 – Define Complete Data Models *(In Progress)*
- [ ] Create TypeScript interfaces for all entities:
  - [ ] Bank
  - [ ] BankAccount
  - [ ] IncomeTransaction
  - [ ] ExpenseTransaction
  - [ ] SavingsInvestmentTransaction
  - [ ] ExpenseEMI
  - [ ] SavingsInvestmentEMI
  - [ ] RecurringIncome
  - [ ] RecurringExpense
  - [ ] RecurringSavingsInvestment
- [ ] Update `frontend/src/types/` with all new interfaces
- [ ] Remove old `PlannedMonthSnapshot` model (replaced by aggregation)

### Task 2 – Create Banks & Bank Accounts Stores *(Pending)*
- [ ] Create `useBanksStore` with CRUD operations
- [ ] Create `useBankAccountsStore` with CRUD operations
- [ ] Add persistence with localforage
- [ ] Add selectors for filtering, searching

### Task 3 – Create Transaction Stores *(Pending)*
- [ ] Create `useIncomeTransactionsStore` with CRUD operations
- [ ] Create `useExpenseTransactionsStore` with CRUD operations
- [ ] Create `useSavingsInvestmentTransactionsStore` with CRUD operations
- [ ] Add persistence with localforage
- [ ] Add selectors for filtering by date, account, category, status
- [ ] Add aggregations (totals by month, category, etc.)

---

## Phase 2 — EMIs & Recurring Templates

### Task 4 – Create EMI Stores *(Pending)*
- [ ] Create `useExpenseEMIsStore` with CRUD operations
- [ ] Create `useSavingsInvestmentEMIsStore` with CRUD operations
- [ ] Implement auto-generation logic:
  - [ ] Daily check for due EMIs
  - [ ] Create transactions when due
  - [ ] Update installment counts
  - [ ] Mark as Completed when finished
- [ ] Add persistence with localforage

### Task 5 – Create Recurring Template Stores *(Pending)*
- [ ] Create `useRecurringIncomesStore` with CRUD operations
- [ ] Create `useRecurringExpensesStore` with CRUD operations
- [ ] Create `useRecurringSavingsInvestmentsStore` with CRUD operations
- [ ] Implement auto-generation logic:
  - [ ] Daily check for due recurring items
  - [ ] Create transactions when due
  - [ ] Calculate next due date based on frequency
  - [ ] Mark as Completed when end date reached
- [ ] Add persistence with localforage

---

## Phase 3 — Aggregation Views

### Task 6 – Redesign Planned Expenses as Aggregation *(Pending)*
- [ ] Update `usePlannedMonthsStore` to aggregate from transactions:
  - [ ] Calculate inflow from Income Transactions
  - [ ] Calculate allocations from Expense Transactions
  - [ ] Calculate savings from Savings/Investment Transactions
  - [ ] Calculate remaining cash per account
  - [ ] Group by month and account
- [ ] Remove direct editing of allocations (edits happen in Transactions)
- [ ] Keep status toggles (Pending/Paid) - these update transaction status
- [ ] Update UI to show aggregated data

### Task 7 – Update Dashboard *(Pending)*
- [ ] Rebuild dashboard to use new transaction stores
- [ ] Calculate metrics from transactions:
  - [ ] Total Income (from Income Transactions)
  - [ ] Total Expenses (from Expense Transactions)
  - [ ] Total Savings (from Savings/Investment Transactions)
  - [ ] Credit Card Outstanding (from Bank Accounts)
  - [ ] Upcoming Due Dates (from EMIs and Recurring)
- [ ] Update charts to use transaction data

---

## Phase 4 — CRUD UIs

### Task 8 – Banks & Bank Accounts UI *(Pending)*
- [ ] Create Banks page with:
  - [ ] List of banks
  - [ ] Create/Edit/Delete bank dialog
  - [ ] Search and filter
- [ ] Create Bank Accounts page with:
  - [ ] List of bank accounts
  - [ ] Create/Edit/Delete account dialog
  - [ ] Filter by bank, account type
  - [ ] Balance tracking
  - [ ] Credit card specific fields

### Task 9 – Transactions UI *(Pending)*
- [ ] Create Transactions page with tabs:
  - [ ] Income Transactions
  - [ ] Expense Transactions
  - [ ] Savings/Investment Transactions
- [ ] For each tab:
  - [ ] List with filters (date range, account, category, status)
  - [ ] Create/Edit/Delete transaction dialog
  - [ ] Bulk actions (mark as paid, delete multiple)
  - [ ] Export to CSV

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

### Task 12 – Redesign Planner Page *(Pending)*
- [ ] Update Planner to show aggregated monthly view
- [ ] Display:
  - [ ] Month header (inflow, fixed factor)
  - [ ] Account table (from transactions)
  - [ ] Bucket totals (from expense transactions)
  - [ ] Status toggles (update transaction status)
- [ ] Remove direct editing (redirect to Transactions page)
- [ ] Add "Add Transaction" quick actions

### Task 13 – Analytics Page *(Pending)*
- [ ] Create Analytics page with:
  - [ ] Income trends (by category, by month)
  - [ ] Expense breakdowns (by category, by bucket)
  - [ ] Savings progress charts
  - [ ] Investment performance
  - [ ] Credit card analysis
  - [ ] Budget vs Actual comparisons
  - [ ] Date range filters

---

## Phase 6 — Auto-Generation & Background Jobs

### Task 14 – Implement Auto-Generation Service *(Pending)*
- [ ] Create service to check for due EMIs daily
- [ ] Create service to check for due Recurring templates daily
- [ ] Run on app startup
- [ ] Run periodically (every hour or on visibility change)
- [ ] Handle edge cases (past due dates, completed items)

### Task 15 – Data Validation & Business Rules *(Pending)*
- [ ] Implement remaining cash calculation
- [ ] Implement due date zeroing logic
- [ ] Add validation:
  - [ ] Prevent negative account balances (with warning)
  - [ ] Validate date ranges
  - [ ] Validate amounts
- [ ] Add warnings for data inconsistencies

---

## Phase 7 — Migration & Cleanup

### Task 16 – Remove Old Code *(Pending)*
- [ ] Remove Excel import/export functionality
- [ ] Remove old `PlannedMonthSnapshot` data model
- [ ] Remove seed data based on old model
- [ ] Clean up unused components
- [ ] Update all references

### Task 17 – One-Time Data Migration (Optional) *(Pending)*
- [ ] Create migration script to convert old data to new structure
- [ ] Map old months to transactions
- [ ] Preserve account information
- [ ] Document migration process

---

## Phase 8 — Testing & Documentation

### Task 18 – Testing *(Pending)*
- [ ] Unit tests for all stores
- [ ] Unit tests for auto-generation logic
- [ ] Integration tests for CRUD flows
- [ ] E2E tests for critical paths

### Task 19 – Documentation Update *(Pending)*
- [ ] Update README with new architecture
- [ ] Update USER_GUIDE with new workflows
- [ ] Update DEVELOPER_GUIDE with new structure
- [ ] Create migration guide
- [ ] Document all entities and relationships

---

## Current Status

- ✅ Requirements documented
- ✅ Architecture designed
- ⏳ Data models being defined
- ⏳ Stores being created
- ⏳ UIs being built

---

**Note:** This is a complete redesign. The old "Planned Expenses" focused implementation is being replaced with a transaction-based, full CRUD financial management system.
