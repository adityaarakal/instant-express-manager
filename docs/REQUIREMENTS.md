# Financial Management App - Complete Requirements

## Overview

This is a **standalone financial management application** that replaces the entire Excel workbook. All data entry and management happens within the app - **NO Excel import/export required**. The Excel workbook serves only as a reference for understanding the data structure and business logic.

---

## Core Entities & CRUD Operations

### 1. **Banks** (CRUD)
- Create, Read, Update, Delete banks
- Fields: Name, Type (Bank/Credit Card/Wallet), Country, Notes
- Used by: Bank Accounts

### 2. **Bank Accounts** (CRUD)
- Create, Read, Update, Delete bank accounts
- Fields: 
  - Account Name (e.g., "ICICI 3945", "Axis 0370")
  - Bank (reference to Banks)
  - Account Type (Savings/Current/Credit Card/Wallet)
  - Account Number (optional)
  - Current Balance
  - Credit Limit (for credit cards)
  - Outstanding Balance (for credit cards)
  - Statement Date
  - Due Date (for credit cards)
  - Notes
- Used by: All transactions, Planned Expenses

### 3. **Income Transactions** (CRUD)
- Create, Read, Update, Delete income transactions
- Fields:
  - Date
  - Amount
  - Source Account (Bank Account)
  - Category (Salary/Bonus/Freelancing/Tutoring/Project/Business/Lending Returns/Other)
  - Description
  - Client/Project Name (for freelancing)
  - Recurring Template ID (if part of recurring income)
  - Status (Pending/Received)
  - Notes
- Used by: Planned Expenses, Income Analytics

### 4. **Expense Transactions** (CRUD)
- Create, Read, Update, Delete expense transactions
- Fields:
  - Date
  - Amount
  - Source Account (Bank Account)
  - Category (Utilities/Responsibilities/STR Residency/Maintenance/CC Bill/Unplanned/Other)
  - Description
  - Bucket (Balance/Savings/Mutual Funds/CC Bill/Maintenance/Expense)
  - Recurring Template ID (if part of recurring expense)
  - Status (Pending/Paid)
  - Notes
- Used by: Planned Expenses, Expense Analytics

### 5. **Savings/Investment Transactions** (CRUD)
- Create, Read, Update, Delete savings/investment transactions
- Fields:
  - Date
  - Amount
  - Source Account (Bank Account)
  - Destination (Mutual Fund Name/ISIN, SIP Name, etc.)
  - Type (SIP/Lump Sum/Withdrawal/Return)
  - SIP Number (if part of SIP)
  - Recurring Template ID (if part of recurring investment)
  - Status (Pending/Completed)
  - Notes
- Used by: Planned Expenses, Investment Analytics, Trading Sheet

### 6. **EMIs for Savings/Investments** (CRUD)
- Create, Read, Update, Delete EMIs for savings/investments
- Fields:
  - Name/Description
  - Start Date
  - End Date
  - Amount (monthly)
  - Source Account (Bank Account)
  - Destination (Investment target)
  - Frequency (Monthly/Quarterly)
  - Status (Active/Completed/Paused)
  - Total Installments
  - Completed Installments
  - Notes
- Auto-generates: Savings/Investment Transactions

### 7. **EMIs for Expenses** (CRUD)
- Create, Read, Update, Delete EMIs for expenses
- Fields:
  - Name/Description
  - Start Date
  - End Date
  - Amount (monthly)
  - Source Account (Bank Account)
  - Category (CC EMI/Loan/Other)
  - Credit Card (if CC EMI - reference to Bank Account)
  - Frequency (Monthly/Quarterly)
  - Status (Active/Completed/Paused)
  - Total Installments
  - Completed Installments
  - Notes
- Auto-generates: Expense Transactions

### 8. **Recurring Incomes** (CRUD)
- Create, Read, Update, Delete recurring income templates
- Fields:
  - Name
  - Amount
  - Source Account (Bank Account)
  - Category
  - Frequency (Monthly/Weekly/Yearly/Custom)
  - Start Date
  - End Date (optional)
  - Next Due Date
  - Status (Active/Paused/Completed)
  - Notes
- Auto-generates: Income Transactions

### 9. **Recurring Expenses** (CRUD)
- Create, Read, Update, Delete recurring expense templates
- Fields:
  - Name
  - Amount
  - Source Account (Bank Account)
  - Category
  - Bucket
  - Frequency (Monthly/Weekly/Yearly/Custom)
  - Start Date
  - End Date (optional)
  - Next Due Date
  - Status (Active/Paused/Completed)
  - Notes
