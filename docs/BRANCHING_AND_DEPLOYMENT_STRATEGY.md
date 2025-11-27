<!--
LOCK STATUS: LOCKED

This file is protected and cannot be modified by AI agents.
Only the user can unlock and modify this file.

To unlock: bash scripts/unlock-doc.sh docs/BRANCHING_AND_DEPLOYMENT_STRATEGY.md
-->



# Branching and Deployment Strategy

## 🎯 Overview

This document outlines the branching strategy and deployment workflow for the Instant Express Manager application. The strategy ensures that only **tested and verified features** reach production, while maintaining a comprehensive development environment for ongoing work.

---

## 🌿 Branch Structure

### Main Branch (`main`) - UAT/Development Branch

**Purpose**: Development and User Acceptance Testing (UAT) environment

**Deployment**: Dev URL (development environment)

**What Goes Into Main**:
- ✅ **All development work** - features, fixes, updates, experiments
- ✅ **Code with or without bugs** - real development status
- ✅ **Everything after comprehensive checks** - all pre-commit validations pass
- ✅ **Complete development state** - represents current development status
- ✅ **All features** - regardless of test coverage or completion status

**Characteristics**:
- 🔄 **Active development** - continuous integration of new features
- 🧪 **Testing ground** - where features are developed and tested
- 📝 **Comprehensive checks** - all pre-commit hooks and validations must pass
- 👥 **Personal/Close associates** - managed by you and your close associates
- 🚀 **Deploys to Dev URL** - accessible for internal testing and UAT

**Workflow**:
1. Feature branches are created from `main`
2. Development work happens on feature branches
3. After comprehensive checks pass, features merge to `main`
4. `main` automatically deploys to Dev URL
5. UAT testing happens on Dev URL

---

### Release Branch (`release`) - Production Branch

**Purpose**: Production-ready, user-facing application

**Deployment**: Prod URL (production environment)

**What Goes Into Release**:
- ✅ **Only features with locked Playwright E2E test flows** - flows must be tested and passing
- ✅ **UI/UX/storage code** that is **covered by locked E2E tests** (analyzed automatically)
- ✅ **All dependencies** of covered code (recursively analyzed)
- ✅ **Test files** for covered code
- ✅ **Utils covered by locked E2E tests** - must have 100% coverage and passing
- ✅ **Stores/hooks covered by locked E2E tests** - covered by unit tests OR E2E tests (100% coverage, passing)
- ✅ **Only what locked E2E tests cover** - nothing beyond E2E test coverage
- ✅ **Locked E2E test files are the source of truth** - they define what goes into release
- ✅ **Code NOT covered by locked E2E tests is immaterial** - **MANDATORY REMOVED**, not included
- 🚨 **MANDATORY FILTERING**: All files not covered by locked E2E tests are **AUTOMATICALLY REMOVED** when pushing to release branch
- 🚨 **NO EXCEPTIONS**: Not even a single file outside E2E coverage is kept in release branch

**Release Qualification Criteria**:
- ✅ **Playwright locked E2E tests** - flows tested and passing
- ✅ **Code coverage analysis** - locked E2E tests analyzed to identify covered code
- ✅ **Unit tests for utils covered by locked E2E tests** - 100% coverage and passing (MANDATORY - cannot bypass)
- ✅ **Unit tests OR E2E tests for stores/hooks covered by locked E2E tests** - 100% coverage and passing (MANDATORY - cannot bypass)
- ✅ **Tests passing for covered code** - no failures allowed for E2E-covered code (MANDATORY - cannot bypass)
- ✅ **100% coverage threshold** - must meet coverage requirements for covered code only
- ✅ **Code NOT covered by locked E2E tests** - immaterial, no test requirements
- ❌ **Unit tests are NEVER bypassed** - missing or failing tests for covered code block release qualification

**Characteristics**:
- 🔒 **Test-driven** - only tested features included
- 🎯 **Focused** - only what's verified by locked tests
- 🛡️ **Protected** - strict criteria for inclusion
- ✅ **100% test coverage** - utils, services, hooks fully tested
- 👥 **End users** - accessible to actual users
- 🚀 **Deploys to Prod URL** - production environment
- 🤖 **Automatic deployment** - features deploy automatically when criteria met

**Workflow**:
1. Features are developed and tested on `main`
2. Playwright tests are written and **locked** for features
3. Unit tests are written for utils (100% coverage required)
4. Services and hooks are tested (unit tests OR E2E tests, 100% coverage required)
5. All tests must pass and meet coverage thresholds
6. **Automatic deployment**: If feature has locked tests and everything passes → automatically deployed to release
7. Release branch is created/updated from `main`
8. Only code covered by locked tests is included in release
9. Release branch deploys to Prod URL

