#!/bin/bash

# ============================================================================
# Analyze Locked E2E Test Coverage
# ============================================================================
# Analyzes locked E2E tests to identify all UI/UX/storage code they touch
# This includes: pages, components, stores, utils, hooks, types, routes
#
# Usage:
#   bash scripts/analyze-locked-test-coverage.sh [--output=coverage.json]
#
# Output:
#   JSON file with complete code coverage map from locked E2E tests
# ============================================================================

set -e

# Source helper functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/release-branch-helpers.sh"

OUTPUT_FILE="$PROJECT_ROOT/.release-coverage/locked-e2e-coverage.json"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --output=*)
      OUTPUT_FILE="${1#*=}"
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      echo "Usage: bash scripts/analyze-locked-test-coverage.sh [--output=coverage.json]"
      exit 1
      ;;
  esac
done

check_project_root

echo ""
log_step "Analyzing Locked E2E Test Coverage"
echo "======================================"
echo ""

# Create output directory
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Get locked tests
LOCKED_TESTS=$(get_locked_tests)

if [ -z "$LOCKED_TESTS" ]; then
  log_error "No locked tests found"
  exit 1
fi

log_info "Found locked E2E tests:"
LOCKED_ARRAY=()
while IFS= read -r test_file; do
  [ -z "$test_file" ] && continue
  CLEAN_PATH=$(echo "$test_file" | sed "s|^$PROJECT_ROOT/||" | sed "s|^frontend/frontend/|frontend/|")
  log_info "  - $CLEAN_PATH"
  LOCKED_ARRAY+=("$CLEAN_PATH")
done <<< "$LOCKED_TESTS"
echo ""

# Initialize coverage map
COVERED_PAGES=()
COVERED_COMPONENTS=()
COVERED_STORES=()
COVERED_UTILS=()
COVERED_HOOKS=()
COVERED_TYPES=()
COVERED_ROUTES=()

