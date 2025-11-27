#!/bin/bash

# ============================================================================
# Quick UI Demo - Opens Playwright UI for visual testing
# ============================================================================

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🎬 Starting E2E Tests in UI Mode..."
echo "   Playwright UI will open - watch tests run step-by-step!"
echo ""

cd frontend
npm run test:e2e:ui

