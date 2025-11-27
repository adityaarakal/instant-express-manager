#!/bin/bash

# ============================================================================
# Documentation File Unlock Script - REQUIRES EXPLICIT USER PERMISSION
# ============================================================================
# Unlocks a documentation file to allow modifications.
# 
# ⚠️  CRITICAL: This script REQUIRES EXPLICIT USER PERMISSION
# ⚠️  AI AGENTS: You CANNOT run this script - only the user can unlock docs
# ⚠️  LOCKED FILES: Remain locked unless user explicitly unlocks them
#
# Usage:
#   bash scripts/unlock-doc.sh <doc-file-path>
#
# Example:
#   bash scripts/unlock-doc.sh docs/BRANCHING_AND_DEPLOYMENT_STRATEGY.md
#
# ⚠️  WARNING: Once unlocked, documentation files can be modified by AI agents
# ⚠️  Remember to lock again after finalizing changes
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOC_FILE="$1"

if [ -z "$DOC_FILE" ]; then
  echo -e "${RED}Error: Documentation file path required${NC}"
  echo "Usage: bash scripts/unlock-doc.sh <doc-file-path>"
  exit 1
fi

if [ ! -f "$DOC_FILE" ]; then
  echo -e "${RED}Error: Documentation file not found: $DOC_FILE${NC}"
  exit 1
fi

# Get relative path for lock file
DOC_NAME=$(basename "$DOC_FILE")
LOCK_DIR=".doc-locks"
LOCK_FILE="$LOCK_DIR/$DOC_NAME.lock"

if [ ! -f "$LOCK_FILE" ]; then
  echo -e "${YELLOW}⚠️  Documentation file is not locked${NC}"
  exit 0
fi

# Confirm unlock - REQUIRES EXPLICIT USER PERMISSION
echo -e "${RED}🚨 CRITICAL: Unlocking Protected Documentation File${NC}"
echo -e "${RED}   File: $DOC_FILE${NC}"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will allow AI agents to modify this documentation file${NC}"
echo -e "${YELLOW}⚠️  Locked docs are DELIVERED documentation - unlocking should be rare${NC}"
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

# Update doc file to mark as unlocked
if grep -q "LOCK STATUS: LOCKED" "$DOC_FILE"; then
  if [[ "$DOC_FILE" == *.md ]]; then
    # Remove HTML comment block for markdown files
    sed -i.bak '/^<!--$/,/^-->$/d' "$DOC_FILE"
    rm -f "${DOC_FILE}.bak"
  else
    # Remove comment lines for other files
    sed -i.bak '/^# LOCK STATUS: LOCKED$/,/^# To unlock:/d' "$DOC_FILE"
    rm -f "${DOC_FILE}.bak"
  fi
  echo -e "${GREEN}✅ Updated documentation file header to UNLOCKED${NC}"
fi

# Log the unlock action
LOG_FILE="$LOCK_DIR/unlock-log.txt"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
USER=$(whoami 2>/dev/null || echo "unknown")
echo "[$TIMESTAMP] UNLOCKED: $DOC_FILE (User: $USER)" >> "$LOG_FILE"

echo ""
echo -e "${GREEN}✅ Documentation file unlocked successfully!${NC}"
echo -e "${YELLOW}⚠️  This documentation file can now be modified by AI agents${NC}"
echo -e "${BLUE}   Remember to lock it again after finalizing changes${NC}"
echo -e "${BLUE}   To lock: bash scripts/lock-doc.sh $DOC_FILE${NC}"

