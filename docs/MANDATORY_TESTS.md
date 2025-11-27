# Mandatory Test Suite Requirements

## Overview

The Playwright module-based test suite is **MANDATORY** and must pass before:
- ✅ Commits can be made (pre-commit hook)
- ✅ Pull requests can be merged (GitHub Actions)

## Enforcement Points

### 1. Pre-Commit Hook (`.husky/pre-commit`)

**Step 6/6: Module-Based Playwright Tests**

The pre-commit hook **MANDATORILY** runs module-based Playwright tests:

- ✅ **Test runner script must exist**: `scripts/run-module-tests.sh`
- ✅ **Playwright must be installed**: Tests cannot be skipped
- ✅ **All tests must pass**: Commit is blocked if any test fails
- ✅ **Cannot be bypassed**: No `--no-verify` or skip options

**Failure Behavior:**
- ❌ Commit is **BLOCKED**
- ❌ Error message displayed
- ❌ Exit code: `1` (failure)

**Example Failure:**
```bash
❌ CRITICAL: Playwright tests failed
❌ Module tests must pass before commit
🔒 ENFORCEMENT: Commit blocked - Fix failing tests first
📋 REQUIRED: Run 'bash scripts/run-module-tests.sh' and fix failing tests
⚠️  This check CANNOT BE BYPASSED - All tests must pass
```

### 2. GitHub Actions PR Workflow (`.github/workflows/pr-checks.yml`)

**Step 4/5: Mandatory Module-Based Playwright Tests**

The PR workflow **MANDATORILY** runs module-based Playwright tests:

- ✅ **Runs on every PR**: Automatic execution
- ✅ **Installs Playwright browsers**: Chromium installed automatically
- ✅ **All tests must pass**: PR cannot be merged if tests fail
- ✅ **Required status check**: Must pass for merge

**Failure Behavior:**
- ❌ PR status check **FAILS**
- ❌ PR cannot be merged (branch protection)
- ❌ Comment added to PR explaining failure
- ❌ Workflow exits with error code

**PR Comment on Failure:**
```
❌ **Quality Checks Failed**

Please fix the following issues:
- ESLint errors/warnings in production code
- TypeScript compilation errors
- Build validation errors
- **Mandatory module-based Playwright tests** (all tests must pass)
- **Mandatory version bump validation** (incoming branch version must be ahead of base branch version)

🔒 **ENFORCEMENT**: PR cannot be merged until all checks pass.

📋 **REQUIRED**: Fix all errors and push again.
```

## What Tests Run

### Automatic Module Detection

Tests run for:
1. **Changed modules**: Automatically detected from git changes
2. **Global modules**: Always run (Dashboard, Settings)
3. **All modules**: If shared/common code changed

### Test Execution

- **Browser**: Chromium (fastest for CI/pre-commit)
- **Parallel**: Tests run in parallel when possible
- **Timeout**: 30 seconds per test
- **Auto-exit**: Tests complete and exit automatically

## Requirements

### Local Development

Before committing, ensure:

1. **Playwright is installed**:
   ```bash
   cd frontend
   npx playwright install chromium
   ```

2. **Tests pass locally**:
   ```bash
   bash scripts/run-module-tests.sh
   ```

3. **Fix any failing tests** before committing

### CI/CD

GitHub Actions automatically:
- ✅ Installs Playwright browsers
- ✅ Runs module-based tests
- ✅ Reports results
- ✅ Blocks merge if tests fail

## Bypass Prevention

### Pre-Commit Hook

- ❌ `--no-verify` flag is **BLOCKED** by git wrapper
- ❌ `HUSKY_SKIP_HOOKS=1` is **DETECTED** and blocked
- ❌ Test skipping is **NOT ALLOWED**

### GitHub Actions

- ❌ Cannot bypass workflow checks
- ❌ Branch protection requires status checks
- ❌ Tests must pass for merge

## Test Lock Validation

**Step 5/6: Test Lock Validation**

Before running tests, the pre-commit hook validates:
- ✅ Locked test files haven't been modified
- ✅ Test checksums match stored values
- ✅ Commit blocked if locked tests are modified

See `docs/PLAYWRIGHT_TEST_SUITE.md` for test locking details.

## Troubleshooting

### Tests Fail Locally

1. **Check test output**:
   ```bash
   bash scripts/run-module-tests.sh
   ```

2. **Run specific module**:
   ```bash
   bash scripts/run-module-tests.sh --module=dashboard
   ```

3. **Run all tests**:
   ```bash
   bash scripts/run-module-tests.sh --all
   ```

4. **Check Playwright installation**:
   ```bash
   cd frontend
   npx playwright --version
   ```

### Tests Fail in CI

1. **Check GitHub Actions logs**
2. **Verify test files exist** in `frontend/e2e/modules/`
3. **Ensure test files have actual tests** (not just empty describe blocks)
4. **Check for flaky tests** (may need retries)

### Playwright Not Installed

**Pre-commit hook will fail** if Playwright is not installed:

```bash
❌ CRITICAL: Playwright not installed
❌ ENFORCEMENT: Commit blocked - Playwright tests are MANDATORY
📋 REQUIRED: Install Playwright with: cd frontend && npx playwright install
```

**Solution:**
```bash
cd frontend
npx playwright install chromium
```

## Summary

| Requirement | Pre-Commit | PR Workflow |
|------------|------------|-------------|
| **Mandatory** | ✅ Yes | ✅ Yes |
| **Can Skip** | ❌ No | ❌ No |
| **Blocks Commit/Merge** | ✅ Yes | ✅ Yes |
| **Auto-Install Browsers** | ⚠️ Manual | ✅ Automatic |
| **Exit on Failure** | ✅ Yes | ✅ Yes |

## Related Documentation

- `docs/PLAYWRIGHT_TEST_SUITE.md` - Complete test suite documentation
- `docs/TEST_AUTO_EXIT.md` - Auto-exit configuration
- `docs/TEST_SCENARIOS_GUIDE.md` - Writing test scenarios
- `docs/GIT_HOOKS_SETUP.md` - Git hooks setup
- `docs/ENFORCEMENT_LOCK.md` - Enforcement lock system

