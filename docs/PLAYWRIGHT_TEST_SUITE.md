# Playwright Test Suite - Module-Based E2E Testing

## Overview

This project uses **Playwright** for end-to-end (E2E) testing with a **module-based approach**. Tests are organized by application modules and run automatically on every pre-commit hook to ensure existing functionality is not broken.

## Key Features

- ✅ **Module-Based Testing**: Tests are organized by application modules
- ✅ **Smart Test Selection**: Only runs tests for changed modules + global modules
- ✅ **Test Locking**: Finalized tests can be locked to prevent AI agent modifications
- ✅ **Pre-commit Integration**: Tests run automatically before every commit
- ✅ **User-Defined Scenarios**: You decide what to test, AI agents cannot modify locked tests

## Test Organization

### Module Structure

Tests are organized in `frontend/e2e/modules/` directory:

```
frontend/e2e/modules/
├── dashboard.spec.ts      # Dashboard module (GLOBAL - always runs)
├── settings.spec.ts        # Settings module (GLOBAL - always runs)
├── banks.spec.ts           # Banks module
├── accounts.spec.ts        # Bank Accounts module
├── transactions.spec.ts   # Transactions module
├── emis.spec.ts           # EMIs module
├── recurring.spec.ts      # Recurring Transactions module
├── planner.spec.ts        # Planner module
├── analytics.spec.ts      # Analytics module
├── forecasting.spec.ts   # Forecasting module
└── credit-cards.spec.ts   # Credit Card Dashboard module
```

### Global Modules

The following modules are considered **global** and their tests run on every PR:

- **Dashboard** (`dashboard.spec.ts`)
- **Settings** (`settings.spec.ts`)

These modules are critical infrastructure that other modules depend on, so they're always tested.

## How It Works

### 1. Pre-commit Hook Integration

When you commit code, the pre-commit hook automatically:

1. **Detects Changed Modules**: Analyzes git changes to determine which modules were modified
2. **Validates Test Locks**: Ensures locked test files haven't been modified
3. **Runs Relevant Tests**: Executes Playwright tests for:
   - Changed modules
   - Global modules (dashboard, settings)
   - All modules (if shared/common code changed)

### 2. Module Detection

The system detects module changes by analyzing:

- **Page Components**: `frontend/src/pages/ModuleName`
- **Component Directories**: `frontend/src/components/module-name`
- **Store Files**: `frontend/src/store/useModuleStore`
- **Route Changes**: Changes to routing configuration

### 3. Test Locking System

Once you've finalized and tested a scenario, you can **lock** the test file to prevent AI agents from modifying it:

```bash
# Lock a test file
bash scripts/lock-test.sh frontend/e2e/modules/dashboard.spec.ts
```

Locked tests:
- ✅ Cannot be modified by AI agents
- ✅ Are validated on every commit
- ✅ Can only be unlocked by you (the user)

To unlock a test file:

```bash
# Unlock a test file (requires confirmation)
bash scripts/unlock-test.sh frontend/e2e/modules/dashboard.spec.ts
```

## Writing Tests

### Test File Template

Each module test file follows this structure:

```typescript
/**
 * E2E tests for [Module Name] module
 * 
 * LOCK STATUS: UNLOCKED (User-defined scenarios pending)
 * 
 * This file contains user-defined test scenarios for the [Module Name] module.
 * Once scenarios are finalized and tested, this file will be LOCKED to prevent
 * AI agents from modifying it. Only the user can unlock and modify locked tests.
 */

import { test, expect } from '@playwright/test';

test.describe('[Module Name] Module - User Flows', () => {
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

  // Your test scenarios here
  test('should perform user flow X', async ({ page }) => {
    // Test implementation
  });
});
```

### Best Practices

1. **User Flows**: Focus on complete user journeys, not isolated unit tests
2. **Descriptive Names**: Use clear, descriptive test names that explain the scenario
3. **Isolation**: Each test should be independent and clean up after itself
4. **Realistic Data**: Use realistic test data that mirrors real-world usage
5. **Assertions**: Verify both UI state and data persistence

### Example Test Scenario

```typescript
test('should create a bank and account, then add a transaction', async ({ page }) => {
  // Navigate to banks
  await page.goto('/banks');
  await page.click('button:has-text("Add Bank")');
  
  // Create bank
  await page.fill('input[name="name"]', 'Test Bank');
  await page.selectOption('select[name="type"]', 'Bank');
  await page.click('button[type="submit"]');
  
  // Verify bank was created
  await expect(page.locator('text=Test Bank')).toBeVisible();
  
  // Navigate to accounts
  await page.goto('/accounts');
  await page.click('button:has-text("Add Account")');
  
  // Create account
  await page.selectOption('select[name="bankId"]', { label: 'Test Bank' });
  await page.fill('input[name="name"]', 'Savings Account');
  await page.selectOption('select[name="accountType"]', 'Savings');
  await page.fill('input[name="currentBalance"]', '10000');
  await page.click('button[type="submit"]');
  
  // Verify account was created
  await expect(page.locator('text=Savings Account')).toBeVisible();
  
  // Navigate to transactions
  await page.goto('/transactions');
  await page.click('button:has-text("Add Transaction")');
  
  // Create transaction
  await page.fill('input[name="date"]', '2025-01-15');
  await page.selectOption('select[name="accountId"]', { label: 'Savings Account' });
  await page.fill('input[name="amount"]', '1000');
  await page.fill('input[name="description"]', 'Test Transaction');
  await page.click('button[type="submit"]');
  
  // Verify transaction was created
  await expect(page.locator('text=Test Transaction')).toBeVisible();
});
```

