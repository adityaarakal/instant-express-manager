#!/bin/bash

# ============================================================================
# VERSION BUMP SCRIPT
# ============================================================================
# Automatically bumps version based on bump type (major, minor, patch)

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Source version utilities
source "$REPO_ROOT/scripts/version-utils.sh"

BUMP_TYPE=${1:-patch}  # major, minor, or patch

if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
  echo "Error: Invalid bump type: $BUMP_TYPE"
  echo "Usage: $0 [major|minor|patch]"
  exit 1
fi

CURRENT_VERSION=$(get_current_version)
echo "Current version: $CURRENT_VERSION"

# Determine new version
case "$BUMP_TYPE" in
  major)
    NEW_VERSION=$(increment_major "$CURRENT_VERSION")
    ;;
  minor)
    NEW_VERSION=$(increment_minor "$CURRENT_VERSION")
    ;;
  patch)
    NEW_VERSION=$(increment_patch "$CURRENT_VERSION")
    ;;
esac

echo "New version: $NEW_VERSION"

# Set the new version
set_version "$NEW_VERSION"

echo ""
echo "✅ Version bumped from $CURRENT_VERSION to $NEW_VERSION"
echo ""
echo "Next steps:"
echo "  1. Review the changes"
echo "  2. Commit: git add . && git commit -m \"chore: Bump version to $NEW_VERSION\""
echo "  3. Tag: git tag v$NEW_VERSION"
echo "  4. Push: git push && git push --tags"

