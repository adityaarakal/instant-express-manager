# Entity Relationships & Connections

## Overview

This document provides a comprehensive mapping of all entities in the application, their relationships, and verification of proper connection implementation.

**Last Updated**: 2024-12-19

---

## Entity List

### 1. **Bank** (Top-Level Entity)
- **Type**: `Bank`
- **Fields**:
  - `id: string`
  - `name: string`
  - `type: 'Bank' | 'CreditCard' | 'Wallet'`
  - `country?: string`
  - `notes?: string`
  - `createdAt: string`
  - `updatedAt: string`
- **Connections**: 
  - ✅ **One-to-Many** with `BankAccount` (via `bankId`)
- **Store**: `useBanksStore`

### 2. **BankAccount** (Core Entity - Everything Connects Here)
- **Type**: `BankAccount`
- **Fields**:
  - `id: string`
  - `name: string`
  - `bankId: string` → **References Bank**
  - `accountType: 'Savings' | 'Current' | 'CreditCard' | 'Wallet'`
  - `accountNumber?: string`
  - `currentBalance: number`
  - `creditLimit?: number`
  - `outstandingBalance?: number`
  - `statementDate?: string`
  - `dueDate?: string`
  - `notes?: string`
  - `createdAt: string`
  - `updatedAt: string`
- **Connections**:
  - ✅ **Many-to-One** with `Bank` (via `bankId`)
  - ✅ **One-to-Many** with `IncomeTransaction` (via `accountId`)
  - ✅ **One-to-Many** with `ExpenseTransaction` (via `accountId`)
  - ✅ **One-to-Many** with `SavingsInvestmentTransaction` (via `accountId`)
  - ✅ **One-to-Many** with `ExpenseEMI` (via `accountId`)
  - ✅ **One-to-Many** with `SavingsInvestmentEMI` (via `accountId`)
  - ✅ **One-to-Many** with `RecurringIncome` (via `accountId`)
  - ✅ **One-to-Many** with `RecurringExpense` (via `accountId`)
  - ✅ **One-to-Many** with `RecurringSavingsInvestment` (via `accountId`)
  - ✅ **One-to-Many** with `ExpenseEMI` (via `creditCardId` - for CC EMIs)
- **Store**: `useBankAccountsStore`

### 3. **IncomeTransaction**
- **Type**: `IncomeTransaction`
- **Fields**:
  - `id: string`
  - `date: string`
  - `amount: number`
  - `accountId: string` → **References BankAccount** ✅
  - `category: IncomeCategory`
  - `description: string`
  - `clientName?: string`
  - `projectName?: string`
  - `recurringTemplateId?: string` → **References RecurringIncome** ✅
  - `status: 'Pending' | 'Received'`
  - `notes?: string`
  - `createdAt: string`
  - `updatedAt: string`
- **Connections**:
  - ✅ **Many-to-One** with `BankAccount` (via `accountId`)
  - ✅ **Many-to-One** with `RecurringIncome` (via `recurringTemplateId`, optional)
- **Store**: `useIncomeTransactionsStore`

### 4. **ExpenseTransaction**
- **Type**: `ExpenseTransaction`
- **Fields**:
  - `id: string`
  - `date: string`
  - `amount: number`
  - `accountId: string` → **References BankAccount** ✅
  - `category: ExpenseCategory`
  - `description: string`
  - `bucket: ExpenseBucket`
  - `dueDate?: string`
  - `recurringTemplateId?: string` → **References RecurringExpense** ✅
  - `emiId?: string` → **References ExpenseEMI** ✅
  - `status: 'Pending' | 'Paid'`
  - `notes?: string`
  - `createdAt: string`
  - `updatedAt: string`
- **Connections**:
  - ✅ **Many-to-One** with `BankAccount` (via `accountId`)
  - ✅ **Many-to-One** with `RecurringExpense` (via `recurringTemplateId`, optional)
  - ✅ **Many-to-One** with `ExpenseEMI` (via `emiId`, optional)
- **Store**: `useExpenseTransactionsStore`

