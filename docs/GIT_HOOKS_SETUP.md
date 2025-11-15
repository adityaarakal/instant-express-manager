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
2. **Type Checking**: TypeScript compilation check
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

## Configuration

Hooks are configured in:
- `.husky/pre-commit` - Pre-commit validation
- `.husky/pre-push` - Pre-push protection
- `.husky/commit-msg` - Commit message validation

**DO NOT** modify these hooks to bypass protections - they are enforced to ensure code quality.

