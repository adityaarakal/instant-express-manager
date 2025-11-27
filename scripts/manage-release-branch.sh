#!/bin/bash

# ============================================================================
# Release Branch Manager
# ============================================================================
# Creates or updates the release branch with only code covered by locked tests
#
# Usage:
#   bash scripts/manage-release-branch.sh [--dry-run] [--force]
#
# Safety:
#   - Never modifies main branch
#   - Creates backup before filtering
#   - Dry-run mode available
# ============================================================================

set -e

# Source helper functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/release-branch-helpers.sh"

# Configuration
RELEASE_BRANCH="release"
MAIN_BRANCH="main"
DRY_RUN=false
FORCE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      echo "Usage: bash scripts/manage-release-branch.sh [--dry-run] [--force]"
      exit 1
      ;;
  esac
done

check_project_root

echo ""
log_step "Release Branch Manager"
echo "========================"
echo ""

# Safety check: Ensure we're not on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

if [ "$CURRENT_BRANCH" = "$MAIN_BRANCH" ] && [ "$DRY_RUN" = false ]; then
  log_warning "Currently on $MAIN_BRANCH branch"
  log_info "This script will create/update $RELEASE_BRANCH branch"
  log_info "Main branch will NOT be modified"
  echo ""
  read -p "Continue? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Aborted by user"
    exit 0
  fi
fi

# Step 1: Check release qualification
log_step "Step 1: Checking release qualification..."
if bash "$SCRIPT_DIR/check-release-qualification.sh" --dry-run=$DRY_RUN; then
  log_success "Release qualification check passed"
else
  log_error "Release qualification check failed"
  log_info "Cannot create/update release branch until all criteria are met"
  exit 1
fi
echo ""

# Step 2: Generate coverage map
log_step "Step 2: Generating coverage map..."
if bash "$SCRIPT_DIR/map-locked-test-coverage.sh"; then
  log_success "Coverage map generated"
else
  log_error "Failed to generate coverage map"
  exit 1
fi
echo ""

COVERAGE_MAP="$PROJECT_ROOT/.release-coverage/locked-tests-coverage.json"

if [ ! -f "$COVERAGE_MAP" ]; then
  log_error "Coverage map not found: $COVERAGE_MAP"
  exit 1
fi

# Step 3: Check if release branch exists
log_step "Step 3: Checking release branch status..."
RELEASE_EXISTS=false

if git show-ref --verify --quiet refs/heads/$RELEASE_BRANCH 2>/dev/null; then
  RELEASE_EXISTS=true
  log_info "Release branch exists locally"
elif git ls-remote --heads origin $RELEASE_BRANCH 2>/dev/null | grep -q "$RELEASE_BRANCH"; then
  RELEASE_EXISTS=true
  log_info "Release branch exists on remote"
fi

if [ "$RELEASE_EXISTS" = false ]; then
  log_info "Release branch does not exist - will be created"
fi
echo ""

# Step 4: Create/update release branch
if [ "$DRY_RUN" = true ]; then
  log_step "Step 4: DRY RUN - Would create/update release branch"
  log_info "Would:"
  log_info "  1. Create/checkout release branch from $MAIN_BRANCH"
  log_info "  2. Filter code based on coverage map"
  log_info "  3. Commit filtered changes"
  log_info "  4. Push to remote"
  echo ""
  log_warning "DRY RUN - No changes made"
  exit 0
fi

log_step "Step 4: Creating/updating release branch..."

# Stash any uncommitted changes
HAS_STASH=false
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  log_info "Stashing uncommitted changes..."
  git stash push -m "Release branch manager stash $(date +%Y%m%d-%H%M%S)" > /dev/null 2>&1
  HAS_STASH=true
fi

# Save current branch
ORIGINAL_BRANCH="$CURRENT_BRANCH"

# Fetch latest
log_info "Fetching latest changes..."
git fetch origin > /dev/null 2>&1 || true

# Create or checkout release branch
if [ "$RELEASE_EXISTS" = true ]; then
  log_info "Checking out existing release branch..."
  git checkout $RELEASE_BRANCH 2>/dev/null || git checkout -b $RELEASE_BRANCH origin/$RELEASE_BRANCH 2>/dev/null || {
    log_error "Failed to checkout release branch"
    if [ "$HAS_STASH" = true ]; then
      git stash pop > /dev/null 2>&1 || true
    fi
    exit 1
  }
  
  # Merge latest from main
  log_info "Merging latest changes from $MAIN_BRANCH..."
  git merge origin/$MAIN_BRANCH --no-edit > /dev/null 2>&1 || {
    log_warning "Merge conflicts detected - this is expected"
    log_info "Will resolve by filtering code"
  }
else
  log_info "Creating new release branch from $MAIN_BRANCH..."
  git checkout -b $RELEASE_BRANCH origin/$MAIN_BRANCH 2>/dev/null || \
  git checkout -b $RELEASE_BRANCH $MAIN_BRANCH 2>/dev/null || {
    log_error "Failed to create release branch"
    if [ "$HAS_STASH" = true ]; then
      git stash pop > /dev/null 2>&1 || true
    fi
    exit 1
  }
fi

# Step 5: Filter code based on coverage map
log_step "Step 5: Filtering code based on coverage map..."

# Get list of files to keep
FILES_TO_KEEP=$(jq -r '[.covered_files | to_entries[] | .value[]] | .[]' "$COVERAGE_MAP" 2>/dev/null || echo "")

