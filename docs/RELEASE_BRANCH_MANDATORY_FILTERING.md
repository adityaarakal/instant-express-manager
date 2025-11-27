# Release Branch Mandatory Filtering Policy

## 🚨 CRITICAL REQUIREMENT

**When code is pushed to the release branch, ALL files NOT covered by locked E2E tests are AUTOMATICALLY REMOVED. This is MANDATORY and NON-NEGOTIABLE.**

## 🔒 Mandatory Enforcement

### Principle

**Only code covered by locked E2E tests is included in release branch. Everything else is MANDATORY REMOVED - not even a single file outside coverage is kept.**

### How It Works

1. **Coverage Analysis**: Locked E2E tests are analyzed to identify all code they touch
2. **File Identification**: All files in the repository are checked against coverage
3. **MANDATORY REMOVAL**: All files NOT in coverage are automatically removed
4. **Verification**: Scripts verify no unwanted files remain
5. **CI/CD Enforcement**: Release qualification is blocked if unwanted files exist

## 📋 Scripted Enforcement

### 1. Release Branch Manager (`scripts/manage-release-branch.sh`)

**Step 5: MANDATORY FILTERING**

```bash
# Automatically removes ALL files not covered by locked E2E tests
# NO EXCEPTIONS - not even a single file outside coverage is kept
```

**What it does:
- ✅ Analyzes locked E2E test coverage
- ✅ Identifies ALL covered files (pages, components, stores, utils, hooks, types)
- ✅ Identifies ALL test files for covered code
- ✅ **MANDATORY REMOVES** all files not in coverage list
- ✅ Uses `git rm` to remove files from repository
- ✅ Commits filtered code to release branch

### 2. Verification Script (`scripts/verify-release-branch-content.sh`)

**Purpose**: Verify no unwanted code exists

What it does:
- ✅ Checks all test files in repository
- ✅ Identifies test files NOT for covered code
- ✅ **BLOCKS release qualification** if unwanted files found
- ✅ Provides clear error messages

### 3. Release Qualification Check (`scripts/check-release-qualification.sh`)

**Step 6: Content Verification**

What it does:
- ✅ Runs verification script
- ✅ **BLOCKS release qualification** if unwanted code detected
- ✅ Ensures only E2E-covered code is included

## 🤖 CI/CD Enforcement

### GitHub Actions Workflow (`.github/workflows/release-branch.yml`)

**Job: `update-release`**

```yaml
- name: Update release branch
  run: npm run release:manage -- --force
```

What happens:
1. ✅ Runs `release:manage` with `--force` flag
2. ✅ **NO user confirmation** - automatic in CI/CD
3. ✅ **MANDATORY removes** all unwanted files
4. ✅ Pushes filtered code to release branch
5. ✅ **Cannot be bypassed** - automatic enforcement

## 📝 Documentation

### Documents That Enforce This Policy

1. **`docs/BRANCHING_AND_DEPLOYMENT_STRATEGY.md`**
   - States: "Code NOT covered by locked E2E tests is immaterial - **MANDATORY REMOVED**"
   - Clarifies: "Not even a single file outside E2E coverage is kept"

2. **`docs/RELEASE_BRANCH_CODE_INCLUSION.md`**
   - Lists what's included/excluded
   - Documents enforcement mechanisms
   - States: "Everything else is MANDATORY removed"

3. **`docs/RELEASE_BRANCH_MANDATORY_FILTERING.md`** (this document)
   - Complete policy documentation
   - Explains how enforcement works
   - Documents all mechanisms

## ✅ Verification Commands

Run these to verify enforcement:

```bash
# 1. Check what code is covered
bash scripts/analyze-locked-test-coverage.sh

# 2. Verify no unwanted code exists
bash scripts/verify-release-branch-content.sh

# 3. Check release qualification (includes Step 6 verification)
npm run release:check

# 4. Simulate release branch filtering (dry-run)
bash scripts/manage-release-branch.sh --dry-run
```

## 🚨 Important Notes

- **This is MANDATORY** - Cannot be bypassed
- **Automatic in CI/CD** - No user confirmation needed
- **No exceptions** - Not even a single file outside coverage
- **Scripted** - Automatic removal in `manage-release-branch.sh`
- **Documented** - Multiple documents enforce this policy
- **Verified** - Multiple scripts verify compliance
- **CI/CD Enforced** - GitHub Actions automatically filters

## 📊 Example

If repository has:
- 50 store files
- 30 utils files
- 20 hooks files
- 100+ test files

But locked E2E tests only cover:
- 2 stores (`useBanksStore`, `useBankAccountsStore`)
- 0 utils
- 1 hook (`useViewMode`)

Then release branch will contain:
- ✅ 2 store files + their tests
- ✅ 1 hook file + its test
- ✅ Pages/components they use
- ❌ **ALL other files are MANDATORY REMOVED**

## 🔍 Enforcement Guarantee

**This policy is enforced through**:
1. ✅ **Scripts**: Automatic removal in `manage-release-branch.sh`
2. ✅ **Documentation**: Multiple documents state this requirement
3. ✅ **Verification**: Scripts verify compliance
4. ✅ **CI/CD**: GitHub Actions automatically filters
5. ✅ **Release Qualification**: Blocks release if unwanted code found

**Result**: **IMPOSSIBLE** to include unwanted code in release branch - it's automatically removed.