### 5. **SavingsInvestmentTransaction**
- **Type**: `SavingsInvestmentTransaction`
- **Fields**:
  - `id: string`
  - `date: string`
  - `amount: number`
  - `accountId: string` → **References BankAccount** ✅
  - `destination: string`
  - `type: 'SIP' | 'LumpSum' | 'Withdrawal' | 'Return'`
  - `sipNumber?: string`
  - `description?: string`
  - `recurringTemplateId?: string` → **References RecurringSavingsInvestment** ✅
  - `emiId?: string` → **References SavingsInvestmentEMI** ✅
  - `status: 'Pending' | 'Completed'`
  - `notes?: string`
  - `createdAt: string`
  - `updatedAt: string`
- **Connections**:
  - ✅ **Many-to-One** with `BankAccount` (via `accountId`)
  - ✅ **Many-to-One** with `RecurringSavingsInvestment` (via `recurringTemplateId`, optional)
  - ✅ **Many-to-One** with `SavingsInvestmentEMI` (via `emiId`, optional)
- **Store**: `useSavingsInvestmentTransactionsStore`

### 6. **ExpenseEMI**
- **Type**: `ExpenseEMI`
- **Fields**:
  - `id: string`
  - `name: string`
  - `startDate: string`
  - `endDate: string`
  - `amount: number`
  - `accountId: string` → **References BankAccount** ✅
  - `category: 'CCEMI' | 'Loan' | 'Other'`
  - `creditCardId?: string` → **References BankAccount** ✅ (for CC EMIs)
  - `frequency: 'Monthly' | 'Quarterly'`
  - `status: 'Active' | 'Completed' | 'Paused'`
  - `totalInstallments: number`
  - `completedInstallments: number`
  - `notes?: string`
  - `createdAt: string`
  - `updatedAt: string`
- **Connections**:
  - ✅ **Many-to-One** with `BankAccount` (via `accountId` - payment account)
  - ✅ **Many-to-One** with `BankAccount` (via `creditCardId` - credit card account, optional)
  - ✅ **One-to-Many** with `ExpenseTransaction` (via `emiId` - generated transactions)
- **Store**: `useExpenseEMIsStore`

### 7. **SavingsInvestmentEMI**
- **Type**: `SavingsInvestmentEMI`
- **Fields**:
  - `id: string`
  - `name: string`
  - `startDate: string`
  - `endDate: string`
  - `amount: number`
  - `accountId: string` → **References BankAccount** ✅
  - `destination: string`
  - `frequency: 'Monthly' | 'Quarterly'`
  - `status: 'Active' | 'Completed' | 'Paused'`
  - `totalInstallments: number`
  - `completedInstallments: number`
  - `notes?: string`
  - `createdAt: string`
  - `updatedAt: string`
- **Connections**:
  - ✅ **Many-to-One** with `BankAccount` (via `accountId`)
  - ✅ **One-to-Many** with `SavingsInvestmentTransaction` (via `emiId` - generated transactions)
- **Store**: `useSavingsInvestmentEMIsStore`

### 8. **RecurringIncome**
- **Type**: `RecurringIncome`
- **Fields**:
  - `id: string`
  - `name: string`
  - `amount: number`
  - `accountId: string` → **References BankAccount** ✅
  - `category: IncomeCategory`
  - `frequency: 'Monthly' | 'Weekly' | 'Yearly' | 'Custom'`
  - `startDate: string`
  - `endDate?: string`
  - `nextDueDate: string`
  - `status: 'Active' | 'Paused' | 'Completed'`
  - `notes?: string`
  - `createdAt: string`
  - `updatedAt: string`
- **Connections**:
  - ✅ **Many-to-One** with `BankAccount` (via `accountId`)
  - ✅ **One-to-Many** with `IncomeTransaction` (via `recurringTemplateId` - generated transactions)
- **Store**: `useRecurringIncomesStore`

### 9. **RecurringExpense**
- **Type**: `RecurringExpense`
- **Fields**:
  - `id: string`
  - `name: string`
  - `amount: number`
  - `accountId: string` → **References BankAccount** ✅
  - `category: ExpenseCategory`
  - `bucket: ExpenseBucket`
  - `frequency: 'Monthly' | 'Weekly' | 'Yearly' | 'Custom'`
  - `startDate: string`
  - `endDate?: string`
  - `nextDueDate: string`
  - `status: 'Active' | 'Paused' | 'Completed'`
  - `notes?: string`
  - `createdAt: string`
  - `updatedAt: string`
- **Connections**:
  - ✅ **Many-to-One** with `BankAccount` (via `accountId`)
  - ✅ **One-to-Many** with `ExpenseTransaction` (via `recurringTemplateId` - generated transactions)
