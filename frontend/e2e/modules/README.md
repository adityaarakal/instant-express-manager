# Module-Based E2E Tests

This directory contains end-to-end tests organized by application modules.

## Test Files

Each module has its own test file:

- `dashboard.spec.ts` - Dashboard module (GLOBAL - always runs)
- `settings.spec.ts` - Settings module (GLOBAL - always runs)
- `banks.spec.ts` - Banks module
- `accounts.spec.ts` - Bank Accounts module
- `transactions.spec.ts` - Transactions module
- `emis.spec.ts` - EMIs module
- `recurring.spec.ts` - Recurring Transactions module
- `planner.spec.ts` - Planner module
- `analytics.spec.ts` - Analytics module
- `forecasting.spec.ts` - Forecasting module
- `credit-cards.spec.ts` - Credit Card Dashboard module

## Writing Tests

1. **Open the module test file** you want to add scenarios to
2. **Write your test scenarios** following the template structure
3. **Run tests manually** to verify they work:
   ```bash
   cd frontend
   npm run test:e2e e2e/modules/[module-name].spec.ts
   ```
4. **Lock the test file** once finalized:
   ```bash
   bash scripts/lock-test.sh frontend/e2e/modules/[module-name].spec.ts
   ```

## Lock Status

Each test file has a `LOCK STATUS` comment in its header:

- **UNLOCKED**: Test file can be modified by AI agents
- **LOCKED**: Test file is protected and cannot be modified by AI agents

## Test Structure

All test files follow this structure:

```typescript
test.describe('Module Name - User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
  });

  test('should perform user flow X', async ({ page }) => {
    // Your test scenario
  });
});
```

## Best Practices

- ✅ Focus on **complete user journeys**, not isolated unit tests
- ✅ Use **descriptive test names** that explain the scenario
- ✅ Keep tests **independent** - each test should clean up after itself
- ✅ Use **realistic test data** that mirrors real-world usage
- ✅ Verify both **UI state** and **data persistence**

## See Also

- `docs/PLAYWRIGHT_TEST_SUITE.md` - Complete test suite documentation
- `scripts/run-module-tests.sh` - Test runner script
- `scripts/lock-test.sh` - Lock test files
- `scripts/unlock-test.sh` - Unlock test files

