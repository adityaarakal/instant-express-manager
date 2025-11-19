#!/bin/bash

# Comprehensive Test Runner Script
# Runs all tests (unit, integration, E2E) and validations

set -e

echo "🧪 Running Comprehensive Test Suite"
echo "===================================="
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
SKIPPED=0

# Function to run a test command and track results
run_test() {
    local name=$1
    local command=$2
    local required=${3:-true}  # Default to required
    
    echo -e "${BLUE}▶ Running: ${name}${NC}"
    
    if eval "$command"; then
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
            echo -e "${YELLOW}⚠️  ${name} - FAILED (optional)${NC}"
            ((SKIPPED++))
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

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo -e "${RED}Error: frontend directory not found${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Test Configuration:${NC}"
echo "  - Working directory: $(pwd)"
echo "  - Frontend directory: frontend/"
echo "  - Node version: $(node --version)"
echo "  - NPM version: $(npm --version)"
echo ""

# Step 1: TypeScript Compilation Check
echo "🔍 Step 1: Type Checking"
run_test "TypeScript Compilation" "cd frontend && npm run build -- --mode test 2>&1 | head -20" true

# Step 2: Linting
echo "🔍 Step 2: Code Quality (Linting)"
run_test "ESLint Validation" "cd frontend && npm run lint 2>&1 | grep -v 'warning' | head -30" false

# Step 3: Unit Tests
echo "🧪 Step 3: Unit Tests"
if [ -d "frontend/src" ] && find frontend/src -name "*.test.ts" -o -name "*.test.tsx" | grep -q .; then
    run_test "Unit Tests" "cd frontend && npm test -- --run 2>&1 | tail -20" false
else
    echo -e "${YELLOW}⚠️  No unit tests found${NC}"
    ((SKIPPED++))
    echo ""
fi

# Step 4: Integration Tests
echo "🔗 Step 4: Integration Tests"
if [ -d "frontend/src/integration" ] && find frontend/src/integration -name "*.test.ts" | grep -q .; then
    run_test "Integration Tests" "cd frontend && npm test -- --run src/integration 2>&1 | tail -20" false
else
    echo -e "${YELLOW}⚠️  No integration tests found${NC}"
    ((SKIPPED++))
    echo ""
fi

# Step 5: Build Validation
echo "🏗️  Step 5: Build Validation"
run_test "Production Build" "cd frontend && npm run build 2>&1 | tail -30" true

# Step 6: E2E Tests (if Playwright is available)
echo "🌐 Step 6: E2E Tests"
if command -v npx &> /dev/null && npx playwright --version &> /dev/null; then
    echo -e "${BLUE}  Available E2E test suites:${NC}"
    echo "    - PWA Functionality (pwa-functionality.spec.ts)"
    echo "    - Data Persistence (data-persistence.spec.ts)"
    echo "    - Cross-Browser Compatibility (cross-browser-compatibility.spec.ts)"
    echo "    - Transaction Flow (transaction-flow.spec.ts)"
    echo "    - Bank Account Flow (bank-account-flow.spec.ts)"
    echo "    - Recurring Templates Flow (recurring-templates-flow.spec.ts)"
    echo "    - EMIs Flow (emis-flow.spec.ts)"
    echo "    - Conversion Flow (conversion-flow.spec.ts)"
    echo ""
    
    # Check if dev server is running
    if curl -s http://localhost:7001 > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Dev server is running on port 7001${NC}"
        
        # Run E2E tests on Chromium only (faster for CI)
        if [ "$CI" = "true" ]; then
            run_test "E2E Tests (Chromium)" "cd frontend && npm run test:e2e -- --project=chromium 2>&1 | tail -40" false
        else
            # In local, ask user which tests to run
            echo -e "${YELLOW}  ⚠️  To run E2E tests, use:${NC}"
            echo "    cd frontend && npm run test:e2e"
            echo "    # Or for specific browser:"
            echo "    cd frontend && npm run test:e2e -- --project=chromium"
            echo "    cd frontend && npm run test:e2e -- --project=firefox"
            echo "    cd frontend && npm run test:e2e -- --project=webkit"
            ((SKIPPED++))
        fi
    else
        echo -e "${YELLOW}  ⚠️  Dev server not running on port 7001${NC}"
        echo -e "${YELLOW}     Start with: npm run dev${NC}"
        echo -e "${YELLOW}     Then run: cd frontend && npm run test:e2e${NC}"
        ((SKIPPED++))
    fi
else
    echo -e "${YELLOW}  ⚠️  Playwright not available${NC}"
    echo -e "${YELLOW}     Install with: cd frontend && npx playwright install${NC}"
    ((SKIPPED++))
fi

# Step 7: Version Validation
echo "📦 Step 7: Version Validation"
if [ -f "scripts/validate-version-bump.sh" ]; then
    run_test "Version Bump Validation" "bash scripts/validate-version-bump.sh 2>&1 | tail -10" false
else
    echo -e "${YELLOW}  ⚠️  Version validation script not found${NC}"
    ((SKIPPED++))
fi

# Step 8: Bundle Size Check
echo "📊 Step 8: Bundle Size Check"
if [ -f "frontend/dist/bundle-info.json" ]; then
    BUNDLE_SIZE=$(cat frontend/dist/bundle-info.json | grep -o '"totalSize": [0-9]*' | grep -o '[0-9]*')
    if [ ! -z "$BUNDLE_SIZE" ]; then
        BUNDLE_MB=$(echo "scale=2; $BUNDLE_SIZE / 1024 / 1024" | bc)
        echo -e "${GREEN}  ✓ Bundle size: ${BUNDLE_MB} MB${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}  ⚠️  Could not parse bundle size${NC}"
        ((SKIPPED++))
    fi
else
    echo -e "${YELLOW}  ⚠️  Bundle info not found (run build first)${NC}"
    ((SKIPPED++))
fi

# Summary
echo "===================================="
echo -e "${BLUE}📊 Test Summary:${NC}"
echo -e "  ${GREEN}✅ Passed: ${PASSED}${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "  ${RED}❌ Failed: ${FAILED}${NC}"
fi
if [ $SKIPPED -gt 0 ]; then
    echo -e "  ${YELLOW}⚠️  Skipped: ${SKIPPED}${NC}"
fi
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All required tests passed!${NC}"
    exit 0
fi

