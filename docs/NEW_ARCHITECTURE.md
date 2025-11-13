# New Application Architecture

## Overview

Complete redesign of the application to support full financial management with CRUD operations for all entities, replacing the Excel workbook entirely.

---

## Data Models

### 1. Bank
```typescript
interface Bank {
  id: string;
  name: string;
  type: 'Bank' | 'CreditCard' | 'Wallet';
  country?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2. BankAccount
```typescript
interface BankAccount {
  id: string;
  name: string; // e.g., "ICICI 3945"
  bankId: string;
  accountType: 'Savings' | 'Current' | 'CreditCard' | 'Wallet';
  accountNumber?: string;
  currentBalance: number;
  creditLimit?: number; // for credit cards
  outstandingBalance?: number; // for credit cards
  statementDate?: string;
  dueDate?: string; // for credit cards
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3. IncomeTransaction
```typescript
interface IncomeTransaction {
  id: string;
  date: string;
  amount: number;
  accountId: string; // BankAccount
  category: 'Salary' | 'Bonus' | 'Freelancing' | 'Tutoring' | 'Project' | 'Business' | 'LendingReturns' | 'Other';
  description: string;
  clientName?: string; // for freelancing
  projectName?: string;
  recurringTemplateId?: string;
  status: 'Pending' | 'Received';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4. ExpenseTransaction
```typescript
interface ExpenseTransaction {
  id: string;
  date: string;
  amount: number;
  accountId: string; // BankAccount
  category: 'Utilities' | 'Responsibilities' | 'STRResidency' | 'Maintenance' | 'CCBill' | 'Unplanned' | 'Other';
  description: string;
  bucket: 'Balance' | 'Savings' | 'MutualFunds' | 'CCBill' | 'Maintenance' | 'Expense';
  dueDate?: string;
  recurringTemplateId?: string;
  emiId?: string; // if generated from EMI
  status: 'Pending' | 'Paid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 5. SavingsInvestmentTransaction
```typescript
interface SavingsInvestmentTransaction {
  id: string;
  date: string;
  amount: number;
  accountId: string; // BankAccount
  destination: string; // Mutual Fund Name, SIP Name, etc.
  type: 'SIP' | 'LumpSum' | 'Withdrawal' | 'Return';
  sipNumber?: string;
  recurringTemplateId?: string;
  emiId?: string; // if generated from EMI
  status: 'Pending' | 'Completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 6. EMI (for Expenses)
```typescript
interface ExpenseEMI {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  amount: number; // monthly
  accountId: string; // BankAccount
  category: 'CCEMI' | 'Loan' | 'Other';
  creditCardId?: string; // if CC EMI
  frequency: 'Monthly' | 'Quarterly';
  status: 'Active' | 'Completed' | 'Paused';
  totalInstallments: number;
  completedInstallments: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 7. EMI (for Savings/Investments)
```typescript
interface SavingsInvestmentEMI {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  amount: number; // monthly
  accountId: string; // BankAccount
  destination: string; // Investment target
  frequency: 'Monthly' | 'Quarterly';
  status: 'Active' | 'Completed' | 'Paused';
  totalInstallments: number;
  completedInstallments: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 8. RecurringIncome
```typescript
interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  accountId: string; // BankAccount
  category: IncomeTransaction['category'];
  frequency: 'Monthly' | 'Weekly' | 'Yearly' | 'Custom';
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  status: 'Active' | 'Paused' | 'Completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 9. RecurringExpense
```typescript
interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  accountId: string; // BankAccount
  category: ExpenseTransaction['category'];
  bucket: ExpenseTransaction['bucket'];
  frequency: 'Monthly' | 'Weekly' | 'Yearly' | 'Custom';
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  status: 'Active' | 'Paused' | 'Completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 10. RecurringSavingsInvestment
```typescript
interface RecurringSavingsInvestment {
  id: string;
  name: string;
  amount: number;
  accountId: string; // BankAccount
  destination: string;
  type: 'SIP' | 'LumpSum';
  frequency: 'Monthly' | 'Quarterly' | 'Yearly';
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  status: 'Active' | 'Paused' | 'Completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Store Structure

### Stores to Create:
1. `useBanksStore` - Banks CRUD
2. `useBankAccountsStore` - Bank Accounts CRUD
3. `useIncomeTransactionsStore` - Income Transactions CRUD
4. `useExpenseTransactionsStore` - Expense Transactions CRUD
5. `useSavingsInvestmentTransactionsStore` - Savings/Investment Transactions CRUD
6. `useExpenseEMIsStore` - Expense EMIs CRUD + auto-generation
7. `useSavingsInvestmentEMIsStore` - Savings/Investment EMIs CRUD + auto-generation
8. `useRecurringIncomesStore` - Recurring Incomes CRUD + auto-generation
9. `useRecurringExpensesStore` - Recurring Expenses CRUD + auto-generation
10. `useRecurringSavingsInvestmentsStore` - Recurring Savings/Investments CRUD + auto-generation
11. `usePlannedExpensesStore` - **Aggregation view** (derived from transactions)
12. `useSettingsStore` - Settings (existing, keep)

---

## UI Pages Structure

### 1. Dashboard
- Overview metrics
- Charts and trends
- Upcoming due dates
- Recent transactions

### 2. Banks Page
- List of banks
- CRUD for banks
- List of bank accounts
- CRUD for bank accounts
- Account balance tracking

### 3. Transactions Page
- Tabs: Income / Expense / Savings-Investment
- Filter by date, account, category
- CRUD operations
- Bulk actions

### 4. EMIs Page
- Tabs: Expense EMIs / Savings-Investment EMIs
- List all EMIs
- CRUD operations
- View generated transactions
- Installment tracking

### 5. Recurring Page
- Tabs: Income / Expense / Savings-Investment
- List all recurring templates
- CRUD operations
- View generated transactions
- Next due date tracking

### 6. Planner Page (Redesigned)
- **Aggregated view** of transactions by month
- Shows:
  - Total Inflow (from Income Transactions)
  - Fixed Factor (from settings)
  - Account allocations (from Expense Transactions)
  - Bucket totals (from Expense Transactions by bucket)
  - Remaining cash (calculated)
  - Status toggles (Pending/Paid)
- **Read-only aggregation** - actual edits happen in Transactions/EMIs/Recurring pages

### 7. Analytics Page
- Income trends
- Expense breakdowns
- Savings progress
- Investment performance
- Credit card analysis
- Budget vs Actual

### 8. Settings Page
- Currency
- Theme
- Default buckets
- Fixed factor
- Other preferences

---

## Auto-Generation Logic

### EMI Auto-Generation
- Daily job checks active EMIs
- If `nextDueDate <= today` and status is Active:
  - Create transaction (Expense or Savings/Investment)
  - Mark as Pending
  - Increment `completedInstallments`
  - Calculate next due date
  - If `completedInstallments >= totalInstallments`, mark EMI as Completed

### Recurring Template Auto-Generation
- Daily job checks active recurring templates
- If `nextDueDate <= today` and status is Active:
  - Create transaction (Income/Expense/Savings-Investment)
  - Mark as Pending
  - Calculate next due date based on frequency
  - If `endDate` exists and `nextDueDate > endDate`, mark as Completed

---

## Migration Strategy

### Phase 1: Core Entities
1. Create data models
2. Create stores for Banks, Bank Accounts
3. Create stores for Transactions (Income/Expense/Savings-Investment)
4. Build CRUD UIs

### Phase 2: EMIs & Recurring
5. Create stores for EMIs
6. Create stores for Recurring templates
7. Implement auto-generation logic
8. Build CRUD UIs

### Phase 3: Aggregation Views
9. Redesign Planned Expenses as aggregation
10. Update Dashboard to use new structure
11. Build Analytics page

### Phase 4: Polish
12. Data validation
13. Error handling
14. Performance optimization
15. Testing

---

## Key Changes from Current Implementation

1. **Remove:** Excel import/export focus
2. **Remove:** Direct month/account allocation editing in Planner
3. **Add:** Full CRUD for all entities
4. **Change:** Planned Expenses becomes aggregation view, not primary data entry
5. **Add:** Auto-generation for EMIs and Recurring templates
6. **Add:** Transaction-based architecture instead of month-based

---

## Benefits

1. **Single Source of Truth:** All data in app, no Excel dependency
2. **Full Control:** CRUD for everything
3. **Automation:** EMIs and Recurring auto-generate transactions
4. **Flexibility:** Easy to add new transaction types, categories
5. **Scalability:** Transaction-based model scales better
6. **Audit Trail:** Every transaction has timestamp, can track history

