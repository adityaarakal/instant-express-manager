#!/bin/bash

# ============================================================================
# Locked Test Coverage Mapper
# ============================================================================
# Identifies all code covered by locked tests and generates a coverage map
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
log_step "Mapping Locked Test Coverage"
echo "================================"
echo ""

# Create output directory
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Get locked tests
LOCKED_TESTS=$(get_locked_tests)

if [ -z "$LOCKED_TESTS" ]; then
  log_error "No locked tests found"
  exit 1
fi

log_info "Found locked tests:"
LOCKED_COUNT=0
LOCKED_ARRAY=()

while IFS= read -r test_file; do
  [ -z "$test_file" ] && continue
  # Clean up path (remove any absolute path prefixes)
  CLEAN_PATH=$(echo "$test_file" | sed "s|^$PROJECT_ROOT/||" | sed "s|^frontend/frontend/|frontend/|")
  log_info "  - $CLEAN_PATH"
  LOCKED_ARRAY+=("$CLEAN_PATH")
  ((LOCKED_COUNT++))
done <<< "$LOCKED_TESTS"

echo ""

# Map tests to code files
log_step "Mapping tests to source code..."

# Initialize coverage map
COVERAGE_MAP=$(cat <<EOF
{
  "locked_tests": [],
  "covered_files": {
    "components": [],
    "utils": [],
    "stores": [],
    "hooks": [],
    "services": [],
    "types": [],
    "other": []
  },
  "generated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)

# Parse each locked test file to identify covered code
for test_file in "${LOCKED_ARRAY[@]}"; do
  FULL_PATH="$PROJECT_ROOT/$test_file"
  
  if [ ! -f "$FULL_PATH" ]; then
    log_warning "Test file not found: $test_file"
    continue
  fi
  
  log_info "Analyzing: $test_file"
  
  # Extract test file name without extension
  TEST_NAME=$(basename "$test_file" .spec.ts)
  
  # Map common test patterns to source files
  # This is a simplified mapping - can be enhanced with AST parsing
  
  # Banks test -> banks-related files
  if [[ "$test_file" == *"banks.spec.ts" ]]; then
    # Add banks-related files
    find "$FRONTEND_DIR/src" -type f \( -name "*bank*" -o -name "*Bank*" \) ! -name "*.test.*" ! -name "*.spec.*" 2>/dev/null | \
      sed "s|^$PROJECT_ROOT/||" | while read -r file; do
        # Categorize file
        if [[ "$file" == *"/components/"* ]]; then
          echo "components:$file"
        elif [[ "$file" == *"/utils/"* ]]; then
          echo "utils:$file"
        elif [[ "$file" == *"/store/"* ]]; then
          echo "stores:$file"
        elif [[ "$file" == *"/hooks/"* ]]; then
          echo "hooks:$file"
        else
          echo "other:$file"
        fi
      done
  fi
  
  # Bank accounts test -> bank-accounts-related files
  if [[ "$test_file" == *"bank-accounts.spec.ts" ]]; then
    # Add bank-accounts-related files
    find "$FRONTEND_DIR/src" -type f \( -name "*bank*account*" -o -name "*BankAccount*" -o -name "*account*" \) ! -name "*.test.*" ! -name "*.spec.*" 2>/dev/null | \
      sed "s|^$PROJECT_ROOT/||" | while read -r file; do
        # Categorize file
        if [[ "$file" == *"/components/"* ]]; then
          echo "components:$file"
        elif [[ "$file" == *"/utils/"* ]]; then
          echo "utils:$file"
        elif [[ "$file" == *"/store/"* ]]; then
          echo "stores:$file"
        elif [[ "$file" == *"/hooks/"* ]]; then
          echo "hooks:$file"
        else
          echo "other:$file"
        fi
      done
  fi
done > /tmp/coverage-map-temp.txt

# Build JSON structure using node or jq
if command -v node > /dev/null 2>&1; then
  log_step "Building coverage map JSON..."
  
  NODE_SCRIPT="
    const fs = require('fs');
    const path = require('path');
    
    const lockedTests = $(printf '%s\n' "${LOCKED_ARRAY[@]}" | jq -R . | jq -s . 2>/dev/null || echo '[]');
    const coverageData = {};
    const categories = ['components', 'utils', 'stores', 'hooks', 'services', 'types', 'other'];
    
    categories.forEach(cat => {
      coverageData[cat] = [];
    });
    
    // Read temp file and categorize
    try {
      const tempData = fs.readFileSync('/tmp/coverage-map-temp.txt', 'utf8');
      const lines = tempData.split('\\n').filter(l => l.trim());
      const fileSet = new Set();
      
      lines.forEach(line => {
        const [category, file] = line.split(':');
        if (category && file && !fileSet.has(file)) {
          fileSet.add(file);
          if (coverageData[category]) {
            coverageData[category].push(file);
          } else {
            coverageData.other.push(file);
          }
        }
      });
    } catch (e) {
      // Temp file might not exist, that's okay
    }
    
    const result = {
      locked_tests: lockedTests,
      covered_files: coverageData,
      generated_at: new Date().toISOString()
    };
    
    console.log(JSON.stringify(result, null, 2));
  "
  
  echo "$NODE_SCRIPT" | node > "$OUTPUT_FILE"
  
elif command -v jq > /dev/null 2>&1; then
  log_step "Building coverage map JSON with jq..."
  
  # Build JSON manually with jq
  {
    echo '{'
    echo '  "locked_tests": ['
    for i in "${!LOCKED_ARRAY[@]}"; do
      if [ $i -gt 0 ]; then
        echo ','
      fi
      echo -n "    \"${LOCKED_ARRAY[$i]}\""
    done
    echo ''
    echo '  ],'
    echo '  "covered_files": {'
    echo '    "components": [],'
    echo '    "utils": [],'
    echo '    "stores": [],'
    echo '    "hooks": [],'
    echo '    "services": [],'
    echo '    "types": [],'
    echo '    "other": []'
    echo '  },'
    echo "  \"generated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\""
    echo '}'
  } | jq . > "$OUTPUT_FILE"
  
else
  log_error "Neither node nor jq found. Cannot generate JSON."
  exit 1
fi

# Cleanup
rm -f /tmp/coverage-map-temp.txt

log_success "Coverage map generated: $OUTPUT_FILE"

# Show summary
TOTAL_FILES=$(jq '[.covered_files | to_entries[] | .value[]] | length' "$OUTPUT_FILE" 2>/dev/null || echo "0")

echo ""
log_step "Coverage Map Summary"
echo "======================"
log_info "Locked tests: $LOCKED_COUNT"
log_info "Covered files: $TOTAL_FILES"
echo ""
log_info "Coverage map saved to: $OUTPUT_FILE"
echo ""

