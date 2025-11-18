#!/bin/bash

# Script to test deployed GitHub Pages site
# Usage: ./scripts/test-deployment.sh [URL]
# Default: https://adityaarakal.github.io/instant-express-manager/

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default URL
DEFAULT_URL="https://adityaarakal.github.io/instant-express-manager/"
URL="${1:-$DEFAULT_URL}"

echo -e "${GREEN}🔍 Testing Deployed GitHub Pages Site${NC}"
echo "URL: $URL"
echo ""

# Check if URL is accessible
echo -e "${YELLOW}1. Checking if site is accessible...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200\|301\|302"; then
  echo -e "${GREEN}✅ Site is accessible${NC}"
else
  echo -e "${RED}❌ Site is not accessible${NC}"
  echo "Make sure GitHub Pages is configured and deployed"
  exit 1
fi

# Check if HTML loads
echo -e "${YELLOW}2. Checking if HTML loads correctly...${NC}"
HTML=$(curl -s "$URL")
if echo "$HTML" | grep -q "<!doctype html\|<html"; then
  echo -e "${GREEN}✅ HTML loads correctly${NC}"
else
  echo -e "${RED}❌ HTML does not load correctly${NC}"
  exit 1
fi

# Check for app title
echo -e "${YELLOW}3. Checking app title...${NC}"
if echo "$HTML" | grep -qi "expense manager\|instant express"; then
  echo -e "${GREEN}✅ App title found${NC}"
else
  echo -e "${YELLOW}⚠️  App title not found (might still be valid)${NC}"
fi

# Check for manifest
echo -e "${YELLOW}4. Checking PWA manifest...${NC}"
MANIFEST_URL="${URL}manifest.webmanifest"
if curl -s -o /dev/null -w "%{http_code}" "$MANIFEST_URL" | grep -q "200"; then
  echo -e "${GREEN}✅ PWA manifest is accessible${NC}"
else
  echo -e "${YELLOW}⚠️  PWA manifest not found (might not be deployed yet)${NC}"
fi

# Check for service worker registration
echo -e "${YELLOW}5. Checking for service worker registration...${NC}"
if echo "$HTML" | grep -qi "service.*worker\|registerSW"; then
  echo -e "${GREEN}✅ Service worker registration found${NC}"
else
  echo -e "${YELLOW}⚠️  Service worker registration not found${NC}"
fi

# Check for React app mount point
echo -e "${YELLOW}6. Checking for React app mount point...${NC}"
if echo "$HTML" | grep -qi "id=\"root\"\|div id=\"root\""; then
  echo -e "${GREEN}✅ React app mount point found${NC}"
else
  echo -e "${RED}❌ React app mount point not found${NC}"
  exit 1
fi

# Check for main JavaScript bundle
echo -e "${YELLOW}7. Checking for JavaScript bundles...${NC}"
if echo "$HTML" | grep -qi "\.js\|type=\"module\""; then
  echo -e "${GREEN}✅ JavaScript bundles found${NC}"
  # Count JavaScript files
  JS_COUNT=$(echo "$HTML" | grep -o "\.js" | wc -l | tr -d ' ')
  echo "   Found $JS_COUNT JavaScript references"
else
  echo -e "${RED}❌ JavaScript bundles not found${NC}"
  exit 1
fi

# Check for CSS
echo -e "${YELLOW}8. Checking for CSS...${NC}"
if echo "$HTML" | grep -qi "\.css\|<style"; then
  echo -e "${GREEN}✅ CSS found${NC}"
else
  echo -e "${YELLOW}⚠️  CSS not found (might be inline)${NC}"
fi

# Check HTTPS
echo -e "${YELLOW}9. Checking HTTPS...${NC}"
if echo "$URL" | grep -q "^https://"; then
  echo -e "${GREEN}✅ HTTPS enabled${NC}"
else
  echo -e "${RED}❌ HTTPS not enabled (required for PWA)${NC}"
fi

# Test a few routes (head requests)
echo -e "${YELLOW}10. Testing routes...${NC}"
ROUTES=("/" "/dashboard" "/transactions" "/banks" "/settings")
for route in "${ROUTES[@]}"; do
  FULL_URL="${URL}${route#/}"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FULL_URL")
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "301" ] || [ "$STATUS" = "302" ]; then
    echo -e "${GREEN}✅ $route - HTTP $STATUS${NC}"
  else
    echo -e "${YELLOW}⚠️  $route - HTTP $STATUS${NC}"
  fi
done

echo ""
echo -e "${GREEN}📋 Basic Deployment Checks Complete!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Manual Testing Required:${NC}"
echo "  - Open $URL in a browser"
echo "  - Test all pages and functionality"
echo "  - Test CRUD operations"
echo "  - Test data persistence"
echo "  - Test PWA installation"
echo "  - Test offline functionality"
echo ""
echo "See docs/DEPLOYMENT_TESTING_CHECKLIST.md for complete testing checklist"