- **Store**: `useRecurringExpensesStore`

### 10. **RecurringSavingsInvestment**
- **Type**: `RecurringSavingsInvestment`
- **Fields**:
  - `id: string`
  - `name: string`
  - `amount: number`
  - `accountId: string` → **References BankAccount** ✅
  - `destination: string`
  - `type: 'SIP' | 'LumpSum'`
  - `frequency: 'Monthly' | 'Quarterly' | 'Yearly'`
  - `startDate: string`
  - `endDate?: string`
  - `nextDueDate: string`
  - `status: 'Active' | 'Paused' | 'Completed'`
  - `notes?: string`
  - `createdAt: string`
  - `updatedAt: string`
- **Connections**:
  - ✅ **Many-to-One** with `BankAccount` (via `accountId`)
  - ✅ **One-to-Many** with `SavingsInvestmentTransaction` (via `recurringTemplateId` - generated transactions)
- **Store**: `useRecurringSavingsInvestmentsStore`

---

## Relationship Diagram

```
Bank
  └─> BankAccount (via bankId)
        ├─> IncomeTransaction (via accountId)
        │     └─> RecurringIncome (via recurringTemplateId)
        ├─> ExpenseTransaction (via accountId)
        │     ├─> RecurringExpense (via recurringTemplateId)
        │     └─> ExpenseEMI (via emiId)
        ├─> SavingsInvestmentTransaction (via accountId)
        │     ├─> RecurringSavingsInvestment (via recurringTemplateId)
        │     └─> SavingsInvestmentEMI (via emiId)
        ├─> ExpenseEMI (via accountId)
        │     └─> BankAccount (via creditCardId, if CC EMI)
        ├─> SavingsInvestmentEMI (via accountId)
        ├─> RecurringIncome (via accountId)
        ├─> RecurringExpense (via accountId)
        └─> RecurringSavingsInvestment (via accountId)
```

---

## Connection Verification Status

### ✅ Properly Connected Entities

1. **All Transactions → BankAccount**: ✅ All transaction types have `accountId` and properly reference `BankAccount`
2. **All EMIs → BankAccount**: ✅ All EMI types have `accountId` and properly reference `BankAccount`
3. **All Recurring Templates → BankAccount**: ✅ All recurring template types have `accountId` and properly reference `BankAccount`
4. **BankAccount → Bank**: ✅ All bank accounts have `bankId` and properly reference `Bank`
5. **Transactions → Recurring Templates**: ✅ Transactions have optional `recurringTemplateId` references
6. **Transactions → EMIs**: ✅ Transactions have optional `emiId` references
7. **ExpenseEMI → BankAccount (Credit Card)**: ✅ ExpenseEMI has optional `creditCardId` for CC EMIs

### ✅ Completed Validations & Checks

#### 1. **Bank Deletion Validation** ✅ **COMPLETED**
- **Status**: ✅ Implemented
- **Implementation**: Added validation in `useBanksStore.deleteBank()` to check for existing `BankAccount` references
- **Location**: `frontend/src/store/useBanksStore.ts`
- **Result**: Prevents deletion if accounts exist, throws descriptive error

#### 2. **BankAccount Deletion Validation** ✅ **COMPLETED**
- **Status**: ✅ Implemented
- **Implementation**: Added comprehensive validation in `useBankAccountsStore.deleteAccount()` to check all references:
  - Transactions (Income, Expense, Savings/Investment)
  - EMIs (Expense, Savings/Investment)
  - Recurring Templates (Income, Expense, Savings/Investment)
  - Credit Card EMI references
- **Location**: `frontend/src/store/useBankAccountsStore.ts`
- **Result**: Prevents deletion if any references exist, provides detailed error message

#### 3. **ExpenseEMI Credit Card Validation** ✅ **COMPLETED**
- **Status**: ✅ Implemented
- **Implementation**: Added validation in `useExpenseEMIsStore.createEMI()` and `updateEMI()` to ensure `creditCardId` references a valid CreditCard account
- **Location**: `frontend/src/store/useExpenseEMIsStore.ts`
- **Result**: Validates account exists and is of type 'CreditCard'

