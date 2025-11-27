# Test Auto-Exit Configuration

## Overview

The Playwright test suite is configured to **automatically exit** when tests complete and **ignore Ctrl+C** during test execution. This ensures:

1. ✅ Tests run to completion without user interruption
2. ✅ Tests automatically exit when done (no waiting for user input)
3. ✅ Pre-commit hooks can run tests unattended
4. ✅ AI agents can run tests without manual intervention

## How It Works

### Signal Handling

The test runner script (`scripts/run-module-tests.sh`) sets up signal handling at the start:

```bash
# Ignore Ctrl+C during script execution - tests must complete
trap '' SIGINT SIGTERM
```

This ensures that:
- **Ctrl+C is ignored** during test execution
- Tests **must complete** before the script exits
- Pre-commit hooks won't be interrupted

### Playwright Configuration

The Playwright config (`frontend/playwright.config.ts`) is configured for auto-exit:

```typescript
export default defineConfig({
  // ... other config
  timeout: 30000,  // Global timeout for each test
  expect: {
    timeout: 5000,
  },
  // No globalSetup/globalTeardown that would wait for input
});
```

### Auto-Exit Behavior

1. **Tests Start**: Playwright starts the dev server automatically
2. **Tests Run**: All tests execute in parallel (when possible)
3. **Tests Complete**: Playwright automatically exits with appropriate exit code
4. **Script Exits**: The test runner script exits with the same code

## Pre-commit Integration

In the pre-commit hook (`.husky/pre-commit`), tests are run with:

```bash
bash scripts/run-module-tests.sh
TEST_STATUS=$?
```

The script:
- ✅ Runs tests to completion
- ✅ Auto-exits when done
- ✅ Returns proper exit code (0 = success, 1 = failure)
- ✅ Blocks commit if tests fail

## Manual Execution

When running tests manually:

```bash
# Tests will run to completion and auto-exit
npm run test:modules

# Or directly
bash scripts/run-module-tests.sh
```

**Note**: If you need to stop tests manually, you may need to:
1. Wait for current test to complete
2. Or kill the process from another terminal: `pkill -f playwright`

## CI/CD Integration

In CI/CD environments, tests:
- ✅ Run automatically
- ✅ Exit when complete
- ✅ Return proper exit codes for CI systems
- ✅ Don't require user interaction

## Troubleshooting

### Tests Hang

If tests appear to hang:

1. **Check Dev Server**: Ensure dev server can start on port 7001
2. **Check Timeouts**: Increase timeout in `playwright.config.ts` if needed
3. **Check Test Files**: Ensure test files have actual test cases (not just empty describe blocks)

### Ctrl+C Not Working

This is **intentional**. Tests are designed to run to completion. To stop tests:

1. Wait for current test to finish
2. Or kill from another terminal: `pkill -f playwright`

### Tests Don't Exit

If tests don't exit automatically:

1. Check Playwright version: `npx playwright --version`
2. Ensure no `test.only()` or `test.skip()` are blocking execution
3. Check for infinite loops in test code

## Configuration

### Test Timeout

Default timeout per test: **30 seconds**

To change:
```typescript
// frontend/playwright.config.ts
export default defineConfig({
  timeout: 60000,  // 60 seconds
});
```

### Expect Timeout

Default expect timeout: **5 seconds**

To change:
```typescript
// frontend/playwright.config.ts
export default defineConfig({
  expect: {
    timeout: 10000,  // 10 seconds
  },
});
```

## See Also

- `docs/PLAYWRIGHT_TEST_SUITE.md` - Complete test suite documentation
- `scripts/run-module-tests.sh` - Test runner script
- `.husky/pre-commit` - Pre-commit hook integration

