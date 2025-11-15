# Versioning Strategy

## Overview

Instant Express Manager uses **Semantic Versioning (SemVer)** for automated version management. Versions follow the format: `MAJOR.MINOR.PATCH` (e.g., `1.2.3`).

## Version Number Format

```
MAJOR.MINOR.PATCH
│     │     │
│     │     └─ Patch: Bug fixes, minor improvements, documentation
│     └─────── Minor: New features (backward compatible)
└───────────── Major: Breaking changes, major features, architectural changes
```

## Version Bump Rules

### MAJOR Version (1.0.0 → 2.0.0)

Bumped when:
- **Breaking Changes**: Changes that require users to modify their existing data or workflow
- **Data Format Changes**: Changes to IndexedDB schema that are not backward compatible
- **API Breaking Changes**: Changes to public APIs, store methods, or component props
- **Major Architecture Changes**: Significant refactoring affecting multiple systems
- **Migration Required**: Data migration scripts needed for existing users

**Examples:**
- Changing transaction data structure requiring migration
- Removing or significantly changing core features
- Changing storage format from one system to another
- Major UI/UX overhaul affecting user workflows

### MINOR Version (1.0.0 → 1.1.0)

Bumped when:
- **New Features**: Adding new functionality that doesn't break existing features
- **New Pages/Components**: Adding new pages, major components, or sections
- **Enhanced Functionality**: Significant improvements to existing features
- **New Transaction Types**: Adding new transaction categories or types
- **New Integrations**: Adding support for new features or integrations

**Examples:**
- Adding new page (e.g., Reports, Budget Planning)
- Adding new transaction type (e.g., Investments, Loans)
- Adding new export formats (e.g., PDF, Excel)
- Adding new chart types or analytics
- New settings or configuration options

### PATCH Version (1.0.0 → 1.0.1)

Bumped when:
- **Bug Fixes**: Fixing bugs in existing functionality
- **Small Improvements**: Minor enhancements that don't add new features
- **Documentation Updates**: Updating documentation (unless breaking)
- **UI/UX Tweaks**: Small UI improvements, styling updates
- **Performance Improvements**: Optimizations without feature changes
- **Code Quality**: Refactoring that doesn't change functionality
- **Dependency Updates**: Updating dependencies (unless they introduce breaking changes)

**Examples:**
- Fixing calculation errors
- Fixing UI rendering issues
- Improving error messages
- Optimizing queries or data processing
- Fixing typos or documentation errors

## Automatic Version Detection

The version bump workflow automatically determines the version bump type based on:

### 1. PR Labels
- `major` or `breaking` → MAJOR bump
- `feature` or `enhancement` → MINOR bump
- `bug` or `fix` → PATCH bump
- `documentation` or `docs` → PATCH bump

### 2. Commit Messages (Conventional Commits)
- `feat:` → MINOR bump
- `fix:` → PATCH bump
- `docs:` → PATCH bump
- `BREAKING CHANGE:` or `!` → MAJOR bump
- `refactor:` → PATCH bump (if no features added)
- `chore:` → PATCH bump (unless specified otherwise)

### 3. Merge Commit Analysis
- Analyzes all commits in the PR
- Uses the highest priority bump type found
- Falls back to MINOR if unsure (better to increment than miss)

## Version Files

Versions are stored in multiple locations for consistency:

1. **`package.json`** (root): Main project version
2. **`frontend/package.json`**: Frontend application version
3. **`VERSION.txt`**: Simple text file for quick access
4. **`CHANGELOG.md`**: Version history with change descriptions

## Workflow Process

### On Merge to Main

1. **Analyze PR**: Determine version bump type from labels/commits
2. **Bump Version**: Increment appropriate version number
3. **Update Files**: Update all version files synchronously
4. **Create Tag**: Create git tag `v{version}` (e.g., `v1.2.3`)
5. **Generate Changelog**: Update CHANGELOG.md with changes
6. **Commit Changes**: Commit version bump and changelog
7. **Push Tag**: Push version tag to remote

### Manual Version Control

To manually set a version (e.g., for hotfixes):

```bash
# Set specific version
npm run version:set 1.2.3

# Bump major
npm run version:major

# Bump minor
npm run version:minor

# Bump patch
npm run version:patch
```

## Version Display in UI

The current version is displayed in the Settings page and can be accessed programmatically:

- **Settings Page**: Shows version at the bottom or in About section
- **Version API**: `window.__APP_VERSION__` available globally
- **Build-time Injection**: Version is injected at build time via Vite's `define` config
- **Source of Truth**: Version is read from root `package.json` in `vite.config.ts`

### Important Notes

- **Dev Server**: Restart required after version bump to see updated version
- **Production Build**: Rebuild required after version bump to see updated version
- **Version Source**: Always use root `package.json` as the single source of truth for version numbers

## Fallback Strategy

### Current Setup (Manual Rollback)

**Manual Rollback via Git Tags:**

