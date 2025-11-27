#!/bin/bash

# ============================================================================
# ENFORCEMENT FILES UNLOCK - REQUIRES EXPLICIT USER PERMISSION
# ============================================================================
# This script allows unlocking enforcement files for modification
# 
# ⚠️  CRITICAL: This script REQUIRES EXPLICIT USER PERMISSION
# ⚠️  AI AGENTS: You CANNOT run this script - only the user can unlock
# ⚠️  LOCKED FILES: Remain locked unless user explicitly unlocks them
#
# Requires explicit confirmation and documents the reason

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK_DIR="$REPO_ROOT/.enforcement-lock"
LOCK_FILE="$LOCK_DIR/checksums.txt"
UNLOCK_LOG="$LOCK_DIR/unlock-log.txt"

echo "🚨 CRITICAL: ENFORCEMENT FILE UNLOCK PROCEDURE"
echo ""
echo "⚠️  WARNING: This will unlock enforcement files to allow modifications"
echo "⚠️  This action REQUIRES EXPLICIT USER PERMISSION"
echo "⚠️  AI agents cannot unlock files - only you can do this"
echo ""
echo "This should ONLY be done to ADD NEW CHECKS, not modify existing ones."
echo ""
echo "PROTECTED FILES:"
echo "  - .husky/pre-commit"
echo "  - .husky/pre-push"
echo "  - .husky/commit-msg"
echo "  - scripts/git-wrapper.sh"
echo "  - .github/workflows/pr-checks.yml"
echo "  - scripts/validate-enforcement-lock.sh"
echo "  - scripts/install-git-protection.sh"
echo ""

# Require reason for unlock
read -p "Reason for unlock (must specify what NEW check is being added): " reason

if [ -z "$reason" ]; then
  echo "❌ Error: Reason is required"
  exit 1
fi

# Check if reason mentions "new check" or "add"
if ! echo "$reason" | grep -qiE "(new|add|additional|new check)"; then
  echo ""
  echo "⚠️  WARNING: Reason doesn't mention adding a NEW check"
  echo "⚠️  Modification of existing checks is STRICTLY PROHIBITED"
  read -p "Are you sure you want to proceed? (type 'YES' to confirm): " confirm
  if [ "$confirm" != "YES" ]; then
    echo "❌ Unlock cancelled"
    exit 1
  fi
fi

# Confirm unlock
echo ""
echo "🔓 Unlocking enforcement files..."
echo "📋 Reason: $reason"
read -p "Type 'UNLOCK' to confirm: " confirm

if [ "$confirm" != "UNLOCK" ]; then
  echo "❌ Unlock cancelled"
  exit 1
fi

# Log unlock
mkdir -p "$LOCK_DIR"
echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC")|$USER|$reason" >> "$UNLOCK_LOG"

# Backup current locks
if [ -f "$LOCK_FILE" ]; then
  cp "$LOCK_FILE" "$LOCK_FILE.backup.$(date +%s)"
fi

# Remove lock file (will be recreated by validate-enforcement-lock.sh)
rm -f "$LOCK_FILE"

echo ""
echo "✅ Enforcement files unlocked"
echo "📋 Reason logged: $reason"
echo "⚠️  IMPORTANT: After making changes, locks will be automatically re-initialized"
echo "⚠️  Make sure your changes only ADD new checks, not modify existing ones"
echo ""

