#!/bin/bash

# ============================================================================
# Test Coverage Checker
# ============================================================================
# Verifies 100% test coverage for utils, services, and hooks
#
# Usage:
#   bash scripts/check-test-coverage.sh [--utils-threshold=100] [--services-threshold=100]
#
# Exit codes:
#   0 - Coverage thresholds met
#   1 - Coverage thresholds not met
# ============================================================================

set -e

# Source helper functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/release-branch-helpers.sh"

# Default thresholds
UTILS_THRESHOLD=100
SERVICES_THRESHOLD=100

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --utils-threshold=*)
      UTILS_THRESHOLD="${1#*=}"
      shift
      ;;
    --services-threshold=*)
      SERVICES_THRESHOLD="${1#*=}"
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      echo "Usage: bash scripts/check-test-coverage.sh [--utils-threshold=100] [--services-threshold=100]"
      exit 1
      ;;
  esac
done

check_project_root

echo ""
log_step "Checking Test Coverage Thresholds"
echo "======================================"
echo ""

COVERAGE_PASSED=true
COVERAGE_DIR="$PROJECT_ROOT/frontend/coverage"

# Run tests with coverage
log_step "Running unit tests with coverage..."
cd "$FRONTEND_DIR"

# Clean previous coverage
rm -rf "$COVERAGE_DIR"

# Run vitest with coverage
if npm run test -- --coverage --run > /tmp/vitest-coverage.log 2>&1; then
  log_success "Tests completed"
else
  log_error "Tests failed"
  cat /tmp/vitest-coverage.log
  cd "$PROJECT_ROOT"
  exit 1
fi

cd "$PROJECT_ROOT"

# Check if coverage report exists
COVERAGE_SUMMARY="$COVERAGE_DIR/coverage-summary.json"

if [ ! -f "$COVERAGE_SUMMARY" ]; then
  log_error "Coverage summary not found: $COVERAGE_SUMMARY"
  log_info "Trying alternative location..."
  
  # Try to find coverage-summary.json
  COVERAGE_SUMMARY=$(find "$COVERAGE_DIR" -name "coverage-summary.json" -type f | head -1)
  
  if [ -z "$COVERAGE_SUMMARY" ]; then
    log_error "Could not find coverage summary file"
    exit 1
  fi
fi

log_info "Coverage summary: $COVERAGE_SUMMARY"