---

## 🔒 Locked Tests as Source of Truth

### Core Principle

**Locked Playwright test files define what goes into the release branch.**

### Release Qualification Requirements

For a feature to qualify for release, it must meet **ALL** of the following criteria:

1. **Playwright Locked E2E Tests**:
   - ✅ Feature has locked Playwright E2E test files
   - ✅ All locked E2E tests are **passing**
   - ✅ Flows are **tested and working**

2. **Coverage Analysis**:
   - ✅ Locked E2E tests are analyzed to identify all code they touch
   - ✅ Code coverage map is generated (pages, components, stores, utils, hooks, types)
   - ✅ Only code covered by locked E2E tests is considered

3. **Unit Tests for Covered Utils** (MANDATORY - Cannot Bypass):
   - ✅ Utils covered by locked E2E tests **MUST have unit test files**
   - ✅ **100% code coverage** for covered utils
   - ✅ All unit tests for covered utils are **passing**
   - ❌ **Cannot bypass**: Missing or failing unit tests block release qualification

4. **Tests for Covered Stores/Hooks** (MANDATORY - Cannot Bypass):
   - ✅ Stores/hooks covered by locked E2E tests **MUST have unit tests OR E2E coverage**
   - ✅ **100% code coverage** required for covered stores/hooks
   - ✅ All tests for covered stores/hooks are **passing**
   - ❌ **Cannot bypass**: Missing or failing unit tests block release qualification

5. **Code NOT Covered by Locked E2E Tests**:
   - ✅ **Immaterial** - not included in release branch
   - ✅ **No test requirements** - failures are non-blocking
   - ✅ **Not checked** - only E2E-covered code matters

### How It Works

1. **Feature Development**:
   - Feature is developed on `main` branch
   - Playwright E2E tests are written for the feature
   - E2E tests exercise the complete UI/UX flow
   - All tests are verified and passing

2. **Test Locking**:
   - Once E2E tests are finalized and passing, they are **locked**:
     ```bash
     bash scripts/lock-test.sh frontend/e2e/modules/feature-name.spec.ts
     ```
   - Locked tests represent **delivered features**
   - Locked tests cannot be modified without explicit user permission

3. **Coverage Analysis**:
   - Locked E2E tests are analyzed to identify all code they touch:
     - Pages (routes)
     - Components (UI)
     - Stores (state management)
     - Utils (utilities)
     - Hooks (React hooks)
     - Types (TypeScript types)
   - Only code covered by locked E2E tests is considered for release
   - Other code is immaterial and not included in release branch

4. **Test Requirements for Covered Code**:
   - **Utils covered by locked E2E tests**: Must have 100% unit test coverage and passing
   - **Stores/hooks covered by locked E2E tests**: Must have unit tests OR be covered by E2E tests (100% coverage, passing)
   - **Code NOT covered by locked E2E tests**: No test requirements (immaterial for release)

5. **Automatic Release Deployment**:
   - ✅ Feature has locked E2E tests
   - ✅ All locked E2E tests are passing
   - ✅ Code covered by locked E2E tests has required test coverage and passing
   - ✅ **→ Automatically deployed to release branch**

6. **Release Inclusion**:
   - Only code covered by locked E2E tests is included in release branch
   - All dependencies of covered code are included (recursive dependency analysis)
   - Test files for covered code are included
   - Nothing beyond what locked E2E tests cover is included

### Example

**Scenario**: Bank creation feature

1. Feature developed on `main` → `banks.spec.ts` test created
2. Utils unit tests written → `bank-utils.test.ts` (100% coverage, passing)
3. Services/hooks tested → Covered by E2E tests (100% coverage, passing)
4. All tests verified and passing
5. Test verified and locked → `banks.spec.ts` is now LOCKED
6. **Automatic deployment**: All criteria met → automatically deployed to release
7. Release branch includes:
   - ✅ `banks.spec.ts` (locked test, passing)
   - ✅ Bank creation UI components
   - ✅ Bank API/state management
   - ✅ Bank-related utilities (100% unit test coverage)
   - ✅ Bank services/hooks (100% test coverage)
   - ✅ Bank documentation
   - ❌ **NOT** any unrelated features or untested code

---

## 📋 Release Process

### Automatic Release Deployment

