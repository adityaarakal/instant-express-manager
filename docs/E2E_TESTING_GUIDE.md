# E2E Testing Guide - Complete Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [For Users](#for-users)
3. [For AI Agents](#for-ai-agents)
4. [Test Locking System](#test-locking-system)
5. [Current Test Scenarios](#current-test-scenarios)
6. [Helper Functions](#helper-functions)
7. [Running Tests](#running-tests)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This project uses **Playwright** for end-to-end (E2E) testing with a **Test-Driven Development (TDD)** approach. Locked tests represent **delivered features** and serve as the source of truth for what "working" means.

### Key Principles

- ✅ **TDD Approach**: Locked tests are DELIVERED features - they define correctness
- ✅ **Test Protection**: Finalized tests are locked to prevent accidental modifications
- ✅ **Implementation Conforms**: Code must make tests pass, not the other way around
- ✅ **User Flow Testing**: Tests focus on complete user journeys, not isolated unit tests
- ✅ **Automatic Execution**: Tests run automatically on pre-commit hooks
- ✅ **Reusable Helpers**: Common test actions are extracted into reusable helper functions
- ✅ **Smart Test Selection**: Only runs tests for changed modules

### The Golden Rule

> **If tests fail, fix the implementation - NEVER modify locked tests.**

Locked tests are like **delivered products** to end users. You cannot change what was delivered without explicit user permission.

---

## For Users

### Quick Start

1. **Run tests manually**:
   ```bash
   npm run test:e2e
   ```

2. **View tests visually** (for demos):
   ```bash
   npm run test:demo:ui      # Interactive UI mode
   npm run test:demo:headed   # Visible browser windows
   npm run test:demo:html     # HTML report
   ```

3. **Lock a finalized test**:
   ```bash
   bash scripts/lock-test.sh frontend/e2e/modules/banks.spec.ts
   ```

4. **Unlock a test** (when you need to modify it):
   ```bash
   bash scripts/unlock-test.sh frontend/e2e/modules/banks.spec.ts
   # Type 'UNLOCK' to confirm
   ```

### Test Structure

Each test file follows this structure:

```typescript
/**
 * E2E test for [Module Name]
 * 
 * LOCK STATUS: LOCKED/UNLOCKED
 * 
 * Test scenarios are defined by the user. Once finalized, tests are locked
 * to prevent AI agents from modifying them.
 */

import { test, expect } from '@playwright/test';
import { helperFunctions } from '../helpers/...';

test.describe('Module Name - User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/');
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const deleteReq = indexedDB.deleteDatabase('instant-express-manager');
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve();
        deleteReq.onblocked = () => resolve();
      });
    });
    await page.reload();
  });

  test('should perform user flow X', async ({ page }) => {
    // Your test scenario
  });
});
```

### Writing New Tests

1. **Open the module test file** (e.g., `frontend/e2e/modules/banks.spec.ts`)
2. **Write your test scenario** using Playwright API
3. **Use helper functions** from `frontend/e2e/helpers/` to avoid code duplication
4. **Run the test** to verify it works:
   ```bash
   cd frontend
   npm run test:e2e e2e/modules/banks.spec.ts
   ```
5. **Lock the test** once finalized:
   ```bash
   bash scripts/lock-test.sh frontend/e2e/modules/banks.spec.ts
   ```

### Best Practices

- ✅ **Focus on user flows**: Test complete user journeys, not isolated actions
- ✅ **Use descriptive names**: Test names should clearly explain what they verify
- ✅ **Keep tests independent**: Each test should clean up after itself
- ✅ **Reuse helpers**: Use helper functions to avoid code duplication
- ✅ **Verify persistence**: Check that data is saved correctly (not just UI state)

---

## For AI Agents

### ⚠️ CRITICAL: TDD Rules - Test-Driven Development

**LOCKED TESTS ARE DELIVERED FEATURES - THEY DEFINE CORRECTNESS**

The following test files are **LOCKED** and represent **delivered features**:

- `frontend/e2e/modules/banks.spec.ts` - **LOCKED** (Delivered feature)
- `frontend/e2e/modules/bank-accounts.spec.ts` - **LOCKED** (Delivered feature)

### The Golden Rule

> **If tests fail → Fix your implementation**  
> **If tests fail → DO NOT modify locked tests**

### What You CAN Do

✅ **Run locked tests**: Execute tests to verify functionality
✅ **Read locked tests**: Understand what "working" means
✅ **Fix implementation**: When tests fail, fix your code to make tests pass
✅ **Create new tests**: Add tests to unlocked files
✅ **Modify helpers**: Update helper functions in `frontend/e2e/helpers/`
✅ **Update documentation**: Modify helpers**: Update helper functions in `frontend/e2e/helpers/`
✅ **Update documentation**: Update documentation files

### What You CANNOT Do

❌ **Modify locked tests**: Cannot change locked test files (even if tests fail)
❌ **Change test expectations**: Cannot alter tests to match broken implementation
❌ **Unlock tests**: Only the user can unlock tests (requires confirmation)
❌ **Bypass lock validation**: Pre-commit hooks will block commits
❌ **Skip test failures**: Tests must pass before commit

### ⚠️ BYPASS PROHIBITED

**These checks CANNOT be bypassed:**

- ❌ **--no-verify flag**: Blocked by git wrapper and server-side checks
- ❌ **Environment variables**: Detected and blocked (HUSKY_SKIP_HOOKS, SKIP_HOOKS, etc.)
- ❌ **AI agents**: Cannot bypass - tests must pass
- ❌ **Manual skip**: Server-side GitHub Actions will enforce

**Even if local checks are bypassed, PR workflow will block the merge.**

### TDD Workflow

When implementing new features:

1. **Implement the feature**
2. **Run tests**: `npm run test:e2e`
3. **If tests fail:**
   - ✅ **Fix your implementation** to make tests pass
   - ❌ **DO NOT** modify locked test files
4. **Re-run tests** until they pass
5. **Commit** only when tests pass

### Lock Validation

The pre-commit hook automatically validates locked tests:

1. **Checksum Validation**: Each locked test has a stored checksum
2. **Automatic Detection**: Any modification to a locked test is detected
3. **Commit Blocking**: Commits are blocked if locked tests are modified
4. **Test Execution**: Tests must pass before commit

### If You Need to Modify a Locked Test

**⚠️ CRITICAL: You CANNOT unlock files - only the user can do this**

**You cannot do this directly.** You must:

1. **Inform the user** that a locked test needs modification
2. **Explain why** the test needs to change
3. **WAIT for explicit user permission** before proceeding
4. **Only if user explicitly requests unlock**, wait for user to unlock:
   ```bash
   bash scripts/unlock-test.sh frontend/e2e/modules/banks.spec.ts
   ```
5. **Make the changes** after the user unlocks it
6. **Inform the user** to lock it again after changes

**⚠️ IMPORTANT**: 
- **AI agents CANNOT unlock files** - only the user can unlock them
- **Locked files remain locked** unless user explicitly unlocks them
- **In most cases, you should fix your implementation** instead of modifying tests

### Helper Functions

You **CAN** modify helper functions in `frontend/e2e/helpers/`:

- `bank-helpers.ts` - Reusable bank-related test actions
  - `createBank(page, bankName?)` - Creates a new bank
  - `ensureBankExists(page, defaultBankName?)` - Ensures a bank exists (creates if needed)
  - `bankExists(page)` - Checks if any banks exist
  - `closeDialogs(page)` - Closes any open dialogs

**When modifying helpers:**
- ✅ Ensure backward compatibility with existing tests
- ✅ Test your changes with existing tests
- ✅ Update documentation if behavior changes

### Creating New Tests

When creating new tests:

1. **Use helper functions** to avoid code duplication
2. **Follow the test structure** shown in existing tests
3. **Clear IndexedDB** in `beforeEach` hook
4. **Use descriptive test names** that explain the scenario
5. **Verify both UI and data persistence**

### Example: Adding a New Test

```typescript
// ✅ CORRECT: Adding a new test to an unlocked file
test('should edit an existing bank', async ({ page }) => {
  // Create a bank first using helper
  const bankName = await createBank(page, 'Test Bank');
  
  // Your test logic here
  // ...
});

// ❌ WRONG: Modifying a locked test file
// This will be blocked by pre-commit hook
```

---

## Test Locking System

### How It Works

1. **Locking a Test**:
   ```bash
   bash scripts/lock-test.sh frontend/e2e/modules/banks.spec.ts
   ```
   - Calculates SHA256 checksum of the test file
   - Stores checksum in `.test-locks/` directory
   - Updates file header to `LOCK STATUS: LOCKED`

2. **Validation**:
   - Pre-commit hook validates all locked tests
   - Compares current checksum with stored checksum
   - Blocks commit if checksums don't match

3. **Unlocking a Test**:
   ```bash
   bash scripts/unlock-test.sh frontend/e2e/modules/banks.spec.ts
   # Type 'UNLOCK' to confirm
   ```
   - Removes lock file
   - Updates file header to `LOCK STATUS: UNLOCKED`
   - Allows modifications

### Lock File Structure

```
.test-locks/
├── e2e/
│   └── modules/
│       ├── banks.spec.ts.lock          # Checksum for banks.spec.ts
│       └── bank-accounts.spec.ts.lock  # Checksum for bank-accounts.spec.ts
├── lock-log.txt                        # Log of lock actions
└── unlock-log.txt                      # Log of unlock actions
```

### Lock Status in Files

Each test file has a lock status comment:

```typescript
/**
 * E2E test for Banks module
 * 
 * LOCK STATUS: LOCKED  ← This indicates the file is locked
 * 
 * This file is protected and cannot be modified by AI agents.
 * Only the user can unlock and modify this file.
 */
```

---

## Current Test Scenarios

### 1. Banks Module (`banks.spec.ts`) - **LOCKED**

**Test**: `should be able to create a bank and see it in the banks list`

**What it tests**:
- User can navigate to `/banks` page
- User can click "Add Bank" button
- User can fill in bank name
- User can create a bank
- Bank appears in the banks list

**Helper used**: `createBank(page, bankName)`

### 2. Bank Accounts Module (`bank-accounts.spec.ts`) - **LOCKED**

**Test**: `should be able to create a bank account when at least one bank exists`

**What it tests**:
- Automatically ensures a bank exists (creates one if needed)
- User can navigate to `/accounts` page
- User can click "Add Account" button
- User can fill in account name
- User can select a bank from dropdown
- User can create an account
- Account appears in the accounts list

**Helper used**: `ensureBankExists(page, bankName)`, `closeDialogs(page)`

---

## Helper Functions

### Location

All helper functions are in `frontend/e2e/helpers/bank-helpers.ts`

### Available Functions

#### `createBank(page: Page, bankName?: string): Promise<string>`

Creates a new bank and returns the bank name.

**Parameters**:
- `page`: Playwright Page object
- `bankName` (optional): Name for the bank (defaults to `Test Bank ${Date.now()}`)

**Returns**: The bank name that was created

**Example**:
```typescript
const bankName = await createBank(page, 'My Test Bank');
```

#### `ensureBankExists(page: Page, defaultBankName?: string): Promise<string>`

Ensures at least one bank exists. If no banks exist, creates one automatically.

**Parameters**:
- `page`: Playwright Page object
- `defaultBankName` (optional): Name for the bank if it needs to be created

**Returns**: The name of an existing or newly created bank

**Example**:
```typescript
const bankName = await ensureBankExists(page, 'Auto Bank');
// If banks exist, returns existing bank name
// If no banks exist, creates one and returns the name
```

#### `bankExists(page: Page): Promise<boolean>`

Checks if any banks exist.

**Parameters**:
- `page`: Playwright Page object

**Returns**: `true` if banks exist, `false` otherwise

**Example**:
```typescript
const exists = await bankExists(page);
if (!exists) {
  await createBank(page);
}
```

#### `closeDialogs(page: Page): Promise<void>`

Closes any open dialogs (onboarding, modals, etc.) that might block interactions.

**Parameters**:
- `page`: Playwright Page object

**Example**:
```typescript
await page.goto('/banks');
await closeDialogs(page);
// Now safe to interact with the page
```

### Best Practices for Helpers

- ✅ **Reuse helpers**: Always use helpers instead of rewriting test logic
- ✅ **Keep helpers generic**: Helpers should work for multiple test scenarios
- ✅ **Document behavior**: Add JSDoc comments explaining what helpers do
- ✅ **Handle edge cases**: Helpers should handle common edge cases (dialogs, loading states, etc.)

---

## Running Tests

### Available Commands

#### Basic Test Execution

```bash
# Run all E2E tests (terminal output)
npm run test:e2e

# Run all tests on all browsers
npm run test:e2e:all
```

#### Visual Demo Commands

```bash
# Interactive menu
npm run test:demo

# UI mode (interactive Playwright UI)
npm run test:demo:ui

# Headed mode (visible browser windows)
npm run test:demo:headed

# HTML report
npm run test:demo:html

# Show last HTML report
npm run test:demo:report
```

#### Module-Based Testing

```bash
# Run tests for changed modules (automatic detection)
npm run test:modules

# Run all module tests
npm run test:modules:all
```

### Pre-commit Hook

Tests run automatically on every commit:

1. **Version bump validation**
2. **Linting**
3. **Type checking**
4. **Build validation**
5. **Test lock validation** ← Validates locked tests haven't been modified
6. **E2E test suite** ← Runs all E2E tests

**All checks must pass** for the commit to proceed.

---

## Troubleshooting

### Tests Failing

1. **Check dev server**: Ensure dev server is running on `http://localhost:7001`
   - Tests will start it automatically, but verify it's accessible

2. **Clear browser state**: Tests clear IndexedDB, but if issues persist:
   ```bash
   # Clear Playwright browser cache
   cd frontend
   npx playwright install --force
   ```

3. **Check test output**: Run tests with verbose output:
   ```bash
   cd frontend
   npx playwright test --project=chromium --reporter=list
   ```

### Lock Validation Failing

If pre-commit hook fails with "Locked test file modified":

1. **Check what changed**: 
   ```bash
   git diff frontend/e2e/modules/banks.spec.ts
   ```

2. **Restore original**:
   ```bash
   git checkout frontend/e2e/modules/banks.spec.ts
   ```

3. **Or unlock if you need to modify**:
   ```bash
   bash scripts/unlock-test.sh frontend/e2e/modules/banks.spec.ts
   # Make changes
   # Lock again: bash scripts/lock-test.sh frontend/e2e/modules/banks.spec.ts
   ```

### Helper Functions Not Working

1. **Check imports**: Ensure helper functions are imported correctly
2. **Check helper file**: Verify helper functions exist and are exported
3. **Update helpers**: If helpers need updates, modify `frontend/e2e/helpers/bank-helpers.ts`
4. **Test helpers**: Run tests to verify helpers still work after changes

### Dev Server Not Starting

If tests fail because dev server doesn't start:

1. **Check port**: Ensure port 7001 is available
2. **Check dependencies**: Run `npm install` in frontend directory
3. **Manual start**: Start dev server manually:
   ```bash
   npm run dev
   ```
   Then run tests in another terminal

---

## Related Documentation

- `docs/PLAYWRIGHT_TEST_SUITE.md` - Original test suite documentation
- `DEMO_TESTS.md` - Visual demo guide
- `frontend/e2e/modules/README.md` - Module test directory guide
- `docs/ENFORCEMENT_LOCK.md` - Enforcement lock system (for pre-commit hooks)

---

## Summary

- ✅ **2 locked test files** protect critical user flows
- ✅ **Helper functions** enable code reuse and maintainability
- ✅ **Pre-commit hooks** ensure tests pass before commits
- ✅ **Visual demo tools** make it easy to see tests running
- ✅ **Clear documentation** for both users and AI agents

**Remember**: Locked tests are protected for a reason - they represent finalized, tested user flows that must not be broken.

