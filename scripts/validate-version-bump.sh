#!/bin/bash

# ============================================================================
# MANDATORY VERSION BUMP VALIDATION
# ============================================================================
# This script enforces that PR branch version must be ahead (greater than)
# the base branch (main) version.
#
# ENFORCEMENT: This check is MANDATORY and CANNOT BE BYPASSED
# POLICY: PR cannot be merged without proper version bump
#
# Rules:
# - PR branch version > base branch version (mandatory)
# - Can be PATCH (0.0.1), MINOR (0.1.0), or MAJOR (1.0.0) increment
# - Must be strictly greater than base version
# - Applies to all PRs targeting main branch

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Source version utilities
source "$REPO_ROOT/scripts/version-utils.sh"

# ============================================================================
# DETERMINE CONTEXT (PR vs Pre-commit)
# ============================================================================

# Check if running in GitHub Actions (PR workflow)
if [ -n "$GITHUB_ACTIONS" ] && [ -n "$GITHUB_BASE_REF" ] && [ -n "$GITHUB_HEAD_REF" ]; then
  MODE="pr-workflow"
  BASE_BRANCH="$GITHUB_BASE_REF"
  HEAD_BRANCH="$GITHUB_HEAD_REF"
  echo "🔍 Running in PR workflow context"
  echo "📋 Base branch: $BASE_BRANCH"
  echo "📋 Head branch: $HEAD_BRANCH"
# Check if running in pre-commit hook
elif [ -n "$GIT_DIR" ] || [ -n "$(git rev-parse --git-dir 2>/dev/null)" ]; then
  MODE="pre-commit"
  BASE_BRANCH="main"
  HEAD_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
  
  # Skip if already on main (should be blocked by pre-commit anyway)
  if [ "$HEAD_BRANCH" = "main" ]; then
    echo "⚠️  Warning: Version bump check skipped on main branch"
    exit 0
  fi
  
  echo "🔍 Running in pre-commit hook context"
  echo "📋 Base branch: $BASE_BRANCH"
  echo "📋 Current branch: $HEAD_BRANCH"
else
  MODE="standalone"
  BASE_BRANCH="${1:-main}"
  HEAD_BRANCH="${2:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")}"
  echo "🔍 Running in standalone mode"
  echo "📋 Base branch: $BASE_BRANCH"
  echo "📋 Head branch: $HEAD_BRANCH"
fi

# ============================================================================
# VALIDATION LOGIC
# ============================================================================

echo ""
echo "🚨 MANDATORY VERSION BUMP VALIDATION"
echo "⚠️  THIS CHECK CANNOT BE BYPASSED - ALL PRs MUST HAVE VERSION BUMP"
echo "📋 REQUIRED: Incoming branch version must be ahead of base branch version"
echo ""

# Get base branch version
echo "📋 Fetching base branch ($BASE_BRANCH) version..."
if [ "$MODE" = "pr-workflow" ]; then
  # In PR workflow, base branch is already checked out
  git fetch origin "$BASE_BRANCH:$BASE_BRANCH" 2>/dev/null || true
  BASE_VERSION=$(git show "$BASE_BRANCH:package.json" 2>/dev/null | node -p "require('fs').readFileSync(0, 'utf8')" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).version" 2>/dev/null || echo "")
  if [ -z "$BASE_VERSION" ]; then
    # Fallback: read directly from checked out branch
    git checkout "$BASE_BRANCH" 2>/dev/null || git checkout "origin/$BASE_BRANCH" 2>/dev/null || true
    BASE_VERSION=$(get_current_version)
    git checkout "$HEAD_BRANCH" 2>/dev/null || git checkout "origin/$HEAD_BRANCH" 2>/dev/null || true
  fi
else
  # In pre-commit or standalone, fetch and check
  git fetch origin "$BASE_BRANCH" 2>/dev/null || true
  BASE_VERSION=$(git show "origin/$BASE_BRANCH:package.json" 2>/dev/null | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).version" 2>/dev/null || echo "")
  if [ -z "$BASE_VERSION" ]; then
    # Try local branch
    if git show-ref --verify --quiet refs/heads/"$BASE_BRANCH"; then
      BASE_VERSION=$(git show "$BASE_BRANCH:package.json" 2>/dev/null | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).version" 2>/dev/null || echo "")
    fi
  fi
fi