**When a feature qualifies for release** (meets all criteria):
- ✅ Feature has locked Playwright tests
- ✅ All locked tests are passing
- ✅ Utils have 100% unit test coverage and passing
- ✅ Services/hooks have 100% test coverage and passing
- ✅ **→ Automatically deployed to release branch**

### Step-by-Step Release Workflow

1. **Verify Locked Tests**:
   ```bash
   npm run test:validate-locks
   ```
   - Ensure all locked tests are present and valid
   - Verify tests are passing

2. **Verify Test Coverage**:
   ```bash
   npm run test  # Run unit tests
   npm run test:e2e  # Run E2E tests
   ```
   - Ensure utils have 100% unit test coverage
   - Ensure services/hooks have 100% test coverage (unit OR E2E)
   - Verify all tests are passing

3. **Automatic Release Deployment**:
   - If all criteria met → **automatically deployed to release**
   - Release branch is created/updated from `main`
   - Only code meeting criteria is included

4. **Filter Release Content**:
   - Review locked test files
   - Include only code covered by locked tests
   - Ensure utils have 100% unit test coverage
   - Ensure services/hooks have 100% test coverage
   - Remove any code not covered by locked tests
   - Ensure standard global things (if any) have locked tests

5. **Verify Release**:
   ```bash
   npm run test:e2e  # Run all tests including locked ones
   npm run test:tdd  # Verify TDD compliance
   npm run test  # Verify unit test coverage
   ```

6. **Deploy to Production**:
   - Push release branch
   - Deploy to Prod URL
   - Monitor for issues

### Blocking Mechanism

**⚠️ CRITICAL: After a feature is successfully deployed to release:**

#### Scenario: Feature Deployed, Then Tests Fail During Development

**What Happens:**

1. **Feature Successfully Deployed**:
   - Feature meets all criteria (locked tests passing, 100% coverage)
   - Feature is automatically deployed to release branch
   - Feature is available to end users on Prod URL

2. **During Continued Development**:
   - Development continues on `main` branch
   - Changes are made to the feature
   - **If locked tests start failing** for this feature:
     - ❌ **BLOCK merging new code to release**
     - ❌ **BLOCK deploying new changes** to release
     - ✅ **Previously deployed feature REMAINS available** on release branch
     - ✅ **Only new changes** need to pass locked tests before progressing to release

3. **Key Principle**:
   - **Previously deployed feature stays on release** (as per earlier successful deployment)
   - **New changes are blocked** until locked tests pass again
   - **We simply block merging code to release** if locked tests fail
   - **Block applies to both**: already released features AND new features to be released

#### Release Merge Blocking Criteria

**Merge to release will be BLOCKED if:**

- ❌ **Locked tests are failing** (for already released OR new features)
- ❌ **Coverage threshold not met** (utils < 100%, services/hooks < 100%)
- ❌ **Tests not passing** (unit tests or E2E tests failing)
- ❌ **Any code doesn't meet release qualification criteria**

**Merge to release will be ALLOWED if:**

- ✅ **All locked tests passing** (Playwright tests tested and working)
- ✅ **Utils have 100% unit test coverage** and all passing
- ✅ **Services/hooks have 100% test coverage** (unit OR E2E) and all passing
- ✅ **Everything tested and working** - comprehensive coverage achieved
- ✅ **Coverage thresholds met** - 100% coverage for all components

#### What Gets Blocked vs. What Remains Available

**What Gets Blocked**:
- ❌ New changes to already released features (if locked tests fail)
- ❌ New features to be released (if locked tests fail or coverage not met)
- ❌ Any code that doesn't meet release qualification criteria
- ❌ Merging code to release when locked tests fail

**What Remains Available**:
- ✅ Previously successfully deployed features remain on release branch
- ✅ Features that were deployed when tests were passing remain available
- ✅ End users continue to have access to previously deployed features
- ✅ Only new changes are blocked until they meet criteria

#### Example Scenario

**Timeline**:
1. **Day 1**: Bank feature deployed to release (all tests passing, 100% coverage)
2. **Day 5**: Development continues, changes made to bank feature
3. **Day 5**: Locked tests start failing due to new changes
4. **Result**:
   - ✅ Bank feature **remains available** on release branch (from Day 1 deployment)
   - ❌ **New changes blocked** from merging to release
   - ❌ **Cannot deploy new code** to release until tests pass
   - ✅ End users **still have access** to the bank feature (as deployed on Day 1)
   - ✅ Once tests pass again → new changes can merge to release

---

## 🚀 Future Deployment Plans

