/**
 * E2E tests for Recurring Templates creation and management flow
 * Tests the complete user journey of creating and managing recurring templates
 */

import { test, expect } from '@playwright/test';

test.describe('Recurring Templates Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/');
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const deleteReq = indexedDB.deleteDatabase('instant-express-manager');
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve();
        deleteReq.onblocked = () => resolve();
      });
    });
    await page.reload();

    // Create a bank and account for recurring templates
    await page.click('text=/banks/i');
    await page.click('button:has-text("Add Bank")');
    await page.fill('input[name="name"]', 'Recurring Test Bank');
    await page.selectOption('select[name="type"]', 'Bank');
    await page.click('button[type="submit"]');

    await page.click('text=/accounts/i');
    await page.click('button:has-text("Add Account")');
    await page.selectOption('select[name="bankId"]', { label: /Recurring Test Bank/i });
    await page.fill('input[name="name"]', 'Recurring Test Account');
    await page.selectOption('select[name="accountType"]', 'Savings');
    await page.fill('input[name="accountNumber"]', '999888');
    await page.fill('input[name="currentBalance"]', '50000');
    await page.click('button[type="submit"]');
  });

  test('should create recurring income template and verify transactions are generated', async ({ page }) => {
    await page.goto('/recurring');

    // Select Income tab
    await page.click('button[role="tab"]:has-text("Income")');

    // Click Add Recurring Template button
    await page.click('button:has-text("Add")');

    // Fill recurring income form
    await page.fill('input[name="name"]', 'Monthly Salary E2E');
    await page.selectOption('select[name="accountId"]', { label: /Recurring Test Account/i });
    await page.selectOption('select[name="category"]', 'Salary');
    await page.fill('input[name="description"]', 'Monthly Salary from Company');
    await page.fill('input[name="amount"]', '50000');
    await page.selectOption('select[name="frequency"]', 'Monthly');
    await page.fill('input[name="dayOfMonth"]', '1');
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.fill('input[name="endDate"]', '2025-12-31');
    await page.selectOption('select[name="status"]', 'Active');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for template to appear
    await expect(page.locator('text=Monthly Salary E2E')).toBeVisible({ timeout: 5000 });

    // Verify transactions were generated (should be 12 for monthly from Jan to Dec)
    await page.goto('/transactions');
    await page.click('button[role="tab"]:has-text("Income")');
    
    // Check that transactions exist (should see at least one)
    const transactionCount = await page.locator('text=/Monthly Salary from Company/i').count();
    expect(transactionCount).toBeGreaterThan(0);
  });

  test('should create recurring expense template', async ({ page }) => {
    await page.goto('/recurring');

    // Select Expense tab
    await page.click('button[role="tab"]:has-text("Expense")');

    // Click Add Recurring Template button
    await page.click('button:has-text("Add")');

    // Fill recurring expense form
    await page.fill('input[name="name"]', 'Monthly Rent E2E');
    await page.selectOption('select[name="accountId"]', { label: /Recurring Test Account/i });
    await page.selectOption('select[name="category"]', 'Utilities');
    await page.selectOption('select[name="bucket"]', 'Expense');
    await page.fill('input[name="description"]', 'Monthly Rent Payment');
    await page.fill('input[name="amount"]', '15000');
    await page.selectOption('select[name="frequency"]', 'Monthly');
    await page.fill('input[name="dayOfMonth"]', '5');
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.selectOption('select[name="status"]', 'Active');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for template to appear
    await expect(page.locator('text=Monthly Rent E2E')).toBeVisible({ timeout: 5000 });

    // Verify transactions were generated
    await page.goto('/transactions');
    await page.click('button[role="tab"]:has-text("Expense")');
    
    const transactionCount = await page.locator('text=/Monthly Rent Payment/i').count();
    expect(transactionCount).toBeGreaterThan(0);
  });

  test('should update recurring template', async ({ page }) => {
    await page.goto('/recurring');

    // Create a recurring template first
    await page.click('button[role="tab"]:has-text("Income")');
    await page.click('button:has-text("Add")');
    await page.fill('input[name="name"]', 'Test Template E2E');
    await page.selectOption('select[name="accountId"]', { label: /Recurring Test Account/i });
    await page.selectOption('select[name="category"]', 'Salary');
    await page.fill('input[name="amount"]', '40000');
    await page.selectOption('select[name="frequency"]', 'Monthly');
    await page.fill('input[name="dayOfMonth"]', '1');
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.click('button[type="submit"]');

    // Wait for template to appear
    await expect(page.locator('text=Test Template E2E')).toBeVisible({ timeout: 5000 });

    // Edit the template (click edit button)
    await page.click('button[aria-label*="Edit"], button[aria-label*="edit"]').catch(() => {
      // If edit button not found, try clicking on the template row
      page.locator('text=Test Template E2E').click();
    });

    // Update amount
    await page.fill('input[name="amount"]', '45000');
    await page.click('button[type="submit"]');

    // Verify update
    await expect(page.locator('text=45000')).toBeVisible({ timeout: 5000 });
  });

  test('should delete recurring template', async ({ page }) => {
    await page.goto('/recurring');

    // Create a recurring template first
    await page.click('button[role="tab"]:has-text("Income")');
    await page.click('button:has-text("Add")');
    await page.fill('input[name="name"]', 'Delete Test E2E');
    await page.selectOption('select[name="accountId"]', { label: /Recurring Test Account/i });
    await page.selectOption('select[name="category"]', 'Salary');
    await page.fill('input[name="amount"]', '30000');
    await page.selectOption('select[name="frequency"]', 'Monthly');
    await page.fill('input[name="dayOfMonth"]', '1');
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.click('button[type="submit"]');

    // Wait for template to appear
    await expect(page.locator('text=Delete Test E2E')).toBeVisible({ timeout: 5000 });

    // Delete the template
    await page.click('button[aria-label*="Delete"], button[aria-label*="delete"]').catch(() => {
      // If delete button not found, try alternative selector
      page.locator('text=Delete Test E2E').locator('..').locator('button').last().click();
    });

    // Confirm deletion if dialog appears
    const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }

    // Verify template is removed
    await expect(page.locator('text=Delete Test E2E')).not.toBeVisible({ timeout: 5000 });
  });
});

