# Test-Driven Development Approach

## Core Philosophy

**Locked tests are DELIVERED features - they represent what the end user expects.**

Once a test is locked, it becomes the **source of truth** for that feature. The test defines what "working" means, and implementations must conform to the tests, not the other way around.

## The Golden Rule

> **If tests fail, fix the implementation - NEVER modify locked tests.**

Locked tests are like **delivered products** to end users. You cannot change what was delivered without explicit user permission.

## Development Workflow

### Standard Flow (New Feature/Task)

1. **Start implementing** a new feature or task
2. **Run tests** (`npm run test:e2e`)
3. **If tests fail:**
   - ✅ **FIX THE IMPLEMENTATION** to make tests pass
   - ❌ **DO NOT** modify locked test files
4. **Tests pass** → Implementation is correct → Commit
5. **Tests still fail** → Keep fixing implementation until tests pass

### Example Scenario

**Task**: Add a new field to the bank creation form

1. You add the new field to the form
2. Run tests: `npm run test:e2e`
3. Test fails because it expects the old behavior
4. **WRONG**: Modifying the test to accept the new field ❌
5. **CORRECT**: Adjusting the implementation to maintain backward compatibility OR asking user to unlock test first ✅

## When Can Tests Be Modified?

### Only with Explicit User Permission

⚠️ **CRITICAL: AI agents CANNOT unlock files - only the user can unlock them**

Tests can ONLY be modified if:

1. **User explicitly requests** to modify a locked test
2. **User explicitly unlocks** the test file (AI agents cannot do this):
   ```bash
   bash scripts/unlock-test.sh frontend/e2e/modules/banks.spec.ts
   # Type 'UNLOCK' to confirm
   ```
3. **After modification**, user locks it again:
   ```bash
   bash scripts/lock-test.sh frontend/e2e/modules/banks.spec.ts
   ```

**⚠️ IMPORTANT**: 
- **Locked files remain locked** unless user explicitly unlocks them
- **AI agents cannot unlock files** - they must wait for user permission
- **Unlocking should be rare** - locked tests are delivered features

### When User Should Unlock Tests

- **New feature requires different test behavior**
- **User wants to update test scenarios**
- **Test is outdated and needs refresh**
- **User explicitly asks AI agent to modify tests**

## Enforcement

### Pre-commit Hook

The pre-commit hook enforces:

1. **Locked tests cannot be modified** - commit blocked if detected
2. **Tests must pass** - commit blocked if tests fail
3. **Implementation must conform** to locked tests

### ⚠️ BYPASS PROHIBITED

**These checks CANNOT be bypassed:**

- ❌ **--no-verify flag**: Blocked by git wrapper and server-side checks
- ❌ **Environment variables**: Detected and blocked
- ❌ **AI agents**: Cannot bypass - tests must pass
- ❌ **Manual skip**: Server-side GitHub Actions will enforce

**Even if local checks are bypassed, PR workflow will block the merge.**

### Error Messages

If you try to modify a locked test:

```
❌ LOCKED TEST FILE MODIFIED: frontend/e2e/modules/banks.spec.ts
🔒 ENFORCEMENT: Locked test files cannot be modified
📋 REQUIRED: Fix your implementation to make tests pass
📋 TO MODIFY TEST: User must unlock it first
```

If tests fail:

```
❌ CRITICAL: E2E test suite failed
❌ All E2E tests must pass before commit
🔒 ENFORCEMENT: Commit blocked - Fix failing tests first
📋 REQUIRED: Fix your implementation to make tests pass
📋 REMEMBER: Do NOT modify locked test files
```

## For AI Agents

### Mandatory Rules

1. **If tests fail** → Fix implementation, NOT tests
2. **Locked tests are immutable** → Cannot be modified
3. **Tests define correctness** → Implementation must match tests
4. **Ask user to unlock** → Only if user explicitly requests test changes

### Workflow for AI Agents

```
New Task → Implement → Run Tests → Tests Fail?
                                    ↓
                          Fix Implementation
                                    ↓
                          Run Tests Again → Pass?
                                    ↓
                          Commit ✅
```

**NEVER**:
- Modify locked test files
- Change test expectations to match broken implementation
- Bypass test failures

**ALWAYS**:
- Fix implementation to make tests pass
- Treat locked tests as delivered features
- Ask user to unlock if test changes are needed

## Benefits

1. **Stability**: Delivered features remain stable
2. **Confidence**: Tests ensure nothing breaks
3. **Clarity**: Tests define what "working" means
4. **Quality**: Forces proper implementation
5. **User Trust**: Delivered features don't change unexpectedly

## Summary

- 🔒 **Locked tests = Delivered features**
- ✅ **Tests fail → Fix implementation**
- ❌ **Tests fail → DO NOT modify tests**
- 👤 **Only user can unlock tests**
- 🎯 **Tests define correctness**

**Remember**: Tests are the contract. Implementation must fulfill the contract.

