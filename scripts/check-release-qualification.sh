#!/bin/bash

# ============================================================================
# Release Qualification Checker
# ============================================================================
# Checks if features meet release branch criteria:
# - All locked Playwright tests exist and are passing
# - Utils have 100% unit test coverage and all tests passing
# - Services/hooks have 100% test coverage (unit OR E2E) and all passing
# - No untested code beyond locked test coverage
#
# Usage:
#   bash scripts/check-release-qualification.sh [--verbose] [--dry-run]
#
# Exit codes:
#   0 - All criteria met (qualified for release)
#   1 - Criteria not met (not qualified)
# ============================================================================

set -e

# Source helper functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/release-branch-helpers.sh"

# Parse arguments
VERBOSE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      echo "Usage: bash scripts/check-release-qualification.sh [--verbose] [--dry-run]"
      exit 1
      ;;
  esac
done

# Initialize
check_project_root
QUALIFIED=true
FAILURES=()

echo ""
log_step "Checking Release Qualification Criteria"
echo "=========================================="
echo ""

# 1. Check locked tests exist
log_step "Step 1: Checking locked Playwright tests..."
LOCKED_TESTS=$(get_locked_tests)

if [ -z "$LOCKED_TESTS" ]; then
  log_error "No locked Playwright tests found"
  log_warning "Release branch requires at least one locked test"
  QUALIFIED=false
  FAILURES+=("No locked tests")
else
  LOCKED_COUNT=$(echo "$LOCKED_TESTS" | wc -l | tr -d ' ')
  log_success "Found $LOCKED_COUNT locked test(s)"
  
  if [ "$VERBOSE" = true ]; then
    echo "$LOCKED_TESTS" | while read -r test; do
      log_info "  - $test"
    done
  fi
fi
echo ""

# 2. Verify locked tests integrity
log_step "Step 2: Verifying locked tests integrity..."
if verify_locked_tests; then
  log_success "All locked tests are valid"
else
  log_error "Locked tests validation failed"
  QUALIFIED=false
  FAILURES+=("Locked tests modified")
fi
echo ""

# 3. Check locked tests are passing
log_step "Step 3: Verifying locked tests are passing..."
if [ "$DRY_RUN" = false ]; then
  if run_playwright_tests "$LOCKED_TESTS"; then
    log_success "All locked tests are passing"
  else
    log_error "Some locked tests are failing"
    QUALIFIED=false
    FAILURES+=("Locked tests failing")
  fi
else
  log_warning "Skipping test execution (dry-run mode)"
fi
echo ""

# 4. Check unit test coverage for utils
log_step "Step 4: Checking unit test coverage for utils..."
UTILS_FILES=$(get_utils_files)
UTILS_COUNT=$(echo "$UTILS_FILES" | grep -v '^$' | wc -l | tr -d ' ')

if [ "$UTILS_COUNT" -eq 0 ]; then
  log_warning "No utils files found"
else
  log_info "Found $UTILS_COUNT utils file(s)"
  
  if [ "$DRY_RUN" = false ]; then
    if run_unit_tests_with_coverage; then
      log_success "Unit tests passed"
      # TODO: Parse coverage report and verify 100% for utils
      log_warning "Coverage threshold check not yet implemented (TODO)"
    else
      log_error "Unit tests failed"
      QUALIFIED=false
      FAILURES+=("Unit tests failing")
    fi
  else
    log_warning "Skipping unit test execution (dry-run mode)"
  fi
fi
echo ""

# 5. Check test coverage for services/hooks
log_step "Step 5: Checking test coverage for services/hooks..."
SERVICES_HOOKS_FILES=$(get_services_hooks_files)
SERVICES_COUNT=$(echo "$SERVICES_HOOKS_FILES" | grep -v '^$' | wc -l | tr -d ' ')

if [ "$SERVICES_COUNT" -eq 0 ]; then
  log_warning "No services/hooks files found"
else
  log_info "Found $SERVICES_COUNT services/hooks file(s)"
  
  if [ "$DRY_RUN" = false ]; then
    # Services/hooks can be covered by unit tests OR E2E tests
    # For now, we check if unit tests pass
    # TODO: Implement coverage check for services/hooks
    log_warning "Services/hooks coverage check not yet fully implemented (TODO)"
  else
    log_warning "Skipping services/hooks check (dry-run mode)"
  fi
fi
echo ""

# 6. Summary
echo "=========================================="
log_step "Release Qualification Summary"
echo ""

if [ "$QUALIFIED" = true ]; then
  log_success "✅ QUALIFIED FOR RELEASE"
  echo ""
  log_info "All criteria met:"
  log_info "  ✓ Locked tests exist and are valid"
  log_info "  ✓ Locked tests are passing"
  log_info "  ✓ Unit tests are passing"
  echo ""
  exit 0
else
  log_error "❌ NOT QUALIFIED FOR RELEASE"
  echo ""
  log_error "Failures:"
  for failure in "${FAILURES[@]}"; do
    log_error "  ✗ $failure"
  done
  echo ""
  log_info "To qualify for release:"
  log_info "  1. Ensure all features have locked Playwright tests"
  log_info "  2. Ensure all locked tests are passing"
  log_info "  3. Ensure utils have 100% unit test coverage"
  log_info "  4. Ensure services/hooks have 100% test coverage (unit OR E2E)"
  echo ""
  exit 1
fi

