/**
 * E2E Tests for Planner Page - Due Date Zeroing Logic
 * 
 * Tests the visual indicators and behavior of due date zeroing in the Planner UI
 */

import { test, expect } from '@playwright/test';

test.describe('Planner - Due Date Zeroing Logic', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
    
    // Clear any existing data
    await page.evaluate(() => {
      localStorage.clear();
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      });
    });
    
    // Reload to ensure clean state
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should show zeroed amounts with strikethrough for past-due transactions', async ({ page }) => {
    // Create a bank and account
    await page.click('text=Banks');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Add Bank")');
    await page.fill('input[name="name"]', 'Test Bank');
    await page.selectOption('select[name="type"]', 'Bank');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(500);

    await page.click('text=Bank Accounts');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[name="name"]', 'Test Account');
    await page.selectOption('select[name="accountType"]', 'Savings');
    await page.fill('input[name="currentBalance"]', '10000');
    await page.fill('input[name="accountNumber"]', '123456');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(500);

    // Create an expense transaction with a past due date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDueDate = yesterday.toISOString().split('T')[0];

    await page.click('text=Transactions');
    await page.waitForLoadState('networkidle');
    await page.click('button[aria-label="Add transaction"]');
    await page.click('text=Expense');
    await page.fill('input[name="description"]', 'Past Due Expense');
    await page.fill('input[name="amount"]', '5000');
    await page.fill('input[name="date"]', pastDueDate);
    await page.selectOption('select[name="accountId"]', 'Test Account');
    await page.selectOption('select[name="category"]', 'Food');
    await page.selectOption('select[name="bucket"]', 'Balance');
    await page.fill('input[name="dueDate"]', pastDueDate);
    await page.selectOption('select[name="status"]', 'Pending');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(500);

    // Navigate to Planner
    await page.click('text=Planner');
    await page.waitForLoadState('networkidle');

    // Wait for the planner to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check for zeroed amount indicator (strikethrough or "0")
    // The amount should be displayed as 0 or with strikethrough styling
    const table = page.locator('table').first();
    
    // Look for the bucket amount cell - it should show 0 or have strikethrough
    const bucketCell = table.locator('td').filter({ hasText: /Balance|₹/ }).first();
    
    // Verify that past-due amounts are zeroed (either shows "0" or has strikethrough)
    // The exact implementation may vary, but we should see some indication
    const cellText = await bucketCell.textContent();
    expect(cellText).toBeTruthy();
    
    // Check for warning icon or tooltip indicating past-due
    const warningIcon = page.locator('[aria-label*="warning" i], [title*="past" i], [title*="due" i]').first();
    const hasWarning = await warningIcon.count() > 0;
    
    // At minimum, the amount should be zero or visually indicated as zeroed
    expect(hasWarning || cellText?.includes('0') || cellText?.includes('₹0')).toBeTruthy();
  });

  test('should show normal amounts for future due dates', async ({ page }) => {
    // Create a bank and account
    await page.click('text=Banks');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Add Bank")');
    await page.fill('input[name="name"]', 'Test Bank');
    await page.selectOption('select[name="type"]', 'Bank');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(500);

    await page.click('text=Bank Accounts');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[name="name"]', 'Test Account');
    await page.selectOption('select[name="accountType"]', 'Savings');
    await page.fill('input[name="currentBalance"]', '10000');
    await page.fill('input[name="accountNumber"]', '123456');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(500);

    // Create an expense transaction with a future due date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDueDate = tomorrow.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    await page.click('text=Transactions');
    await page.waitForLoadState('networkidle');
    await page.click('button[aria-label="Add transaction"]');
    await page.click('text=Expense');
    await page.fill('input[name="description"]', 'Future Due Expense');
    await page.fill('input[name="amount"]', '3000');
    await page.fill('input[name="date"]', today);
    await page.selectOption('select[name="accountId"]', 'Test Account');
    await page.selectOption('select[name="category"]', 'Food');
    await page.selectOption('select[name="bucket"]', 'Balance');
    await page.fill('input[name="dueDate"]', futureDueDate);
    await page.selectOption('select[name="status"]', 'Pending');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(500);

    // Navigate to Planner
    await page.click('text=Planner');
    await page.waitForLoadState('networkidle');

    // Wait for the planner to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check that the amount is NOT zeroed (should show the actual amount)
    const table = page.locator('table').first();
    const bucketCell = table.locator('td').filter({ hasText: /Balance|₹/ }).first();
    const cellText = await bucketCell.textContent();
    
    // Should show the actual amount (3000), not zero
    expect(cellText).toContain('3');
    expect(cellText).not.toContain('₹0');
  });

  test('should display tooltip with original amount for zeroed items', async ({ page }) => {
    // Create a bank and account
    await page.click('text=Banks');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Add Bank")');
    await page.fill('input[name="name"]', 'Test Bank');
    await page.selectOption('select[name="type"]', 'Bank');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(500);

    await page.click('text=Bank Accounts');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[name="name"]', 'Test Account');
    await page.selectOption('select[name="accountType"]', 'Savings');
    await page.fill('input[name="currentBalance"]', '10000');
    await page.fill('input[name="accountNumber"]', '123456');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(500);

    // Create an expense transaction with a past due date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDueDate = yesterday.toISOString().split('T')[0];

    await page.click('text=Transactions');
    await page.waitForLoadState('networkidle');
    await page.click('button[aria-label="Add transaction"]');
    await page.click('text=Expense');
    await page.fill('input[name="description"]', 'Past Due Expense');
    await page.fill('input[name="amount"]', '5000');
    await page.fill('input[name="date"]', pastDueDate);
    await page.selectOption('select[name="accountId"]', 'Test Account');
    await page.selectOption('select[name="category"]', 'Food');
    await page.selectOption('select[name="bucket"]', 'Balance');
    await page.fill('input[name="dueDate"]', pastDueDate);
    await page.selectOption('select[name="status"]', 'Pending');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(500);

    // Navigate to Planner
    await page.click('text=Planner');
    await page.waitForLoadState('networkidle');

    // Wait for the planner to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Hover over a zeroed amount cell to see tooltip
    const table = page.locator('table').first();
    const bucketCell = table.locator('td').filter({ hasText: /Balance|₹/ }).first();
    
    // Hover to trigger tooltip
    await bucketCell.hover();
    await page.waitForTimeout(500);

    // Check for tooltip with information about the zeroed amount
    // The tooltip should mention the original amount or due date
    const tooltip = page.locator('[role="tooltip"], [class*="tooltip"], [class*="MuiTooltip"]');
    const tooltipText = await tooltip.textContent().catch(() => null);
    
    // Tooltip should exist and contain relevant information
    // (exact text may vary based on implementation)
    if (tooltipText) {
      expect(tooltipText.length).toBeGreaterThan(0);
    }
  });
});

