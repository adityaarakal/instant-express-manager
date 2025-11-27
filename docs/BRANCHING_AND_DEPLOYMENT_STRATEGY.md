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
- ✅ **Only features with locked Playwright test flows**
- ✅ **UI/UX/API/utils/docs/etc** that are **covered by locked tests**
- ✅ **Only what locked tests cover** - nothing beyond test coverage
- ✅ **Standard global things** (if any) - but these must also have locked tests
- ✅ **Locked test files are the source of truth** - they define what goes into release

**Characteristics**:
- 🔒 **Test-driven** - only tested features included
- 🎯 **Focused** - only what's verified by locked tests
- 🛡️ **Protected** - strict criteria for inclusion
- 👥 **End users** - accessible to actual users
- 🚀 **Deploys to Prod URL** - production environment

**Workflow**:
1. Features are developed and tested on `main`
2. Playwright tests are written and **locked** for features
3. Only features with **locked test files** are considered for release
4. Release branch is created/updated from `main`
5. Only code covered by locked tests is included in release
6. Release branch deploys to Prod URL

---

## 🔒 Locked Tests as Source of Truth

### Core Principle

**Locked Playwright test files define what goes into the release branch.**

### How It Works

1. **Feature Development**:
   - Feature is developed on `main` branch
   - Playwright tests are written for the feature
   - Tests are verified and passing

2. **Test Locking**:
   - Once tests are finalized, they are **locked**:
     ```bash
     bash scripts/lock-test.sh frontend/e2e/modules/feature-name.spec.ts
     ```
   - Locked tests represent **delivered features**
   - Locked tests cannot be modified without explicit user permission

3. **Release Inclusion**:
   - Only features with **locked test files** are eligible for release
   - All code related to locked tests (UI, API, utils, docs) is included
   - Nothing beyond what locked tests cover is included

### Example

**Scenario**: Bank creation feature

1. Feature developed on `main` → `banks.spec.ts` test created
2. Test verified and locked → `banks.spec.ts` is now LOCKED
3. Release branch includes:
   - ✅ `banks.spec.ts` (locked test)
   - ✅ Bank creation UI components
   - ✅ Bank API/state management
   - ✅ Bank-related utilities
   - ✅ Bank documentation
   - ❌ **NOT** any unrelated features or untested code

---

## 📋 Release Process

### Step-by-Step Release Workflow

1. **Verify Locked Tests**:
   ```bash
   npm run test:validate-locks
   ```
   - Ensure all locked tests are present and valid
   - Verify tests are passing

2. **Create/Update Release Branch**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b release  # or git checkout release if exists
   git merge main
   ```

3. **Filter Release Content**:
   - Review locked test files
   - Include only code covered by locked tests
   - Remove any code not covered by locked tests
   - Ensure standard global things (if any) have locked tests

4. **Verify Release**:
   ```bash
   npm run test:e2e  # Run all tests including locked ones
   npm run test:tdd  # Verify TDD compliance
   ```

5. **Deploy to Production**:
   - Push release branch
   - Deploy to Prod URL
   - Monitor for issues

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
- ✅ **All locked tests pass**
- ✅ **No untested code** beyond locked test coverage
- ✅ **Standard global things** (if any) have locked tests
- ✅ **Production-ready** - no debug code or development artifacts

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
- **Locked test** = **Release inclusion**
- Tests define what's **delivered** to users
- Tests ensure **quality** and **functionality**

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
2. ✅ Verify all locked tests pass
3. ✅ Review code coverage of locked tests
4. ✅ Remove untested code
5. ✅ Ensure production readiness

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
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Release Branch                            │
│                   (Production/Prod URL)                     │
│  • Only locked test features                                │
│  • Only code covered by tests                              │
│  • Production-ready                                         │
│  • End user accessible                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 Important Notes

### ⚠️ Critical Rules

1. **Never merge untested code to release branch**
2. **Locked tests are mandatory for release inclusion**
3. **Main branch contains everything; release contains only tested features**
4. **Release branch is production-ready; main branch is development status**

### 📋 Checklist for Release

- [ ] All features have locked Playwright tests
- [ ] All locked tests are passing
- [ ] Code coverage matches locked tests
- [ ] No untested code in release branch
- [ ] Standard global things (if any) have locked tests
- [ ] Production-ready (no debug code)
- [ ] Documentation updated
- [ ] Deployment configuration verified

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

