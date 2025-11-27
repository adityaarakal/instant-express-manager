# AI Agent Test Guidelines

## ⚠️ CRITICAL RULES FOR AI AGENTS

### TDD Approach - Test-Driven Development

**Locked tests are DELIVERED features - they represent what the end user expects.**

The following test files are **LOCKED** and represent **delivered features**:

- ✅ `frontend/e2e/modules/banks.spec.ts` - **LOCKED** (Delivered feature)
- ✅ `frontend/e2e/modules/bank-accounts.spec.ts` - **LOCKED** (Delivered feature)

### The Golden Rule

> **If tests fail → Fix your IMPLEMENTATION**  
> **If tests fail → DO NOT modify locked tests**

**Any attempt to modify these files will be blocked by pre-commit hooks.**

### What Happens If You Try to Modify Locked Tests

1. **Pre-commit hook detects modification**
2. **Commit is blocked** with error message
3. **You must restore the original file** or ask user to unlock

### Error Message You'll See

```
❌ LOCKED TEST FILE MODIFIED: frontend/e2e/modules/banks.spec.ts
🔒 ENFORCEMENT: Locked test files cannot be modified
📋 REQUIRED: To modify this test, unlock it first:
   bash scripts/unlock-test.sh frontend/e2e/modules/banks.spec.ts
```

---

## What You CAN Do

### ✅ Allowed Actions

1. **Read locked tests**: You can read locked tests to understand scenarios
2. **Run locked tests**: You can execute tests to verify functionality
3. **Create new tests**: Add new test files or tests to unlocked files
4. **Modify helpers**: Update helper functions in `frontend/e2e/helpers/`
5. **Update documentation**: Modify documentation files
6. **Fix test infrastructure**: Update Playwright config, scripts, etc.

### ✅ Helper Functions (You CAN Modify)

Location: `frontend/e2e/helpers/bank-helpers.ts`

**When modifying helpers:**
- ✅ Ensure backward compatibility with existing tests
- ✅ Test changes with existing locked tests
- ✅ Update documentation if behavior changes
- ✅ Add new helpers for new test scenarios

**Example - Adding a new helper:**

```typescript
/**
 * Deletes a bank by name
 * @param page Playwright Page object
 * @param bankName Name of the bank to delete
 */
export async function deleteBank(page: Page, bankName: string): Promise<void> {
  await page.goto('/banks');
  await closeDialogs(page);
  
  // Find and click delete button for the bank
  // ... implementation
}
```

---

## What You CANNOT Do

### ❌ Prohibited Actions

1. **Modify locked tests**: Cannot change locked test files in any way
2. **Unlock tests**: Only user can unlock (requires confirmation)
3. **Bypass lock validation**: Pre-commit hooks will catch any modifications
4. **Remove lock files**: Cannot delete `.test-locks/` directory or files
5. **Modify lock scripts**: Cannot change `lock-test.sh` or `validate-test-locks.sh`

---

## Workflow for AI Agents

### Scenario 1: Tests Fail After Implementing New Feature

**You MUST:**

1. **DO NOT** modify the locked test file
2. **Fix your implementation** to make tests pass
3. **Re-run tests** until they pass
4. **Commit** only when tests pass

**Example workflow:**

```
Task: Add new field to form
→ Implement feature
→ Run tests: npm run test:e2e
→ Tests fail
→ Fix implementation (make field optional or ensure backward compatibility)
→ Run tests again
→ Tests pass ✅
→ Commit
```

**Example response if tests fail:**

```
⚠️ Tests are failing after implementing the new feature.

Following TDD approach:
• Locked tests are DELIVERED features
• I will fix my IMPLEMENTATION to make tests pass
• I will NOT modify the locked test files

Fixing implementation now...
```

### Scenario 2: User Asks to Modify a Locked Test

**You MUST:**

1. **Inform user** that the test is locked
2. **Explain** that you cannot modify it directly
3. **Provide instructions** for user to unlock:
   ```bash
   bash scripts/unlock-test.sh frontend/e2e/modules/banks.spec.ts
   ```
4. **Wait for user** to unlock the test
5. **Make changes** after unlock
6. **Remind user** to lock again after changes

**Example response:**

