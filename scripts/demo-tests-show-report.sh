#!/bin/bash

# ============================================================================
# Show Last HTML Report - Opens the most recent HTML test report
# ============================================================================

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "📊 Opening last HTML test report..."
echo ""

cd frontend

# Show the last HTML report
npx playwright show-report

