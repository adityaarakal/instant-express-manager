# Release Branch Code Inclusion Policy

## Overview

The release branch **ONLY** includes code covered by locked E2E tests. This document confirms what code is included and what is excluded.

## ✅ Code Included in Release Branch

### Covered by Locked E2E Tests

Based on current locked E2E tests (`banks.spec.ts` and `bank-accounts.spec.ts`):

#### Stores (2)
- ✅ `frontend/src/store/useBanksStore.ts`
- ✅ `frontend/src/store/useBankAccountsStore.ts`

#### Hooks (1)
- ✅ `frontend/src/hooks/useViewMode.ts`

#### Pages (2)
- ✅ `frontend/src/pages/Banks.tsx`
- ✅ `frontend/src/pages/BankAccounts.tsx`

#### Components (9)
- ✅ `frontend/src/components/banks/BankCard.tsx`
- ✅ `frontend/src/components/bankAccounts/BankAccountCard.tsx`
- ✅ `frontend/src/components/common/ButtonWithLoading.tsx`
- ✅ `frontend/src/components/common/ConfirmDialog.tsx`
- ✅ `frontend/src/components/common/EmptyState.tsx`
- ✅ `frontend/src/components/common/TableSkeleton.tsx`
- ✅ `frontend/src/components/common/ViewToggle.tsx`
- ✅ `frontend/src/types/banks.ts`
- ✅ `frontend/src/types/bankAccounts.ts`

#### Unit Tests (3)
- ✅ `frontend/src/store/__tests__/useBanksStore.test.ts`
- ✅ `frontend/src/store/__tests__/useBankAccountsStore.test.ts`
- ✅ `frontend/src/hooks/__tests__/useViewMode.test.ts`

#### E2E Tests
- ✅ `frontend/e2e/modules/banks.spec.ts` (locked)
- ✅ `frontend/e2e/modules/bank-accounts.spec.ts` (locked)
- ✅ `frontend/e2e/helpers/bank-helpers.ts`

## ❌ Code EXCLUDED from Release Branch

### Stores NOT Covered
- ❌ `useIncomeTransactionsStore.ts` and its tests
- ❌ `useExpenseTransactionsStore.ts` and its tests
- ❌ `useSavingsInvestmentTransactionsStore.ts` and its tests
- ❌ `useExpenseEMIsStore.ts` and its tests
- ❌ `useSavingsInvestmentEMIsStore.ts` and its tests
- ❌ `useRecurringIncomesStore.ts` and its tests
- ❌ `useRecurringExpensesStore.ts` and its tests
- ❌ `useRecurringSavingsInvestmentsStore.ts` and its tests
- ❌ `autoGeneration.ts` and its tests

### Utils NOT Covered
- ❌ All utils files (none are covered by locked E2E tests)
- ❌ All utils test files

### Hooks NOT Covered
- ❌ All hooks except `useViewMode.ts`
- ❌ All hook tests except `useViewMode.test.ts`

### Other Code NOT Covered
- ❌ All pages except Banks and BankAccounts
- ❌ All components except those listed above
- ❌ All other features not covered by locked E2E tests

## Verification

Run the verification script to ensure compliance:

```bash
bash scripts/verify-release-branch-content.sh
```

This script will:
1. Analyze locked E2E test coverage
2. Identify all code covered by locked tests
3. Verify only covered code and its tests are included
4. Report any unwanted code or test files

## Enforcement

The release qualification check (`scripts/check-release-qualification.sh`) includes:
- ✅ Step 6: Verification that no unwanted code or tests are included
- ❌ **Blocks release qualification** if unwanted code is detected

## Summary

**Total Files Included**: ~14 source files + 3 unit test files + 2 E2E test files + helpers

**Total Files Excluded**: All other code in the repository

**Principle**: Only code touched by locked E2E tests is included. Everything else is immaterial and excluded.

