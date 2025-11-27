#!/bin/bash

# ============================================================================
# Verify Release Branch Content
# ============================================================================
# Verifies that release branch only contains code covered by locked E2E tests
# This ensures we're not checking in unwanted code or unit tests
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/release-branch-helpers.sh"

check_project_root

echo ""
log_step "Verifying Release Branch Content"
echo "===================================="
echo ""

# Analyze coverage
COVERAGE_FILE="$PROJECT_ROOT/.release-coverage/locked-e2e-coverage.json"
if ! bash "$SCRIPT_DIR/analyze-locked-test-coverage.sh" --output="$COVERAGE_FILE" 2>/dev/null; then
  log_error "Failed to analyze coverage"
  exit 1
fi

if [ ! -f "$COVERAGE_FILE" ] || ! command -v jq > /dev/null 2>&1; then
  log_error "Coverage file not found or jq not available"
  exit 1
fi

# Get covered code
COVERED_STORES=$(jq -r '.stores[]' "$COVERAGE_FILE" 2>/dev/null | grep -v '^$' || echo "")
COVERED_UTILS=$(jq -r '.utils[]' "$COVERAGE_FILE" 2>/dev/null | grep -v '^$' || echo "")
COVERED_HOOKS=$(jq -r '.hooks[]' "$COVERAGE_FILE" 2>/dev/null | grep -v '^$' || echo "")
COVERED_COMPONENTS=$(jq -r '.components[]' "$COVERAGE_FILE" 2>/dev/null | grep -v '^$' || echo "")
COVERED_PAGES=$(jq -r '.pages[]' "$COVERAGE_FILE" 2>/dev/null | grep -v '^$' || echo "")

# Get all test files in the repo
ALL_TEST_FILES=$(find "$FRONTEND_DIR/src" -type f \( -name "*.test.ts" -o -name "*.test.tsx" \) 2>/dev/null | sed "s|^$PROJECT_ROOT/||" || echo "")

# Get expected test files (only for covered code)
EXPECTED_TEST_FILES=""
ALL_COVERED="$COVERED_STORES"$'\n'"$COVERED_UTILS"$'\n'"$COVERED_HOOKS"$'\n'"$COVERED_COMPONENTS"$'\n'"$COVERED_PAGES"

for covered_file in $ALL_COVERED; do
  [ -z "$covered_file" ] && continue
  
  FILE_DIR=$(dirname "$covered_file")
  FILE_NAME=$(basename "$covered_file" .tsx | sed 's/\.ts$//')
  
  # Check for test files
  TEST_FILE1="${covered_file%.ts}.test.ts"
  TEST_FILE2="${covered_file%.tsx}.test.tsx"
  TEST_FILE3="${FILE_DIR}/__tests__/${FILE_NAME}.test.ts"
  TEST_FILE4="${FILE_DIR}/__tests__/${FILE_NAME}.test.tsx"
  
  for test_file in "$TEST_FILE1" "$TEST_FILE2" "$TEST_FILE3" "$TEST_FILE4"; do
    if [ -f "$PROJECT_ROOT/$test_file" ]; then
      EXPECTED_TEST_FILES="$EXPECTED_TEST_FILES"$'\n'"$test_file"
    fi
  done
done

EXPECTED_TEST_FILES=$(echo "$EXPECTED_TEST_FILES" | grep -v '^$' | sort -u)

# Find unwanted test files (tests not for covered code)
UNWANTED_TEST_FILES=""
for test_file in $ALL_TEST_FILES; do
  [ -z "$test_file" ] && continue
  
  # Check if this test is for covered code
  IS_COVERED_TEST=false
  
  # Extract the source file name this test is for
  TEST_NAME=$(basename "$test_file" .test.ts | sed 's/\.test\.tsx$//')
  TEST_DIR=$(dirname "$test_file")
  
  # Check if this test file matches any covered file
  for covered_file in $ALL_COVERED; do
    [ -z "$covered_file" ] && continue
    
    COVERED_NAME=$(basename "$covered_file" .ts | sed 's/\.tsx$//')
    COVERED_DIR=$(dirname "$covered_file")
    
    # Match by name and directory structure
    if [[ "$TEST_NAME" == "$COVERED_NAME" ]]; then
      # Check if directories match (allowing for __tests__ subdirectory)
      if [[ "$TEST_DIR" == "$COVERED_DIR" ]] || [[ "$TEST_DIR" == "$COVERED_DIR/__tests__" ]]; then
        IS_COVERED_TEST=true
        break
      fi
    fi
  done
  
  if [ "$IS_COVERED_TEST" = false ]; then
    # Check if it's in the expected list
    if ! echo "$EXPECTED_TEST_FILES" | grep -q "^$test_file$"; then
      UNWANTED_TEST_FILES="$UNWANTED_TEST_FILES"$'\n'"$test_file"
    fi
  fi
done

UNWANTED_TEST_FILES=$(echo "$UNWANTED_TEST_FILES" | grep -v '^$' | sort -u)

# Report
log_info "Covered Code Summary:"
log_info "  - Stores: $(echo "$COVERED_STORES" | grep -v '^$' | wc -l | tr -d ' ')"
log_info "  - Utils: $(echo "$COVERED_UTILS" | grep -v '^$' | wc -l | tr -d ' ')"
log_info "  - Hooks: $(echo "$COVERED_HOOKS" | grep -v '^$' | wc -l | tr -d ' ')"
log_info "  - Components: $(echo "$COVERED_COMPONENTS" | grep -v '^$' | wc -l | tr -d ' ')"
log_info "  - Pages: $(echo "$COVERED_PAGES" | grep -v '^$' | wc -l | tr -d ' ')"
echo ""

log_info "Expected Test Files: $(echo "$EXPECTED_TEST_FILES" | grep -v '^$' | wc -l | tr -d ' ')"
log_info "Total Test Files in Repo: $(echo "$ALL_TEST_FILES" | grep -v '^$' | wc -l | tr -d ' ')"
echo ""

if [ -n "$UNWANTED_TEST_FILES" ]; then
  log_error "UNWANTED TEST FILES FOUND (not for covered code):"
  echo "$UNWANTED_TEST_FILES" | while read -r test_file; do
    [ -z "$test_file" ] && continue
    log_error "  ✗ $test_file"
  done
  echo ""
  log_error "These test files should NOT be included in release branch"
  exit 1
else
  log_success "No unwanted test files found"
  log_success "All test files are for code covered by locked E2E tests"
fi

echo ""
log_success "Release branch content verification passed"
echo ""

