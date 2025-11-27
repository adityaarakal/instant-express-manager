#!/bin/bash

# ============================================================================
# Visual Demo Script for E2E Tests
# ============================================================================
# This script runs the E2E tests with visual output for demonstration
# Options:
#   --ui      - Run with Playwright UI (interactive)
#   --html     - Generate HTML report and open in browser
#   --headed   - Run in headed mode (see browser)
#   (default)  - Run with list reporter showing progress

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎬 E2E Tests Visual Demo${NC}"
echo "=========================================="
echo ""

# Check if dev server is running
if ! curl -s http://localhost:7001 > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Dev server not running on port 7001${NC}"
  echo -e "${YELLOW}   Starting dev server in background...${NC}"
  cd frontend
  npm run dev > /dev/null 2>&1 &
  DEV_SERVER_PID=$!
  cd ..
  
  # Wait for server to start
  echo -e "${BLUE}⏳ Waiting for dev server to start...${NC}"
  for i in {1..30}; do
    if curl -s http://localhost:7001 > /dev/null 2>&1; then
      echo -e "${GREEN}✅ Dev server is ready!${NC}"
      break
    fi
    sleep 1
  done
else
  echo -e "${GREEN}✅ Dev server is running${NC}"
  DEV_SERVER_PID=""
fi

echo ""
echo -e "${BLUE}📋 Available Demo Modes:${NC}"
echo "  1. UI Mode (Interactive) - See tests run step-by-step"
echo "  2. HTML Report - Generate detailed HTML report"
echo "  3. Headed Mode - See browser windows"
echo "  4. List Mode (Default) - See test progress in terminal"
echo ""
read -p "Select mode (1-4) [default: 4]: " mode
mode=${mode:-4}

cd frontend

case $mode in
  1)
    echo -e "${BLUE}🎬 Running tests in UI mode (interactive)...${NC}"
    echo -e "${YELLOW}   Playwright UI will open - you can watch tests run step-by-step${NC}"
    npm run test:e2e:ui
    ;;
  2)
    echo -e "${BLUE}🎬 Running tests and generating HTML report...${NC}"
    HTML_REPORT=1 npm run test:e2e
    echo ""
    echo -e "${GREEN}✅ HTML report generated!${NC}"
    echo -e "${BLUE}📊 Opening report in browser...${NC}"
    if command -v open >/dev/null 2>&1; then
      open playwright-report/index.html
    elif command -v xdg-open >/dev/null 2>&1; then
      xdg-open playwright-report/index.html
    else
      echo -e "${YELLOW}⚠️  Please open: frontend/playwright-report/index.html${NC}"
    fi
    ;;
  3)
    echo -e "${BLUE}🎬 Running tests in headed mode (visible browser)...${NC}"
    echo -e "${YELLOW}   Browser windows will open so you can watch the tests${NC}"
    npx playwright test --project=chromium --headed
    ;;
  4)
    echo -e "${BLUE}🎬 Running tests with list reporter...${NC}"
    npm run test:e2e
    ;;
  *)
    echo -e "${YELLOW}⚠️  Invalid option, using default (list mode)${NC}"
    npm run test:e2e
    ;;
esac

# Cleanup: kill dev server if we started it
if [ -n "$DEV_SERVER_PID" ]; then
  echo ""
  echo -e "${YELLOW}🛑 Stopping dev server...${NC}"
  kill $DEV_SERVER_PID 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}✅ Demo complete!${NC}"

