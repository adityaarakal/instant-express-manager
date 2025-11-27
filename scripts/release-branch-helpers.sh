#!/bin/bash

# ============================================================================
# Release Branch Helper Functions
# ============================================================================
# Shared utility functions for release branch management scripts
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOCK_DIR="$PROJECT_ROOT/.test-locks"

# Logging functions
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_step() {
  echo -e "${CYAN}📋 $1${NC}"
}

# Check if we're in the project root
check_project_root() {
  if [ ! -d "$FRONTEND_DIR" ]; then
    log_error "Frontend directory not found. Please run from project root."
    exit 1
  fi
}

# Get all locked test files
get_locked_tests() {
  if [ ! -d "$LOCK_DIR" ]; then
    echo ""
    return
  fi
  
  find "$LOCK_DIR" -name "*.lock" -type f 2>/dev/null | \
    sed "s|^$LOCK_DIR/||" | \
    sed 's|\.lock$||' | \
    sed 's|^|frontend/|' || echo ""
}

# Check if a test file is locked
is_test_locked() {
  local test_file="$1"
  local relative_path=$(echo "$test_file" | sed 's|^frontend/||')
  local lock_file="$LOCK_DIR/$relative_path.lock"
  
  [ -f "$lock_file" ] && return 0 || return 1
}

# Get locked test file path from lock file
get_test_file_from_lock() {
  local lock_file="$1"
  local relative_path=$(echo "$lock_file" | sed 's|^\.test-locks/||' | sed 's|\.lock$||')
  echo "frontend/$relative_path"
}

# Run Playwright tests and check if they pass
run_playwright_tests() {
  local test_files="$1"
  local exit_code=0
  
  log_step "Running Playwright tests..."
  
  cd "$FRONTEND_DIR"
  
  if [ -z "$test_files" ]; then
    log_warning "No test files specified"
    return 1
  fi
  
  # Run tests for each file
  while IFS= read -r test_file; do
    [ -z "$test_file" ] && continue
    
    # Clean up path - remove any absolute path prefixes
    CLEAN_PATH=$(echo "$test_file" | sed "s|^$PROJECT_ROOT/||" | sed "s|^frontend/frontend/|frontend/|")
    
    # Check if file exists (try both relative and absolute)
    if [ ! -f "$PROJECT_ROOT/$CLEAN_PATH" ] && [ ! -f "$CLEAN_PATH" ]; then
      log_error "Test file not found: $CLEAN_PATH"
      exit_code=1
      continue
    fi
    
    # Use relative path from frontend directory
    RELATIVE_PATH=$(echo "$CLEAN_PATH" | sed 's|^frontend/||')
    
    log_info "Running: $RELATIVE_PATH"
    if npm run test:e2e -- "$RELATIVE_PATH" > /dev/null 2>&1; then
      log_success "Passed: $RELATIVE_PATH"
    else
      log_error "Failed: $RELATIVE_PATH"
      exit_code=1
    fi
  done <<< "$test_files"
  
  cd "$PROJECT_ROOT"
  return $exit_code
}