```
⚠️ The test file `frontend/e2e/modules/banks.spec.ts` is currently LOCKED.

Following TDD approach, locked tests are DELIVERED features and cannot be modified
without explicit user permission.

To proceed:

1. Unlock the test:
   bash scripts/unlock-test.sh frontend/e2e/modules/banks.spec.ts
   (Type 'UNLOCK' when prompted)

2. I'll make the changes after you unlock it

3. Lock it again after changes:
   bash scripts/lock-test.sh frontend/e2e/modules/banks.spec.ts

Alternatively, I can adjust my implementation to work with the existing test
if that's acceptable.
```

### Scenario 2: User Asks to Add a New Test

**You CAN:**

1. **Check if file is locked**: Read the file header for `LOCK STATUS: LOCKED`
2. **If unlocked**: Add the new test directly
3. **If locked**: Inform user and ask to unlock first

**Example:**

```typescript
// ✅ CORRECT: Adding to unlocked file
test('should edit an existing bank', async ({ page }) => {
  const bankName = await createBank(page, 'Test Bank');
  // ... test logic
});

// ❌ WRONG: Adding to locked file (will be blocked)
```

### Scenario 3: Helper Function Needs Update

**You CAN modify helpers:**

1. **Update helper function** in `frontend/e2e/helpers/bank-helpers.ts`
2. **Ensure compatibility** with existing tests
3. **Run tests** to verify nothing broke:
   ```bash
   npm run test:e2e
   ```
4. **Update documentation** if behavior changes

**Example:**

```typescript
// ✅ CORRECT: Updating helper function
export async function ensureBankExists(page: Page, defaultBankName?: string): Promise<string> {
  // Improved implementation
  // ... new logic
}
```

---

## Test File Structure

### Locked Test File Header

```typescript
/**
 * E2E test for Banks module
 * 
 * LOCK STATUS: LOCKED  ← This means DO NOT MODIFY
 * 
 * This file is protected and cannot be modified by AI agents.
 * Only the user can unlock and modify this file.
 */
```

### Unlocked Test File Header

```typescript
/**
 * E2E test for Transactions module
 * 
 * LOCK STATUS: UNLOCKED  ← This means you CAN modify
 * 
 * This file can be modified by AI agents.
 */
```

---

## Checking Lock Status

### Method 1: Read File Header

```bash
head -10 frontend/e2e/modules/banks.spec.ts
# Look for "LOCK STATUS: LOCKED" or "LOCK STATUS: UNLOCKED"
```

### Method 2: Check Lock File

```bash
ls -la .test-locks/e2e/modules/
# If .lock file exists, the test is locked
```

### Method 3: Read File Content

Read the first few lines of the test file - the lock status is in the header comment.

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Modifying Locked Test

```typescript
// ❌ WRONG: Trying to modify locked test
test('should create a bank', async ({ page }) => {
  // Adding new code to locked test
  await page.goto('/banks');
  // ... this will be blocked
});
```

**Result**: Pre-commit hook blocks commit

### ❌ Mistake 2: Unlocking Without User Permission

```bash
# ❌ WRONG: AI agent cannot unlock tests
bash scripts/unlock-test.sh frontend/e2e/modules/banks.spec.ts
```

**Result**: Script requires user confirmation (`UNLOCK`), which AI cannot provide

### ✅ Correct: Using Helpers

```typescript
// ✅ CORRECT: Using helper function
import { ensureBankExists } from '../helpers/bank-helpers';

test('should create account', async ({ page }) => {
  // Using helper - this is fine
  await ensureBankExists(page);
  // ... rest of test
});
```

---

## Best Practices

1. **Always check lock status** before modifying test files
2. **Use helper functions** instead of rewriting test logic
3. **Test your changes** with `npm run test:e2e` before committing
4. **Inform user** if locked tests need modification
5. **Document changes** to helper functions

---

## Summary

- 🔒 **Locked tests**: DELIVERED features - cannot modify (blocked by pre-commit hooks)
- ✅ **TDD Rule**: Tests fail → Fix implementation, NOT tests
- ✅ **Helpers**: Can modify - ensure backward compatibility
- ✅ **New tests**: Can create - check lock status first
- ⚠️ **Unlocking**: Only user can unlock - requires confirmation

**Remember**: 
- Locked tests are DELIVERED features - they define what "working" means
- Implementation must conform to tests, not the other way around
- If tests fail, fix your code to make tests pass

