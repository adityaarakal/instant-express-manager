#!/bin/bash

# Script to install git hooks for the project
# This makes it easy for team members to set up the hooks

echo "🔧 Installing Git Hooks..."

# Check if .githooks directory exists
if [ ! -d ".githooks" ]; then
    echo "❌ Error: .githooks directory not found!"
    exit 1
fi

# Install pre-push hook
if [ -f ".githooks/pre-push" ]; then
    cp .githooks/pre-push .git/hooks/pre-push
    chmod +x .git/hooks/pre-push
    echo "✅ Pre-push hook installed successfully"
else
    echo "⚠️  Warning: pre-push hook not found in .githooks"
fi

echo ""
echo "✨ Git hooks installation complete!"
echo ""
echo "The pre-push hook will now prevent direct pushes to the main branch."
echo "Use feature branches and pull requests instead."
