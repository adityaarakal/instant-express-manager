#!/bin/bash

# Script to run Lighthouse audit locally
# Usage: ./scripts/run-lighthouse.sh [URL]
# Default: http://localhost:4173 (preview build)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default URL (local preview)
DEFAULT_URL="http://localhost:4173"
URL="${1:-$DEFAULT_URL}"

echo -e "${GREEN}🔍 Running Lighthouse Audit${NC}"
echo "URL: $URL"
echo ""

# Check if URL is provided or use default
if [ "$URL" == "$DEFAULT_URL" ]; then
  echo -e "${YELLOW}⚠️  Using default URL: $DEFAULT_URL${NC}"
  echo -e "${YELLOW}Make sure the preview server is running (npm run preview)${NC}"
  echo ""
  
  # Check if server is running
  if ! curl -s "$URL" > /dev/null; then
    echo -e "${RED}❌ Error: Server not running at $URL${NC}"
    echo -e "${YELLOW}Starting preview server...${NC}"
    echo ""
    
    # Start preview server in background
    cd frontend
    npm run build
    npm run preview &
    PREVIEW_PID=$!
    
    # Wait for server to start
    echo "Waiting for server to start..."
    for i in {1..30}; do
      if curl -s "$URL" > /dev/null; then
        echo -e "${GREEN}✅ Server is ready!${NC}"
        break
      fi
      sleep 1
    done
    
    # Check if server started
    if ! curl -s "$URL" > /dev/null; then
      echo -e "${RED}❌ Error: Server failed to start${NC}"
      kill $PREVIEW_PID 2>/dev/null || true
      exit 1
    fi
  fi
fi

# Check if Lighthouse CLI is installed
if ! command -v lighthouse &> /dev/null; then
  echo -e "${YELLOW}⚠️  Lighthouse CLI not found. Installing...${NC}"
  npm install -g lighthouse
fi

echo ""
echo -e "${GREEN}Running Lighthouse audit...${NC}"
echo ""

# Run Lighthouse
lighthouse "$URL" \
  --output=html,json \
  --output-path=./lighthouse-report \
  --chrome-flags="--headless --no-sandbox" \
  --view \
  --quiet=false

# Extract scores from JSON report
if [ -f "./lighthouse-report.report.json" ]; then
  echo ""
  echo -e "${GREEN}📊 Lighthouse Scores:${NC}"
  echo ""
  
  # Use node to parse JSON and extract scores
  node -e "
    const report = require('./lighthouse-report.report.json');
    const categories = report.categories;
    
    console.log('Performance:      ' + Math.round(categories.performance.score * 100) + '/100');
    console.log('Accessibility:    ' + Math.round(categories.accessibility.score * 100) + '/100');
    console.log('Best Practices:   ' + Math.round(categories['best-practices'].score * 100) + '/100');
    console.log('SEO:              ' + Math.round(categories.seo.score * 100) + '/100');
    console.log('PWA:              ' + Math.round(categories.pwa.score * 100) + '/100');
    console.log('');
    
    const allPassed = Object.values(categories).every(cat => cat.score >= 0.90);
    if (allPassed) {
      console.log('✅ All scores meet target (90+)');
      process.exit(0);
    } else {
      console.log('⚠️  Some scores below target (90+)');
      Object.values(categories).forEach(cat => {
        if (cat.score < 0.90) {
          console.log('   - ' + cat.title + ': ' + Math.round(cat.score * 100) + '/100 (target: 90+)');
        }
      });
      process.exit(1);
    }
  "
  
  EXIT_CODE=$?
  
  echo ""
  echo -e "${GREEN}📄 Full report saved to:${NC}"
  echo "   - HTML: ./lighthouse-report.report.html"
  echo "   - JSON: ./lighthouse-report.report.json"
  echo ""
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Lighthouse audit passed!${NC}"
  else
    echo -e "${YELLOW}⚠️  Lighthouse audit completed with warnings${NC}"
  fi
  
  # Clean up preview server if we started it
  if [ ! -z "$PREVIEW_PID" ]; then
    echo "Stopping preview server..."
    kill $PREVIEW_PID 2>/dev/null || true
  fi
  
  exit $EXIT_CODE
else
  echo -e "${RED}❌ Error: Lighthouse report not generated${NC}"
  exit 1
fi

