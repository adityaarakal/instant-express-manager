#!/bin/bash

# ============================================================================
# Documentation File Lock Script
# ============================================================================
# Locks a documentation file to prevent modifications by AI agents.
# Only the user should run this script - AI agents cannot lock docs.
#
# Usage:
#   bash scripts/lock-doc.sh <doc-file-path>
#
# Example:
#   bash scripts/lock-doc.sh docs/BRANCHING_AND_DEPLOYMENT_STRATEGY.md
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
  echo "Usage: bash scripts/lock-doc.sh <doc-file-path>"
  exit 1
fi

if [ ! -f "$DOC_FILE" ]; then
  echo -e "${RED}Error: Documentation file not found: $DOC_FILE${NC}"
  exit 1
fi

# Get relative path for lock file
# docs/BRANCHING_AND_DEPLOYMENT_STRATEGY.md -> BRANCHING_AND_DEPLOYMENT_STRATEGY.md.lock
DOC_NAME=$(basename "$DOC_FILE")
LOCK_DIR=".doc-locks"
LOCK_FILE="$LOCK_DIR/$DOC_NAME.lock"

# Create lock directory if it doesn't exist
mkdir -p "$LOCK_DIR"

# Check if already locked
if [ -f "$LOCK_FILE" ]; then
  echo -e "${YELLOW}⚠️  Documentation file is already locked${NC}"
  echo -e "${BLUE}   Lock file: $LOCK_FILE${NC}"
  exit 0
fi

# Calculate checksum
CHECKSUM=$(sha256sum "$DOC_FILE" | cut -d' ' -f1)

# Save checksum to lock file
echo "$CHECKSUM" > "$LOCK_FILE"

# Update doc file to mark as locked (add header comment if markdown)
if [ -f "$DOC_FILE" ]; then
  # Check if file already has lock status
  if ! grep -q "LOCK STATUS: LOCKED" "$DOC_FILE"; then
    # Add lock status to the beginning of the file
    if [[ "$DOC_FILE" == *.md ]]; then
      # For markdown files, add HTML comment at the top
      TEMP_FILE=$(mktemp)
      echo "<!--" >> "$TEMP_FILE"
      echo "LOCK STATUS: LOCKED" >> "$TEMP_FILE"
      echo "" >> "$TEMP_FILE"
      echo "This file is protected and cannot be modified by AI agents." >> "$TEMP_FILE"
      echo "Only the user can unlock and modify this file." >> "$TEMP_FILE"
      echo "" >> "$TEMP_FILE"
      echo "To unlock: bash scripts/unlock-doc.sh $DOC_FILE" >> "$TEMP_FILE"
      echo "-->" >> "$TEMP_FILE"
      echo "" >> "$TEMP_FILE"
      cat "$DOC_FILE" >> "$TEMP_FILE"
      mv "$TEMP_FILE" "$DOC_FILE"
    else
      # For other files, add comment based on file type
      TEMP_FILE=$(mktemp)
      echo "# LOCK STATUS: LOCKED" >> "$TEMP_FILE"
      echo "#" >> "$TEMP_FILE"
      echo "# This file is protected and cannot be modified by AI agents." >> "$TEMP_FILE"
      echo "# Only the user can unlock and modify this file." >> "$TEMP_FILE"
      echo "#" >> "$TEMP_FILE"
      echo "# To unlock: bash scripts/unlock-doc.sh $DOC_FILE" >> "$TEMP_FILE"
      echo "" >> "$TEMP_FILE"
      cat "$DOC_FILE" >> "$TEMP_FILE"
      mv "$TEMP_FILE" "$DOC_FILE"
    fi
    
    # Recalculate checksum after adding lock status
    CHECKSUM=$(sha256sum "$DOC_FILE" | cut -d' ' -f1)
    echo "$CHECKSUM" > "$LOCK_FILE"
    echo -e "${GREEN}✅ Updated documentation file header to LOCKED${NC}"
  fi
fi

# Log the lock action
LOG_FILE="$LOCK_DIR/lock-log.txt"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
USER=$(whoami 2>/dev/null || echo "unknown")
echo "[$TIMESTAMP] LOCKED: $DOC_FILE (User: $USER)" >> "$LOG_FILE"

echo ""
echo -e "${GREEN}✅ Documentation file locked successfully!${NC}"
echo -e "${BLUE}   File: $DOC_FILE${NC}"
echo -e "${BLUE}   Lock file: $LOCK_FILE${NC}"
echo -e "${YELLOW}⚠️  This documentation file can no longer be modified by AI agents${NC}"
echo -e "${BLUE}   To unlock: bash scripts/unlock-doc.sh $DOC_FILE${NC}"

