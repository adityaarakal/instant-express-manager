# Strict Local Enforcement - No Bypassing Allowed

## Overview

This repository implements **strict local enforcement** that makes it extremely difficult to bypass checks, even with `--no-verify`. While Git's design makes 100% prevention impossible, we've implemented multiple layers of protection.

## Installation

After cloning the repository, run:

```bash
npm install
npm run install-protection
```

This will:
1. ✅ Install Husky Git hooks
2. ✅ Set up Git wrapper that blocks `--no-verify`
3. ✅ Configure Git aliases that use the wrapper
4. ✅ Add shell configuration to intercept Git commands
5. ✅ Protect hooks from deletion via `.gitattributes`

## Protection Layers

### Layer 1: Git Wrapper Script (`scripts/git-wrapper.sh`)

**Blocks `--no-verify` at the Git command level**

The wrapper intercepts all Git commit commands and blocks `--no-verify`:
- ❌ `git commit --no-verify` → **BLOCKED**
- ❌ `git commit -n` → **BLOCKED**
- ✅ `git commit` → **ALLOWED** (hooks run normally)

### Layer 2: Git Aliases

**Redirects commit commands to use wrapper**

Configured via `install-git-protection.sh`:
- `git commit` → Uses wrapper (blocks `--no-verify`)
- `git c` → Uses wrapper (blocks `--no-verify`)
- `git amend` → Uses wrapper (blocks `--no-verify`)

### Layer 3: Shell Configuration

**Overrides `git` function when in repository**

Adds to `.bashrc` or `.zshrc`:
```bash
git() {
    if [[ "$(pwd)" == "/path/to/repo"* ]]; then
        bash scripts/git-wrapper.sh "$@"
    else
        command git "$@"
    }
}
```

This intercepts ALL Git commands in the repository directory.

### Layer 4: Pre-commit Hook

**Final validation and detection**

The `.husky/pre-commit` hook:
- ✅ Detects bypass attempts via environment variables
- ✅ Checks parent processes for `--no-verify` flags
- ✅ Verifies git-wrapper is active
- ✅ Runs ESLint, TypeScript, and build checks
- ✅ Blocks commit if any check fails

### Layer 5: .gitattributes Protection

**Prevents hook deletion/modification**

`.gitattributes` marks hooks as merge=ours:
- Prevents accidental deletion
- Prevents modifications via merge conflicts
- Ensures hooks persist across operations

## How It Works

### Normal Flow (✅ Allowed)

```
Developer runs: git commit -m "message"
    ↓
Shell function intercepts → git-wrapper.sh
    ↓
Wrapper checks for --no-verify (not found)
    ↓
Wrapper executes: git commit -m "message"
    ↓
Git calls pre-commit hook
    ↓
Hook runs all checks (ESLint, TypeScript, Build)
    ↓
If checks pass → Commit succeeds
If checks fail → Commit blocked
```

### Bypass Attempt (❌ Blocked)

```
Developer runs: git commit --no-verify -m "message"
    ↓
Shell function intercepts → git-wrapper.sh
    ↓
Wrapper detects --no-verify flag
    ↓
Wrapper BLOCKS command and exits with error
    ↓
Commit never happens
```

### Direct Git Bypass (⚠️ Possible but Detected)

If someone uses the full path to Git binary:
```bash
/usr/bin/git commit --no-verify -m "message"
```

This would bypass the wrapper, BUT:
1. ⚠️ Pre-commit hook still won't run (Git skips it)
2. ✅ Server-side checks (GitHub Actions) will block the PR
3. ✅ Branch protection rules will prevent merge
4. ✅ The bypassed commit will be visible in history

## Verification

Check if protection is active:

```bash
# Test wrapper
bash scripts/git-wrapper.sh commit --no-verify
# Should show: "CRITICAL ERROR: BYPASS ATTEMPT DETECTED"

# Check Git aliases
git config --get-regexp alias | grep commit
# Should show wrapper paths

# Check shell function
type git
# Should show function definition if active
```

## Limitations

### Known Limitations

1. **Direct Git Binary Path**: Using `/usr/bin/git` bypasses wrapper
   - **Mitigation**: Server-side checks will still block PRs
   - **Detection**: Commit will be visible in history

2. **Environment Variables**: Setting `GIT_DIR` or `GIT_WORK_TREE` can bypass
   - **Mitigation**: Hook checks for these
   - **Detection**: Hook will fail if detected

3. **Hook Deletion**: Deleting `.husky/pre-commit` bypasses hook
   - **Mitigation**: `.gitattributes` prevents via merge conflicts
   - **Detection**: Server-side checks will still block PRs

### Absolute Truth

**Client-side enforcement cannot be 100% foolproof.**

Even with all these protections, a determined developer could:
- Use full Git binary path
- Temporarily rename hooks
- Modify Git configuration

**BUT**: These bypasses will be caught by:
- ✅ **Server-side checks** (GitHub Actions - CANNOT be bypassed)
- ✅ **Branch protection rules** (GitHub - CANNOT be bypassed)
- ✅ **PR review process** (GitHub - requires approval)

## Enforcement Hierarchy

1. **Local Hooks** (Helpful, but can be bypassed)
   - Catches issues early
   - Developer convenience
   - Not 100% secure

2. **Git Wrapper** (Strong protection)
   - Blocks most bypass attempts
   - Makes bypassing difficult
   - Still can be circumvented

3. **Server-Side Checks** (True enforcement)
   - GitHub Actions workflows
   - **CANNOT be bypassed**
   - Blocks PR merges

4. **Branch Protection** (Ultimate protection)
   - Requires status checks
   - Requires PR approval
   - **CANNOT be bypassed**

## Best Practices

1. **Always use `git commit`** (not direct binary)
2. **Fix errors instead of bypassing**
3. **Run checks manually if needed**: `npm run lint`, `npm run build`
4. **Trust server-side checks** as the ultimate authority
5. **Never use `--no-verify`** - it violates policy

## Troubleshooting

**Issue**: Wrapper not blocking `--no-verify`
- **Solution**: Run `npm run install-protection` again
- **Solution**: Reload shell: `source ~/.bashrc` or `source ~/.zshrc`

**Issue**: Shell function not active
- **Solution**: Check shell config file (`~/.bashrc` or `~/.zshrc`)
- **Solution**: Restart terminal
- **Solution**: Manually add function if missing

**Issue**: Want to commit infrastructure-only changes
- **Solution**: Fix TypeScript errors first (use `@ts-ignore` if absolutely necessary)
- **Solution**: Remember server-side checks will still run on PR

## Summary

We've implemented **maximum local protection** against bypassing:
- ✅ Git wrapper blocks `--no-verify`
- ✅ Shell function intercepts Git commands
- ✅ Multiple detection layers in hooks
- ✅ `.gitattributes` protects hooks

But **true enforcement** comes from server-side:
- ✅ GitHub Actions (cannot be bypassed)
- ✅ Branch protection rules (cannot be bypassed)
- ✅ PR review process (requires approval)

**Local protection is strong, server-side protection is absolute.**

