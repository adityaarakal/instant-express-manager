#!/bin/bash

# ============================================================================
# Documentation Lock Validation Script - MANDATORY AND NON-BYPASSABLE
# ============================================================================
# Validates that locked documentation files have not been modified.
# This script is called automatically during pre-commit to prevent
# AI agents from modifying locked documentation files.
#
# ⚠️  BYPASS PROHIBITED: This script cannot be skipped or bypassed
# ⚠️  AI AGENTS: You cannot bypass this check - locked docs cannot be modified
# ⚠️  LOCK POLICY: Locked docs are DELIVERED documentation (immutable)
#
# Usage:
#   bash scripts/validate-doc-locks.sh
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

LOCK_DIR=".doc-locks"
VALIDATION_FAILED=0

if [ ! -d "$LOCK_DIR" ]; then
  # No locks directory means no locked docs
  exit 0
fi

echo -e "${BLUE}🔒 Validating locked documentation files...${NC}"

# Find all lock files
LOCK_FILES=$(find "$LOCK_DIR" -name "*.lock" -type f 2>/dev/null || echo "")

if [ -z "$LOCK_FILES" ]; then
  echo -e "${GREEN}✅ No locked documentation files found${NC}"
  exit 0
fi

# Check each locked documentation file
while IFS= read -r lock_file; do
  [ -z "$lock_file" ] && continue
  
  # Get documentation file path from lock file path
  # .doc-locks/BRANCHING_AND_DEPLOYMENT_STRATEGY.md.lock -> docs/BRANCHING_AND_DEPLOYMENT_STRATEGY.md
  doc_name=$(basename "$lock_file" .lock)
  doc_file="docs/$doc_name"
  
  if [ ! -f "$doc_file" ]; then
    echo -e "${YELLOW}⚠️  Documentation file not found (may have been deleted): $doc_file${NC}"
    continue
  fi
  
  # Get stored checksum
  stored_checksum=$(cat "$lock_file" 2>/dev/null || echo "")
  if [ -z "$stored_checksum" ]; then
    echo -e "${YELLOW}⚠️  Lock file is empty: $lock_file${NC}"
    continue
  fi
  
  # Calculate current checksum
  current_checksum=$(sha256sum "$doc_file" | cut -d' ' -f1)
  
  # Compare checksums
  if [ "$stored_checksum" != "$current_checksum" ]; then
    echo -e "${RED}❌ LOCKED DOCUMENTATION FILE MODIFIED: $doc_file${NC}"
    echo -e "${RED}   Stored checksum: ${stored_checksum:0:16}...${NC}"
    echo -e "${RED}   Current checksum: ${current_checksum:0:16}...${NC}"
    echo ""
    echo -e "${RED}🔒 ENFORCEMENT: Locked documentation files cannot be modified${NC}"
    echo -e "${RED}📋 LOCK POLICY: Locked docs are DELIVERED documentation${NC}"
    echo -e "${RED}📋 REQUIRED: Restore locked documentation or unlock it first${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  BYPASS PROHIBITED: This check cannot be skipped${NC}"
    echo -e "${YELLOW}⚠️  Even AI agents cannot bypass this check${NC}"
    echo -e "${YELLOW}⚠️  Even with --no-verify, server-side checks will block${NC}"
    echo -e "${YELLOW}⚠️  Locked docs MUST remain unchanged - no exceptions${NC}"
    echo ""
    echo -e "${BLUE}📋 To modify documentation (requires user permission):${NC}"
    echo -e "${BLUE}   bash scripts/unlock-doc.sh $doc_file${NC}"
    echo ""
    VALIDATION_FAILED=1
  else
    echo -e "${GREEN}✅ Locked documentation file validated: $doc_file${NC}"
  fi
done <<< "$LOCK_FILES"

if [ $VALIDATION_FAILED -eq 1 ]; then
  echo ""
  echo -e "${RED}❌ Documentation lock validation failed!${NC}"
  echo -e "${RED}   Locked documentation files have been modified${NC}"
  echo -e "${RED}   Commit blocked - restore locked docs or unlock them first${NC}"
  exit 1
fi

echo -e "${GREEN}✅ All locked documentation files validated successfully${NC}"
exit 0