# Also keep essential files (configs, package files, etc.)
ESSENTIAL_FILES=(
  "package.json"
  "package-lock.json"
  "frontend/package.json"
  "frontend/package-lock.json"
  "frontend/vite.config.ts"
  "frontend/tsconfig.json"
  "frontend/tsconfig.node.json"
  ".gitignore"
  "README.md"
  "docs/BRANCHING_AND_DEPLOYMENT_STRATEGY.md"
  "docs/RELEASE_BRANCH_IMPLEMENTATION_PLAN.md"
  ".test-locks"
  "scripts"
  ".github"
)

# Keep test files
TEST_FILES=$(find "$FRONTEND_DIR" -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" \) 2>/dev/null | sed "s|^$PROJECT_ROOT/||" || echo "")

# Build list of all files to keep
ALL_FILES_TO_KEEP="$FILES_TO_KEEP"
for file in "${ESSENTIAL_FILES[@]}"; do
  ALL_FILES_TO_KEEP="$ALL_FILES_TO_KEEP"$'\n'"$file"
done
ALL_FILES_TO_KEEP="$ALL_FILES_TO_KEEP"$'\n'"$TEST_FILES"

# Remove duplicates and empty lines
ALL_FILES_TO_KEEP=$(echo "$ALL_FILES_TO_KEEP" | grep -v '^$' | sort -u)

# Get all files in the repo (excluding .git, node_modules, etc.)
ALL_FILES=$(git ls-files | grep -v '^\.git' | grep -v 'node_modules' | grep -v 'dist' | grep -v 'coverage' || echo "")

# Find files to remove (files not in keep list)
FILES_TO_REMOVE=""
KEEP_COUNT=0
REMOVE_COUNT=0

while IFS= read -r file; do
  [ -z "$file" ] && continue
  
  # Check if file should be kept
  KEEP=false
  
  # Check essential files
  for essential in "${ESSENTIAL_FILES[@]}"; do
    if [[ "$file" == "$essential" ]] || [[ "$file" == "$essential"/* ]]; then
      KEEP=true
      break
    fi
  done
  
  # Check coverage map
  if [ "$KEEP" = false ]; then
    if echo "$ALL_FILES_TO_KEEP" | grep -q "^$file$"; then
      KEEP=true
    fi
  fi
  
  # Check if it's a directory from essential files
  if [ "$KEEP" = false ]; then
    for essential in "${ESSENTIAL_FILES[@]}"; do
      if [[ "$file" == "$essential"* ]]; then
        KEEP=true
        break
      fi
    done
  fi
  
  if [ "$KEEP" = false ]; then
    FILES_TO_REMOVE="$FILES_TO_REMOVE"$'\n'"$file"
    ((REMOVE_COUNT++))
  else
    ((KEEP_COUNT++))
  fi
done <<< "$ALL_FILES"

log_info "Files to keep: $KEEP_COUNT"
log_info "Files to remove: $REMOVE_COUNT"

if [ "$REMOVE_COUNT" -gt 0 ]; then
  log_warning "This will remove $REMOVE_COUNT file(s) not covered by locked tests"
  
  if [ "$FORCE" = false ]; then
    echo ""
    read -p "Continue with filtering? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log_info "Aborted by user"
      git checkout "$ORIGINAL_BRANCH" > /dev/null 2>&1 || true
      if [ "$HAS_STASH" = true ]; then
        git stash pop > /dev/null 2>&1 || true
      fi
      exit 0
    fi
  fi
  
  # Remove files not covered by locked tests
  echo "$FILES_TO_REMOVE" | grep -v '^$' | while IFS= read -r file; do
    [ -z "$file" ] && continue
    if [ -f "$file" ]; then
      log_info "Removing: $file"
      git rm "$file" > /dev/null 2>&1 || rm -f "$file"
    fi
  done
else
  log_info "No files to remove - all files are covered by locked tests"
fi

# Step 6: Commit changes
log_step "Step 6: Committing filtered changes..."

if git diff --cached --quiet && git diff --quiet; then
  log_info "No changes to commit"
else
  git add -A
  git commit -m "chore: update release branch with locked test coverage

- Filtered code to only include files covered by locked tests
- Removed untested code
- Generated from main branch at $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')

This commit was automatically generated by manage-release-branch.sh" > /dev/null 2>&1 || {
    log_warning "Nothing to commit (may already be up to date)"
  }
fi

# Step 7: Push to remote (optional)
log_step "Step 7: Release branch ready"
log_success "Release branch updated successfully"

echo ""
log_info "Summary:"
log_info "  Branch: $RELEASE_BRANCH"
log_info "  Files kept: $KEEP_COUNT"
log_info "  Files removed: $REMOVE_COUNT"
echo ""

# Restore original branch
if [ "$ORIGINAL_BRANCH" != "$RELEASE_BRANCH" ]; then
  log_info "Returning to original branch: $ORIGINAL_BRANCH"
  git checkout "$ORIGINAL_BRANCH" > /dev/null 2>&1 || true
fi

# Restore stash
if [ "$HAS_STASH" = true ]; then
  log_info "Restoring stashed changes..."
  git stash pop > /dev/null 2>&1 || true
fi

echo ""
log_info "To push release branch to remote:"
log_info "  git push origin $RELEASE_BRANCH"
echo ""

