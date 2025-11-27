#!/bin/bash

# ============================================================================
# Quick UI Demo - Opens Playwright UI for visual testing
# ============================================================================

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🎬 Starting E2E Tests in UI Mode..."
echo "   Playwright UI will open in your browser - watch tests run step-by-step!"
echo ""
echo "📋 The UI will show:"
echo "   • List of all tests"
echo "   • Run tests button"
echo "   • Watch tests execute in real-time"
echo "   • See browser actions step-by-step"
echo ""

cd frontend

# Run with UI mode - this opens a browser window
# The --ui flag opens Playwright's interactive UI
echo "🚀 Opening Playwright UI..."
echo "   A browser window should open automatically"
echo "   If not, check the terminal for the URL"
echo ""

npx playwright test --ui

