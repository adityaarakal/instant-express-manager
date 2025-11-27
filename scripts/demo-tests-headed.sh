#!/bin/bash

# ============================================================================
# Headed Mode Demo - Runs tests with visible browser windows
# ============================================================================

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🎬 Starting E2E Tests in Headed Mode..."
echo "   Browser windows will open - watch the tests execute!"
echo ""

cd frontend
npx playwright test --project=chromium --headed

