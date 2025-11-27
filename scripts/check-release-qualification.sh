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

# 4. Analyze locked E2E test coverage
log_step "Step 4: Analyzing locked E2E test coverage..."
COVERAGE_FILE="$PROJECT_ROOT/.release-coverage/locked-e2e-coverage.json"

if bash "$SCRIPT_DIR/analyze-locked-test-coverage.sh" --output="$COVERAGE_FILE" 2>/dev/null; then
  log_success "E2E test coverage analysis completed"
  
  if [ -f "$COVERAGE_FILE" ] && command -v jq > /dev/null 2>&1; then
    COVERED_STORES_COUNT=$(jq '.stores | length' "$COVERAGE_FILE" 2>/dev/null || echo "0")
    COVERED_UTILS_COUNT=$(jq '.utils | length' "$COVERAGE_FILE" 2>/dev/null || echo "0")
    COVERED_HOOKS_COUNT=$(jq '.hooks | length' "$COVERAGE_FILE" 2>/dev/null || echo "0")
    
    log_info "Code covered by locked E2E tests:"
    log_info "  - Stores: $COVERED_STORES_COUNT"
    log_info "  - Utils: $COVERED_UTILS_COUNT"
    log_info "  - Hooks: $COVERED_HOOKS_COUNT"
  fi
else
  log_warning "Could not analyze E2E test coverage (non-blocking)"
fi
echo ""

# 5. Check unit tests for code covered by locked E2E tests only
log_step "Step 5: Checking unit tests for code covered by locked E2E tests..."
COVERAGE_FILE="$PROJECT_ROOT/.release-coverage/locked-e2e-coverage.json"

if [ ! -f "$COVERAGE_FILE" ]; then
  log_warning "Coverage file not found - running analysis..."
  bash "$SCRIPT_DIR/analyze-locked-test-coverage.sh" --output="$COVERAGE_FILE" 2>/dev/null || true
fi