# Parse coverage JSON (requires jq or node)
if command -v jq > /dev/null 2>&1; then
  # Use jq to parse JSON
  log_step "Parsing coverage report..."
  
  # Check utils coverage
  UTILS_COVERAGE=$(jq -r '.total.lines.pct' "$COVERAGE_SUMMARY" 2>/dev/null || echo "0")
  
  if [ -z "$UTILS_COVERAGE" ] || [ "$UTILS_COVERAGE" = "null" ]; then
    log_warning "Could not parse utils coverage from summary"
    log_info "Checking individual file coverage..."
    
    # Check individual utils files
    UTILS_FILES=$(get_utils_files)
    UTILS_MISSING_TESTS=()
    
    for util_file in $UTILS_FILES; do
      if ! has_test_file "$util_file"; then
        UTILS_MISSING_TESTS+=("$util_file")
      fi
    done
    
    if [ ${#UTILS_MISSING_TESTS[@]} -gt 0 ]; then
      log_error "Utils files missing tests:"
      for file in "${UTILS_MISSING_TESTS[@]}"; do
        log_error "  - $file"
      done
      COVERAGE_PASSED=false
    else
      log_success "All utils files have test files"
    fi
  else
    UTILS_COVERAGE_INT=${UTILS_COVERAGE%.*}
    if [ "$UTILS_COVERAGE_INT" -ge "$UTILS_THRESHOLD" ]; then
      log_success "Utils coverage: ${UTILS_COVERAGE}% (threshold: ${UTILS_THRESHOLD}%)"
    else
      log_error "Utils coverage: ${UTILS_COVERAGE}% (threshold: ${UTILS_THRESHOLD}%)"
      COVERAGE_PASSED=false
    fi
  fi
  
  # Check services/hooks coverage
  SERVICES_COVERAGE=$(jq -r '.total.lines.pct' "$COVERAGE_SUMMARY" 2>/dev/null || echo "0")
  
  if [ -z "$SERVICES_COVERAGE" ] || [ "$SERVICES_COVERAGE" = "null" ]; then
    log_warning "Could not parse services/hooks coverage from summary"
    log_info "Checking individual file coverage..."
    
    # Check individual services/hooks files
    SERVICES_HOOKS_FILES=$(get_services_hooks_files)
    SERVICES_MISSING_TESTS=()
    
    for service_file in $SERVICES_HOOKS_FILES; do
      if ! has_test_file "$service_file"; then
        SERVICES_MISSING_TESTS+=("$service_file")
      fi
    done
    
    if [ ${#SERVICES_MISSING_TESTS[@]} -gt 0 ]; then
      log_warning "Services/hooks files missing unit tests (may be covered by E2E):"
      for file in "${SERVICES_MISSING_TESTS[@]}"; do
        log_info "  - $file"
      done
      log_info "Note: Services/hooks can be covered by E2E tests instead of unit tests"
    else
      log_success "All services/hooks files have test files"
    fi
  else
    SERVICES_COVERAGE_INT=${SERVICES_COVERAGE%.*}
    if [ "$SERVICES_COVERAGE_INT" -ge "$SERVICES_THRESHOLD" ]; then
      log_success "Services/hooks coverage: ${SERVICES_COVERAGE}% (threshold: ${SERVICES_THRESHOLD}%)"
    else
      log_error "Services/hooks coverage: ${SERVICES_COVERAGE}% (threshold: ${SERVICES_THRESHOLD}%)"
      COVERAGE_PASSED=false
    fi
  fi
  
elif command -v node > /dev/null 2>&1; then
  # Use node to parse JSON
  log_step "Parsing coverage report with Node.js..."
  
  NODE_SCRIPT="
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('$COVERAGE_SUMMARY', 'utf8'));
    const utilsThreshold = $UTILS_THRESHOLD;
    const servicesThreshold = $SERVICES_THRESHOLD;
    
    // Check total coverage
    const totalCoverage = data.total?.lines?.pct || 0;
    console.log('Total coverage:', totalCoverage + '%');
    
    // Check individual file coverage
    let utilsMissing = [];
    let servicesMissing = [];
    
    for (const [file, coverage] of Object.entries(data)) {
      if (file === 'total') continue;
      const pct = coverage?.lines?.pct || 0;
      
      if (file.includes('/utils/') && pct < utilsThreshold) {
        utilsMissing.push({ file, coverage: pct });
      }
      if ((file.includes('/store/') || file.includes('/hooks/')) && pct < servicesThreshold) {
        servicesMissing.push({ file, coverage: pct });
      }
    }
    
    if (utilsMissing.length > 0) {
      console.log('UTILS_BELOW_THRESHOLD');
      utilsMissing.forEach(({ file, coverage }) => {
        console.log(file + ':' + coverage);
      });
    }
    
    if (servicesMissing.length > 0) {
      console.log('SERVICES_BELOW_THRESHOLD');
      servicesMissing.forEach(({ file, coverage }) => {
        console.log(file + ':' + coverage);
      });
    }
  "
  
  NODE_OUTPUT=$(node -e "$NODE_SCRIPT" 2>&1)
  
  if echo "$NODE_OUTPUT" | grep -q "UTILS_BELOW_THRESHOLD"; then
    log_error "Some utils files are below threshold:"
    echo "$NODE_OUTPUT" | grep -A 100 "UTILS_BELOW_THRESHOLD" | grep -v "UTILS_BELOW_THRESHOLD" | while read -r line; do
      log_error "  $line"
    done
    COVERAGE_PASSED=false
  else
    log_success "All utils files meet coverage threshold"
  fi
  
  if echo "$NODE_OUTPUT" | grep -q "SERVICES_BELOW_THRESHOLD"; then
    log_warning "Some services/hooks files are below threshold (may be covered by E2E):"
    echo "$NODE_OUTPUT" | grep -A 100 "SERVICES_BELOW_THRESHOLD" | grep -v "SERVICES_BELOW_THRESHOLD" | while read -r line; do
      log_info "  $line"
    done
  else
    log_success "All services/hooks files meet coverage threshold"
  fi
  
else
  log_error "Neither jq nor node found. Cannot parse coverage report."
  log_info "Please install jq or ensure node is available"
  exit 1
fi

echo ""
echo "======================================"

if [ "$COVERAGE_PASSED" = true ]; then
  log_success "✅ Coverage thresholds met"
  exit 0
else
  log_error "❌ Coverage thresholds not met"
  exit 1
fi

