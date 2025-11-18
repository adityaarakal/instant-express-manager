/**
 * E2E tests for Bank and Bank Account creation flow
 * Tests the complete user journey of creating banks and accounts
 */

import { test, expect } from '@playwright/test';

test.describe('Bank and Bank Account Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/');
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const deleteReq = indexedDB.deleteDatabase('instant-express-manager');
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve(); // Continue even if delete fails
        deleteReq.onblocked = () => resolve();
      });
    });
    await page.reload();
  });

  test('should create a bank and then create an account', async ({ page }) => {
    await page.goto('/');

    // Navigate to Banks page
    await page.click('text=/banks/i');
    await expect(page).toHaveURL(/.*banks/i);

    // Click "Add Bank" button
    await page.click('button:has-text("Add Bank")');

    // Fill bank form
    await page.fill('input[name="name"]', 'Test Bank E2E');
    await page.selectOption('select[name="type"]', 'Bank');

    // Submit bank form
    await page.click('button[type="submit"]');

    // Verify bank is created (should see it in the list or success message)
    await expect(page.locator('text=Test Bank E2E')).toBeVisible({ timeout: 5000 });

    // Navigate to Bank Accounts page
    await page.click('text=/accounts/i');
    await expect(page).toHaveURL(/.*accounts/i);

    // Click "Add Account" button
    await page.click('button:has-text("Add Account")');

    // Fill account form
    await page.selectOption('select[name="bankId"]', { label: /Test Bank E2E/i });
    await page.fill('input[name="name"]', 'Test Account E2E');
    await page.selectOption('select[name="accountType"]', 'Savings');
    await page.fill('input[name="accountNumber"]', '123456');
    await page.fill('input[name="currentBalance"]', '10000');

    // Submit account form
    await page.click('button[type="submit"]');

    // Verify account is created
    await expect(page.locator('text=Test Account E2E')).toBeVisible({ timeout: 5000 });
  });

  test('should display bank and account in dashboard', async ({ page }) => {
    await page.goto('/');

    // Navigate to Banks and create a bank
    await page.click('text=/banks/i');
    await page.click('button:has-text("Add Bank")');
    await page.fill('input[name="name"]', 'Dashboard Test Bank');
    await page.selectOption('select[name="type"]', 'Bank');
    await page.click('button[type="submit"]');

    // Create an account
    await page.click('text=/accounts/i');
    await page.click('button:has-text("Add Account")');
    await page.selectOption('select[name="bankId"]', { label: /Dashboard Test Bank/i });
    await page.fill('input[name="name"]', 'Dashboard Test Account');
    await page.selectOption('select[name="accountType"]', 'Savings');
    await page.fill('input[name="accountNumber"]', '789012');
    await page.fill('input[name="currentBalance"]', '50000');
    await page.click('button[type="submit"]');

    // Navigate to Dashboard
    await page.click('text=/dashboard/i');
    await expect(page).toHaveURL(/.*dashboard/i);

    // Verify account appears in dashboard
    await expect(page.locator('text=Dashboard Test Account')).toBeVisible({ timeout: 5000 });
  });
});

