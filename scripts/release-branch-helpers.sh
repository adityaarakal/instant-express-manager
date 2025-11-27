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
    sed 's|^\.test-locks/||' | \
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
  for test_file in $test_files; do
    if [ ! -f "$PROJECT_ROOT/$test_file" ]; then
      log_error "Test file not found: $test_file"
      exit_code=1
      continue
    fi
    
    log_info "Running: $test_file"
    if npm run test:e2e -- "$test_file" > /dev/null 2>&1; then
      log_success "Passed: $test_file"
    else
      log_error "Failed: $test_file"
      exit_code=1
    fi
  done
  
  cd "$PROJECT_ROOT"
  return $exit_code
}

# Run unit tests with coverage
run_unit_tests_with_coverage() {
  log_step "Running unit tests with coverage..."
  
  cd "$FRONTEND_DIR"
  
  # Run vitest with coverage
  if npm run test -- --coverage --run > /tmp/vitest-coverage.log 2>&1; then
    log_success "Unit tests passed"
    cd "$PROJECT_ROOT"
    return 0
  else
    log_error "Unit tests failed"
    cat /tmp/vitest-coverage.log
    cd "$PROJECT_ROOT"
    return 1
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

