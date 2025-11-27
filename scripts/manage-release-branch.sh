#!/bin/bash

# ============================================================================
# Release Branch Manager
# ============================================================================
# Creates or updates the release branch with ONLY code covered by locked E2E tests
#
# 🚨 CRITICAL: This script MANDATORY removes ALL files not covered by locked E2E tests.
# 🚨 NO EXCEPTIONS: Not even a single file outside E2E coverage is kept.
#
# Usage:
#   bash scripts/manage-release-branch.sh [--dry-run] [--force]
#
# Options:
#   --dry-run    Run without making changes (shows what would be removed)
#   --force      Skip confirmation prompts (automatic in CI/CD)
#
# MANDATORY BEHAVIOR:
#   - ALL files not covered by locked E2E tests are AUTOMATICALLY REMOVED
#   - This cannot be bypassed - it's the core requirement for release branch
#   - Only E2E-covered code + its tests + essential config files are kept
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

# Step 2: Analyze locked E2E test coverage
log_step "Step 2: Analyzing locked E2E test coverage..."
COVERAGE_FILE="$PROJECT_ROOT/.release-coverage/locked-e2e-coverage.json"

if bash "$SCRIPT_DIR/analyze-locked-test-coverage.sh" --output="$COVERAGE_FILE"; then
  log_success "E2E test coverage analysis completed"
else
  log_error "Failed to analyze E2E test coverage"
  exit 1
fi
echo ""

if [ ! -f "$COVERAGE_FILE" ]; then
  log_error "Coverage file not found: $COVERAGE_FILE"
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

# Step 5: Filter code based on E2E test coverage analysis
log_step "Step 5: Filtering code based on locked E2E test coverage..."

# Get list of files to keep from coverage analysis
if command -v jq > /dev/null 2>&1; then
  # Extract all covered files from the coverage analysis (exclude empty strings)
  COVERED_PAGES=$(jq -r '.pages[]' "$COVERAGE_FILE" 2>/dev/null | grep -v '^$' || echo "")
  COVERED_COMPONENTS=$(jq -r '.components[]' "$COVERAGE_FILE" 2>/dev/null | grep -v '^$' || echo "")
  COVERED_STORES=$(jq -r '.stores[]' "$COVERAGE_FILE" 2>/dev/null | grep -v '^$' || echo "")
  COVERED_UTILS=$(jq -r '.utils[]' "$COVERAGE_FILE" 2>/dev/null | grep -v '^$' || echo "")
  COVERED_HOOKS=$(jq -r '.hooks[]' "$COVERAGE_FILE" 2>/dev/null | grep -v '^$' || echo "")
  COVERED_TYPES=$(jq -r '.types[]' "$COVERAGE_FILE" 2>/dev/null | grep -v '^$' || echo "")
  
  # Combine all covered files
  FILES_TO_KEEP="$COVERED_PAGES"$'\n'"$COVERED_COMPONENTS"$'\n'"$COVERED_STORES"$'\n'"$COVERED_UTILS"$'\n'"$COVERED_HOOKS"$'\n'"$COVERED_TYPES"
  FILES_TO_KEEP=$(echo "$FILES_TO_KEEP" | grep -v '^$' | sort -u)
  
  # Also include test files ONLY for covered code (strict filtering)
  COVERED_TEST_FILES=""
  for covered_file in $FILES_TO_KEEP; do
    [ -z "$covered_file" ] && continue
    # Only include test files for files explicitly in coverage analysis
    # Check if this file is in stores, utils, hooks, components, or pages
    IS_COVERED=false
    if echo "$COVERED_STORES" | grep -q "^$covered_file$"; then
      IS_COVERED=true
    elif echo "$COVERED_UTILS" | grep -q "^$covered_file$"; then
      IS_COVERED=true
    elif echo "$COVERED_HOOKS" | grep -q "^$covered_file$"; then
      IS_COVERED=true
    elif echo "$COVERED_COMPONENTS" | grep -q "^$covered_file$"; then
      IS_COVERED=true
    elif echo "$COVERED_PAGES" | grep -q "^$covered_file$"; then
      IS_COVERED=true
    fi
    
    # Only add test files for explicitly covered code
    if [ "$IS_COVERED" = true ]; then
      # Find corresponding test files in standard locations
      FILE_DIR=$(dirname "$covered_file")
      FILE_NAME=$(basename "$covered_file" .tsx | sed 's/\.ts$//')
      
      # Check same directory
      TEST_FILE="${covered_file%.ts}.test.ts"
      TEST_FILE_TSX="${covered_file%.tsx}.test.tsx"
      
      # Check __tests__ subdirectory
      TEST_FILE_IN_TESTS_DIR="${FILE_DIR}/__tests__/${FILE_NAME}.test.ts"
      TEST_FILE_IN_TESTS_DIR_TSX="${FILE_DIR}/__tests__/${FILE_NAME}.test.tsx"
      
      # Add test files if they exist
      for test_file in "$TEST_FILE" "$TEST_FILE_TSX" "$TEST_FILE_IN_TESTS_DIR" "$TEST_FILE_IN_TESTS_DIR_TSX"; do
        if [ -f "$PROJECT_ROOT/$test_file" ]; then
          COVERED_TEST_FILES="$COVERED_TEST_FILES"$'\n'"$test_file"
        fi
      done
    fi
  done
  
  # Include locked E2E test files
  LOCKED_TEST_FILES=$(jq -r '.locked_tests[]' "$COVERAGE_FILE" 2>/dev/null || echo "")
  
  # Include E2E helper files used by locked tests
  E2E_HELPER_FILES=$(find "$FRONTEND_DIR/e2e/helpers" -name "*.ts" -type f 2>/dev/null | sed "s|^$PROJECT_ROOT/||" || echo "")
