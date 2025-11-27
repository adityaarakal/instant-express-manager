#!/bin/bash

# ============================================================================
# HTML Report Demo - Generates and opens HTML test report
# ============================================================================

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🎬 Running E2E Tests and generating HTML report..."
echo ""

cd frontend

# Run tests with HTML reporter
HTML_REPORT=1 npm run test:e2e

echo ""
echo "✅ HTML report generated!"
echo "📊 Opening report in browser..."

# Open HTML report
if command -v open >/dev/null 2>&1; then
  open playwright-report/index.html
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open playwright-report/index.html
else
  echo "⚠️  Please manually open: frontend/playwright-report/index.html"
fi

