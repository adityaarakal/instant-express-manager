#!/bin/bash

# ============================================================================
# TDD Check Script
# ===========================================================================
# This script enforces Test-Driven Development approach:
# - Locked tests are DELIVERED features
# - If tests fail, fix IMPLEMENTATION, NOT tests
# - Tests define what "working" means
#
# Usage:
#   bash scripts/tdd-check.sh
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 TDD Check: Verifying Test-Driven Development Rules${NC}"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
  echo -e "${RED}Error: Must run from project root${NC}"
  exit 1
fi

# Step 1: Validate test locks
echo -e "${BLUE}Step 1: Validating test locks...${NC}"
if [ -f "scripts/validate-test-locks.sh" ]; then
  bash scripts/validate-test-locks.sh
  LOCK_STATUS=$?
  if [ $LOCK_STATUS -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ TDD RULE VIOLATION: Locked tests have been modified${NC}"
    echo -e "${RED}📋 REQUIRED: Fix your IMPLEMENTATION to make tests pass${NC}"
    echo -e "${RED}📋 DO NOT: Modify locked test files${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Test locks validated${NC}"
else
  echo -e "${YELLOW}⚠️  Test lock validation script not found${NC}"
fi
echo ""

# Step 2: Run tests
echo -e "${BLUE}Step 2: Running E2E tests...${NC}"
echo -e "${YELLOW}💡 TDD Rule: Tests define what 'working' means${NC}"
echo -e "${YELLOW}💡 If tests fail → Fix implementation, NOT tests${NC}"
echo ""

cd frontend
npm run test:e2e
TEST_STATUS=$?
cd ..

if [ $TEST_STATUS -ne 0 ]; then
  echo ""
  echo -e "${RED}❌ TDD RULE VIOLATION: Tests are failing${NC}"
  echo ""
  echo -e "${RED}🔒 ENFORCEMENT: Tests must pass${NC}"
  echo -e "${RED}📋 TDD RULE: Locked tests are DELIVERED features${NC}"
  echo -e "${RED}📋 REQUIRED: Fix your IMPLEMENTATION to make tests pass${NC}"
  echo -e "${RED}📋 DO NOT: Modify locked test files${NC}"
  echo ""
  echo -e "${YELLOW}💡 TDD Approach:${NC}"
  echo -e "${YELLOW}   • Tests define what 'working' means${NC}"
  echo -e "${YELLOW}   • Implementation must conform to tests${NC}"
  echo -e "${YELLOW}   • If tests fail → Fix implementation, NOT tests${NC}"
  echo ""
  echo -e "${BLUE}📋 Steps to fix:${NC}"
  echo -e "${BLUE}   1. Review failing test output above${NC}"
  echo -e "${BLUE}   2. Fix your implementation to make tests pass${NC}"
  echo -e "${BLUE}   3. Run 'npm run test:e2e' to verify${NC}"
  echo -e "${BLUE}   4. Commit only when tests pass${NC}"
  echo ""
  exit 1
fi

echo ""
echo -e "${GREEN}✅ TDD Check Passed!${NC}"
echo -e "${GREEN}✅ Tests are passing - Implementation is correct${NC}"
echo ""