# Analyze each locked test
for test_file in "${LOCKED_ARRAY[@]}"; do
  FULL_PATH="$PROJECT_ROOT/$test_file"
  
  if [ ! -f "$FULL_PATH" ]; then
    log_warning "Test file not found: $test_file"
    continue
  fi
  
  log_info "Analyzing: $test_file"
  
  # Extract test name
  TEST_NAME=$(basename "$test_file" .spec.ts)
  
  # Analyze routes used in E2E test
  ROUTES=$(grep -E "goto\(['\"]|toHaveURL" "$FULL_PATH" | grep -oE "['\"](/[^'\"]+)['\"]" | sed "s|['\"]||g" | sort -u || echo "")
  
  # Map routes to pages
  for route in $ROUTES; do
    case "$route" in
      /banks|/banks/*)
        COVERED_PAGES+=("frontend/src/pages/Banks.tsx")
        COVERED_ROUTES+=("/banks")
        ;;
      /accounts|/accounts/*)
        COVERED_PAGES+=("frontend/src/pages/BankAccounts.tsx")
        COVERED_ROUTES+=("/accounts")
        ;;
    esac
  done
  
  # Analyze helper files used
  HELPER_IMPORTS=$(grep -E "^import.*from.*helpers" "$FULL_PATH" | grep -oE "helpers/[^'\"]+" | sort -u || echo "")
  
  for helper in $HELPER_IMPORTS; do
    HELPER_FILE="frontend/e2e/$helper.ts"
    if [ -f "$PROJECT_ROOT/$HELPER_FILE" ]; then
      # Analyze what the helper touches
      HELPER_ROUTES=$(grep -E "goto\(['\"]" "$PROJECT_ROOT/$HELPER_FILE" | grep -oE "['\"](/[^'\"]+)['\"]" | sed "s|['\"]||g" | sort -u || echo "")
      for route in $HELPER_ROUTES; do
        case "$route" in
          /banks|/banks/*)
            COVERED_PAGES+=("frontend/src/pages/Banks.tsx")
            COVERED_ROUTES+=("/banks")
            ;;
          /accounts|/accounts/*)
            COVERED_PAGES+=("frontend/src/pages/BankAccounts.tsx")
            COVERED_ROUTES+=("/accounts")
            ;;
        esac
      done
    fi
  done
  
  # Map test names to specific stores/components
  if [[ "$test_file" == *"banks.spec.ts" ]]; then
    COVERED_STORES+=("frontend/src/store/useBanksStore.ts")
    COVERED_PAGES+=("frontend/src/pages/Banks.tsx")
  fi
  
  if [[ "$test_file" == *"bank-accounts.spec.ts" ]]; then
    COVERED_STORES+=("frontend/src/store/useBankAccountsStore.ts")
    COVERED_STORES+=("frontend/src/store/useBanksStore.ts")
    COVERED_PAGES+=("frontend/src/pages/BankAccounts.tsx")
  fi
done

# For each covered page, find its dependencies
for page in "${COVERED_PAGES[@]}"; do
  PAGE_PATH="$PROJECT_ROOT/$page"
  if [ ! -f "$PAGE_PATH" ]; then
    continue
  fi
  
  log_info "Analyzing dependencies of: $page"
  
  # Find imports from src/
  IMPORTS=$(grep -E "^import.*from ['\"]\.\.?/" "$PAGE_PATH" | grep -oE "from ['\"](\.\.?/[^'\"]+)" | sed "s|from ['\"]\.\.?/||" | sed "s|['\"]||g" | sort -u || echo "")
  
  for import in $IMPORTS; do
    # Resolve import path
    IMPORT_DIR=$(dirname "$page")
    RESOLVED_PATH=$(echo "$IMPORT_DIR/$import" | sed 's|/[^/]*/\.\./|/|g' | sed 's|/\./|/|g')
    
    # Check if it's a store
    if [[ "$RESOLVED_PATH" == *"/store/"* ]] && [[ "$RESOLVED_PATH" == *.ts ]]; then
      STORE_FILE="${RESOLVED_PATH%.ts}.ts"
      if [ -f "$PROJECT_ROOT/$STORE_FILE" ]; then
        COVERED_STORES+=("$STORE_FILE")
      fi
    fi
    
    # Check if it's a component
    if [[ "$RESOLVED_PATH" == *"/components/"* ]]; then
      COMPONENT_FILE="${RESOLVED_PATH%.tsx}.tsx"
      COMPONENT_FILE_TS="${RESOLVED_PATH%.ts}.ts"
      if [ -f "$PROJECT_ROOT/$COMPONENT_FILE" ]; then
        COVERED_COMPONENTS+=("$COMPONENT_FILE")
      elif [ -f "$PROJECT_ROOT/$COMPONENT_FILE_TS" ]; then
        COVERED_COMPONENTS+=("$COMPONENT_FILE_TS")
      fi
    fi
    
    # Check if it's a util
    if [[ "$RESOLVED_PATH" == *"/utils/"* ]] && [[ "$RESOLVED_PATH" == *.ts ]]; then
      UTIL_FILE="${RESOLVED_PATH%.ts}.ts"
      if [ -f "$PROJECT_ROOT/$UTIL_FILE" ]; then
        COVERED_UTILS+=("$UTIL_FILE")
      fi
    fi
    
    # Check if it's a hook
    if [[ "$RESOLVED_PATH" == *"/hooks/"* ]]; then
      HOOK_FILE="${RESOLVED_PATH%.tsx}.tsx"
      HOOK_FILE_TS="${RESOLVED_PATH%.ts}.ts"
      if [ -f "$PROJECT_ROOT/$HOOK_FILE" ]; then
        COVERED_HOOKS+=("$HOOK_FILE")
      elif [ -f "$PROJECT_ROOT/$HOOK_FILE_TS" ]; then
        COVERED_HOOKS+=("$HOOK_FILE_TS")
      fi
    fi
    
    # Check if it's a type
    if [[ "$RESOLVED_PATH" == *"/types/"* ]] && [[ "$RESOLVED_PATH" == *.ts ]]; then
      TYPE_FILE="${RESOLVED_PATH%.ts}.ts"
      if [ -f "$PROJECT_ROOT/$TYPE_FILE" ]; then
        COVERED_TYPES+=("$TYPE_FILE")
      fi
    fi
  done
