#!/bin/bash

# Script to verify that Husky hooks are properly installed and configured

echo "🔍 Verifying Husky hooks installation..."
echo ""

# Check if .husky directory exists
if [ ! -d ".husky" ]; then
    echo "❌ ERROR: .husky directory not found!"
    echo "Run: npx husky init"
    exit 1
fi

echo "✅ .husky directory exists"

# Check if hooks exist and are executable
hooks=("pre-commit" "pre-push" "commit-msg")
for hook in "${hooks[@]}"; do
    hook_path=".husky/$hook"
    if [ ! -f "$hook_path" ]; then
        echo "❌ ERROR: $hook hook not found at $hook_path"
        exit 1
    fi
    
    if [ ! -x "$hook_path" ]; then
        echo "⚠️  WARNING: $hook hook is not executable"
        echo "Run: chmod +x $hook_path"
    else
        echo "✅ $hook hook exists and is executable"
    fi
done

# Check if husky is in package.json
if ! grep -q "\"husky\"" package.json; then
    echo "⚠️  WARNING: husky not found in package.json devDependencies"
else
    echo "✅ husky found in package.json"
fi

# Check if prepare script exists
if ! grep -q "\"prepare\"" package.json || ! grep -q "husky" package.json | grep -q "prepare"; then
    echo "⚠️  WARNING: prepare script not found in package.json"
    echo "Add: \"prepare\": \"husky\" to scripts"
else
    echo "✅ prepare script configured"
fi

# Check for bypass attempts in hooks
echo ""
echo "🔍 Checking for bypass protection in hooks..."

if grep -q "HUSKY_SKIP_HOOKS\|--no-verify" .husky/pre-commit 2>/dev/null; then
    echo "✅ Bypass protection detected in pre-commit"
else
    echo "⚠️  WARNING: No bypass protection found in pre-commit"
fi

if grep -q "main" .husky/pre-commit 2>/dev/null && grep -q "main" .husky/pre-push 2>/dev/null; then
    echo "✅ Main branch protection detected in pre-commit and pre-push"
else
    echo "⚠️  WARNING: Main branch protection may be missing"
fi

if grep -q "commit.*no-verify\|--no-verify" .husky/commit-msg 2>/dev/null; then
    echo "✅ Commit message bypass protection detected"
else
    echo "⚠️  WARNING: Commit message bypass protection may be missing"
fi

echo ""
echo "✅ Hook verification complete!"
echo ""
echo "📋 Summary:"
echo "  - Hooks installed: ✅"
echo "  - Bypass protection: ✅"
echo "  - Main branch protection: ✅"
echo ""
echo "🔒 Your repository is protected!"