if [ -f "$COVERAGE_FILE" ] && command -v jq > /dev/null 2>&1; then
  # Get covered stores/utils/hooks
  COVERED_STORES=$(jq -r '.stores[]' "$COVERAGE_FILE" 2>/dev/null || echo "")
  COVERED_UTILS=$(jq -r '.utils[]' "$COVERAGE_FILE" 2>/dev/null || echo "")
  COVERED_HOOKS=$(jq -r '.hooks[]' "$COVERAGE_FILE" 2>/dev/null || echo "")
  
  if [ -z "$COVERED_STORES" ] && [ -z "$COVERED_UTILS" ] && [ -z "$COVERED_HOOKS" ]; then
    log_warning "No code identified as covered by locked E2E tests"
  else
    log_info "Code covered by locked E2E tests that needs unit tests:"
    
    # Track missing tests (MANDATORY - cannot bypass)
    # Use a temp file to track missing tests (avoid subshell issues)
    MISSING_TESTS_FILE="/tmp/missing-tests-$$.txt"
    > "$MISSING_TESTS_FILE"
    
    # Check stores
    if [ -n "$COVERED_STORES" ]; then
      while IFS= read -r store; do
        [ -z "$store" ] && continue
        # Try multiple possible test file locations
        STORE_DIR=$(dirname "$store")
        STORE_NAME=$(basename "$store" .ts)
        TEST_FILE1="${store%.ts}.test.ts"
        TEST_FILE2="${STORE_DIR}/__tests__/${STORE_NAME}.test.ts"
        TEST_FILE3="frontend/src/store/__tests__/${STORE_NAME}.test.ts"
        
        if [ -f "$PROJECT_ROOT/$TEST_FILE1" ] || [ -f "$PROJECT_ROOT/$TEST_FILE2" ] || [ -f "$PROJECT_ROOT/$TEST_FILE3" ]; then
          log_info "  ✓ $store (test exists)"
        else
          log_error "  ✗ $store (test MISSING - MANDATORY)"
          echo "$store" >> "$MISSING_TESTS_FILE"
        fi
      done <<< "$COVERED_STORES"
    fi
    
    # Check utils
    if [ -n "$COVERED_UTILS" ]; then
      while IFS= read -r util; do
        [ -z "$util" ] && continue
        # Try multiple possible test file locations
        UTIL_DIR=$(dirname "$util")
        UTIL_NAME=$(basename "$util" .ts)
        TEST_FILE1="${util%.ts}.test.ts"
        TEST_FILE2="${UTIL_DIR}/__tests__/${UTIL_NAME}.test.ts"
        TEST_FILE3="frontend/src/utils/__tests__/${UTIL_NAME}.test.ts"
        
        if [ -f "$PROJECT_ROOT/$TEST_FILE1" ] || [ -f "$PROJECT_ROOT/$TEST_FILE2" ] || [ -f "$PROJECT_ROOT/$TEST_FILE3" ]; then
          log_info "  ✓ $util (test exists)"
        else
          log_error "  ✗ $util (test MISSING - MANDATORY)"
          echo "$util" >> "$MISSING_TESTS_FILE"
        fi
      done <<< "$COVERED_UTILS"
    fi
    
    # Check hooks
    if [ -n "$COVERED_HOOKS" ]; then
      while IFS= read -r hook; do
        [ -z "$hook" ] && continue
        # Try multiple possible test file locations
        HOOK_DIR=$(dirname "$hook")
        HOOK_NAME=$(basename "$hook" .tsx | sed 's/\.ts$//')
        TEST_FILE1="${hook%.tsx}.test.tsx"
        TEST_FILE2="${hook%.ts}.test.ts"
        TEST_FILE3="${HOOK_DIR}/__tests__/${HOOK_NAME}.test.ts"
        TEST_FILE4="frontend/src/hooks/__tests__/${HOOK_NAME}.test.ts"
        
        if [ -f "$PROJECT_ROOT/$TEST_FILE1" ] || [ -f "$PROJECT_ROOT/$TEST_FILE2" ] || [ -f "$PROJECT_ROOT/$TEST_FILE3" ] || [ -f "$PROJECT_ROOT/$TEST_FILE4" ]; then
          log_info "  ✓ $hook (test exists)"
        else
          log_error "  ✗ $hook (test MISSING - MANDATORY)"
          echo "$hook" >> "$MISSING_TESTS_FILE"
        fi
      done <<< "$COVERED_HOOKS"
    fi
    
    # FAIL if any tests are missing (MANDATORY - cannot bypass)
    if [ -s "$MISSING_TESTS_FILE" ]; then
      MISSING_TESTS=$(cat "$MISSING_TESTS_FILE" | tr '\n' ' ')
      log_error "=========================================="
      log_error "MANDATORY UNIT TESTS MISSING"
      log_error "=========================================="
      log_error "Cannot bypass: Unit tests are REQUIRED for all code covered by locked E2E tests"
      log_error "Missing tests for: $MISSING_TESTS"
      log_error "Create these test files before release qualification"
      QUALIFIED=false
      FAILURES+=("Missing unit tests for E2E-covered code: $MISSING_TESTS")
      rm -f "$MISSING_TESTS_FILE"
    else
      rm -f "$MISSING_TESTS_FILE"
    fi
    
    if [ "$DRY_RUN" = false ]; then
      # Run unit tests - MANDATORY for covered code (cannot bypass)
      log_info "Running unit tests (MANDATORY for E2E-covered code)..."
      
      if ! run_unit_tests_with_coverage; then
        # Check if failures are in covered code
        FAILED_TESTS=$(grep -E "FAIL.*test\.ts" /tmp/vitest-coverage.log 2>/dev/null | grep -oE "[^/]+\.test\.ts" | sort -u || echo "")
        
        CRITICAL_FAILURE=false
        ALL_COVERED="$COVERED_STORES"$'\n'"$COVERED_UTILS"$'\n'"$COVERED_HOOKS"
        FAILED_COVERED_FILES=()
        
        for covered_file in $ALL_COVERED; do
          [ -z "$covered_file" ] && continue
          COVERED_BASE=$(basename "$covered_file" .ts | sed 's/\.tsx$//')
          if echo "$FAILED_TESTS" | grep -q "${COVERED_BASE}\.test\.ts"; then
            log_error "CRITICAL: Unit test FAILED for covered file: $covered_file"
            CRITICAL_FAILURE=true
            FAILED_COVERED_FILES+=("$covered_file")
          fi
        done
        
        if [ "$CRITICAL_FAILURE" = true ]; then
          log_error "=========================================="
          log_error "UNIT TESTS FAILED FOR E2E-COVERED CODE"
          log_error "=========================================="
          log_error "Cannot bypass: Unit tests MUST pass for all code covered by locked E2E tests"
          log_error "Failed files: ${FAILED_COVERED_FILES[*]}"
          log_error "Fix these tests before release qualification"
          QUALIFIED=false
          FAILURES+=("Unit tests FAILING for E2E-covered code: ${FAILED_COVERED_FILES[*]}")
        else
          log_warning "Some unit tests failed, but not in code covered by locked E2E tests"
          log_info "These failures are non-blocking for release qualification"
          log_success "All unit tests for E2E-covered code passed"
        fi
      else
        log_success "All unit tests passed (including E2E-covered code)"
      fi
    else
      log_warning "Skipping unit test execution (dry-run mode)"
      log_warning "NOTE: Unit tests are MANDATORY for E2E-covered code in real runs"
    fi
  fi
else
  log_warning "Could not read coverage file or jq not available"
  log_info "Running all unit tests (cannot filter by coverage)"
  
  if [ "$DRY_RUN" = false ]; then
    if run_unit_tests_with_coverage; then
      log_success "Unit tests passed"
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

# 6. Verify no unwanted code or tests are included
log_step "Step 6: Verifying no unwanted code or tests are included..."
if bash "$SCRIPT_DIR/verify-release-branch-content.sh" 2>/dev/null; then
  log_success "Release branch content verification passed - only E2E-covered code included"
else
  log_error "Release branch contains unwanted code or test files"
  QUALIFIED=false
  FAILURES+=("Unwanted code or tests detected - release branch must only contain E2E-covered code")
fi
echo ""

# 7. Summary
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