done

# Recursively find dependencies of stores/utils/components
find_dependencies() {
  local file="$1"
  local visited="$2"
  
  if echo "$visited" | grep -q "$file"; then
    return 0
  fi
  visited="$visited|$file"
  
  if [ ! -f "$PROJECT_ROOT/$file" ]; then
    return 0
  fi
  
  # Find imports from src/
  IMPORTS=$(grep -E "^import.*from ['\"]\.\.?/" "$PROJECT_ROOT/$file" 2>/dev/null | grep -oE "from ['\"](\.\.?/[^'\"]+)" | sed "s|from ['\"]\.\.?/||" | sed "s|['\"]||g" | sort -u || echo "")
  
  for import in $IMPORTS; do
    IMPORT_DIR=$(dirname "$file")
    RESOLVED_PATH=$(echo "$IMPORT_DIR/$import" | sed 's|/[^/]*/\.\./|/|g' | sed 's|/\./|/|g')
    
    # Only track src/ files
    if [[ "$RESOLVED_PATH" != frontend/src/* ]]; then
      continue
    fi
    
    # Add to appropriate category
    if [[ "$RESOLVED_PATH" == *"/store/"* ]] && [[ "$RESOLVED_PATH" == *.ts ]]; then
      STORE_FILE="${RESOLVED_PATH%.ts}.ts"
      if [ -f "$PROJECT_ROOT/$STORE_FILE" ] && ! echo "${COVERED_STORES[@]}" | grep -q "$STORE_FILE"; then
        COVERED_STORES+=("$STORE_FILE")
        find_dependencies "$STORE_FILE" "$visited"
      fi
    elif [[ "$RESOLVED_PATH" == *"/utils/"* ]] && [[ "$RESOLVED_PATH" == *.ts ]]; then
      UTIL_FILE="${RESOLVED_PATH%.ts}.ts"
      if [ -f "$PROJECT_ROOT/$UTIL_FILE" ] && ! echo "${COVERED_UTILS[@]}" | grep -q "$UTIL_FILE"; then
        COVERED_UTILS+=("$UTIL_FILE")
        find_dependencies "$UTIL_FILE" "$visited"
      fi
    elif [[ "$RESOLVED_PATH" == *"/components/"* ]]; then
      COMPONENT_FILE="${RESOLVED_PATH%.tsx}.tsx"
      COMPONENT_FILE_TS="${RESOLVED_PATH%.ts}.ts"
      if [ -f "$PROJECT_ROOT/$COMPONENT_FILE" ] && ! echo "${COVERED_COMPONENTS[@]}" | grep -q "$COMPONENT_FILE"; then
        COVERED_COMPONENTS+=("$COMPONENT_FILE")
        find_dependencies "$COMPONENT_FILE" "$visited"
      elif [ -f "$PROJECT_ROOT/$COMPONENT_FILE_TS" ] && ! echo "${COVERED_COMPONENTS[@]}" | grep -q "$COMPONENT_FILE_TS"; then
        COVERED_COMPONENTS+=("$COMPONENT_FILE_TS")
        find_dependencies "$COMPONENT_FILE_TS" "$visited"
      fi
    elif [[ "$RESOLVED_PATH" == *"/hooks/"* ]]; then
      HOOK_FILE="${RESOLVED_PATH%.tsx}.tsx"
      HOOK_FILE_TS="${RESOLVED_PATH%.ts}.ts"
      if [ -f "$PROJECT_ROOT/$HOOK_FILE" ] && ! echo "${COVERED_HOOKS[@]}" | grep -q "$HOOK_FILE"; then
        COVERED_HOOKS+=("$HOOK_FILE")
        find_dependencies "$HOOK_FILE" "$visited"
      elif [ -f "$PROJECT_ROOT/$HOOK_FILE_TS" ] && ! echo "${COVERED_HOOKS[@]}" | grep -q "$HOOK_FILE_TS"; then
        COVERED_HOOKS+=("$HOOK_FILE_TS")
        find_dependencies "$HOOK_FILE_TS" "$visited"
      fi
    elif [[ "$RESOLVED_PATH" == *"/types/"* ]] && [[ "$RESOLVED_PATH" == *.ts ]]; then
      TYPE_FILE="${RESOLVED_PATH%.ts}.ts"
      if [ -f "$PROJECT_ROOT/$TYPE_FILE" ] && ! echo "${COVERED_TYPES[@]}" | grep -q "$TYPE_FILE"; then
        COVERED_TYPES+=("$TYPE_FILE")
      fi
    fi
  done
}

# Find all dependencies recursively
log_step "Finding dependencies recursively..."
for store in "${COVERED_STORES[@]}"; do
  find_dependencies "$store" ""
done
for util in "${COVERED_UTILS[@]}"; do
  find_dependencies "$util" ""
done
for component in "${COVERED_COMPONENTS[@]}"; do
  find_dependencies "$component" ""
done
for hook in "${COVERED_HOOKS[@]}"; do
  find_dependencies "$hook" ""
done

# Remove duplicates
COVERED_PAGES_UNIQUE=($(printf '%s\n' "${COVERED_PAGES[@]}" | sort -u))
COVERED_COMPONENTS_UNIQUE=($(printf '%s\n' "${COVERED_COMPONENTS[@]}" | sort -u))
COVERED_STORES_UNIQUE=($(printf '%s\n' "${COVERED_STORES[@]}" | sort -u))
COVERED_UTILS_UNIQUE=($(printf '%s\n' "${COVERED_UTILS[@]}" | sort -u))
COVERED_HOOKS_UNIQUE=($(printf '%s\n' "${COVERED_HOOKS[@]}" | sort -u))
COVERED_TYPES_UNIQUE=($(printf '%s\n' "${COVERED_TYPES[@]}" | sort -u))
COVERED_ROUTES_UNIQUE=($(printf '%s\n' "${COVERED_ROUTES[@]}" | sort -u))

# Build JSON output
if command -v node > /dev/null 2>&1; then
  NODE_SCRIPT="
    const coverage = {
      locked_tests: $(printf '%s\n' "${LOCKED_ARRAY[@]}" | jq -R . | jq -s . 2>/dev/null || echo '[]'),
      pages: $(printf '%s\n' "${COVERED_PAGES_UNIQUE[@]}" | jq -R . | jq -s . 2>/dev/null || echo '[]'),
      components: $(printf '%s\n' "${COVERED_COMPONENTS_UNIQUE[@]}" | jq -R . | jq -s . 2>/dev/null || echo '[]'),
      stores: $(printf '%s\n' "${COVERED_STORES_UNIQUE[@]}" | jq -R . | jq -s . 2>/dev/null || echo '[]'),
      utils: $(printf '%s\n' "${COVERED_UTILS_UNIQUE[@]}" | grep -v '^$' | jq -R . | jq -s . 2>/dev/null || echo '[]'),
      hooks: $(printf '%s\n' "${COVERED_HOOKS_UNIQUE[@]}" | grep -v '^$' | jq -R . | jq -s . 2>/dev/null || echo '[]'),
      types: $(printf '%s\n' "${COVERED_TYPES_UNIQUE[@]}" | grep -v '^$' | jq -R . | jq -s . 2>/dev/null || echo '[]'),
      routes: $(printf '%s\n' "${COVERED_ROUTES_UNIQUE[@]}" | jq -R . | jq -s . 2>/dev/null || echo '[]'),
      generated_at: new Date().toISOString()
    };
    console.log(JSON.stringify(coverage, null, 2));
  "
  
  echo "$NODE_SCRIPT" | node > "$OUTPUT_FILE"
  
elif command -v jq > /dev/null 2>&1; then
  {
    echo '{'
    echo '  "locked_tests": ['
    FIRST=true
    for test in "${LOCKED_ARRAY[@]}"; do
      if [ "$FIRST" = true ]; then
        FIRST=false
      else
        echo ','
      fi
      echo -n "    \"$test\""
    done
    echo ''
    echo '  ],'
    echo '  "pages": ['
    FIRST=true
    for page in "${COVERED_PAGES_UNIQUE[@]}"; do
      if [ "$FIRST" = true ]; then
        FIRST=false
      else
        echo ','
      fi
      echo -n "    \"$page\""
    done
    echo ''
    echo '  ],'
    echo '  "components": ['
    FIRST=true
    for comp in "${COVERED_COMPONENTS_UNIQUE[@]}"; do
      if [ "$FIRST" = true ]; then
        FIRST=false
      else
        echo ','
      fi
      echo -n "    \"$comp\""
    done
    echo ''
    echo '  ],'
    echo '  "stores": ['
    FIRST=true
    for store in "${COVERED_STORES_UNIQUE[@]}"; do
      if [ "$FIRST" = true ]; then
        FIRST=false
      else
        echo ','
      fi
      echo -n "    \"$store\""
    done
    echo ''
    echo '  ],'
    echo '  "utils": ['
    FIRST=true
    for util in "${COVERED_UTILS_UNIQUE[@]}"; do
      if [ "$FIRST" = true ]; then
        FIRST=false
      else
        echo ','
      fi
      echo -n "    \"$util\""
    done
    echo ''
    echo '  ],'
    echo '  "hooks": ['
    FIRST=true
    for hook in "${COVERED_HOOKS_UNIQUE[@]}"; do
      if [ "$FIRST" = true ]; then
        FIRST=false
      else
        echo ','
      fi
      echo -n "    \"$hook\""
    done
    echo ''
    echo '  ],'
    echo '  "types": ['
    FIRST=true
    for type in "${COVERED_TYPES_UNIQUE[@]}"; do
      if [ "$FIRST" = true ]; then
        FIRST=false
      else
        echo ','
      fi
      echo -n "    \"$type\""
    done
    echo ''
    echo '  ],'
    echo '  "routes": ['
    FIRST=true
    for route in "${COVERED_ROUTES_UNIQUE[@]}"; do
      if [ "$FIRST" = true ]; then
        FIRST=false
      else
        echo ','
      fi
      echo -n "    \"$route\""
    done
    echo ''
    echo '  ],'
    echo "  \"generated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\""
    echo '}'
  } | jq . > "$OUTPUT_FILE"
else
  log_error "Neither node nor jq found. Cannot generate JSON."
  exit 1
fi

# Show summary
TOTAL_FILES=$((${#COVERED_PAGES_UNIQUE[@]} + ${#COVERED_COMPONENTS_UNIQUE[@]} + ${#COVERED_STORES_UNIQUE[@]} + ${#COVERED_UTILS_UNIQUE[@]} + ${#COVERED_HOOKS_UNIQUE[@]} + ${#COVERED_TYPES_UNIQUE[@]}))

echo ""
log_step "Coverage Analysis Summary"
echo "=========================="
log_info "Locked tests: ${#LOCKED_ARRAY[@]}"
log_info "Pages: ${#COVERED_PAGES_UNIQUE[@]}"
log_info "Components: ${#COVERED_COMPONENTS_UNIQUE[@]}"
log_info "Stores: ${#COVERED_STORES_UNIQUE[@]}"
log_info "Utils: ${#COVERED_UTILS_UNIQUE[@]}"
log_info "Hooks: ${#COVERED_HOOKS_UNIQUE[@]}"
log_info "Types: ${#COVERED_TYPES_UNIQUE[@]}"
log_info "Routes: ${#COVERED_ROUTES_UNIQUE[@]}"
log_info "Total files: $TOTAL_FILES"
echo ""
log_success "Coverage analysis saved to: $OUTPUT_FILE"
echo ""

