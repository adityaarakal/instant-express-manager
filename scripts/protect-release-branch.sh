#!/bin/bash

# ============================================================================
# Release Branch Protection Script
# ============================================================================
# Validates release branch state and blocks merges if criteria not met
#
# Usage:
#   bash scripts/protect-release-branch.sh [--branch=release]
#
# Exit codes:
#   0 - Release branch is valid
#   1 - Release branch is invalid (block merge)
# ============================================================================

set -e

# Source helper functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/release-branch-helpers.sh"

RELEASE_BRANCH="${1:-release}"

check_project_root

echo ""
log_step "Protecting Release Branch: $RELEASE_BRANCH"
echo "=============================================="
echo ""

# Check if we're trying to merge to release branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
MERGE_HEAD=$(git rev-parse --verify MERGE_HEAD 2>/dev/null || echo "")

if [ -n "$MERGE_HEAD" ]; then
  log_info "Merge in progress detected"
  TARGET_BRANCH=$(git rev-parse --abbrev-ref MERGE_HEAD 2>/dev/null || echo "unknown")
  
  if [ "$TARGET_BRANCH" = "$RELEASE_BRANCH" ] || [ "$CURRENT_BRANCH" = "$RELEASE_BRANCH" ]; then
    log_warning "Attempting to merge to/from release branch"
    log_step "Validating release branch criteria..."
  fi
fi

# Step 1: Verify locked tests
log_step "Step 1: Verifying locked tests..."
if ! verify_locked_tests; then
  log_error "Locked tests validation failed"
  log_error "❌ MERGE BLOCKED: Locked tests have been modified"
  exit 1
fi
echo ""

# Step 2: Check release qualification
log_step "Step 2: Checking release qualification..."
if ! bash "$SCRIPT_DIR/check-release-qualification.sh"; then
  log_error "Release qualification check failed"
  log_error "❌ MERGE BLOCKED: Release qualification criteria not met"
  exit 1
fi
echo ""

# Step 3: Check test coverage
log_step "Step 3: Checking test coverage..."
if ! bash "$SCRIPT_DIR/check-test-coverage.sh"; then
  log_error "Test coverage check failed"
  log_error "❌ MERGE BLOCKED: Coverage thresholds not met"
  exit 1
fi
echo ""

# Step 4: Verify all tests pass
log_step "Step 4: Verifying all tests pass..."

# Run locked tests
LOCKED_TESTS=$(get_locked_tests)
if [ -n "$LOCKED_TESTS" ]; then
  if ! run_playwright_tests "$LOCKED_TESTS"; then
    log_error "Locked tests are failing"
    log_error "❌ MERGE BLOCKED: Tests must pass before merging to release"
    exit 1
  fi
fi

# Run unit tests
cd "$FRONTEND_DIR"
if ! npm run test -- --run > /dev/null 2>&1; then
  log_error "Unit tests are failing"
  log_error "❌ MERGE BLOCKED: All tests must pass before merging to release"
  cd "$PROJECT_ROOT"
  exit 1
fi
cd "$PROJECT_ROOT"
echo ""

# All checks passed
log_success "✅ Release branch protection checks passed"
log_success "✅ Merge allowed"
echo ""
exit 0