# Run unit tests with coverage
run_unit_tests_with_coverage() {
  log_step "Running unit tests with coverage..."
  
  cd "$FRONTEND_DIR"
  
  # Get code covered by locked E2E tests
  COVERAGE_FILE="$PROJECT_ROOT/.release-coverage/locked-e2e-coverage.json"
  
  if [ -f "$COVERAGE_FILE" ] && command -v jq > /dev/null 2>&1; then
    COVERED_STORES=$(jq -r '.stores[]' "$COVERAGE_FILE" 2>/dev/null | sed 's|frontend/src/store/||' | sed 's|\.ts$||' | sort -u || echo "")
    COVERED_UTILS=$(jq -r '.utils[]' "$COVERAGE_FILE" 2>/dev/null | sed 's|frontend/src/utils/||' | sed 's|\.ts$||' | sort -u || echo "")
    COVERED_HOOKS=$(jq -r '.hooks[]' "$COVERAGE_FILE" 2>/dev/null | sed 's|frontend/src/hooks/||' | sed 's|\.tsx$||' | sed 's|\.ts$||' | sort -u || echo "")
  else
    COVERED_STORES=""
    COVERED_UTILS=""
    COVERED_HOOKS=""
  fi
  
  # Run vitest with coverage
  if npm run test -- --coverage --run > /tmp/vitest-coverage.log 2>&1; then
    log_success "Unit tests passed"
    cd "$PROJECT_ROOT"
    return 0
  else
    # Check if failures are in covered code
    FAILED_TESTS=$(grep -E "FAIL.*test\.ts" /tmp/vitest-coverage.log | grep -oE "[^/]+\.test\.ts" | sort -u || echo "")
    
    if [ -z "$COVERED_STORES" ] && [ -z "$COVERED_UTILS" ] && [ -z "$COVERED_HOOKS" ]; then
      # No covered code identified - fail on any failure
      log_error "Unit tests failed"
      cat /tmp/vitest-coverage.log | tail -50
      cd "$PROJECT_ROOT"
      return 1
    fi
    
    # Check if any failures are in covered code
    CRITICAL_FAILURE=false
    ALL_COVERED="$COVERED_STORES"$'\n'"$COVERED_UTILS"$'\n'"$COVERED_HOOKS"
    
    for covered in $ALL_COVERED; do
      [ -z "$covered" ] && continue
      if echo "$FAILED_TESTS" | grep -q "${covered}\.test\.ts"; then
        log_error "Critical failure: Unit tests failed for covered code: $covered"
        CRITICAL_FAILURE=true
      fi
    done
    
    if [ "$CRITICAL_FAILURE" = true ]; then
      log_error "Unit tests failed for code covered by locked E2E tests"
      cd "$PROJECT_ROOT"
      return 1
    else
      log_warning "Some unit tests failed, but not in code covered by locked E2E tests"
      log_info "Failed tests: $FAILED_TESTS"
      log_info "Covered code: stores=$COVERED_STORES, utils=$COVERED_UTILS, hooks=$COVERED_HOOKS"
      log_info "These failures are non-blocking for release qualification"
      cd "$PROJECT_ROOT"
      return 0
    fi
  fi
}

# Parse coverage report and check thresholds
check_coverage_thresholds() {
  local coverage_file="$1"
  local utils_threshold="${2:-100}"
  local services_threshold="${3:-100}"
  
  if [ ! -f "$coverage_file" ]; then
    log_error "Coverage file not found: $coverage_file"
    return 1
  fi
  
  # Parse coverage JSON (vitest outputs coverage-summary.json)
  # This is a simplified check - actual implementation will parse JSON
  log_step "Checking coverage thresholds..."
  log_info "Utils threshold: ${utils_threshold}%"
  log_info "Services/Hooks threshold: ${services_threshold}%"
  
  # TODO: Implement actual JSON parsing and threshold checking
  # For now, return success if file exists
  return 0
}

# Verify locked tests are not modified
verify_locked_tests() {
  log_step "Verifying locked tests integrity..."
  
  if [ ! -d "$LOCK_DIR" ]; then
    log_warning "No locked tests found"
    return 0
  fi
  
  # Use existing validation script
  if bash "$SCRIPT_DIR/validate-test-locks.sh"; then
    log_success "All locked tests validated"
    return 0
  else
    log_error "Locked tests validation failed"
    return 1
  fi
}

# Get utils files that need 100% coverage
get_utils_files() {
  find "$FRONTEND_DIR/src/utils" -name "*.ts" -type f ! -name "*.test.ts" ! -name "*.spec.ts" 2>/dev/null | \
    sed "s|^$PROJECT_ROOT/||" || echo ""
}

# Get services/hooks files that need 100% coverage
get_services_hooks_files() {
  {
    find "$FRONTEND_DIR/src/store" -name "*.ts" -type f ! -name "*.test.ts" ! -name "*.spec.ts" 2>/dev/null
    find "$FRONTEND_DIR/src/hooks" -name "*.ts" -type f ! -name "*.test.ts" ! -name "*.spec.ts" 2>/dev/null
    find "$FRONTEND_DIR/src/hooks" -name "*.tsx" -type f ! -name "*.test.tsx" ! -name "*.spec.tsx" 2>/dev/null
  } | sed "s|^$PROJECT_ROOT/||" || echo ""
}

# Check if file has corresponding test
has_test_file() {
  local source_file="$1"
  local test_file=""
  
  # Try different test file patterns
  if [[ "$source_file" == *.ts ]]; then
    test_file="${source_file%.ts}.test.ts"
  elif [[ "$source_file" == *.tsx ]]; then
    test_file="${source_file%.tsx}.test.tsx"
  fi
  
  [ -f "$PROJECT_ROOT/$test_file" ] && return 0 || return 1
}

# Export functions for use in other scripts
export -f log_info log_success log_warning log_error log_step
export -f check_project_root get_locked_tests is_test_locked
export -f get_test_file_from_lock run_playwright_tests
export -f run_unit_tests_with_coverage check_coverage_thresholds
export -f verify_locked_tests get_utils_files get_services_hooks_files
export -f has_test_file

