#!/bin/bash

# ============================================================================
# Module-Based Playwright Test Runner
# ============================================================================
# This script detects which modules have changed in the current PR/branch
# and runs only the relevant Playwright tests for those modules plus global modules.
#
# Global modules (always run): dashboard, settings
# Module-specific tests: Only run if that module's code has changed
#
# Usage:
#   bash scripts/run-module-tests.sh [--all] [--module=module-name]
#
# Options:
#   --all          Run all tests regardless of changes
#   --module=name  Run tests for specific module only
#
# Note: Tests run to completion and auto-exit. Ctrl+C is ignored during execution.
# ============================================================================

set -e

# Ignore Ctrl+C during script execution - tests must complete
trap '' SIGINT SIGTERM

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global modules that always run tests
GLOBAL_MODULES="dashboard settings"

# Function to get test file for a module
get_test_file() {
  local module=$1
  case $module in
    dashboard) echo "dashboard.spec.ts" ;;
    settings) echo "settings.spec.ts" ;;
    banks) echo "banks.spec.ts" ;;
    accounts) echo "accounts.spec.ts" ;;
    transactions) echo "transactions.spec.ts" ;;
    emis) echo "emis.spec.ts" ;;
    recurring) echo "recurring.spec.ts" ;;
    planner) echo "planner.spec.ts" ;;
    analytics) echo "analytics.spec.ts" ;;
    forecasting) echo "forecasting.spec.ts" ;;
    credit-cards) echo "credit-cards.spec.ts" ;;
    *) echo "" ;;
  esac
}

# Function to detect module from file path
detect_module_from_path() {
  local file=$1
  case $file in
    *pages/Dashboard*|*components/dashboard*|*store/useDashboardStore*) echo "dashboard" ;;
    *pages/Settings*|*components/settings*|*store/useSettingsStore*) echo "settings" ;;
    *pages/Banks*|*components/banks*|*store/useBanksStore*) echo "banks" ;;
    *pages/BankAccounts*|*components/accounts*|*store/useAccountsStore*) echo "accounts" ;;
    *pages/Transactions*|*components/transactions*|*store/useTransactionsStore*) echo "transactions" ;;
    *pages/EMIs*|*components/emis*|*store/useEMIsStore*) echo "emis" ;;
    *pages/Recurring*|*components/recurring*|*store/useRecurringStore*) echo "recurring" ;;
    *pages/Planner*|*components/planner*|*store/usePlannerStore*) echo "planner" ;;
    *pages/Analytics*|*components/analytics*|*store/useAnalyticsStore*) echo "analytics" ;;
    *pages/Forecasting*|*components/forecasting*|*store/useForecastingStore*) echo "forecasting" ;;
    *pages/CreditCardDashboard*|*components/credit-cards*|*store/useCreditCardStore*) echo "credit-cards" ;;
    *) echo "" ;;
  esac
}

# Function to check if module is in list
module_in_list() {
  local module=$1
  local list=$2
  for m in $list; do
    if [ "$m" = "$module" ]; then
      return 0
    fi
  done
  return 1
}

# Function to detect changed modules
detect_changed_modules() {
  local changed_files
  local modules_found=""
  
  # Get changed files (staged + modified)
  if [ -n "$CI" ] && [ -n "$GITHUB_BASE_REF" ]; then
    # CI environment: compare with base branch
    changed_files=$(git diff --name-only origin/$GITHUB_BASE_REF...HEAD 2>/dev/null || git diff --name-only main...HEAD 2>/dev/null || echo "")
  else
    # Local environment: check staged and modified files
    changed_files=$(git diff --name-only --cached HEAD 2>/dev/null || echo "")
    changed_files="$changed_files"$'\n'$(git diff --name-only HEAD 2>/dev/null || echo "")
  fi
  
  # If no changes detected, check all files in current commit
  if [ -z "$changed_files" ] || [ -z "$(echo "$changed_files" | tr -d '\n')" ]; then
    changed_files=$(git diff-tree --no-commit-id --name-only -r HEAD 2>/dev/null || echo "")
  fi
  
  # Check each changed file
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    
    # Check for shared/common changes - these affect all modules
    if echo "$file" | grep -qE "frontend/src/(components/common|providers|utils|hooks|theme|App\.tsx|main\.tsx)"; then
      echo "all_modules" > /tmp/test_modules.txt
      return 0
    fi
    
    # Detect module from file path
    local module=$(detect_module_from_path "$file")
    if [ -n "$module" ]; then
      if ! module_in_list "$module" "$modules_found"; then
        modules_found="$modules_found $module"
      fi
    fi
    
    # Check route changes
    if echo "$file" | grep -q "frontend/src/routes"; then
      if echo "$file" | grep -qi "dashboard"; then
        if ! module_in_list "dashboard" "$modules_found"; then
          modules_found="$modules_found dashboard"
        fi
      fi
      if echo "$file" | grep -qi "settings"; then
        if ! module_in_list "settings" "$modules_found"; then
          modules_found="$modules_found settings"
        fi
      fi
    fi
  done <<< "$changed_files"
  
  # Always include global modules
  for global in $GLOBAL_MODULES; do
    if ! module_in_list "$global" "$modules_found"; then
      modules_found="$modules_found $global"
    fi
  done
  
  # Save modules to temp file
  echo "$modules_found" | tr ' ' '\n' | grep -v '^$' > /tmp/test_modules.txt
}

