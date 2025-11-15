#!/bin/bash

# ============================================================================
# GIT WRAPPER - STRICT ENFORCEMENT - NO BYPASSING ALLOWED
# ============================================================================
# This script wraps Git commands to prevent bypassing hooks
# It intercepts --no-verify and blocks it absolutely

# Check if commit command contains --no-verify
if [[ "$@" == *"--no-verify"* ]] || [[ "$@" == *"-n"* ]]; then
    echo ""
    echo "🚨 CRITICAL ERROR: BYPASS ATTEMPT DETECTED"
    echo "❌ --no-verify (or -n) flag is ABSOLUTELY PROHIBITED"
    echo "❌ This violates ZERO TOLERANCE POLICY"
    echo ""
    echo "🔒 ENFORCEMENT: Command blocked"
    echo "📋 REQUIRED: Remove --no-verify flag and fix all issues"
    echo "📋 ZERO TOLERANCE: NO EXCEPTIONS - NOT EVEN FOR INFRASTRUCTURE"
    echo ""
    echo "If you must commit, you MUST:"
    echo "  1. Fix all ESLint errors"
    echo "  2. Fix all TypeScript errors"
    echo "  3. Ensure build passes"
    echo "  4. Commit without --no-verify"
    echo ""
    exit 1
fi

# Check for other bypass flags
if [[ "$@" == *"SKIP_HOOKS"* ]] || [[ "$@" == *"HUSKY_SKIP"* ]] || [[ "$@" == *"BYPASS"* ]]; then
    echo ""
    echo "🚨 CRITICAL ERROR: BYPASS ATTEMPT DETECTED"
    echo "❌ Bypass flags detected in command"
    echo "❌ This violates ZERO TOLERANCE POLICY"
    echo ""
    echo "🔒 ENFORCEMENT: Command blocked"
    exit 1
fi

# Execute Git command normally (hooks will run)
exec git "$@"

