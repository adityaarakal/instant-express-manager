#!/bin/bash

# ============================================================================
# Test File Unlock Script - REQUIRES EXPLICIT USER PERMISSION
# ============================================================================
# Unlocks a test file to allow modifications.
# 
# ⚠️  CRITICAL: This script REQUIRES EXPLICIT USER PERMISSION
# ⚠️  AI AGENTS: You CANNOT run this script - only the user can unlock tests
# ⚠️  LOCKED FILES: Remain locked unless user explicitly unlocks them
#
# Usage:
#   bash scripts/unlock-test.sh <test-file-path>
#
# Example:
#   bash scripts/unlock-test.sh frontend/e2e/modules/banks.spec.ts
#
# ⚠️  WARNING: Once unlocked, test files can be modified by AI agents
# ⚠️  Remember to lock again after finalizing changes
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
  echo "Usage: bash scripts/unlock-test.sh <test-file-path>"
  exit 1
fi

if [ ! -f "$TEST_FILE" ]; then
  echo -e "${RED}Error: Test file not found: $TEST_FILE${NC}"
  exit 1
fi

# Get relative path for lock file
RELATIVE_PATH=$(echo "$TEST_FILE" | sed 's|^frontend/||')
LOCK_FILE=".test-locks/${RELATIVE_PATH}.lock"

if [ ! -f "$LOCK_FILE" ]; then
  echo -e "${YELLOW}⚠️  Test file is not locked${NC}"
  exit 0
fi

# Confirm unlock - REQUIRES EXPLICIT USER PERMISSION
echo -e "${RED}🚨 CRITICAL: Unlocking Protected Test File${NC}"
echo -e "${RED}   File: $TEST_FILE${NC}"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will allow AI agents to modify this test file${NC}"
echo -e "${YELLOW}⚠️  Locked tests are DELIVERED features - unlocking should be rare${NC}"
echo ""
echo -e "${BLUE}This action REQUIRES EXPLICIT USER PERMISSION${NC}"
echo -e "${BLUE}AI agents cannot unlock files - only you can do this${NC}"
echo ""
read -p "Type 'UNLOCK' to confirm (or anything else to cancel): " CONFIRM

if [ "$CONFIRM" != "UNLOCK" ]; then
  echo -e "${GREEN}✅ Unlock cancelled - file remains locked${NC}"
  exit 0
fi

# Remove lock file
rm -f "$LOCK_FILE"

# Update test file to mark as unlocked
if grep -q "LOCK STATUS: LOCKED" "$TEST_FILE"; then
  sed -i.bak "s/LOCK STATUS: LOCKED/LOCK STATUS: UNLOCKED/g" "$TEST_FILE"
  rm -f "${TEST_FILE}.bak"
  echo -e "${GREEN}✅ Updated test file header to UNLOCKED${NC}"
fi

# Log the unlock action
LOG_FILE=".test-locks/unlock-log.txt"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
USER=$(whoami 2>/dev/null || echo "unknown")
echo "[$TIMESTAMP] UNLOCKED: $TEST_FILE (User: $USER)" >> "$LOG_FILE"

echo ""
echo -e "${GREEN}✅ Test file unlocked successfully!${NC}"
echo -e "${YELLOW}⚠️  This test file can now be modified by AI agents${NC}"
echo -e "${BLUE}   Remember to lock it again after finalizing changes${NC}"

