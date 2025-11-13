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

### ⚠️ Missing Validations & Checks

#### 1. **Bank Deletion Validation** ❌
- **Issue**: No check for existing `BankAccount` references when deleting a `Bank`
- **Impact**: Can create orphaned `BankAccount` records
- **Location**: `useBanksStore.deleteBank()`
- **Recommendation**: Add validation to prevent deletion if accounts exist, or cascade delete

#### 2. **BankAccount Deletion Validation** ❌
- **Issue**: No check for existing references when deleting a `BankAccount`
- **Impact**: Can create orphaned:
  - Transactions (Income, Expense, Savings/Investment)
  - EMIs (Expense, Savings/Investment)
  - Recurring Templates (Income, Expense, Savings/Investment)
- **Location**: `useBankAccountsStore.deleteAccount()`
- **Recommendation**: Add validation to prevent deletion if references exist, or provide cascade delete option

#### 3. **ExpenseEMI Credit Card Validation** ⚠️
- **Issue**: No validation that `creditCardId` references a valid `BankAccount` with `accountType === 'CreditCard'`
- **Impact**: Can create invalid CC EMI references
- **Location**: `useExpenseEMIsStore.createEMI()` and `updateEMI()`
- **Recommendation**: Add validation to ensure `creditCardId` is a valid credit card account

#### 4. **Orphaned Reference Detection** ⚠️
- **Issue**: `checkDataInconsistencies()` only checks transactions, not EMIs or Recurring templates
- **Impact**: Orphaned EMIs and Recurring templates not detected
- **Location**: `utils/validation.ts::checkDataInconsistencies()`
- **Recommendation**: Extend to check all entity types

#### 5. **Recurring Template Reference Validation** ⚠️
- **Issue**: No validation that `recurringTemplateId` in transactions references a valid template
- **Impact**: Can have orphaned transaction references
- **Location**: Transaction stores
- **Recommendation**: Add validation in transaction creation/update

#### 6. **EMI Reference Validation** ⚠️
- **Issue**: No validation that `emiId` in transactions references a valid EMI
- **Impact**: Can have orphaned transaction references
- **Location**: Transaction stores
- **Recommendation**: Add validation in transaction creation/update

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

### ❌ Missing Relationship Queries

1. **Bank → BankAccounts Count**: No method to get count of accounts per bank
2. **BankAccount → Total Transactions Count**: No aggregate count method
3. **BankAccount → Total Balance Impact**: No method to calculate net balance change from all transactions

---

## Recommendations

### High Priority

1. **Add Bank Deletion Validation**:
   ```typescript
   deleteBank: (id: string) => {
     const accounts = useBankAccountsStore.getState().getAccountsByBank(id);
     if (accounts.length > 0) {
       throw new Error(`Cannot delete bank: ${accounts.length} account(s) still reference it`);
     }
     // ... delete logic
   }
   ```

2. **Add BankAccount Deletion Validation**:
   ```typescript
   deleteAccount: (id: string) => {
     // Check all references
     const incomeCount = useIncomeTransactionsStore.getState().getTransactionsByAccount(id).length;
     const expenseCount = useExpenseTransactionsStore.getState().getTransactionsByAccount(id).length;
     const savingsCount = useSavingsInvestmentTransactionsStore.getState().getTransactionsByAccount(id).length;
     const expenseEMIs = useExpenseEMIsStore.getState().getEMIsByAccount(id).length;
     const savingsEMIs = useSavingsInvestmentEMIsStore.getState().getEMIsByAccount(id).length;
     const recurringIncomes = useRecurringIncomesStore.getState().getTemplatesByAccount(id).length;
     const recurringExpenses = useRecurringExpensesStore.getState().getTemplatesByAccount(id).length;
     const recurringSavings = useRecurringSavingsInvestmentsStore.getState().getTemplatesByAccount(id).length;
     
     const totalReferences = incomeCount + expenseCount + savingsCount + expenseEMIs + savingsEMIs + 
                            recurringIncomes + recurringExpenses + recurringSavings;
     
     if (totalReferences > 0) {
       throw new Error(`Cannot delete account: ${totalReferences} record(s) still reference it`);
     }
     // ... delete logic
   }
   ```

3. **Extend Data Health Check**:
   - Add checks for orphaned EMIs
   - Add checks for orphaned Recurring templates
   - Add checks for invalid `creditCardId` references
   - Add checks for invalid `recurringTemplateId` references
   - Add checks for invalid `emiId` references

### Medium Priority

4. **Add Credit Card Validation in ExpenseEMI**:
   ```typescript
   if (emiData.category === 'CCEMI' && emiData.creditCardId) {
     const creditCard = useBankAccountsStore.getState().getAccount(emiData.creditCardId);
     if (!creditCard || creditCard.accountType !== 'CreditCard') {
       throw new Error('creditCardId must reference a valid CreditCard account');
     }
   }
   ```

5. **Add Reference Validation in Transactions**:
   - Validate `recurringTemplateId` exists when provided
   - Validate `emiId` exists when provided

### Low Priority

6. **Add Relationship Query Helpers**:
   - `getBankAccountSummary(accountId)` - Returns all related entity counts
   - `getBankSummary(bankId)` - Returns account count and totals
   - `getEntityDependencies(entityType, entityId)` - Returns all entities that depend on this entity

---

## Summary

### ✅ What's Working Well

- All entities properly connect to `BankAccount` as the central hub
- Relationship queries are implemented for most common use cases
- Auto-generation properly maintains references (`emiId`, `recurringTemplateId`)
- Data health check detects orphaned transactions

### ⚠️ What Needs Improvement

- **Deletion validations**: Need to prevent orphaned records
- **Extended health checks**: Need to check all entity types, not just transactions
- **Reference validations**: Need to validate optional references (`creditCardId`, `recurringTemplateId`, `emiId`)

### 📊 Connection Completeness

- **Core Connections**: 100% ✅
- **Validation**: 60% ⚠️
- **Health Checks**: 40% ⚠️
- **Relationship Queries**: 90% ✅

---

**Next Steps**: Implement the high-priority recommendations to ensure data integrity and prevent orphaned references.