### Current State

- ✅ GitHub Pages deployment (to be removed)
- ✅ Public repository (to be made private)
- ✅ Development workflow established

### Planned Changes

1. **Repository Privacy**:
   - 🔒 Make repository **private**
   - 🔒 Restrict access to authorized personnel
   - 🔒 Protect source code and deployment configurations

2. **Domain Acquisition**:
   - 🌐 Purchase proper domain name
   - 🌐 Configure DNS settings
   - 🌐 Set up SSL certificates

3. **Deployment Infrastructure**:
   - 🏗️ **Dev URL**: Development environment
     - Deploys from `main` branch
     - Accessible for UAT and internal testing
   - 🏗️ **Prod URL**: Production environment
     - Deploys from `release` branch
     - Accessible to end users
   - 🏗️ Remove GitHub Pages deployment
   - 🏗️ Set up proper hosting infrastructure

4. **Execution Timeline**:
   - 📅 Plan deployment infrastructure
   - 📅 Execute domain and hosting setup
   - 📅 Configure CI/CD pipelines
   - 📅 Migrate from GitHub Pages

**Note**: These changes will be executed as time permits, with proper planning and coordination.

---

## 🔍 Quality Assurance

### Main Branch Checks

All code merged to `main` must pass:

- ✅ **Version bump validation**
- ✅ **Linting validation** (ESLint)
- ✅ **Type checking** (TypeScript)
- ✅ **Build validation**
- ✅ **Test lock validation**
- ✅ **E2E test suite** (all tests must pass)

### Release Branch Checks

Release branch must additionally ensure:

- ✅ **Only locked test features** are included
- ✅ **All locked tests pass** - Playwright tests tested and working
- ✅ **Utils have 100% unit test coverage** - all unit tests passing
- ✅ **Services/hooks have 100% test coverage** - unit OR E2E tests, all passing
- ✅ **Everything tested and working** - comprehensive test coverage
- ✅ **No untested code** beyond locked test coverage
- ✅ **Standard global things** (if any) have locked tests
- ✅ **Production-ready** - no debug code or development artifacts
- ✅ **Coverage thresholds met** - 100% coverage for utils, services, hooks

---

## 📊 Branch Comparison

| Aspect | Main Branch | Release Branch |
|--------|-------------|----------------|
| **Purpose** | Development/UAT | Production |
| **Deployment** | Dev URL | Prod URL |
| **Content** | All development work | Only locked test features |
| **Bugs** | May contain bugs | Bug-free (tested) |
| **Test Coverage** | Partial/Complete | Complete (locked tests) |
| **Access** | Internal/Close associates | End users |
| **Update Frequency** | Continuous | Planned releases |
| **Stability** | Development status | Production-ready |

---

## 🎯 Key Principles

### 1. Main Branch = Development Truth

- Contains **everything** that's been developed
- Represents **real development status**
- Includes **all features** regardless of completion
- Serves as **source** for release branch

### 2. Release Branch = Test-Driven Truth

- Contains **only** what's covered by locked tests
- Locked tests are the **source of truth**
- Nothing beyond test coverage is included
- Represents **delivered features** to end users

### 3. Locked Tests = Release Criteria

- **No locked test** = **No release inclusion**
- **Locked test + passing + coverage** = **Release inclusion**
- **Locked test + failing** = **Block release merge**
- Tests define what's **delivered** to users
- Tests ensure **quality** and **functionality**
- **100% coverage required** for utils, services, hooks
- **Automatic deployment** when all criteria met

### 4. Separation of Concerns

- **Main**: Development and experimentation
- **Release**: Production and user-facing
- **Clear boundaries** between environments
- **Controlled** release process

---

## 📝 Best Practices

### For Main Branch

1. ✅ Merge features after comprehensive checks pass
2. ✅ Keep development work up-to-date
3. ✅ Ensure all pre-commit validations pass
4. ✅ Document features and changes
5. ✅ Test features before merging

### For Release Branch

1. ✅ Only include features with locked tests
2. ✅ Verify all locked tests pass (Playwright tests tested and working)
3. ✅ Ensure utils have 100% unit test coverage and passing
4. ✅ Ensure services/hooks have 100% test coverage (unit OR E2E) and passing
5. ✅ Verify everything is tested and working
6. ✅ Review code coverage of locked tests
7. ✅ Remove untested code
8. ✅ Ensure production readiness
9. ✅ Block merge if locked tests fail (even for already released features)
10. ✅ Block merge if coverage thresholds not met