# Function to get test files for modules
get_test_files() {
  local modules="$@"
  local test_files=""
  
  for module in $modules; do
    local test_file_name=$(get_test_file "$module")
    if [ -n "$test_file_name" ]; then
      local test_file="frontend/e2e/modules/$test_file_name"
      if [ -f "$test_file" ]; then
        test_files="$test_files $test_file"
      else
        echo -e "${YELLOW}⚠️  Warning: Test file not found for module '$module': $test_file${NC}" >&2
      fi
    fi
  done
  
  echo "$test_files" | tr ' ' '\n' | grep -v '^$'
}

# Parse command line arguments
RUN_ALL=false
SPECIFIC_MODULE=""

while [ $# -gt 0 ]; do
  case $1 in
    --all)
      RUN_ALL=true
      shift
      ;;
    --module=*)
      SPECIFIC_MODULE="${1#*=}"
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--all] [--module=module-name]"
      exit 1
      ;;
  esac
done

# Main execution
echo -e "${BLUE}🧪 Module-Based Playwright Test Runner${NC}"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
  echo -e "${RED}Error: Must run from project root${NC}"
  exit 1
fi

# Determine which modules to test
if [ "$RUN_ALL" = "true" ]; then
  echo -e "${BLUE}📋 Running all module tests (--all flag)${NC}"
  MODULES_TO_TEST="dashboard settings banks accounts transactions emis recurring planner analytics forecasting credit-cards"
elif [ -n "$SPECIFIC_MODULE" ]; then
  echo -e "${BLUE}📋 Running tests for specific module: $SPECIFIC_MODULE${NC}"
  MODULES_TO_TEST="$SPECIFIC_MODULE"
  # Always include global modules
  for global in $GLOBAL_MODULES; do
    if ! module_in_list "$global" "$MODULES_TO_TEST"; then
      MODULES_TO_TEST="$MODULES_TO_TEST $global"
    fi
  done
else
  echo -e "${BLUE}📋 Detecting changed modules...${NC}"
  detect_changed_modules
  
  if [ -f /tmp/test_modules.txt ]; then
    if grep -q "all_modules" /tmp/test_modules.txt; then
      echo -e "${YELLOW}⚠️  Shared code changed - running all module tests${NC}"
      MODULES_TO_TEST="dashboard settings banks accounts transactions emis recurring planner analytics forecasting credit-cards"
    else
      MODULES_TO_TEST=$(cat /tmp/test_modules.txt | tr '\n' ' ')
      echo -e "${GREEN}✅ Detected modules: $MODULES_TO_TEST${NC}"
    fi
    rm -f /tmp/test_modules.txt
  else
    echo -e "${YELLOW}⚠️  No changed modules detected - running global modules only${NC}"
    MODULES_TO_TEST="$GLOBAL_MODULES"
  fi
fi

# Get test files
TEST_FILES=$(get_test_files $MODULES_TO_TEST)

if [ -z "$TEST_FILES" ]; then
  echo -e "${YELLOW}⚠️  No test files found for selected modules${NC}"
  echo -e "${GREEN}✅ Skipping tests (no tests to run)${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}📋 Test files to run:${NC}"
for file in $TEST_FILES; do
  echo "  - $file"
done
echo ""

# Check if dev server is running
if ! curl -s http://localhost:7001 > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Dev server not running on port 7001${NC}"
  echo -e "${YELLOW}   Tests will start the dev server automatically${NC}"
fi

# Run Playwright tests
echo -e "${BLUE}🚀 Running Playwright tests...${NC}"
echo ""

cd frontend

# Build test file pattern for Playwright
# Playwright uses file paths, so we need to convert to relative paths
TEST_PATTERNS=""
for file in $TEST_FILES; do
  # Convert frontend/e2e/modules/dashboard.spec.ts to e2e/modules/dashboard.spec.ts
  rel_path=$(echo "$file" | sed 's|^frontend/||')
  TEST_PATTERNS="$TEST_PATTERNS $rel_path"
done

# Run tests with Playwright (Chromium only for speed in pre-commit)
# Playwright accepts multiple file patterns - run all at once to avoid multiple server starts
# Set up signal handling to prevent interruption during test execution
TEST_EXIT_CODE=0
if [ -n "$TEST_PATTERNS" ]; then
  # Build command with all test patterns
  # Set PRE_COMMIT env var to use list reporter (auto-exits, no HTML viewer)
  export PRE_COMMIT=1
  TEST_CMD="npm run test:e2e -- --project=chromium"
  for pattern in $TEST_PATTERNS; do
    TEST_CMD="$TEST_CMD $pattern"
  done
  
  echo -e "${BLUE}  Running tests for: $TEST_PATTERNS${NC}"
  echo -e "${YELLOW}  ⚠️  Tests will run to completion and auto-exit (Ctrl+C ignored during execution)${NC}"
  
  # Run tests - they will auto-exit when done
  # The trap at the top of the script ensures Ctrl+C is ignored
  # PRE_COMMIT=1 ensures list reporter is used (no HTML viewer, auto-exits)
  if eval "$TEST_CMD" 2>&1; then
    TEST_EXIT_CODE=0
  else
    TEST_EXIT_CODE=1
  fi
else
  echo -e "${YELLOW}⚠️  No test patterns to run${NC}"
  TEST_EXIT_CODE=0
fi

cd ..

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ All module tests passed!${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}❌ Some module tests failed!${NC}"
  echo -e "${RED}   Please fix the failing tests before committing${NC}"
  exit 1
fi
