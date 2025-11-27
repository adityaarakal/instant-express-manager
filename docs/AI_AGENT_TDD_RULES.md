# AI Agent TDD Rules - MANDATORY

## ⚠️ CRITICAL: Test-Driven Development Rules

### The Core Principle

**Locked tests are DELIVERED features. They represent what the end user expects.**

When implementing new features or tasks:
- ✅ **If tests fail → Fix your implementation**
- ❌ **If tests fail → DO NOT modify locked tests**

## Mandatory Workflow

### Step-by-Step Process

1. **Receive task** to implement new feature
2. **Implement the feature** in your code
3. **Run tests**: `npm run test:e2e`
4. **If tests fail:**
   - ✅ **Fix your implementation** to make tests pass
   - ❌ **DO NOT** modify locked test files
   - ❌ **DO NOT** change test expectations
5. **Re-run tests** until they pass
6. **Commit** only when tests pass

### Example: Adding a New Field

**Task**: Add "IFSC Code" field to bank creation form

**WRONG Approach** ❌:
```typescript
// 1. Add field to form
// 2. Test fails because test doesn't expect IFSC field
// 3. Modify test to include IFSC field ← WRONG!
```

**CORRECT Approach** ✅:
```typescript
// 1. Add field to form
// 2. Test fails because test doesn't expect IFSC field
// 3. Make field optional or ensure it doesn't break existing test
// 4. OR: Ask user to unlock test first if field is mandatory
// 5. Fix implementation to make existing test pass
```

## What You CANNOT Do

### ❌ Prohibited Actions

1. **Modify locked test files** - Even if tests fail
2. **Change test expectations** - To match broken implementation
3. **Skip test failures** - Tests must pass before commit
4. **Bypass lock validation** - Pre-commit hooks will catch you
5. **Unlock tests yourself** - Only user can unlock

## What You MUST Do

### ✅ Required Actions

1. **Fix implementation** - When tests fail
2. **Maintain backward compatibility** - With existing tests
3. **Ask user to unlock** - If test changes are truly needed
4. **Ensure tests pass** - Before committing
5. **Respect locked tests** - As delivered features

## Error Scenarios

### Scenario 1: Tests Fail After Implementation

**What happens:**
```
❌ CRITICAL: E2E test suite failed
🔒 ENFORCEMENT: Commit blocked - Fix failing tests first
📋 REQUIRED: Fix your implementation to make tests pass
📋 REMEMBER: Do NOT modify locked test files
```

**What you do:**
1. **DO NOT** modify the test file
2. **DO** fix your implementation
3. **DO** re-run tests until they pass
4. **DO** commit only when tests pass

### Scenario 2: Test Needs Modification

**What happens:**
- You realize the test needs to change for the new feature
- But the test is locked

**What you do:**
1. **STOP** - Do not modify the locked test
2. **INFORM** user that test needs modification
3. **WAIT** for user to unlock the test
4. **THEN** modify the test after unlock
5. **REMIND** user to lock it again

**Example response:**
```
⚠️ The test file `frontend/e2e/modules/banks.spec.ts` is LOCKED.

To add the new IFSC field test, I need you to unlock it first:

1. Unlock: bash scripts/unlock-test.sh frontend/e2e/modules/banks.spec.ts
2. I'll add the test for IFSC field
3. Lock again: bash scripts/lock-test.sh frontend/e2e/modules/banks.spec.ts

Alternatively, I can implement the feature to work with the existing test
(keeping IFSC optional) if that's acceptable.
```

## The TDD Mindset

### Think of Tests as Contracts

- **Tests = Contract** with end user
- **Implementation = Fulfillment** of contract
- **Locked tests = Delivered contract** (cannot change)

### When Implementing New Features

Ask yourself:
1. "Does this break existing tests?" → If yes, fix implementation
2. "Do I need to change tests?" → If yes, ask user to unlock
3. "Can I implement this without breaking tests?" → If yes, do it

## Enforcement Mechanisms

### Pre-commit Hook

The pre-commit hook will:
1. **Block commits** if locked tests are modified
2. **Block commits** if tests fail
3. **Force you** to fix implementation

### ⚠️ BYPASS PROHIBITED

**These checks CANNOT be bypassed:**

- ❌ **--no-verify flag**: Blocked by git wrapper and server-side checks
- ❌ **Environment variables**: Detected and blocked (HUSKY_SKIP_HOOKS, SKIP_HOOKS, etc.)
- ❌ **AI agents**: Cannot bypass - tests must pass
- ❌ **Manual skip**: Server-side GitHub Actions will enforce

**Even if local checks are bypassed, PR workflow will block the merge.**

### Lock Validation

Lock validation checks:
- ✅ Test file checksum matches stored checksum
- ✅ No modifications to locked tests
- ✅ Tests still pass

### Server-Side Enforcement

GitHub Actions PR workflow:
- ✅ Runs all TDD checks on every PR
- ✅ Blocks merge if tests fail
- ✅ Blocks merge if locked tests are modified
- ✅ Cannot be bypassed - enforced by GitHub

## Best Practices

1. **Run tests early** - Before committing
2. **Fix immediately** - When tests fail
3. **Respect locks** - Treat as delivered features
4. **Ask permission** - Before requesting unlock
5. **Document changes** - When user unlocks

## Summary

- 🔒 **Locked tests = Delivered features (immutable)**
- ✅ **Tests fail → Fix implementation**
- ❌ **Tests fail → DO NOT modify tests**
- 👤 **Only user can unlock tests**
- 🎯 **Tests define what "working" means**

**Remember**: You are implementing features to satisfy the tests, not changing tests to match broken implementations.