### For Test Locking

1. ✅ Lock tests only when feature is complete
2. ✅ Verify tests are comprehensive
3. ✅ Ensure tests cover all aspects
4. ✅ Document what tests cover
5. ✅ Keep tests updated with feature changes

---

## 🔄 Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Feature Development                       │
│                  (Feature Branch)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Comprehensive Checks Pass
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Main Branch                             │
│                    (UAT/Dev URL)                            │
│  • All development work                                     │
│  • With/without bugs                                        │
│  • Real development status                                  │
│  • Everything after checks                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Tests Written & Locked
                       │ Utils: 100% Unit Test Coverage ✓
                       │ Services/Hooks: 100% Test Coverage ✓
                       │ All Tests Passing ✓
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Release Qualification Check                      │
│  ✓ Locked Playwright tests passing                          │
│  ✓ Utils: 100% unit test coverage & passing                │
│  ✓ Services/Hooks: 100% test coverage & passing            │
│  ✓ Everything tested and working                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ All Criteria Met?
                       │ YES → Automatic Deployment
                       │ NO → Block Merge
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Release Branch                            │
│                   (Production/Prod URL)                     │
│  • Only locked test features                                │
│  • Only code covered by tests                              │
│  • 100% test coverage (utils, services, hooks)              │
│  • Production-ready                                         │
│  • End user accessible                                      │
│  • Automatic deployment when criteria met                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Release Merge Blocking                         │
│                                                              │
│  If locked tests fail during development:                   │
│  ❌ Block merge to release                                  │
│  ✅ Previously deployed feature remains available           │
│  ✅ Only new changes blocked until tests pass               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 Important Notes

### ⚠️ Critical Rules

1. **Never merge untested code to release branch**
2. **Locked tests are mandatory for release inclusion** - must be passing
3. **100% test coverage required** - utils, services, hooks must have 100% coverage
4. **Everything must be tested and working** - comprehensive test coverage required
5. **Automatic deployment** - features deploy automatically when all criteria met
6. **Block merge if tests fail** - even for already released features, block merge if locked tests fail
7. **Main branch contains everything; release contains only tested features**
8. **Release branch is production-ready; main branch is development status**

### 📋 Checklist for Release

- [ ] All features have locked Playwright tests
- [ ] All locked tests are **passing** (flows tested and working)
- [ ] Utils have **unit test files** with **100% coverage** and **passing**
- [ ] Services and hooks have **100% test coverage** (unit OR E2E) and **passing**
- [ ] **Everything tested and working** - comprehensive test coverage
- [ ] Code coverage matches locked tests
- [ ] **100% coverage threshold** met for all components
- [ ] No untested code in release branch
- [ ] Standard global things (if any) have locked tests
- [ ] Production-ready (no debug code)
- [ ] Documentation updated
- [ ] Deployment configuration verified

### 🚫 Release Merge Blocking Criteria

**Merge to release will be BLOCKED if:**

- ❌ **Locked tests are failing** (for already released or new features)
- ❌ **Coverage threshold not met** (utils < 100%, services/hooks < 100%)
- ❌ **Tests not passing** (unit tests or E2E tests failing)
- ❌ **Untested code** beyond locked test coverage

**Merge to release will be ALLOWED if:**

- ✅ **All locked tests passing** (Playwright tests tested and working)
- ✅ **Utils have 100% unit test coverage** and all passing
- ✅ **Services/hooks have 100% test coverage** (unit OR E2E) and all passing
- ✅ **Everything tested and working** - comprehensive coverage achieved
- ✅ **Coverage thresholds met** - 100% coverage for all components

**Note**: Previously successfully deployed features remain available on release branch. Only new changes are blocked until they meet all criteria.

---

## 📚 Related Documentation

- [TDD Approach](TDD_APPROACH.md) - Test-Driven Development principles
- [Lock Policy](LOCK_POLICY.md) - File locking mechanism
- [E2E Testing Guide](E2E_TESTING_GUIDE.md) - Playwright test suite
- [AI Agent TDD Rules](AI_AGENT_TDD_RULES.md) - Rules for AI agents

---

## 🔮 Future Enhancements

As the project evolves, we may consider:

- 🔄 Automated release branch creation from main
- 🔄 Automated filtering based on locked tests
- 🔄 Release branch validation scripts
- 🔄 Deployment automation
- 🔄 Rollback procedures
- 🔄 Release notes generation

---

**Last Updated**: 2024-11-27  
**Status**: Active Strategy  
**Owner**: Development Team