#### 4. **Extended Orphaned Reference Detection** ✅ **COMPLETED**
- **Status**: ✅ Implemented
- **Implementation**: Extended `checkDataInconsistencies()` to check all entity types:
  - EMIs (Expense, Savings/Investment)
  - Recurring Templates (Income, Expense, Savings/Investment)
  - Invalid `creditCardId` references
  - Invalid `recurringTemplateId` references
  - Invalid `emiId` references
  - Invalid `bankId` references
- **Location**: `frontend/src/utils/validation.ts` and `frontend/src/components/common/DataHealthCheck.tsx`
- **Result**: Comprehensive health check for all entity relationships

### ✅ Completed Validations & Checks (Continued)

#### 5. **Recurring Template Reference Validation** ✅ **COMPLETED**
- **Status**: ✅ Implemented
- **Implementation**: Added validation in all transaction stores to check `recurringTemplateId` references
  - `useIncomeTransactionsStore.createTransaction()` / `updateTransaction()`
  - `useExpenseTransactionsStore.createTransaction()` / `updateTransaction()`
  - `useSavingsInvestmentTransactionsStore.createTransaction()` / `updateTransaction()`
- **Location**: `frontend/src/store/useIncomeTransactionsStore.ts`, `useExpenseTransactionsStore.ts`, `useSavingsInvestmentTransactionsStore.ts`
- **Result**: Prevents creating/updating transactions with invalid `recurringTemplateId` references

#### 6. **EMI Reference Validation** ✅ **COMPLETED**
- **Status**: ✅ Implemented
- **Implementation**: Added validation in expense and savings transaction stores to check `emiId` references
  - `useExpenseTransactionsStore.createTransaction()` / `updateTransaction()`
  - `useSavingsInvestmentTransactionsStore.createTransaction()` / `updateTransaction()`
- **Location**: `frontend/src/store/useExpenseTransactionsStore.ts`, `useSavingsInvestmentTransactionsStore.ts`
- **Result**: Prevents creating/updating transactions with invalid `emiId` references

---

## Store Methods for Relationship Queries

### ✅ Implemented Relationship Queries

1. **BankAccount → Transactions**:
   - `useIncomeTransactionsStore.getTransactionsByAccount(accountId)`
   - `useExpenseTransactionsStore.getTransactionsByAccount(accountId)`
   - `useSavingsInvestmentTransactionsStore.getTransactionsByAccount(accountId)`

2. **BankAccount → EMIs**:
   - `useExpenseEMIsStore.getEMIsByAccount(accountId)`
   - `useSavingsInvestmentEMIsStore.getEMIsByAccount(accountId)`

3. **BankAccount → Recurring Templates**:
   - `useRecurringIncomesStore.getTemplatesByAccount(accountId)`
   - `useRecurringExpensesStore.getTemplatesByAccount(accountId)`
   - `useRecurringSavingsInvestmentsStore.getTemplatesByAccount(accountId)`

4. **Bank → BankAccounts**:
   - `useBankAccountsStore.getAccountsByBank(bankId)`

5. **EMI → Generated Transactions**:
   - `useExpenseEMIsStore.getGeneratedTransactions(emiId)`
   - `useSavingsInvestmentEMIsStore.getGeneratedTransactions(emiId)`

6. **Recurring Template → Generated Transactions**:
   - `useRecurringIncomesStore.getGeneratedTransactions(templateId)`
   - `useRecurringExpensesStore.getGeneratedTransactions(templateId)`
   - `useRecurringSavingsInvestmentsStore.getGeneratedTransactions(templateId)`

### ✅ Completed Relationship Queries

1. ✅ **Bank → BankAccounts Count**: `useBanksStore.getAccountsCount(bankId)`
2. ✅ **Bank → Bank Summary**: `useBanksStore.getBankSummary(bankId)` - Returns bank, accounts count, and total balance
3. ✅ **BankAccount → Total Transactions Count**: `useBankAccountsStore.getTotalTransactionsCount(accountId)`
4. ✅ **BankAccount → Total Balance Impact**: `useBankAccountsStore.getTotalBalanceImpact(accountId)` - Calculates net balance change from all transactions
5. ✅ **BankAccount → Summary**: `useBankAccountsStore.getBankAccountSummary(accountId)` - Returns comprehensive summary with all entity counts
6. ✅ **Entity Dependencies**: `getEntityDependencies(entityType, entityId)` - Utility function to get all entities that depend on a given entity

---

## Recommendations

