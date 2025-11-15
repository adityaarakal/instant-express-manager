#!/bin/bash

# ============================================================================
# INSTALL GIT PROTECTION - STRICT ENFORCEMENT SETUP
# ============================================================================
# This script sets up Git aliases and shell configuration to prevent bypassing

set -e

echo "🔒 Installing strict Git protection against bypassing..."
echo ""

# Get the repository root directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GIT_WRAPPER="$REPO_ROOT/scripts/git-wrapper.sh"

# Make git-wrapper executable
chmod +x "$GIT_WRAPPER"

# Create Git aliases that use the wrapper
echo "📋 Setting up Git aliases..."
git config --local alias.commit '!f() { bash "'$GIT_WRAPPER'" commit "$@"; }; f'
git config --local alias.c '!f() { bash "'$GIT_WRAPPER'" commit "$@"; }; f'
git config --local alias.amend '!f() { bash "'$GIT_WRAPPER'" commit --amend "$@"; }; f'

echo "✅ Git aliases configured"

# Create shell configuration snippet
SHELL_CONFIG=""

# Detect shell
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
    echo "📋 Detected Zsh"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
    echo "📋 Detected Bash"
else
    echo "⚠️  Unknown shell, skipping shell config setup"
    SHELL_CONFIG=""
fi

if [ -n "$SHELL_CONFIG" ]; then
    # Check if already configured
    if grep -q "instant-express-manager.*git-protection" "$SHELL_CONFIG" 2>/dev/null; then
        echo "✅ Shell configuration already exists"
    else
        echo ""
        echo "📋 Adding Git protection to shell configuration..."
        cat >> "$SHELL_CONFIG" << EOF

# ============================================================================
# INSTANT-EXPRESS-MANAGER: STRICT GIT PROTECTION (NO BYPASSING)
# ============================================================================
# This prevents --no-verify and other bypass flags in Git commands
if [ -f "$GIT_WRAPPER" ]; then
    # Override git command to use wrapper when in this repo
    git() {
        if [[ "\$(pwd)" == "$REPO_ROOT"* ]]; then
            bash "$GIT_WRAPPER" "\$@"
        else
            command git "\$@"
        fi
    }
fi
EOF
        echo "✅ Shell configuration updated: $SHELL_CONFIG"
        echo "⚠️  Please reload your shell: source $SHELL_CONFIG"
    fi
fi

# Create .gitattributes to prevent hook deletion
cat > "$REPO_ROOT/.gitattributes" << 'EOF'
# Prevent deletion of hooks
.husky/pre-commit -text merge=ours
.husky/pre-push -text merge=ours
.husky/commit-msg -text merge=ours
scripts/git-wrapper.sh -text merge=ours
EOF

echo ""
echo "✅ Git protection installed successfully!"
echo ""
echo "🔒 PROTECTION ACTIVE:"
echo "  ✅ Git wrapper blocks --no-verify"
echo "  ✅ Git aliases configured"
echo "  ✅ Shell configuration added"
echo "  ✅ .gitattributes prevents hook deletion"
echo ""
echo "📋 IMPORTANT:"
echo "  1. Reload your shell: source $SHELL_CONFIG"
echo "  2. Or restart your terminal"
echo "  3. Use 'git commit' normally (wrapper will block --no-verify)"
echo ""
echo "⚠️  WARNING: If you bypass this wrapper, server-side checks will still block PRs"
echo ""