if [ -z "$BASE_VERSION" ] || [ "$BASE_VERSION" = "null" ] || [ "$BASE_VERSION" = "" ]; then
  echo "❌ CRITICAL: Could not determine base branch ($BASE_BRANCH) version"
  echo "❌ ENFORCEMENT: Version bump validation failed"
  echo "📋 REQUIRED: Ensure base branch has valid version in package.json"
  exit 1
fi

echo "✅ Base branch ($BASE_BRANCH) version: $BASE_VERSION"

# Get head branch version
echo "📋 Fetching head branch ($HEAD_BRANCH) version..."
if [ "$MODE" = "pr-workflow" ]; then
  # In PR workflow, head branch is already checked out
  HEAD_VERSION=$(get_current_version)
else
  # In pre-commit, we're already on the head branch
  HEAD_VERSION=$(get_current_version)
fi

if [ -z "$HEAD_VERSION" ] || [ "$HEAD_VERSION" = "null" ] || [ "$HEAD_VERSION" = "" ]; then
  echo "❌ CRITICAL: Could not determine head branch ($HEAD_BRANCH) version"
  echo "❌ ENFORCEMENT: Version bump validation failed"
  echo "📋 REQUIRED: Ensure head branch has valid version in package.json"
  exit 1
fi

echo "✅ Head branch ($HEAD_BRANCH) version: $HEAD_VERSION"

# Validate versions are in correct format
if ! validate_version "$BASE_VERSION"; then
  echo "❌ CRITICAL: Invalid base branch version format: $BASE_VERSION"
  echo "❌ Expected format: MAJOR.MINOR.PATCH (e.g., 1.0.0)"
  exit 1
fi

if ! validate_version "$HEAD_VERSION"; then
  echo "❌ CRITICAL: Invalid head branch version format: $HEAD_VERSION"
  echo "❌ Expected format: MAJOR.MINOR.PATCH (e.g., 1.0.1)"
  exit 1
fi

# ============================================================================
# VALIDATE VERSION BUMP (HEAD > BASE)
# ============================================================================

echo ""
echo "📊 Version Bump Validation:"
echo "   Base version:    $BASE_VERSION"
echo "   Head version:    $HEAD_VERSION"
echo "   Required:        HEAD_VERSION > BASE_VERSION"
echo ""

# Check if HEAD_VERSION > BASE_VERSION
if ! compare_versions "$HEAD_VERSION" "$BASE_VERSION"; then
  # Calculate minimum next versions for reference
  NEXT_PATCH=$(increment_patch "$BASE_VERSION")
  NEXT_MINOR=$(increment_minor "$BASE_VERSION")
  NEXT_MAJOR=$(increment_major "$BASE_VERSION")
  
  echo "❌ CRITICAL: Version bump validation FAILED"
  echo "❌ Head branch version ($HEAD_VERSION) is NOT ahead of base version ($BASE_VERSION)"
  echo ""
  echo "🔒 ENFORCEMENT: PR cannot be merged - Version bump is MANDATORY"
  echo "📋 REQUIRED: Incoming branch version must be ahead of base branch version"
  echo ""
  echo "📋 How to fix:"
  echo "   1. Ensure your branch is up to date with $BASE_BRANCH"
  echo "   2. Bump version (choose appropriate increment):"
  echo "      - PATCH increment: npm run version:patch  (e.g., $BASE_VERSION -> $NEXT_PATCH)"
  echo "      - MINOR increment: npm run version:minor  (e.g., $BASE_VERSION -> $NEXT_MINOR)"
  echo "      - MAJOR increment: npm run version:major  (e.g., $BASE_VERSION -> $NEXT_MAJOR)"
  echo "      # Or manually update package.json, frontend/package.json, and VERSION.txt"
  echo "   3. Commit the version bump:"
  echo "      git add package.json frontend/package.json VERSION.txt"
  echo "      git commit -m 'chore: Bump version to <NEW_VERSION>'"
  echo "   4. Push and try again"
  echo ""
  echo "⚠️  NOTE: This is a MANDATORY check - PR cannot be merged without proper version bump"
  echo "⚠️  NOTE: Version bump can be PATCH (0.0.1), MINOR (0.1.0), or MAJOR (1.0.0) increment"
  echo ""
  exit 1
fi

echo "✅ Version bump validation PASSED"
echo "✅ Head branch version ($HEAD_VERSION) is ahead of base version ($BASE_VERSION)"
echo ""
echo "🔒 ENFORCEMENT STATUS: COMPLIANT"
echo "✅ Version bump requirement satisfied"
echo ""

exit 0