### ✅ Completed (High Priority)

1. ✅ **Bank Deletion Validation** - **COMPLETED**
   - Implemented in `useBanksStore.deleteBank()`
   - Prevents deletion if accounts exist

2. ✅ **BankAccount Deletion Validation** - **COMPLETED**
   - Implemented in `useBankAccountsStore.deleteAccount()`
   - Checks all entity references before deletion

3. ✅ **Extended Data Health Check** - **COMPLETED**
   - Extended `checkDataInconsistencies()` to check all entity types
   - Updated `DataHealthCheck` component to pass all entities
   - Validates: EMIs, Recurring templates, invalid references

4. ✅ **Credit Card Validation in ExpenseEMI** - **COMPLETED**
   - Implemented in `useExpenseEMIsStore.createEMI()` and `updateEMI()`
   - Validates `creditCardId` references a valid CreditCard account

### ✅ Completed (Medium Priority)

5. ✅ **Add Reference Validation in Transactions** - **COMPLETED**
   - **Status**: ✅ Implemented
   - **Implementation**:
     - ✅ Validate `recurringTemplateId` exists when provided in transaction creation/update
     - ✅ Validate `emiId` exists when provided in transaction creation/update
   - **Location**: 
     - ✅ `useIncomeTransactionsStore.createTransaction()` / `updateTransaction()`
     - ✅ `useExpenseTransactionsStore.createTransaction()` / `updateTransaction()`
     - ✅ `useSavingsInvestmentTransactionsStore.createTransaction()` / `updateTransaction()`
   - **Result**: Prevents creating/updating transactions with invalid references

### ✅ Completed (Low Priority)

6. ✅ **Add Relationship Query Helpers** - **COMPLETED**
   - ✅ `getBankAccountSummary(accountId)` - Returns all related entity counts and balance impact
     - Location: `useBankAccountsStore.getBankAccountSummary()`
   - ✅ `getBankSummary(bankId)` - Returns account count and totals
     - Location: `useBanksStore.getBankSummary()`
   - ✅ `getEntityDependencies(entityType, entityId)` - Returns all entities that depend on this entity
     - Location: `frontend/src/utils/entityRelationships.ts`

---

## Summary

### ✅ What's Working Well

- All entities properly connect to `BankAccount` as the central hub
- Relationship queries are implemented for most common use cases
- Auto-generation properly maintains references (`emiId`, `recurringTemplateId`)
- Data health check detects orphaned transactions

### ✅ All Improvements Completed

- ✅ **Transaction Reference Validations**: Validates `recurringTemplateId` and `emiId` in transaction creation/update
- ✅ **Relationship Query Helpers**: All convenience methods for summary views implemented
- ✅ **Aggregate Queries**: All missing aggregate queries implemented

### 📊 Connection Completeness

- **Core Connections**: 100% ✅
- **Deletion Validations**: 100% ✅ (Bank, BankAccount)
- **Health Checks**: 100% ✅ (All entity types checked)
- **Reference Validations**: 100% ✅ (CreditCard ✅, Transaction references ✅)
- **Relationship Queries**: 100% ✅ (All queries implemented)

---

**Status**: ✅ **ALL PENDING ITEMS COMPLETED**

All validations, health checks, and relationship queries have been implemented. The application now has comprehensive data integrity and relationship management.

---

## Implementation Summary

### ✅ Completed Items

#### Medium Priority
- ✅ **Transaction Reference Validation**: Added validation for `recurringTemplateId` and `emiId` in all transaction stores
  - Validates references exist before creating/updating transactions
  - Prevents orphaned references at creation time

#### Low Priority
- ✅ **Relationship Query Helpers**: 
  - `getBankAccountSummary(accountId)` - Implemented in `useBankAccountsStore`
  - `getBankSummary(bankId)` - Implemented in `useBanksStore`
  - `getEntityDependencies(entityType, entityId)` - Implemented in `utils/entityRelationships.ts`

- ✅ **Aggregate Queries**:
  - `Bank → BankAccounts Count` - `useBanksStore.getAccountsCount(bankId)`
  - `BankAccount → Total Transactions Count` - `useBankAccountsStore.getTotalTransactionsCount(accountId)`
  - `BankAccount → Total Balance Impact` - `useBankAccountsStore.getTotalBalanceImpact(accountId)`

---

**Last Updated**: 2024-12-19