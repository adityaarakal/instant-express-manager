#!/bin/bash

# ============================================================================
# Locked Test Coverage Mapper
# ============================================================================
# Identifies all code covered by locked E2E tests and generates a coverage map
# Uses analyze-locked-test-coverage.sh to get comprehensive coverage
#
# Usage:
#   bash scripts/map-locked-test-coverage.sh [--output=coverage-map.json]
#
# Output:
#   JSON file mapping locked tests to source code files
# ============================================================================

set -e

# Source helper functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/release-branch-helpers.sh"

OUTPUT_FILE="$PROJECT_ROOT/.release-coverage/locked-tests-coverage.json"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --output=*)
      OUTPUT_FILE="${1#*=}"
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      echo "Usage: bash scripts/map-locked-test-coverage.sh [--output=coverage-map.json]"
      exit 1
      ;;
  esac
done

check_project_root

echo ""
log_step "Mapping Locked E2E Test Coverage"
echo "====================================="
echo ""

# Use the comprehensive analysis script
log_info "Running comprehensive E2E test coverage analysis..."
ANALYSIS_OUTPUT="$PROJECT_ROOT/.release-coverage/locked-e2e-coverage.json"

if bash "$SCRIPT_DIR/analyze-locked-test-coverage.sh" --output="$ANALYSIS_OUTPUT"; then
  log_success "Coverage analysis completed"
else
  log_error "Coverage analysis failed"
  exit 1
fi

# Convert to the format expected by release branch manager
if [ -f "$ANALYSIS_OUTPUT" ]; then
  log_step "Converting to release branch format..."
  
  if command -v jq > /dev/null 2>&1; then
    jq '{
      locked_tests: .locked_tests,
      covered_files: {
        pages: .pages,
        components: .components,
        stores: .stores,
        utils: .utils,
        hooks: .hooks,
        types: .types,
        routes: .routes
      },
      generated_at: .generated_at
    }' "$ANALYSIS_OUTPUT" > "$OUTPUT_FILE"
    
    log_success "Coverage map generated: $OUTPUT_FILE"
    
    # Show summary
    TOTAL_FILES=$(jq '[.covered_files | to_entries[] | .value[]] | length' "$OUTPUT_FILE" 2>/dev/null || echo "0")
    LOCKED_COUNT=$(jq '.locked_tests | length' "$OUTPUT_FILE" 2>/dev/null || echo "0")
    
    echo ""
    log_step "Coverage Map Summary"
    echo "======================"
    log_info "Locked tests: $LOCKED_COUNT"
    log_info "Pages: $(jq '.covered_files.pages | length' "$OUTPUT_FILE" 2>/dev/null || echo "0")"
    log_info "Components: $(jq '.covered_files.components | length' "$OUTPUT_FILE" 2>/dev/null || echo "0")"
    log_info "Stores: $(jq '.covered_files.stores | length' "$OUTPUT_FILE" 2>/dev/null || echo "0")"
    log_info "Utils: $(jq '.covered_files.utils | length' "$OUTPUT_FILE" 2>/dev/null || echo "0")"
    log_info "Hooks: $(jq '.covered_files.hooks | length' "$OUTPUT_FILE" 2>/dev/null || echo "0")"
    log_info "Types: $(jq '.covered_files.types | length' "$OUTPUT_FILE" 2>/dev/null || echo "0")"
    log_info "Total files: $TOTAL_FILES"
    echo ""
  else
    log_error "jq not found. Cannot convert coverage format."
    exit 1
  fi
else
  log_error "Coverage analysis file not found: $ANALYSIS_OUTPUT"
  exit 1
fi

