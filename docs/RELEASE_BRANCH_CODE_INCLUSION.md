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

## 🚨 MANDATORY ENFORCEMENT

### Automatic File Removal

**CRITICAL**: When code is pushed to the release branch, **ALL files not covered by locked E2E tests are AUTOMATICALLY REMOVED**.

The release branch manager (`scripts/manage-release-branch.sh`):
1. ✅ Analyzes locked E2E test coverage
2. ✅ Identifies ALL code covered by locked E2E tests
3. ✅ **MANDATORY REMOVAL**: Removes ALL files not in the coverage list
4. ✅ **NO EXCEPTIONS**: Not even a single file outside coverage is kept
5. ✅ Commits the filtered code to release branch

### Verification

The release qualification check (`scripts/check-release-qualification.sh`) includes:
- ✅ Step 6: Verification that no unwanted code or tests are included
- ❌ **BLOCKS release qualification** if unwanted code is detected
- ❌ **BLOCKS release branch update** if unwanted code exists

### GitHub Actions Enforcement

The GitHub Actions workflow (`.github/workflows/release-branch.yml`):
- ✅ Runs `release:manage --force` which **MANDATORY removes** unwanted files
- ✅ No user confirmation required in CI/CD
- ✅ Automatic filtering before pushing to release branch

## 📋 Summary

**Total Files Included**: ~14 source files + 3 unit test files + 2 E2E test files + helpers

**Total Files Excluded**: **ALL other code in the repository** (automatically removed)

**Principle**: Only code touched by locked E2E tests is included. **Everything else is MANDATORY removed - not even a single file outside coverage is kept.**

## 🔒 Enforcement Guarantee

**This is MANDATORY and NON-NEGOTIABLE**:
- ✅ Scripted: Automatic removal in `manage-release-branch.sh`
- ✅ Documented: This document and `BRANCHING_AND_DEPLOYMENT_STRATEGY.md`
- ✅ Verified: `verify-release-branch-content.sh` blocks release if unwanted code found
- ✅ CI/CD Enforced: GitHub Actions automatically filters before push
- ✅ **NO BYPASS**: Cannot be bypassed - unwanted files are removed automatically