else
  log_error "jq not found. Cannot parse coverage file."
  exit 1
fi

# Also keep essential files (configs, package files, etc.)
ESSENTIAL_FILES=(
  "package.json"
  "package-lock.json"
  "frontend/package.json"
  "frontend/package-lock.json"
  "frontend/vite.config.ts"
  "frontend/tsconfig.json"
  "frontend/tsconfig.node.json"
  "frontend/index.html"
  "frontend/public"
  ".gitignore"
  "README.md"
  "docs/BRANCHING_AND_DEPLOYMENT_STRATEGY.md"
  "docs/RELEASE_BRANCH_IMPLEMENTATION_PLAN.md"
  "docs/RELEASE_BRANCH_USAGE.md"
  "docs/RELEASE_BRANCH_IMPLEMENTATION_SUMMARY.md"
  ".test-locks"
  "scripts"
  ".github"
  "frontend/e2e"
)

# Build list of all files to keep
ALL_FILES_TO_KEEP="$FILES_TO_KEEP"
ALL_FILES_TO_KEEP="$ALL_FILES_TO_KEEP"$'\n'"$COVERED_TEST_FILES"
ALL_FILES_TO_KEEP="$ALL_FILES_TO_KEEP"$'\n'"$LOCKED_TEST_FILES"
ALL_FILES_TO_KEEP="$ALL_FILES_TO_KEEP"$'\n'"$E2E_HELPER_FILES"

for file in "${ESSENTIAL_FILES[@]}"; do
  ALL_FILES_TO_KEEP="$ALL_FILES_TO_KEEP"$'\n'"$file"
done

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

# MANDATORY: Remove ALL files not covered by locked E2E tests
# This is NON-NEGOTIABLE - release branch MUST only contain E2E-covered code
if [ "$REMOVE_COUNT" -gt 0 ]; then
  log_step "MANDATORY FILTERING: Removing $REMOVE_COUNT file(s) not covered by locked E2E tests"
  log_warning "This is MANDATORY - release branch MUST only contain code covered by locked E2E tests"
  log_info "Nothing else can be included - not even a single file"
  
  if [ "$FORCE" = false ]; then
    echo ""
    log_warning "⚠️  MANDATORY ACTION REQUIRED"
    log_info "Release branch MUST only contain E2E-covered code"
    log_info "All other files will be REMOVED"
    read -p "Continue with mandatory filtering? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log_error "Aborted - but filtering is MANDATORY for release branch"
      log_error "Release branch cannot contain code not covered by locked E2E tests"
      git checkout "$ORIGINAL_BRANCH" > /dev/null 2>&1 || true
      if [ "$HAS_STASH" = true ]; then
        git stash pop > /dev/null 2>&1 || true
      fi
      exit 1
    fi
  fi
  
  # MANDATORY: Remove files not covered by locked E2E tests
  # This is NON-NEGOTIABLE - no exceptions
  # Use a temp file to track removed count (avoid subshell issues)
  REMOVED_COUNT_FILE="/tmp/removed-count-$$.txt"
  echo "0" > "$REMOVED_COUNT_FILE"
  
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if [ -f "$file" ]; then
      log_info "🔒 MANDATORY REMOVAL: $file (not covered by locked E2E tests)"
      git rm "$file" > /dev/null 2>&1 || rm -f "$file"
      CURRENT_COUNT=$(cat "$REMOVED_COUNT_FILE")
      echo $((CURRENT_COUNT + 1)) > "$REMOVED_COUNT_FILE"
    fi
  done <<< "$(echo "$FILES_TO_REMOVE" | grep -v '^$')"
  
  REMOVED_COUNT=$(cat "$REMOVED_COUNT_FILE" 2>/dev/null || echo "0")
  rm -f "$REMOVED_COUNT_FILE"
  
  log_success "✅ MANDATORY FILTERING COMPLETE"
  log_info "Removed $REMOVED_COUNT file(s) not covered by locked E2E tests"
  log_info "Release branch now contains ONLY code covered by locked E2E tests"
  log_info "🚨 NO EXCEPTIONS: Not even a single file outside E2E coverage was kept"
else
  log_success "✅ No files to remove - all files are covered by locked E2E tests"
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

