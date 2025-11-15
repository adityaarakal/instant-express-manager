# Git Hook Limitations

## Critical Limitation: `--no-verify` Bypass

### The Problem

**Client-side Git hooks cannot detect when they are being bypassed.**

When you use `git commit --no-verify`, Git **completely skips calling the hooks**. The hooks never execute, so they cannot detect or prevent the bypass.

### Why This Happens

Git hooks are client-side scripts that Git calls at specific points:
- `pre-commit` hook runs **before** the commit
- `commit-msg` hook runs **before** the commit is finalized
- `pre-push` hook runs **before** the push

When you use `--no-verify`, Git is instructed to **skip all hooks entirely**. Since the hooks never run, they cannot:
- Detect the `--no-verify` flag
- Block the commit
- Enforce any protections

### This is a Fundamental Limitation

**All client-side hooks share this limitation:**
- ❌ Cannot prevent `--no-verify` bypass
- ❌ Cannot prevent hook deletion
- ❌ Cannot prevent hook modification
- ❌ Cannot prevent Git configuration changes

### Real Protection: Server-Side Enforcement

**The only true protection is server-side enforcement:**

1. **GitHub Actions Workflows** ✅ **IMPLEMENTED**
   - `.github/workflows/pr-checks.yml` enforces all checks
   - Runs automatically on every PR
   - Cannot be bypassed by users
   - **This is your real protection**

2. **Branch Protection Rules** ⚠️ **RECOMMENDED**
   - Require status checks to pass before merge
   - Blocks PR merge if checks fail
   - Configure in GitHub repository settings

3. **Pre-receive Hooks** ❌ **Not Available**
   - Would require a custom Git server
   - GitHub doesn't support custom pre-receive hooks

### Best Practices

1. **Never use `--no-verify`**
   - Fix errors instead of bypassing checks
   - If you must commit infrastructure-only changes, fix TypeScript errors first

2. **Rely on Server-Side Checks**
   - GitHub Actions workflows provide true enforcement
   - Local hooks are for developer convenience, not security

3. **Set Up Branch Protection**
   - Require PR reviews
   - Require status checks to pass
   - Prevent force pushes to `main`

4. **Trust but Verify**
   - Local hooks help catch issues early
   - Server-side checks ensure code quality
   - Never rely solely on client-side enforcement

### Current Implementation Status

✅ **GitHub Actions PR Workflow**: Implemented and active
- Enforces ESLint, TypeScript, and build checks
- Runs on every PR to `main`
- Cannot be bypassed

⚠️ **Branch Protection Rules**: Should be configured
- Go to GitHub repository Settings > Branches
- Add rule for `main` branch
- Require status check: "PR Quality Checks"

✅ **Local Hooks**: Implemented for developer convenience
- Helpful for catching issues early
- Cannot prevent intentional bypassing
- Should not be relied upon for security

### Conclusion

**Client-side hooks are helpful but not secure.**

The real enforcement comes from:
1. ✅ GitHub Actions workflows (implemented)
2. ⚠️ Branch protection rules (recommended)
3. ✅ PR review process (should be enforced)

Local hooks provide developer convenience, but server-side checks provide true protection.

