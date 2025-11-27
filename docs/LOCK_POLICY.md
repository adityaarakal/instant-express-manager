# Lock Policy - Explicit User Permission Required

## 🔒 Core Principle

**Locked files remain locked unless the user explicitly unlocks them.**

## ⚠️ CRITICAL RULES

### For AI Agents

1. **You CANNOT unlock files** - only the user can unlock them
2. **You CANNOT run unlock scripts** - they require explicit user permission
3. **Locked files remain locked** - do not attempt to unlock them
4. **Wait for user permission** - if a file needs modification, inform the user and wait

### For Users

1. **Only you can unlock files** - AI agents cannot do this
2. **Unlocking requires explicit action** - you must run unlock scripts yourself
3. **Locked files are protected** - they represent delivered features
4. **Re-lock after changes** - always lock files again after modifications

## Lock Types

### Test File Locks

- **Location**: `.test-locks/` directory
- **Purpose**: Protect finalized test scenarios
- **Unlock script**: `bash scripts/unlock-test.sh <file-path>`
- **Lock script**: `bash scripts/lock-test.sh <file-path>`

### Enforcement File Locks

- **Location**: `.enforcement-lock/` directory
- **Purpose**: Protect enforcement mechanisms (pre-commit hooks, workflows)
- **Unlock script**: `bash scripts/unlock-enforcement.sh`
- **Auto-re-lock**: Locks are automatically re-initialized after commit

## Unlock Process

### Test Files

1. **User runs unlock script**:
   ```bash
   bash scripts/unlock-test.sh frontend/e2e/modules/banks.spec.ts
   ```

2. **User confirms** by typing 'UNLOCK'

3. **File is unlocked** - AI agents can now modify it

4. **After changes, user locks again**:
   ```bash
   bash scripts/lock-test.sh frontend/e2e/modules/banks.spec.ts
   ```

### Enforcement Files

1. **User runs unlock script**:
   ```bash
   bash scripts/unlock-enforcement.sh
   ```

2. **User provides reason** (must mention adding new checks)

3. **User confirms** by typing 'UNLOCK'

4. **Files are unlocked** - modifications can be made

5. **Locks auto-re-initialize** after commit

## What AI Agents Must Do

### When a Locked File Needs Modification

1. **Inform the user** that the file is locked
2. **Explain why** modification is needed
3. **WAIT for explicit user permission**
4. **Do NOT** attempt to unlock the file yourself
5. **Do NOT** suggest unlocking unless user explicitly asks

### Example Response

```
⚠️ The file `frontend/e2e/modules/banks.spec.ts` is LOCKED.

I cannot modify locked files - only you can unlock them.

If you want to modify this file, you would need to unlock it first:
1. Run: bash scripts/unlock-test.sh frontend/e2e/modules/banks.spec.ts
2. Type 'UNLOCK' when prompted
3. I'll make the changes after you unlock it
4. Lock it again: bash scripts/lock-test.sh frontend/e2e/modules/banks.spec.ts

Alternatively, I can adjust my implementation to work with the existing test
if that's acceptable (recommended approach).
```

## Summary

- 🔒 **Locked files remain locked** - no automatic unlocking
- 👤 **Only user can unlock** - AI agents cannot do this
- ⚠️ **Explicit permission required** - wait for user action
- 🔄 **Re-lock after changes** - always restore locks

**Remember**: Locked files are delivered features. They should remain locked unless explicitly unlocked by the user.

