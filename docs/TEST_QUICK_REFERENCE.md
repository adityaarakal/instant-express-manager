# Playwright Test Suite - Quick Reference

## Quick Commands

### Run Tests

```bash
# Run tests for changed modules (automatic detection)
bash scripts/run-module-tests.sh

# Run all module tests
bash scripts/run-module-tests.sh --all

# Run tests for specific module
bash scripts/run-module-tests.sh --module=dashboard
```

### Lock/Unlock Tests

```bash
# Lock a test file (after finalizing scenarios)
bash scripts/lock-test.sh frontend/e2e/modules/dashboard.spec.ts

# Unlock a test file (to modify it)
bash scripts/unlock-test.sh frontend/e2e/modules/dashboard.spec.ts
```

### Direct Playwright Commands

```bash
# Run all tests
cd frontend && npm run test:e2e

# Run specific test file
cd frontend && npm run test:e2e e2e/modules/dashboard.spec.ts

# Run with UI (interactive)
cd frontend && npm run test:e2e:ui
```

## Module Test Files

All test files are in `frontend/e2e/modules/`:

- `dashboard.spec.ts` - Dashboard (GLOBAL)
- `settings.spec.ts` - Settings (GLOBAL)
- `banks.spec.ts` - Banks
- `accounts.spec.ts` - Accounts
- `transactions.spec.ts` - Transactions
- `emis.spec.ts` - EMIs
- `recurring.spec.ts` - Recurring
- `planner.spec.ts` - Planner
- `analytics.spec.ts` - Analytics
- `forecasting.spec.ts` - Forecasting
- `credit-cards.spec.ts` - Credit Cards

## Workflow

1. **Write Test Scenarios**
   - Open module test file
   - Add your test scenarios
   - Run tests manually to verify

2. **Lock Tests**
   - Once finalized, lock the test file
   - Tests will be protected from AI modifications

3. **Pre-commit**
   - Tests run automatically
   - Only changed modules + global modules are tested
   - Locked tests are validated

## Test Status

Check lock status in test file header:
- `LOCK STATUS: UNLOCKED` - Can be modified
- `LOCK STATUS: LOCKED` - Protected from modifications

## Troubleshooting

**Tests not running?**
- Check Playwright installation: `cd frontend && npx playwright install`
- Verify dev server is running (starts automatically)

**Lock validation failing?**
- Restore file: `git checkout frontend/e2e/modules/[file].spec.ts`
- Or unlock: `bash scripts/unlock-test.sh frontend/e2e/modules/[file].spec.ts`

**Module not detected?**
- Run all tests: `bash scripts/run-module-tests.sh --all`
- Or specify module: `bash scripts/run-module-tests.sh --module=[name]`

## See Also

- `docs/PLAYWRIGHT_TEST_SUITE.md` - Complete documentation
- `docs/TEST_SCENARIOS_GUIDE.md` - Scenario definition guide
- `frontend/e2e/modules/README.md` - Module test directory guide

