# 🎬 E2E Tests Visual Demo Guide

## Quick Start

### Option 1: Interactive UI Mode (Best for Demo)
```bash
npm run test:demo
# Then select option 1, or use:
bash scripts/demo-tests-ui.sh
```
Opens Playwright UI where you can:
- Watch tests run step-by-step
- See browser actions in real-time
- Pause/resume tests
- See detailed logs

### Option 2: HTML Report (Best for Review)
```bash
bash scripts/demo-tests-html.sh
```
Generates a detailed HTML report and opens it in your browser showing:
- Test results with screenshots
- Step-by-step execution
- Timeline view
- Video recordings (if enabled)

### Option 3: Headed Mode (See Browser Windows)
```bash
bash scripts/demo-tests-headed.sh
```
Runs tests with visible browser windows so you can watch:
- Browser opening and navigating
- Form filling
- Button clicks
- Page interactions

### Option 4: Terminal Output (Default)
```bash
npm run test:e2e
```
Shows test progress in terminal with:
- Test names
- Pass/fail status
- Execution time

## What You'll See

### Test 1: Create Bank
- Navigates to `/banks` page
- Clicks "Add Bank" button
- Fills in bank name
- Clicks "Create"
- Verifies bank appears in list

### Test 2: Create Bank Account
- Ensures a bank exists (creates one if needed)
- Navigates to `/accounts` page
- Clicks "Add Account" button
- Fills in account name
- Selects a bank from dropdown
- Clicks "Create"
- Verifies account appears in list

## Tips

- **For presentations**: Use UI mode (option 1) - most visual
- **For debugging**: Use HTML report (option 2) - most detailed
- **For quick check**: Use headed mode (option 3) - see browser
- **For CI/CD**: Use terminal output (option 4) - fastest

## Requirements

- Dev server should be running on `http://localhost:7001`
- If not running, the demo script will start it automatically
