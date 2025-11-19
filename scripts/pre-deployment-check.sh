#!/bin/bash

# Pre-Deployment Verification Script
# Runs comprehensive checks before deployment to ensure everything is ready

set -e

echo "🚀 Pre-Deployment Verification"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0
WARNINGS=0

# Function to run a check
run_check() {
    local name=$1
    local command=$2
    local required=${3:-true}  # Default to required
    
    echo -e "${BLUE}▶ Checking: ${name}${NC}"
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${name} - PASSED${NC}"
        ((PASSED++))
        echo ""
        return 0
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ ${name} - FAILED${NC}"
            ((FAILED++))
            echo ""
            return 1
        else
            echo -e "${YELLOW}⚠️  ${name} - WARNING${NC}"
            ((WARNINGS++))
            echo ""
            return 0
        fi
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from project root${NC}"
    exit 1
fi

echo "📋 Running Pre-Deployment Checks..."
echo ""

# 1. Check Node.js version
run_check "Node.js version (18+)" "node --version | grep -q 'v1[89]' || node --version | grep -q 'v2[0-9]'"

# 2. Check dependencies are installed
run_check "Root dependencies installed" "[ -d 'node_modules' ]"
run_check "Frontend dependencies installed" "[ -d 'frontend/node_modules' ]"

# 3. TypeScript compilation
echo -e "${BLUE}▶ Checking: TypeScript Compilation${NC}"
if cd frontend && npm run build -- --mode test > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript Compilation - PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ TypeScript Compilation - FAILED${NC}"
    ((FAILED++))
fi
cd ..
echo ""

# 4. Production build
echo -e "${BLUE}▶ Checking: Production Build${NC}"
if cd frontend && npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Production Build - PASSED${NC}"
    ((PASSED++))
    
    # Check build output exists
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        echo -e "${GREEN}✅ Build Output - PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Build Output - FAILED${NC}"
        ((FAILED++))
    fi
    
    # Check service worker exists
    if [ -f "dist/sw.js" ]; then
        echo -e "${GREEN}✅ Service Worker - PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  Service Worker - WARNING${NC}"
        ((WARNINGS++))
    fi
    
    # Check manifest exists
    if [ -f "dist/manifest.webmanifest" ]; then
        echo -e "${GREEN}✅ PWA Manifest - PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  PWA Manifest - WARNING${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌ Production Build - FAILED${NC}"
    ((FAILED++))
fi
cd ..
echo ""

# 5. Check GitHub Actions workflows
run_check "Deployment workflow exists" "[ -f '.github/workflows/deploy.yml' ]"
run_check "Lighthouse workflow exists" "[ -f '.github/workflows/lighthouse.yml' ]"
run_check "PR checks workflow exists" "[ -f '.github/workflows/pr-checks.yml' ]"

# 6. Check configuration files
run_check "Vite config exists" "[ -f 'frontend/vite.config.ts' ]"
run_check "TypeScript config exists" "[ -f 'frontend/tsconfig.json' ]"
run_check "Package.json exists" "[ -f 'package.json' ]"
run_check "Frontend package.json exists" "[ -f 'frontend/package.json' ]"

# 7. Check documentation
run_check "README exists" "[ -f 'README.md' ]"
run_check "Deployment checklist exists" "[ -f 'docs/DEPLOYMENT_CHECKLIST.md' ]"

# 8. Check version consistency
echo -e "${BLUE}▶ Checking: Version Consistency${NC}"
ROOT_VERSION=$(node -p "require('./package.json').version")
FRONTEND_VERSION=$(node -p "require('./frontend/package.json').version")

if [ "$ROOT_VERSION" = "$FRONTEND_VERSION" ]; then
    echo -e "${GREEN}✅ Version Consistency - PASSED (v${ROOT_VERSION})${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Version Consistency - FAILED${NC}"
    echo -e "${RED}   Root: ${ROOT_VERSION}, Frontend: ${FRONTEND_VERSION}${NC}"
    ((FAILED++))
fi
echo ""

# 9. Check for common issues
echo -e "${BLUE}▶ Checking: Common Issues${NC}"

# Check for console.log statements (should be minimal in production)
CONSOLE_LOGS=$(grep -r "console\.log" frontend/src --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null | wc -l | tr -d ' ')
if [ "$CONSOLE_LOGS" -lt 50 ]; then
    echo -e "${GREEN}✅ Console.log statements - ACCEPTABLE (${CONSOLE_LOGS} found)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Console.log statements - WARNING (${CONSOLE_LOGS} found)${NC}"
    ((WARNINGS++))
fi

# Check bundle size
if [ -f "frontend/dist/bundle-info.json" ]; then
    BUNDLE_SIZE=$(node -p "require('./frontend/dist/bundle-info.json').totalSize" 2>/dev/null || echo "0")
    if [ "$BUNDLE_SIZE" != "0" ]; then
        echo -e "${GREEN}✅ Bundle size info available${NC}"
        ((PASSED++))
    fi
fi

echo ""

# 10. Summary
echo "================================"
echo "📊 Verification Summary"
echo "================================"
echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warnings: ${WARNINGS}${NC}"
fi
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Failed: ${FAILED}${NC}"
    echo ""
    echo -e "${RED}❌ Deployment checks failed. Please fix the issues above before deploying.${NC}"
    exit 1
else
    echo ""
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Review warnings above before deploying.${NC}"
    else
        echo -e "${GREEN}🚀 Ready for deployment!${NC}"
    fi
    exit 0
fi