## Running Tests

### Manual Test Execution

Run all module tests:

```bash
bash scripts/run-module-tests.sh --all
```

Run tests for a specific module:

```bash
bash scripts/run-module-tests.sh --module=dashboard
```

Run tests based on changed files (automatic detection):

```bash
bash scripts/run-module-tests.sh
```

### Direct Playwright Commands

Run all tests:

```bash
cd frontend
npm run test:e2e
```

Run specific test file:

```bash
cd frontend
npm run test:e2e e2e/modules/dashboard.spec.ts
```

Run with UI mode (interactive):

```bash
cd frontend
npm run test:e2e:ui
```

## Test Locking Workflow

### 1. Write and Test Your Scenarios

1. Open the module test file (e.g., `frontend/e2e/modules/dashboard.spec.ts`)
2. Write your test scenarios
3. Run tests manually to verify they pass:
   ```bash
   cd frontend
   npm run test:e2e e2e/modules/dashboard.spec.ts
   ```

### 2. Lock the Test File

Once you're satisfied with the tests:

```bash
bash scripts/lock-test.sh frontend/e2e/modules/dashboard.spec.ts
```

This will:
- Calculate and store a checksum of the test file
- Mark the file as LOCKED in its header
- Prevent AI agents from modifying it

### 3. Verify Lock Status

The pre-commit hook will automatically validate locked tests. If a locked test is modified, the commit will be blocked.

### 4. Unlock When Needed

If you need to modify a locked test:

```bash
bash scripts/unlock-test.sh frontend/e2e/modules/dashboard.spec.ts
# Type 'UNLOCK' to confirm
```

After making changes, lock it again.

## BDD vs Other Practices

### Recommendation: **User Flow Testing (Not Strict BDD)**

For this project, we recommend **User Flow Testing** rather than strict BDD (Behavior Driven Development) because:

1. **Simplicity**: User flows are easier to write and maintain
2. **Focus**: Tests focus on what users actually do, not abstract behaviors
3. **Flexibility**: Easier to add/modify scenarios as the app evolves
4. **AI-Friendly**: Clear, straightforward tests that AI agents can understand (but not modify when locked)

### When to Use BDD

Consider BDD if:
- You have non-technical stakeholders writing tests
- You need very formal behavior specifications
- Your team prefers Given-When-Then syntax

### Current Approach Benefits

- ✅ **User-Centric**: Tests mirror real user journeys
- ✅ **Maintainable**: Easy to understand and update
- ✅ **Protected**: Locked tests prevent accidental modifications
- ✅ **Fast**: Only runs relevant tests, not entire suite

## Troubleshooting

### Tests Not Running

If tests don't run in pre-commit:

1. **Check Playwright Installation**:
   ```bash
   cd frontend
   npx playwright install
   ```

2. **Verify Dev Server**: Tests need the dev server running (it starts automatically)

3. **Check Test Files**: Ensure test files exist in `frontend/e2e/modules/`

### Lock Validation Failing

If lock validation fails:

1. **Check Lock Status**: Verify which files are locked:
   ```bash
   ls -la .test-locks/
   ```

2. **Restore Original**: Restore the locked test file from git:
   ```bash
   git checkout frontend/e2e/modules/dashboard.spec.ts
   ```

3. **Or Unlock**: If you need to modify it:
   ```bash
   bash scripts/unlock-test.sh frontend/e2e/modules/dashboard.spec.ts
   ```

### Module Detection Issues

If tests aren't running for changed modules:

1. **Check File Paths**: Ensure changed files match module detection patterns
2. **Run All Tests**: Use `--all` flag to run everything:
   ```bash
   bash scripts/run-module-tests.sh --all
   ```

3. **Manual Selection**: Run specific module:
   ```bash
   bash scripts/run-module-tests.sh --module=dashboard
   ```

## Integration with CI/CD

The test suite integrates seamlessly with CI/CD:

- **Pre-commit**: Runs automatically before every commit
- **GitHub Actions**: Can be added to CI pipeline (see `.github/workflows/`)
- **Fast Feedback**: Only runs relevant tests, keeping CI fast

## Next Steps

1. **Define Scenarios**: Start writing test scenarios for each module
2. **Test and Verify**: Run tests manually to ensure they work
3. **Lock Tests**: Lock finalized tests to protect them
4. **Iterate**: Add more scenarios as needed, unlock → modify → lock

## Related Documentation

- `docs/GIT_HOOKS_SETUP.md` - Git hooks configuration
- `docs/ENFORCEMENT_LOCK.md` - Enforcement lock system
- `docs/DEVELOPER_GUIDE.md` - General development guide

