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
- **Package Info**: Imported from package.json in build

## Fallback Strategy

### Version Rollback

If a version has issues:

1. **Git Tags**: Use git tags to identify versions
   ```bash
   git tag -l "v*"  # List all versions
   git checkout v1.2.3  # Checkout specific version
   ```

2. **Branch from Tag**: Create hotfix branch from previous version
   ```bash
   git checkout -b hotfix/1.2.4 v1.2.3
   ```

3. **Version History**: Check CHANGELOG.md for version details

### Data Compatibility

- **IndexedDB**: Version numbers help identify data format versions
- **Migration**: Store version in data for migration scripts
- **Backup Compatibility**: Version info in backup files

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

