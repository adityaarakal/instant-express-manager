# Release Branch Usage Guide

## 🎯 Overview

This guide explains how to use the release branch management system to ensure only tested, production-ready features reach the release branch.

## 📋 Prerequisites

Before using the release branch system, ensure:

1. ✅ Features have locked Playwright tests
2. ✅ Utils have 100% unit test coverage
3. ✅ Services/hooks have 100% test coverage (unit OR E2E)
4. ✅ All tests are passing

## 🚀 Quick Start

### Check Release Qualification

Check if your code meets release criteria:

```bash
npm run release:check
```

This will verify:
- Locked tests exist and are valid
- Locked tests are passing
- Unit tests are passing
- Coverage thresholds are met

### Check Test Coverage

Verify test coverage meets thresholds:

```bash
npm run release:coverage
```

This will:
- Run unit tests with coverage
- Check utils have 100% coverage
- Check services/hooks have 100% coverage
- Report any gaps

### Generate Coverage Map

Map locked tests to source code files:

```bash
npm run release:map
```

This generates `.release-coverage/locked-tests-coverage.json` mapping:
- Locked tests → Covered source files
- Categorizes files (components, utils, stores, hooks, etc.)

### Manage Release Branch

Create or update the release branch:

```bash
npm run release:manage
```

**Dry-run mode** (see what would happen without making changes):
```bash
npm run release:manage -- --dry-run
```

**Force mode** (skip confirmation prompts):
```bash
npm run release:manage -- --force
```

This will:
1. Check release qualification
2. Generate coverage map
3. Create/update release branch from main
4. Filter code to only include files covered by locked tests
5. Commit filtered changes

### Protect Release Branch

Validate release branch state (useful before merging):

```bash
npm run release:protect
```

This verifies:
- Locked tests are valid
- Release qualification criteria met
- Coverage thresholds met
- All tests passing

## 📖 Detailed Workflow

### Step 1: Develop Feature on Main Branch

1. Create feature branch from `main`
2. Develop feature
3. Write Playwright tests
4. Write unit tests for utils (100% coverage required)
5. Write tests for services/hooks (100% coverage required)
6. Ensure all tests pass
7. Merge to `main`

### Step 2: Lock Tests

Once tests are finalized and passing, lock them:

```bash
npm run test:lock frontend/e2e/modules/your-feature.spec.ts
```

### Step 3: Verify Release Qualification

Check if feature qualifies for release:

```bash
npm run release:check
```

If qualification fails, address the issues:
- Add missing tests
- Fix failing tests
- Improve coverage

### Step 4: Update Release Branch

Once qualified, update release branch:

```bash
npm run release:manage
```

This will:
- Create release branch if it doesn't exist
- Update release branch with filtered code
- Only include code covered by locked tests

### Step 5: Deploy Release Branch

Push release branch to remote:

```bash
git push origin release
```

The release branch will deploy to production (configure your CI/CD accordingly).

## 🔒 Protection Mechanisms

### Automatic Protection

The GitHub Actions workflow automatically:
- ✅ Checks release qualification on push to `main`
- ✅ Blocks PRs to release branch if criteria not met
- ✅ Updates release branch when criteria met (optional)

### Manual Protection

Before merging to release branch, run:

```bash
npm run release:protect
```

This ensures all criteria are met before merge.

## 🛠️ Troubleshooting

### "No locked tests found"

**Solution**: Lock your Playwright tests first:
```bash
npm run test:lock frontend/e2e/modules/your-feature.spec.ts
```

### "Locked tests are failing"

**Solution**: Fix your implementation to make tests pass. **DO NOT** modify locked tests.

### "Coverage thresholds not met"

**Solution**: 
- Add unit tests for utils (100% coverage required)
- Add tests for services/hooks (100% coverage required, unit OR E2E)

### "Release branch update failed"

**Solution**:
1. Ensure you're not on main branch (script will warn you)
2. Ensure all changes are committed
3. Check git status for conflicts
4. Try dry-run mode first: `npm run release:manage -- --dry-run`

## 📝 Best Practices

1. **Lock tests early**: Lock tests as soon as they're finalized
2. **Maintain coverage**: Keep 100% coverage for utils, services, hooks
3. **Test before release**: Always run `npm run release:check` before updating release branch
4. **Use dry-run**: Test changes with `--dry-run` before applying
5. **Review coverage map**: Check `.release-coverage/locked-tests-coverage.json` to see what's included

## 🚨 Important Notes

- ⚠️ **Main branch is never modified** by release branch scripts
- ⚠️ **Release branch is read-only** for manual edits (use main branch for development)
- ⚠️ **Locked tests cannot be modified** without explicit unlock
- ⚠️ **Coverage thresholds are strict** (100% for utils, services, hooks)

## 📚 Related Documentation

- [Branching and Deployment Strategy](BRANCHING_AND_DEPLOYMENT_STRATEGY.md) - Overall strategy
- [Release Branch Implementation Plan](RELEASE_BRANCH_IMPLEMENTATION_PLAN.md) - Technical details
- [TDD Approach](TDD_APPROACH.md) - Test-driven development principles
- [Lock Policy](LOCK_POLICY.md) - File locking mechanism

---

**Last Updated**: 2024-12-19  
**Status**: Active

