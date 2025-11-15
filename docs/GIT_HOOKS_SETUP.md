# Git Hooks Setup - Pre-commit and Pre-push Protection

## Overview

This repository uses **Husky** to enforce strict code quality and branch protection rules. All protections are **non-bypassable**, even with user permissions.

## Protections in Place

### 1. Pre-commit Hook (`.husky/pre-commit`)

**Blocks Direct Commits to Main Branch**:
- ❌ Direct commits to `main` are **FORBIDDEN**
- ✅ Must use feature branches and PR workflow

**Blocks Bypass Attempts**:
- ❌ `--no-verify` flag is **ABSOLUTELY PROHIBITED**
- ❌ `HUSKY_SKIP_HOOKS=1` is **FORBIDDEN**
- ❌ `SKIP_HOOKS`, `SKIP_PRE_COMMIT`, `BYPASS_CHECKS` environment variables are **FORBIDDEN**
- ✅ Zero tolerance policy - **NO EXCEPTIONS**

**Validation Checks** (ALL must pass):
1. **Linting Validation**: ESLint on production code only (test files excluded)
   - Allows up to 3 warnings (for React Hook dependency warnings)
   - Blocks on errors in production code
   - Test file errors are acceptable and excluded
2. **Type Checking**: TypeScript compilation check (test files excluded)
   - Excludes `src/**/__tests__/**`, `src/**/*.test.ts`, `src/**/*.test.tsx`
   - Ensures production code is type-safe
   - Test file type errors are acceptable and excluded
3. **Build Validation**: Production build must succeed

### 2. Pre-push Hook (`.husky/pre-push`)

**Blocks Direct Pushes to Main Branch**:
- ❌ Direct pushes to `main` are **FORBIDDEN**
- ✅ Must use feature branches and PR workflow

### 3. Commit Message Hook (`.husky/commit-msg`)

**Detects Bypass Attempts in Commit Messages**:
- ❌ Blocks commit messages containing `--no-verify`, `skip hooks`, etc.
- ❌ Prevents attempts to document bypass methods in commit messages
- ✅ Zero tolerance policy - **NO EXCEPTIONS**

## Installation

Hooks are automatically installed when you run:
```bash
npm install
```

Or manually:
```bash
npm run prepare
```

## Verification

To verify hooks are installed correctly:
```bash
./scripts/verify-hooks.sh
```

## Required Workflow

**❌ FORBIDDEN**:
```bash
# Direct commit to main
git checkout main
git commit -m "some change"

# Bypassing hooks
git commit --no-verify -m "bypass"
HUSKY_SKIP_HOOKS=1 git commit -m "bypass"
```

**✅ REQUIRED**:
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ... edit files ...

# Commit (hooks will run automatically)
git add .
git commit -m "your message"

# Push feature branch
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

## Zero Tolerance Policy

All protections are **NON-BYPASSABLE**:
- ❌ User permission does NOT allow bypassing
- ❌ `--no-verify` is **ABSOLUTELY FORBIDDEN**
- ❌ Environment variables cannot disable hooks
- ❌ No exceptions, no workarounds

## Troubleshooting

**Issue**: Hook prevents commit
- **Solution**: Fix all linting/type/build errors before committing

**Issue**: Want to commit to main
- **Solution**: Use feature branch and create PR instead

**Issue**: Hook not running
- **Solution**: Run `npm run prepare` to reinstall hooks
- **Solution**: Check `.husky/pre-commit` exists and is executable

## GitHub Actions PR Workflow

**Additional Protection**: All PR checks are also enforced via GitHub Actions workflows.

The `.github/workflows/pr-checks.yml` workflow enforces the same quality checks on every pull request:

1. **ESLint Validation**: Same rules as pre-commit hook
   - Production code only (test files excluded)
   - Max 3 warnings allowed
2. **TypeScript Type Checking**: Compilation check
3. **Build Validation**: Production build must succeed

**Benefits**:
- ✅ Server-side enforcement (cannot be bypassed)
- ✅ PR status checks (required for merge)
- ✅ Comments on PR with check results
- ✅ Protection even if hooks are disabled locally
- ✅ Dependency caching for faster builds (uses root `package-lock.json`)

**Workflow Status**:
- Automatically runs on every PR to `main`
- Can be manually triggered via `workflow_dispatch`
- Blocks PR merge if any check fails
- Adds comments to PR with pass/fail status
- Uses npm dependency caching with root `package-lock.json` for performance

## Configuration

Hooks are configured in:
- `.husky/pre-commit` - Pre-commit validation (no deprecated Husky lines)
- `.husky/pre-push` - Pre-push protection (no deprecated Husky lines)
- `.husky/commit-msg` - Commit message validation (no deprecated Husky lines)

Workflows are configured in:
- `.github/workflows/pr-checks.yml` - PR quality checks

TypeScript configuration:
- `frontend/tsconfig.json` - Excludes test files from compilation
  - Excludes: `src/**/__tests__/**`, `src/**/*.test.ts`, `src/**/*.test.tsx`

**DO NOT** modify these hooks or workflows to bypass protections - they are enforced to ensure code quality.

**Note**: Deprecated Husky lines (`#!/usr/bin/env sh` and `. "$(dirname -- "$0")/_/husky.sh"`) have been removed from all hooks for Husky v10.0.0 compatibility.

## Enforcement Files Lock System

**CRITICAL**: All enforcement files are **LOCKED** and cannot be modified.

### Lock Protection

Enforcement files are protected by a checksum-based lock system that:
- ✅ **Blocks modifications** to existing checks
- ✅ **Prevents AI agents** from changing files (even with user permission)
- ✅ **Prevents users** from accidentally modifying checks
- ✅ **Allows adding NEW checks** via unlock procedure
- ❌ **Does NOT allow** modifying existing checks
- ❌ **Does NOT allow** removing checks
- ❌ **Does NOT allow** disabling checks

### Protected Files

- `.husky/pre-commit`, `.husky/pre-push`, `.husky/commit-msg`
- `scripts/git-wrapper.sh`
- `.github/workflows/pr-checks.yml`
- `scripts/validate-enforcement-lock.sh`, `scripts/install-git-protection.sh`

### Unlock Procedure

To add a **NEW** check (only allowed action):
```bash
npm run unlock-enforcement
# Follow prompts - must specify reason for NEW check
```

**Important**: Only additions of NEW checks are allowed. Modifying existing checks is **FORBIDDEN**, even with user permission.

See `docs/ENFORCEMENT_LOCK.md` for complete documentation.

## Important Limitations

### Client-Side Hooks Cannot Prevent Bypass

**Critical Limitation**: Client-side Git hooks cannot detect when they are being bypassed.

When you use `git commit --no-verify`, Git **completely skips calling the hooks**. The hooks never execute, so they cannot detect or prevent the bypass. This is a fundamental limitation of Git hooks.

**Real Protection**: Server-side enforcement via GitHub Actions workflows cannot be bypassed. The `.github/workflows/pr-checks.yml` workflow provides true enforcement that runs on every PR and blocks merges if checks fail.

For more details, see `docs/HOOK_LIMITATIONS.md`.

