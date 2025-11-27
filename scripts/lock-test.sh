#!/bin/bash

# ============================================================================
# Test File Locking Script
# ============================================================================
# Locks a finalized test file to prevent AI agents from modifying it.
# Only the user can unlock and modify locked tests.
#
# Usage:
#   bash scripts/lock-test.sh <test-file-path>
#
# Example:
#   bash scripts/lock-test.sh frontend/e2e/modules/dashboard.spec.ts
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TEST_FILE="$1"

if [ -z "$TEST_FILE" ]; then
  echo -e "${RED}Error: Test file path required${NC}"
  echo "Usage: bash scripts/lock-test.sh <test-file-path>"
  exit 1
fi

if [ ! -f "$TEST_FILE" ]; then
  echo -e "${RED}Error: Test file not found: $TEST_FILE${NC}"
  exit 1
fi

# Check if file is in modules directory
if ! echo "$TEST_FILE" | grep -q "e2e/modules/"; then
  echo -e "${RED}Error: Test file must be in frontend/e2e/modules/ directory${NC}"
  exit 1
fi

# Create lock directory if it doesn't exist
mkdir -p .test-locks

# Calculate checksum
CHECKSUM=$(sha256sum "$TEST_FILE" | cut -d' ' -f1)

# Get relative path for lock file
RELATIVE_PATH=$(echo "$TEST_FILE" | sed 's|^frontend/||')

# Create lock file entry
LOCK_FILE=".test-locks/${RELATIVE_PATH}.lock"
LOCK_DIR=$(dirname "$LOCK_FILE")
mkdir -p "$LOCK_DIR"

# Check if already locked
if [ -f "$LOCK_FILE" ]; then
  EXISTING_CHECKSUM=$(cat "$LOCK_FILE")
  if [ "$EXISTING_CHECKSUM" = "$CHECKSUM" ]; then
    echo -e "${YELLOW}⚠️  Test file is already locked${NC}"
    exit 0
  else
    echo -e "${YELLOW}⚠️  Test file was previously locked but has been modified${NC}"
    echo -e "${YELLOW}   Updating lock with new checksum...${NC}"
  fi
fi

# Write checksum to lock file
echo "$CHECKSUM" > "$LOCK_FILE"

# Update test file to mark as locked
if grep -q "LOCK STATUS: UNLOCKED" "$TEST_FILE"; then
  sed -i.bak "s/LOCK STATUS: UNLOCKED/LOCK STATUS: LOCKED/g" "$TEST_FILE"
  rm -f "${TEST_FILE}.bak"
  echo -e "${GREEN}✅ Updated test file header to LOCKED${NC}"
fi

# Log the lock action
LOG_FILE=".test-locks/lock-log.txt"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
USER=$(whoami 2>/dev/null || echo "unknown")
echo "[$TIMESTAMP] LOCKED: $TEST_FILE (User: $USER, Checksum: $CHECKSUM)" >> "$LOG_FILE"

echo ""
echo -e "${GREEN}✅ Test file locked successfully!${NC}"
echo -e "${BLUE}📋 Locked file: $TEST_FILE${NC}"
echo -e "${BLUE}📋 Checksum: $CHECKSUM${NC}"
echo ""
echo -e "${YELLOW}⚠️  This test file is now protected from AI agent modifications${NC}"
echo -e "${YELLOW}   To unlock, run: bash scripts/unlock-test.sh $TEST_FILE${NC}"

