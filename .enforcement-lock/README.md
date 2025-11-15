# Enforcement Lock Directory

This directory contains the lock files that protect enforcement scripts.

## Files

- **`checksums.txt`** - SHA256 checksums of all protected enforcement files
- **`unlock-log.txt`** - Log of all unlock operations (who, when, why)

## Purpose

These files ensure that enforcement scripts cannot be modified accidentally or maliciously. Any modification to protected files will be detected and blocked by the pre-commit hook.

## Regeneration

Locks are automatically:
- **Initialized**: On first run of `validate-enforcement-lock.sh`
- **Regenerated**: After unlock and commit (automatic)
- **Validated**: On every commit (automatic)

## Manual Operations

**Do NOT manually edit these files** unless you understand the lock system.

If you need to unlock:
- Use `scripts/unlock-enforcement.sh` (requires approval)
- See `docs/ENFORCEMENT_LOCK.md` for details

