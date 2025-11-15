#!/bin/bash

# ============================================================================
# ENFORCEMENT FILES LOCK VALIDATION
# ============================================================================
# This script validates that enforcement files are not modified
# Only additions of new checks are allowed - no modifications to existing checks

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK_DIR="$REPO_ROOT/.enforcement-lock"
LOCK_FILE="$LOCK_DIR/checksums.txt"

# List of protected enforcement files
PROTECTED_FILES=(
  ".husky/pre-commit"
  ".husky/pre-push"
  ".husky/commit-msg"
  "scripts/git-wrapper.sh"
  ".github/workflows/pr-checks.yml"
  "scripts/validate-enforcement-lock.sh"
  "scripts/install-git-protection.sh"
  "scripts/validate-version-bump.sh"
)

# Create lock directory if it doesn't exist
mkdir -p "$LOCK_DIR"

# Function to calculate file checksum
calculate_checksum() {
  local file="$1"
  if [ -f "$file" ]; then
    sha256sum "$file" 2>/dev/null | cut -d' ' -f1 || md5sum "$file" 2>/dev/null | cut -d' ' -f1 || echo "0"
  else
    echo "0"
  fi
}

# Function to initialize locks if not exists
initialize_locks() {
  if [ ! -f "$LOCK_FILE" ]; then
    echo "🔒 Initializing enforcement file locks..."
    > "$LOCK_FILE"
    for file in "${PROTECTED_FILES[@]}"; do
      full_path="$REPO_ROOT/$file"
      if [ -f "$full_path" ]; then
        checksum=$(calculate_checksum "$full_path")
        echo "$file|$checksum" >> "$LOCK_FILE"
      fi
    done
    echo "✅ Enforcement files locked"
    return 0
  fi
  return 1
}

# Function to validate file hasn't changed
validate_file() {
  local file="$1"
  local stored_checksum="$2"
  local full_path="$REPO_ROOT/$file"
  
  if [ ! -f "$full_path" ]; then
    echo "❌ CRITICAL: Protected enforcement file deleted: $file"
    echo "❌ DELETION OF ENFORCEMENT FILES IS FORBIDDEN"
    return 1
  fi
  
  current_checksum=$(calculate_checksum "$full_path")
  
  if [ "$current_checksum" != "$stored_checksum" ]; then
    echo ""
    echo "❌ CRITICAL: Protected enforcement file modified: $file"
    echo "❌ MODIFICATION OF ENFORCEMENT FILES IS FORBIDDEN"
    echo "❌ This applies even with user permission"
    echo "❌ AI agents cannot modify these files"
    echo "❌ Only additions of NEW checks are allowed"
    echo ""
    echo "🔒 ENFORCEMENT: Commit blocked - File locked"
    echo "📋 REQUIRED: Revert changes to $file"
    echo "📋 ALLOWED: Only adding NEW checks (not modifying existing ones)"
    echo "📋 PROTECTION: User permission does NOT override lock"
    echo ""
    echo "To add a NEW check (requires explicit unlock):"
    echo "  1. Run: bash scripts/unlock-enforcement.sh"
    echo "  2. Provide reason for NEW check (must specify what is being added)"
    echo "  3. Make changes (only add new checks, don't modify existing)"
    echo "  4. Commit (locks will re-initialize automatically)"
    echo ""
    echo "See docs/ENFORCEMENT_LOCK.md for details"
    return 1
  fi
  
  return 0
}

# Check if files are staged
check_staged_changes() {
  local modified_files=()
  
  for file in "${PROTECTED_FILES[@]}"; do
    if git diff --cached --name-only | grep -q "^$file$" || \
       git diff --cached --name-only | grep -q "^\./$file$"; then
      modified_files+=("$file")
    fi
  done
  
  if [ ${#modified_files[@]} -gt 0 ]; then
    echo "🚨 CRITICAL: Attempt to modify protected enforcement files detected!"
    echo "❌ MODIFICATION OF ENFORCEMENT FILES IS FORBIDDEN"
    echo ""
    echo "Protected files being modified:"
    for file in "${modified_files[@]}"; do
      echo "  - $file"
    done
    echo ""
    echo "🔒 ENFORCEMENT: Commit blocked - Files are locked"
    echo "📋 REQUIRED: Unstage these files and revert changes"
    echo "📋 POLICY: Only additions of NEW checks allowed, not modifications"
    echo ""
    echo "To unlock (requires approval process):"
    echo "  See docs/ENFORCEMENT_LOCK.md for unlock procedure"
    exit 1
  fi
}

# Main validation
main() {
  cd "$REPO_ROOT"
  
  # Initialize locks if first run
  if initialize_locks; then
    echo "✅ Enforcement locks initialized - files are now protected"
    exit 0
  fi
  
  # Check for staged changes to protected files
  check_staged_changes
  
  # Validate all protected files match stored checksums
  all_valid=true
  while IFS='|' read -r file stored_checksum || [ -n "$file" ]; do
    if [ -z "$file" ] || [ "$file" = "" ]; then
      continue
    fi
    
    if ! validate_file "$file" "$stored_checksum"; then
      all_valid=false
    fi
  done < "$LOCK_FILE"
  
  if [ "$all_valid" = false ]; then
    exit 1
  fi
  
  echo "✅ Enforcement file lock validation passed"
  return 0
}

main "$@"