- Auto-generates: Expense Transactions

### 10. **Recurring Savings/Investments** (CRUD)
- Create, Read, Update, Delete recurring savings/investment templates
- Fields:
  - Name
  - Amount
  - Source Account (Bank Account)
  - Destination (Investment target)
  - Type (SIP/Lump Sum)
  - Frequency (Monthly/Quarterly/Yearly)
  - Start Date
  - End Date (optional)
  - Next Due Date
  - Status (Active/Paused/Completed)
  - Notes
- Auto-generates: Savings/Investment Transactions

---

## Derived Features

### 11. **Planned Expenses** (Monthly Planning View)
- **NOT a separate entity** - it's a **view/aggregation** of:
  - Income Transactions (inflow)
  - Expense Transactions (allocations)
  - Savings/Investment Transactions (savings)
  - Bank Account balances
  - Status tracking (Pending/Paid)
- Monthly blocks showing:
  - Total Inflow (sum of income transactions)
  - Fixed Factor (configurable)
  - Account-level allocations (from transactions)
  - Bucket totals (from expense transactions)
  - Remaining cash (calculated)
  - Due dates (from transactions/EMIs)

### 12. **Dashboard & Analytics**
- Aggregated views of:
  - Total Income (by category, by month)
  - Total Expenses (by category, by bucket)
  - Savings Progress
  - Investment Performance
  - Credit Card Outstanding
  - Upcoming Due Dates
  - Budget vs Actual

### 13. **Trading/Investment Tracking**
- View all savings/investment transactions
- Track SIP performance
- Investment returns
- Portfolio view

### 14. **Credit Card Management**
- View all credit card accounts
- Outstanding balances
- Due dates
- Payment history
- CC EMI tracking

### 15. **Bill Management**
- View all recurring expenses
- Upcoming bills
- Payment history
- Bill categories (Utilities, Responsibilities, STR Residency, etc.)

---

## Business Rules

1. **Remaining Cash Calculation:**
   - `Remaining Cash = Inflow - Fixed Balance - Savings Transfer + Manual Adjustments`
   - Calculated per account per month

2. **Due Date Zeroing:**
   - Amounts automatically zero after due date passes
   - Can be re-enabled if needed

3. **Status Tracking:**
   - All transactions have Pending/Paid status
   - Bucket totals filter by status
   - Status changes update totals in real-time

4. **EMI Auto-Generation:**
   - EMIs automatically create transactions on due dates
   - Mark as Pending until paid
   - Update installment count

5. **Recurring Transaction Auto-Generation:**
   - Recurring templates create transactions on scheduled dates
   - Mark as Pending until confirmed
   - Update next due date

6. **Account Balance Tracking:**
   - Starting balance + Income - Expenses = Current Balance
   - Update when transactions are marked Paid/Received

---

## Data Flow

```
Banks → Bank Accounts → Transactions (Income/Expense/Savings)
                      ↓
              EMIs & Recurring Templates
                      ↓
              Auto-generate Transactions
                      ↓
              Planned Expenses View (aggregated)
                      ↓
              Dashboard & Analytics
```

---

## UI Structure

### Main Navigation
1. **Dashboard** - Overview, metrics, charts
2. **Banks** - Manage banks and bank accounts
3. **Transactions** - View all transactions (Income/Expense/Savings)
4. **EMIs** - Manage EMIs (Expenses & Savings/Investments)
5. **Recurring** - Manage recurring templates (Income/Expense/Savings)
6. **Planner** - Monthly planning view (aggregated from transactions)
7. **Analytics** - Reports, trends, insights
8. **Settings** - Configuration, preferences

---

## Key Principles

1. **No Excel Dependency:** All data lives in the app (IndexedDB)
2. **CRUD First:** Every entity supports full Create, Read, Update, Delete
3. **Auto-Generation:** EMIs and Recurring templates auto-create transactions
4. **Real-time Calculations:** All totals and remaining cash update immediately
5. **Status-Driven:** Pending/Paid status controls visibility in totals
6. **Single Source of Truth:** App is the only system for data entry

---

## Migration from Excel

- **One-time data import** from Excel (optional, for initial setup)
- After import, Excel is no longer needed
- All future data entry happens in the app
- No export back to Excel required

---

## Next Steps

1. Redesign data models for all entities
2. Create Zustand stores for each entity type
3. Build CRUD UIs for all entities
4. Implement auto-generation logic for EMIs/Recurring
5. Rebuild Planned Expenses as aggregation view
6. Update Dashboard to use new data structure

