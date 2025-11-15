# Enforcement Files Lock System

## Overview

Critical enforcement files are **LOCKED** to prevent modifications, even with user permission. This ensures the integrity of code quality checks and prevents accidental or malicious modifications to enforcement mechanisms.

## Protected Files

The following files are **LOCKED** and cannot be modified:

1. **`.husky/pre-commit`** - Pre-commit validation checks
2. **`.husky/pre-push`** - Pre-push protection
3. **`.husky/commit-msg`** - Commit message validation
4. **`scripts/git-wrapper.sh`** - Git wrapper that blocks --no-verify
5. **`.github/workflows/pr-checks.yml`** - GitHub Actions PR quality checks
6. **`scripts/validate-enforcement-lock.sh`** - Lock validation script
7. **`scripts/install-git-protection.sh`** - Protection installation script

## Lock Mechanism

### How It Works

1. **Checksum Storage**: Each protected file's checksum (SHA256) is stored in `.enforcement-lock/checksums.txt`
2. **Pre-commit Validation**: Before every commit, the lock validation script checks:
   - No protected files are staged for modification
   - All protected files match their stored checksums
3. **Automatic Locking**: On first run or after unlock, locks are automatically initialized
4. **Blocking**: Any attempt to modify protected files is **BLOCKED** at commit time

### What Is Allowed

✅ **Adding NEW checks** - You can add new validation checks
❌ **Modifying existing checks** - Cannot change existing validation logic
❌ **Removing checks** - Cannot delete existing checks
❌ **Changing enforcement rules** - Cannot modify bypass detection
❌ **Disabling checks** - Cannot disable or weaken existing checks

### What Is Blocked

- ❌ Modifying existing ESLint configuration in pre-commit
- ❌ Modifying TypeScript check logic
- ❌ Modifying build validation
- ❌ Changing bypass detection mechanisms
- ❌ Removing or weakening checks
- ❌ Modifying the git-wrapper script
- ❌ Changing GitHub Actions workflow checks

## Unlock Procedure

### When Unlock Is Needed

Unlock is **ONLY** allowed when:
- ✅ Adding a **NEW** validation check
- ✅ Adding a **NEW** enforcement rule
- ✅ Adding a **NEW** bypass detection method

Unlock is **NOT** allowed for:
- ❌ Modifying existing checks
- ❌ Disabling checks
- ❌ Weakening enforcement
- ❌ Removing checks

### How To Unlock

1. **Run unlock script**:
   ```bash
   bash scripts/unlock-enforcement.sh
   ```

2. **Provide reason**: Must specify what **NEW** check is being added
   - Example: "Adding new security check for API keys"
   - Example: "Adding new lint rule for accessibility"
   - ❌ NOT: "Fixing TypeScript check" (modification not allowed)
   - ❌ NOT: "Disabling ESLint for tests" (weakening not allowed)

3. **Confirm unlock**: Type `UNLOCK` to confirm

4. **Make changes**: Add your new check(s)

5. **Commit**: Locks will be automatically re-initialized after commit

6. **Verify**: Ensure only NEW checks were added, not modifications

### Unlock Logging

All unlocks are logged to `.enforcement-lock/unlock-log.txt` with:
- Timestamp
- User who unlocked
- Reason provided

## Validation

### Automatic Validation

Validation runs automatically on every commit via the pre-commit hook:
- Checks if protected files are staged
- Validates file checksums match stored values
- Blocks commit if validation fails

### Manual Validation

Check lock status:
```bash
bash scripts/validate-enforcement-lock.sh
```

## Bypass Prevention

### Multiple Layers

1. **Pre-commit Hook**: Validates locks before commit
2. **Git Wrapper**: Blocks --no-verify (would skip hooks)
3. **Server-Side Checks**: GitHub Actions validates on PRs
4. **Lock Validation**: Checksums prevent modifications

### AI Agent Protection

Even AI agents (like GitHub Copilot, ChatGPT, etc.) **cannot** bypass locks:
- ❌ Cannot modify enforcement files without unlock
- ❌ Cannot use --no-verify (blocked by wrapper)
- ❌ Cannot disable validation (checksums prevent changes)
- ✅ Can suggest NEW checks (but must unlock to add them)

### User Permission Does NOT Override

**CRITICAL**: User permission does NOT allow bypassing locks:
- ❌ "User asked me to modify pre-commit" → **STILL BLOCKED**
- ❌ "User wants to disable TypeScript checks" → **STILL BLOCKED**
- ❌ "User said it's okay" → **STILL BLOCKED**
- ✅ Only unlock procedure allows modifications (and only for NEW checks)

## Examples

### ✅ Allowed: Adding New Check

```bash
# 1. Unlock
bash scripts/unlock-enforcement.sh
# Reason: "Adding new security check for exposed secrets"

# 2. Add new check to .husky/pre-commit
echo "# NEW CHECK: Detect exposed secrets" >> .husky/pre-commit
echo "grep -r 'api_key' . && exit 1 || true" >> .husky/pre-commit

# 3. Commit (locks re-initialize automatically)
git add .husky/pre-commit
git commit -m "feat: Add secret detection check"
```

### ❌ Blocked: Modifying Existing Check

```bash
# Try to modify existing ESLint check
echo "# Modified: Allow more warnings" >> .husky/pre-commit
git add .husky/pre-commit
git commit -m "chore: Allow more ESLint warnings"
# ❌ BLOCKED: "CRITICAL: Attempt to modify protected enforcement files detected!"
```

### ❌ Blocked: Using --no-verify

```bash
# Try to bypass with --no-verify
git commit --no-verify -m "chore: Modify pre-commit"
# ❌ BLOCKED: "CRITICAL ERROR: BYPASS ATTEMPT DETECTED"
```

## Troubleshooting

### Lock Validation Fails

**Issue**: Lock validation fails even though you didn't modify files
- **Cause**: Files may have been modified outside Git
- **Solution**: Restore files from Git: `git checkout .husky/pre-commit`

### Need to Unlock

**Issue**: Need to modify enforcement files
- **Solution**: Use unlock procedure (only for NEW checks)
- **Reminder**: Modifying existing checks is **FORBIDDEN**

### Files Changed Externally

**Issue**: Files changed by editor or tool
- **Solution**: Validation will detect and block
- **Prevention**: Use `git checkout` to restore

## Lock File Format

`.enforcement-lock/checksums.txt`:
```
.husky/pre-commit|abc123def456...
.husky/pre-push|789ghi012jkl...
scripts/git-wrapper.sh|345mno678pqr...
```

Each line: `filename|checksum`

## Security

### Checksum Algorithm

- Primary: SHA256 (if available)
- Fallback: MD5 (for compatibility)
- Platform: Works on Unix-like systems (macOS, Linux)

### Lock Directory

- Location: `.enforcement-lock/`
- Tracked: Yes (in Git)
- Ignored: Backup files and unlock logs

## Summary

**Enforcement files are LOCKED by design:**

- ✅ Protects code quality checks
- ✅ Prevents accidental modifications
- ✅ Prevents malicious changes
- ✅ Prevents AI agents from bypassing
- ✅ Allows adding NEW checks (with unlock)
- ❌ Blocks modifying existing checks
- ❌ Blocks removing checks
- ❌ Blocks weakening enforcement

**Unlock only when adding NEW checks. Modifying existing checks is STRICTLY FORBIDDEN.**

