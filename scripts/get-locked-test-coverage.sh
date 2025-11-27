#!/bin/bash

# ============================================================================
# Get Locked Test Coverage
# ============================================================================
# Identifies which source files are covered by locked E2E tests
# Returns list of files that need unit tests for release qualification
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/release-branch-helpers.sh"

check_project_root

# Get locked tests
LOCKED_TESTS=$(get_locked_tests)

if [ -z "$LOCKED_TESTS" ]; then
  echo ""
  exit 0
fi

# Files covered by locked tests
COVERED_STORES=()
COVERED_UTILS=()
COVERED_COMPONENTS=()

# Analyze each locked test
while IFS= read -r test_file; do
  [ -z "$test_file" ] && continue
  
  # Extract test name to identify what it covers
  TEST_NAME=$(basename "$test_file" .spec.ts)
  
  # Banks test covers useBanksStore
  if [[ "$test_file" == *"banks.spec.ts" ]]; then
    COVERED_STORES+=("frontend/src/store/useBanksStore.ts")
  fi
  
  # Bank accounts test covers useBankAccountsStore and useBanksStore
  if [[ "$test_file" == *"bank-accounts.spec.ts" ]]; then
    COVERED_STORES+=("frontend/src/store/useBankAccountsStore.ts")
    COVERED_STORES+=("frontend/src/store/useBanksStore.ts")
  fi
  
done <<< "$LOCKED_TESTS"

# Remove duplicates
COVERED_STORES_UNIQUE=$(printf '%s\n' "${COVERED_STORES[@]}" | sort -u)

# Output JSON
echo "{"
echo "  \"stores\": ["
FIRST=true
for store in $COVERED_STORES_UNIQUE; do
  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    echo ","
  fi
  echo -n "    \"$store\""
done
echo ""
echo "  ],"
echo "  \"utils\": [],"
echo "  \"components\": []"
echo "}"