If a version has critical issues, you can manually rollback:

1. **List Available Versions**:
   ```bash
   git tag -l "v*"  # List all version tags
   git tag -l "v*" | sort -V | tail -5  # Show last 5 versions
   ```

2. **Checkout Previous Version**:
   ```bash
   git checkout v1.0.0  # Rollback to specific version
   # Or checkout the commit hash from CHANGELOG.md
   git checkout <commit-hash>
   ```

3. **Create Hotfix Branch from Previous Version**:
   ```bash
   git checkout -b hotfix/1.0.2 v1.0.0  # Branch from stable version
   # Make fixes, then create PR
   ```

4. **Redeploy Previous Version**:
   - Build and deploy the previous version
   - Revert the deployment to previous tag
   - Create a hotfix PR to fix the issue

### Automatic Fallback (Not Currently Implemented)

**To implement automatic version fallback, you would need:**

#### 1. Version-Aware PWA Updates
```typescript
// In vite.config.ts - Change from autoUpdate to prompt/autoUpdate with version check
VitePWA({
  registerType: 'promptUpdate', // Or 'autoUpdate' with version checking
  // Add version checking logic
})
```

#### 2. Error Detection & Reporting
- Monitor app errors on startup
- Track version stability metrics
- Detect critical failures (e.g., data corruption, app crash)
- Report issues to monitoring service

#### 3. Service Worker Version Management
```javascript
// Custom service worker logic
self.addEventListener('install', (event) => {
  const currentVersion = self.registration.scope.split('/').pop();
  const previousVersion = localStorage.getItem('app-version');
  
  // Check if new version is stable
  if (isVersionStable(currentVersion)) {
    event.waitUntil(skipWaiting());
  } else {
    // Fallback to previous version
    event.waitUntil(activatePreviousVersion());
  }
});
```

#### 4. Data Migration & Validation
- Store version number in IndexedDB
- Check data compatibility on app startup
- Run migration scripts if needed
- Validate data integrity after migration
- Rollback data changes if migration fails

#### 5. Deployment Strategy
- Blue-green deployments (run two versions side-by-side)
- Canary releases (gradual rollout)
- Feature flags to enable/disable new features
- A/B testing before full rollout

### Recommended Approach

**For a PWA with local data, the current manual approach is sufficient because:**

1. **IndexedDB Data is Version-Scoped**: Each deployment URL has its own IndexedDB
2. **Service Worker Caching**: Workbox already caches versions separately
3. **Manual Control**: Better to have manual control over rollbacks for data safety
4. **Testing**: PR workflow ensures versions are tested before deployment

**Automatic fallback would require:**
- Backend service to track version health
- Error reporting infrastructure
- Complex migration logic
- Risk of data corruption if rollback happens mid-operation

### Data Compatibility

**Current Strategy:**
- **Backup Before Upgrade**: Users should export backup before major version updates
- **Version in Backups**: Backup files include version number for compatibility checking
- **No Breaking Changes**: PATCH and MINOR versions maintain data compatibility
- **MAJOR Versions**: May require data migration (documented in CHANGELOG.md)

**Future Improvements (If Needed):**
- Automatic backup before major updates
- Data migration scripts for version upgrades
- Version compatibility checking on restore
- Downgrade protection (prevent restoring newer version backup to older app)

## Release Notes

Each version includes release notes in CHANGELOG.md:

```markdown
## [1.2.3] - 2024-01-15

### Added
- New feature: Clear all data functionality
- Settings page version display

### Fixed
- Rollup optional dependency installation in CI
- TypeScript compilation errors

### Changed
- Improved dependency installation workflow
```

## Best Practices

1. **Always Use PR Labels**: Label PRs appropriately for automatic versioning
2. **Write Clear Commit Messages**: Use conventional commit format
3. **Document Breaking Changes**: Use `BREAKING CHANGE:` in commit messages
4. **Review CHANGELOG**: Verify changelog before merging
5. **Test Before Release**: Test thoroughly before version bump
6. **Tag Releases**: Ensure git tags are created for releases

## Examples

### Example 1: Bug Fix
- PR: Fix transaction balance calculation error
- Label: `bug`
- Bump: PATCH (1.0.0 → 1.0.1)

### Example 2: New Feature
- PR: Add Clear All Data functionality
- Label: `feature`
- Bump: MINOR (1.0.0 → 1.1.0)

### Example 3: Breaking Change
- PR: Refactor transaction storage format (requires migration)
- Label: `breaking`
- Bump: MAJOR (1.0.0 → 2.0.0)

### Example 4: Multiple Changes
- PR: Add feature + fix bugs
- Labels: `feature`, `bug`
- Bump: MINOR (highest priority) (1.0.0 → 1.1.0)

## Questions or Issues?

If unsure about version bump type:
- Default to PATCH for fixes
- Default to MINOR for features
- Only use MAJOR for confirmed breaking changes
- Ask for review if uncertain

