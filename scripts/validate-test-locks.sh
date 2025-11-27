#!/bin/bash

# ============================================================================
# Test Lock Validation Script - MANDATORY AND NON-BYPASSABLE
# ============================================================================
# Validates that locked test files have not been modified.
# This script is called automatically during pre-commit to prevent
# AI agents from modifying locked test files.
#
# ⚠️  BYPASS PROHIBITED: This script cannot be skipped or bypassed
# ⚠️  AI AGENTS: You cannot bypass this check - locked tests cannot be modified
# ⚠️  TDD RULE: Locked tests are DELIVERED features (immutable)
#
# Usage:
#   bash scripts/validate-test-locks.sh
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

LOCK_DIR=".test-locks"
VALIDATION_FAILED=0

if [ ! -d "$LOCK_DIR" ]; then
  # No locks directory means no locked tests
  exit 0
fi

echo -e "${BLUE}🔒 Validating locked test files...${NC}"

# Find all lock files
LOCK_FILES=$(find "$LOCK_DIR" -name "*.lock" -type f 2>/dev/null || echo "")

if [ -z "$LOCK_FILES" ]; then
  echo -e "${GREEN}✅ No locked test files found${NC}"
  exit 0
fi

# Check each locked test file
while IFS= read -r lock_file; do
  [ -z "$lock_file" ] && continue
  
  # Get test file path from lock file path
  # .test-locks/e2e/modules/dashboard.spec.ts.lock -> frontend/e2e/modules/dashboard.spec.ts
  # Lock files are stored relative to frontend/, so prepend frontend/
  relative_path=$(echo "$lock_file" | sed 's|^\.test-locks/||' | sed 's|\.lock$||')
  test_file="frontend/$relative_path"
  
  if [ ! -f "$test_file" ]; then
    echo -e "${YELLOW}⚠️  Test file not found (may have been deleted): $test_file${NC}"
    continue
  fi
  
  # Get stored checksum
  stored_checksum=$(cat "$lock_file" 2>/dev/null || echo "")
  if [ -z "$stored_checksum" ]; then
    echo -e "${YELLOW}⚠️  Lock file is empty: $lock_file${NC}"
    continue
  fi
  
  # Calculate current checksum
  current_checksum=$(sha256sum "$test_file" | cut -d' ' -f1)
  
  # Compare checksums
  if [ "$stored_checksum" != "$current_checksum" ]; then
    echo -e "${RED}❌ LOCKED TEST FILE MODIFIED: $test_file${NC}"
    echo -e "${RED}   Stored checksum: ${stored_checksum:0:16}...${NC}"
    echo -e "${RED}   Current checksum: ${current_checksum:0:16}...${NC}"
    echo ""
    echo -e "${RED}🔒 ENFORCEMENT: Locked test files cannot be modified${NC}"
    echo -e "${RED}📋 TDD RULE: Locked tests are DELIVERED features${NC}"
    echo -e "${RED}📋 REQUIRED: Fix your IMPLEMENTATION to make tests pass${NC}"
    echo -e "${RED}📋 DO NOT: Modify locked tests to match broken implementation${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  BYPASS PROHIBITED: This check cannot be skipped${NC}"
    echo -e "${YELLOW}⚠️  Even AI agents cannot bypass this check${NC}"
    echo -e "${YELLOW}⚠️  Even with --no-verify, server-side checks will block${NC}"
    echo -e "${YELLOW}⚠️  Locked tests MUST remain unchanged - no exceptions${NC}"
    echo ""
    echo -e "${YELLOW}💡 TDD Approach:${NC}"
    echo -e "${YELLOW}   • Tests define what 'working' means${NC}"
    echo -e "${YELLOW}   • Implementation must conform to tests${NC}"
    echo -e "${YELLOW}   • If tests fail → Fix implementation, NOT tests${NC}"
    echo ""
    echo -e "${BLUE}📋 To modify test (requires user permission):${NC}"
    echo -e "${BLUE}   bash scripts/unlock-test.sh $test_file${NC}"
    echo ""
    VALIDATION_FAILED=1
  else
    echo -e "${GREEN}✅ Locked test file validated: $test_file${NC}"
  fi
done <<< "$LOCK_FILES"

if [ $VALIDATION_FAILED -eq 1 ]; then
  echo ""
  echo -e "${RED}❌ Test lock validation failed!${NC}"
  echo -e "${RED}   Locked test files have been modified${NC}"
  echo -e "${RED}   Commit blocked - restore locked tests or unlock them first${NC}"
  exit 1
fi

echo -e "${GREEN}✅ All locked test files validated successfully${NC}"
exit 0

