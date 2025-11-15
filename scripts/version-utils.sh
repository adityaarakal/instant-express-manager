#!/bin/bash

# ============================================================================
# VERSION UTILITY FUNCTIONS
# ============================================================================
# Utility functions for version management

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION_FILE="$REPO_ROOT/VERSION.txt"

# Get current version from package.json
get_current_version() {
  if [ -f "$REPO_ROOT/package.json" ]; then
    node -p "require('$REPO_ROOT/package.json').version"
  elif [ -f "$VERSION_FILE" ]; then
    cat "$VERSION_FILE"
  else
    echo "0.0.0"
  fi
}

# Parse version into parts
parse_version() {
  local version=$1
  echo "$version" | awk -F. '{print $1" "$2" "$3}'
}

# Increment version parts
increment_major() {
  local version=$1
  local parts=($(parse_version "$version"))
  echo "$((parts[0] + 1)).0.0"
}

increment_minor() {
  local version=$1
  local parts=($(parse_version "$version"))
  echo "${parts[0]}.$((parts[1] + 1)).0"
}

increment_patch() {
  local version=$1
  local parts=($(parse_version "$version"))
  echo "${parts[0]}.${parts[1]}.$((parts[2] + 1))"
}

# Validate version format
validate_version() {
  local version=$1
  if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Invalid version format: $version. Expected MAJOR.MINOR.PATCH"
    return 1
  fi
  return 0
}

# Set version in all files
set_version() {
  local new_version=$1
  
  if ! validate_version "$new_version"; then
    return 1
  fi
  
  echo "Setting version to $new_version..."
  
  # Update root package.json
  if [ -f "$REPO_ROOT/package.json" ]; then
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$REPO_ROOT/package.json', 'utf8'));
      pkg.version = '$new_version';
      fs.writeFileSync('$REPO_ROOT/package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
  fi
  
  # Update frontend package.json
  if [ -f "$REPO_ROOT/frontend/package.json" ]; then
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$REPO_ROOT/frontend/package.json', 'utf8'));
      pkg.version = '$new_version';
      fs.writeFileSync('$REPO_ROOT/frontend/package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
  fi
  
  # Update VERSION.txt
  echo "$new_version" > "$VERSION_FILE"
  
  echo "✅ Version set to $new_version"
}

# Export functions for use in other scripts
export -f get_current_version
export -f parse_version
export -f increment_major
export -f increment_minor
export -f increment_patch
export -f validate_version
export -f set_version

