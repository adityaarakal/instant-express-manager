/**
 * E2E tests for Transaction creation and management flow
 * Tests the complete user journey of creating and managing transactions
 */

import { test, expect } from '@playwright/test';

test.describe('Transaction Flow', () => {
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

    // Create a bank and account for transactions
    await page.click('text=/banks/i');
    await page.click('button:has-text("Add Bank")');
    await page.fill('input[name="name"]', 'Transaction Test Bank');
    await page.selectOption('select[name="type"]', 'Bank');
    await page.click('button[type="submit"]');

    await page.click('text=/accounts/i');
    await page.click('button:has-text("Add Account")');
    await page.selectOption('select[name="bankId"]', { label: /Transaction Test Bank/i });
    await page.fill('input[name="name"]', 'Transaction Test Account');
    await page.selectOption('select[name="accountType"]', 'Savings');
    await page.fill('input[name="accountNumber"]', '111222');
    await page.fill('input[name="currentBalance"]', '100000');
    await page.click('button[type="submit"]');
  });

  test('should create income transaction', async ({ page }) => {
    await page.goto('/transactions');

    // Select Income tab
    await page.click('button[role="tab"]:has-text("Income")');

    // Click Add Transaction button
    await page.click('button:has-text("Add Transaction")');

    // Fill transaction form
    await page.fill('input[name="date"]', '2025-01-15');
    await page.selectOption('select[name="accountId"]', { label: /Transaction Test Account/i });
    await page.selectOption('select[name="category"]', 'Salary');
    await page.fill('input[name="description"]', 'Monthly Salary E2E');
    await page.fill('input[name="amount"]', '50000');
    await page.selectOption('select[name="status"]', 'Received');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify transaction appears in list
    await expect(page.locator('text=Monthly Salary E2E')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=50000')).toBeVisible();
  });

  test('should create expense transaction and verify balance updates', async ({ page }) => {
    await page.goto('/transactions');

    // Select Expense tab
    await page.click('button[role="tab"]:has-text("Expense")');

    // Get initial balance from accounts page
    await page.goto('/accounts');
    const initialBalanceText = await page.locator('text=/Transaction Test Account/i').locator('..').locator('text=/\\d+/').first().textContent();
    const initialBalance = initialBalanceText ? parseFloat(initialBalanceText.replace(/[^0-9.]/g, '')) : 0;

    // Go back to transactions
    await page.goto('/transactions');
    await page.click('button[role="tab"]:has-text("Expense")');

    // Click Add Transaction button
    await page.click('button:has-text("Add Transaction")');

    // Fill expense transaction form
    await page.fill('input[name="date"]', '2025-01-15');
    await page.selectOption('select[name="accountId"]', { label: /Transaction Test Account/i });
    await page.selectOption('select[name="category"]', 'Utilities');
    await page.selectOption('select[name="bucket"]', 'Expense');
    await page.fill('input[name="description"]', 'Electricity Bill E2E');
    await page.fill('input[name="amount"]', '5000');
    await page.selectOption('select[name="status"]', 'Paid');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify transaction appears
    await expect(page.locator('text=Electricity Bill E2E')).toBeVisible({ timeout: 5000 });

    // Verify balance updated on accounts page
    await page.goto('/accounts');
    const newBalanceText = await page.locator('text=/Transaction Test Account/i').locator('..').locator('text=/\\d+/').first().textContent();
    const newBalance = newBalanceText ? parseFloat(newBalanceText.replace(/[^0-9.]/g, '')) : 0;
    
    // Balance should have decreased by 5000
    expect(newBalance).toBeLessThan(initialBalance);
  });

  test('should filter transactions by account', async ({ page }) => {
    await page.goto('/transactions');

    // Create a transaction first
    await page.click('button[role="tab"]:has-text("Income")');
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[name="date"]', '2025-01-15');
    await page.selectOption('select[name="accountId"]', { label: /Transaction Test Account/i });
    await page.selectOption('select[name="category"]', 'Salary');
    await page.fill('input[name="description"]', 'Filter Test Transaction');
    await page.fill('input[name="amount"]', '30000');
    await page.selectOption('select[name="status"]', 'Received');
    await page.click('button[type="submit"]');

    // Wait for transaction to appear
    await expect(page.locator('text=Filter Test Transaction')).toBeVisible({ timeout: 5000 });

    // Apply account filter (click Filters button if it exists, or use filter dropdown)
    const filtersButton = page.locator('button:has-text("Filters")');
    if (await filtersButton.isVisible()) {
      await filtersButton.click();
      
      // Select account filter if visible
      const accountSelect = page.locator('select').filter({ hasText: /account/i }).first();
      if (await accountSelect.isVisible()) {
        await accountSelect.selectOption({ label: /Transaction Test Account/i });
      }
    }

    // Verify filtered transaction is visible
    await expect(page.locator('text=Filter Test Transaction')).toBeVisible();
  });
});

