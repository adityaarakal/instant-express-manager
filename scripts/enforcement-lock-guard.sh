#!/bin/bash

# ============================================================================
# ENFORCEMENT LOCK GUARD - AI AGENT PROTECTION
# ============================================================================
# This script is called by the pre-commit hook to ensure AI agents
# cannot modify enforcement files, even with user permission

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Check if we're being called to bypass validation
# This prevents AI agents from modifying this script itself
if [ "$1" = "--bypass" ] || [ "$1" = "--skip" ] || [ "$1" = "--allow" ]; then
    echo ""
    echo "❌ CRITICAL: Bypass attempt detected in enforcement-lock-guard.sh"
    echo "❌ This script cannot be bypassed"
    echo "❌ ENFORCEMENT: Blocked"
    exit 1
fi

# Run validation
bash "$REPO_ROOT/scripts/validate-enforcement-lock.sh"

