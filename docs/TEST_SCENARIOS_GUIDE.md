# Test Scenarios Guide - Defining User Flows

## Overview

This guide helps you define test scenarios for each module. These scenarios represent **user flows** - complete journeys that users take through your application.

## What to Test

Focus on testing **critical user flows** that:

1. **Core Functionality**: Essential features users rely on
2. **Data Integrity**: Ensure data is saved, updated, and deleted correctly
3. **User Experience**: Verify UI interactions work as expected
4. **Cross-Module Integration**: Test flows that span multiple modules

## Module-Specific Scenarios

### Dashboard Module (Global)

**Critical Flows:**
- ✅ Dashboard loads and displays metrics
- ✅ Dashboard shows correct monthly/overall totals
- ✅ Dashboard widgets can be toggled/shown/hidden
- ✅ Dashboard updates when data changes
- ✅ Navigation from dashboard to other modules works

**Example Scenario:**
```typescript
test('should display dashboard with correct metrics', async ({ page }) => {
  // Setup: Create some test data (banks, accounts, transactions)
  // Navigate to dashboard
  // Verify metrics are displayed correctly
  // Verify navigation links work
});
```

### Settings Module (Global)

**Critical Flows:**
- ✅ Theme preference is saved and persists
- ✅ Settings are saved correctly
- ✅ Settings affect app behavior immediately
- ✅ Data backup/restore works
- ✅ Export functionality works

**Example Scenario:**
```typescript
test('should save and persist theme preference', async ({ page }) => {
  // Navigate to settings
  // Change theme
  // Reload page
  // Verify theme persists
});
```

### Banks Module

**Critical Flows:**
- ✅ Create a new bank
- ✅ Edit bank details
- ✅ Delete a bank
- ✅ List all banks
- ✅ Bank validation works

**Example Scenario:**
```typescript
test('should create, edit, and delete a bank', async ({ page }) => {
  // Create bank
  // Verify it appears in list
  // Edit bank
  // Verify changes saved
  // Delete bank
  // Verify it's removed
});
```

### Accounts Module

**Critical Flows:**
- ✅ Create account linked to bank
- ✅ Edit account details
- ✅ Delete account
- ✅ Account balance updates correctly
- ✅ Account appears in transactions dropdown

**Example Scenario:**
```typescript
test('should create account and verify balance updates', async ({ page }) => {
  // Create bank first
  // Create account with initial balance
  // Verify balance displayed correctly
  // Add transaction
  // Verify balance updated
});
```

### Transactions Module

**Critical Flows:**
- ✅ Create income transaction
- ✅ Create expense transaction
- ✅ Create savings/investment transaction
- ✅ Edit transaction
- ✅ Delete transaction
- ✅ Transaction affects account balance
- ✅ Filters work correctly
- ✅ Undo functionality works

**Example Scenario:**
```typescript
test('should create transaction and verify balance update', async ({ page }) => {
  // Setup: Create bank and account
  // Create income transaction
  // Verify transaction appears
  // Verify account balance updated
  // Delete transaction
  // Verify balance reverted
});
```

### EMIs Module

**Critical Flows:**
- ✅ Create EMI
- ✅ EMI installments are generated
- ✅ Mark installment as paid
- ✅ EMI affects account balance
- ✅ Edit EMI
- ✅ Delete EMI

**Example Scenario:**
```typescript
test('should create EMI and mark installments as paid', async ({ page }) => {
  // Setup: Create bank and account
  // Create EMI
  // Verify installments generated
  // Mark first installment as paid
  // Verify balance updated
});
```

### Recurring Transactions Module

**Critical Flows:**
- ✅ Create recurring transaction template
- ✅ Recurring transactions are generated
- ✅ Edit recurring template
- ✅ Delete recurring template
- ✅ Generated transactions appear correctly

**Example Scenario:**
```typescript
test('should create recurring transaction and verify generation', async ({ page }) => {
  // Setup: Create bank and account
  // Create recurring transaction template
  // Verify transactions generated
  // Verify they appear in transactions list
});
```

### Planner Module

**Critical Flows:**
- ✅ Create monthly plan
- ✅ Allocate amounts to buckets
- ✅ Planner shows correct totals
- ✅ Due dates can be set
- ✅ Zero amounts can be overridden
- ✅ Planner data persists

**Example Scenario:**
```typescript
test('should create monthly plan and allocate buckets', async ({ page }) => {
  // Navigate to planner
  // Create plan for current month
  // Allocate amounts to buckets
  // Verify totals calculated correctly
  // Set due dates
  // Verify data persists
});
```

### Analytics Module

**Critical Flows:**
- ✅ Analytics page loads
- ✅ Charts display correctly
- ✅ Filters work
- ✅ Date range selection works
- ✅ Data is accurate

**Example Scenario:**
```typescript
test('should display analytics with correct data', async ({ page }) => {
  // Setup: Create transactions
  // Navigate to analytics
  // Verify charts displayed
  // Change date range
  // Verify data updates
});
```

### Credit Card Dashboard Module

**Critical Flows:**
- ✅ Credit card dashboard loads
- ✅ Outstanding balance displayed
- ✅ Payment history shown
- ✅ Due date calendar works
- ✅ Payment can be recorded

**Example Scenario:**
```typescript
test('should display credit card dashboard correctly', async ({ page }) => {
  // Setup: Create credit card account and transactions
  // Navigate to credit card dashboard
  // Verify outstanding balance
  // Verify payment history
  // Record payment
  // Verify balance updated
});
```

## Cross-Module Scenarios

These scenarios test flows that span multiple modules:

**Example: Complete Financial Flow**
```typescript
test('should complete full financial management flow', async ({ page }) => {
  // 1. Create bank
  // 2. Create account
  // 3. Add initial balance transaction
  // 4. Create recurring income
  // 5. Create EMI
  // 6. Create monthly plan
  // 7. Verify dashboard shows correct totals
  // 8. Verify analytics reflect all data
});
```

## Test Data Setup

Use realistic test data:

```typescript
// Good: Realistic data
await page.fill('input[name="name"]', 'HDFC Bank');
await page.fill('input[name="currentBalance"]', '50000');
await page.fill('input[name="amount"]', '5000');

// Avoid: Unrealistic or placeholder data
await page.fill('input[name="name"]', 'Test Bank');
await page.fill('input[name="currentBalance"]', '100');
```

## Test Organization

Organize tests by user flow, not by technical implementation:

```typescript
// Good: User flow organization
test('should create bank and account, then add transaction', async ({ page }) => {
  // Complete user journey
});

// Avoid: Technical organization
test('should test bank creation', async ({ page }) => {
  // Only tests one technical aspect
});
```

## When to Lock Tests

Lock tests when:

1. ✅ **Scenario is finalized** - You've tested it manually and it works
2. ✅ **Flow is critical** - Breaking this flow would impact users significantly
3. ✅ **Test is stable** - Test doesn't need frequent changes
4. ✅ **You're satisfied** - The test covers the scenario adequately

Don't lock tests when:

- ❌ Still experimenting with scenarios
- ❌ Test is frequently changing
- ❌ Not sure if scenario is complete

## Next Steps

1. **Start with Global Modules**: Define scenarios for Dashboard and Settings first
2. **Add Module-Specific Scenarios**: Add scenarios for modules you use most
3. **Test and Lock**: Run tests, verify they pass, then lock them
4. **Iterate**: Add more scenarios as you discover new flows

## See Also

- `docs/PLAYWRIGHT_TEST_SUITE.md` - Complete test suite documentation
- `frontend/e2e/modules/README.md` - Module test directory guide

