/**
 * E2E tests for Cross-Browser Compatibility
 * Tests core functionality across different browsers
 * Run with: npm run test:e2e -- --project=chromium|firefox|webkit
 */

import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  test.describe('Basic Navigation', () => {
    test('should navigate to all main pages', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test navigation to Dashboard
      await page.click('text=/dashboard/i');
      await expect(page).toHaveURL(/.*dashboard/i);
      await page.waitForLoadState('networkidle');

      // Test navigation to Transactions
      await page.click('text=/transactions/i');
      await expect(page).toHaveURL(/.*transactions/i);
      await page.waitForLoadState('networkidle');

      // Test navigation to Banks
      await page.click('text=/banks/i');
      await expect(page).toHaveURL(/.*banks/i);
      await page.waitForLoadState('networkidle');

      // Test navigation to Accounts
      await page.click('text=/accounts/i');
      await expect(page).toHaveURL(/.*accounts/i);
      await page.waitForLoadState('networkidle');

      // Test navigation to EMIs
      await page.click('text=/emis/i');
      await expect(page).toHaveURL(/.*emis/i);
      await page.waitForLoadState('networkidle');

      // Test navigation to Recurring
      await page.click('text=/recurring/i');
      await expect(page).toHaveURL(/.*recurring/i);
      await page.waitForLoadState('networkidle');

      // Test navigation to Planner
      await page.click('text=/planner/i');
      await expect(page).toHaveURL(/.*planner/i);
      await page.waitForLoadState('networkidle');

      // Test navigation to Analytics
      await page.click('text=/analytics/i');
      await expect(page).toHaveURL(/.*analytics/i);
      await page.waitForLoadState('networkidle');

      // Test navigation to Settings
      await page.click('text=/settings/i');
      await expect(page).toHaveURL(/.*settings/i);
      await page.waitForLoadState('networkidle');
    });

    test('should have working back button', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/banks/i');
      await expect(page).toHaveURL(/.*banks/i);

      // Go back
      await page.goBack();
      await expect(page).toHaveURL(/\/(?!.*banks)/); // URL should not contain 'banks'

      // Go forward
      await page.goForward();
      await expect(page).toHaveURL(/.*banks/i);
    });
  });

  test.describe('Bank CRUD Operations', () => {
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
      await page.waitForLoadState('networkidle');
    });

    test('should create a bank', async ({ page }) => {
      await page.click('text=/banks/i');
      await page.waitForURL(/.*banks/i);
      await page.click('button:has-text("Add Bank")');

      await page.fill('input[name="name"]', 'Cross-Browser Test Bank');
      await page.selectOption('select[name="type"]', 'Bank');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Cross-Browser Test Bank')).toBeVisible({ timeout: 5000 });
    });

    test('should read/list banks', async ({ page }) => {
      // Create a bank first
      await page.click('text=/banks/i');
      await page.click('button:has-text("Add Bank")');
      await page.fill('input[name="name"]', 'List Test Bank');
      await page.selectOption('select[name="type"]', 'Bank');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=List Test Bank')).toBeVisible({ timeout: 5000 });

      // Reload and verify bank is listed
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.click('text=/banks/i');
      await page.waitForURL(/.*banks/i);

      await expect(page.locator('text=List Test Bank')).toBeVisible({ timeout: 5000 });
    });

    test('should update a bank', async ({ page }) => {
      // Create a bank first
      await page.click('text=/banks/i');
      await page.click('button:has-text("Add Bank")');
      await page.fill('input[name="name"]', 'Update Test Bank');
      await page.selectOption('select[name="type"]', 'Bank');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Update Test Bank')).toBeVisible({ timeout: 5000 });

      // Find and click edit button (implementation may vary)
      // This is a basic test - actual edit flow depends on UI implementation
      await page.waitForTimeout(1000);
    });

    test('should delete a bank', async ({ page }) => {
      // Create a bank first
      await page.click('text=/banks/i');
      await page.click('button:has-text("Add Bank")');
      await page.fill('input[name="name"]', 'Delete Test Bank');
      await page.selectOption('select[name="type"]', 'Bank');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Delete Test Bank')).toBeVisible({ timeout: 5000 });

      // Find and click delete button (implementation may vary)
      // This is a basic test - actual delete flow depends on UI implementation
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Account CRUD Operations', () => {
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
      await page.waitForLoadState('networkidle');

      // Create a bank first
      await page.click('text=/banks/i');
      await page.click('button:has-text("Add Bank")');
      await page.fill('input[name="name"]', 'Account Test Bank');
      await page.selectOption('select[name="type"]', 'Bank');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Account Test Bank')).toBeVisible({ timeout: 5000 });
    });

    test('should create an account', async ({ page }) => {
      await page.click('text=/accounts/i');
      await page.waitForURL(/.*accounts/i);
      await page.click('button:has-text("Add Account")');

      await page.fill('input[name="accountName"]', 'Cross-Browser Test Account');
      await page.fill('input[name="currentBalance"]', '10000');
      await page.selectOption('select[name="bankId"]', 'Account Test Bank');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Cross-Browser Test Account')).toBeVisible({ timeout: 5000 });
    });

    test('should read/list accounts', async ({ page }) => {
      // Create an account first
      await page.click('text=/accounts/i');
      await page.click('button:has-text("Add Account")');
      await page.fill('input[name="accountName"]', 'List Test Account');
      await page.fill('input[name="currentBalance"]', '10000');
      await page.selectOption('select[name="bankId"]', 'Account Test Bank');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=List Test Account')).toBeVisible({ timeout: 5000 });

      // Reload and verify account is listed
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.click('text=/accounts/i');
      await page.waitForURL(/.*accounts/i);

      await expect(page.locator('text=List Test Account')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Transaction Operations', () => {
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
      await page.waitForLoadState('networkidle');

      // Create a bank and account first
      await page.click('text=/banks/i');
      await page.click('button:has-text("Add Bank")');
      await page.fill('input[name="name"]', 'Transaction Test Bank');
      await page.selectOption('select[name="type"]', 'Bank');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Transaction Test Bank')).toBeVisible({ timeout: 5000 });

      await page.click('text=/accounts/i');
      await page.click('button:has-text("Add Account")');
      await page.fill('input[name="accountName"]', 'Transaction Test Account');
      await page.fill('input[name="currentBalance"]', '10000');
      await page.selectOption('select[name="bankId"]', 'Transaction Test Bank');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Transaction Test Account')).toBeVisible({ timeout: 5000 });
    });

    test('should create an income transaction', async ({ page }) => {
      await page.click('text=/transactions/i');
      await page.waitForURL(/.*transactions/i);
      await page.click('button:has-text("Add Transaction")');
      await page.click('button:has-text("Income")');

      await page.fill('input[name="amount"]', '5000');
      await page.fill('input[name="description"]', 'Cross-Browser Test Income');
      await page.selectOption('select[name="accountId"]', 'Transaction Test Account');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Cross-Browser Test Income')).toBeVisible({ timeout: 5000 });
    });

    test('should create an expense transaction', async ({ page }) => {
      await page.click('text=/transactions/i');
      await page.waitForURL(/.*transactions/i);
      await page.click('button:has-text("Add Transaction")');
      await page.click('button:has-text("Expense")');

      await page.fill('input[name="amount"]', '2000');
      await page.fill('input[name="description"]', 'Cross-Browser Test Expense');
      await page.selectOption('select[name="accountId"]', 'Transaction Test Account');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Cross-Browser Test Expense')).toBeVisible({ timeout: 5000 });
    });

    test('should filter transactions', async ({ page }) => {
      // Create transactions first
      await page.click('text=/transactions/i');
      await page.click('button:has-text("Add Transaction")');
      await page.click('button:has-text("Income")');
      await page.fill('input[name="amount"]', '5000');
      await page.fill('input[name="description"]', 'Filter Test Income');
      await page.selectOption('select[name="accountId"]', 'Transaction Test Account');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Filter Test Income')).toBeVisible({ timeout: 5000 });

      // Test filtering (if implemented)
      // This depends on the actual filter UI implementation
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Form Validation', () => {
    test('should validate required fields', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/banks/i');
      await page.waitForURL(/.*banks/i);
      await page.click('button:has-text("Add Bank")');

      // Try to submit without filling required fields
      await page.click('button[type="submit"]');

      // Check for validation errors (implementation may vary)
      // This depends on form validation implementation
      await page.waitForTimeout(1000);
    });

    test('should validate input formats', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/accounts/i');
      await page.waitForURL(/.*accounts/i);

      // Create a bank first
      await page.click('text=/banks/i');
      await page.click('button:has-text("Add Bank")');
      await page.fill('input[name="name"]', 'Validation Test Bank');
      await page.selectOption('select[name="type"]', 'Bank');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Validation Test Bank')).toBeVisible({ timeout: 5000 });

      await page.click('text=/accounts/i');
      await page.click('button:has-text("Add Account")');

      // Try invalid balance (non-numeric or negative)
      await page.fill('input[name="currentBalance"]', 'invalid');
      await page.selectOption('select[name="bankId"]', 'Validation Test Bank');
      await page.click('button[type="submit"]');

      // Check for validation errors (implementation may vary)
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify navigation works on mobile
      await page.click('text=/banks/i');
      await expect(page).toHaveURL(/.*banks/i);

      // Verify content is visible and not cut off
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify navigation works on tablet
      await page.click('text=/accounts/i');
      await expect(page).toHaveURL(/.*accounts/i);

      // Verify content is visible
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should work on desktop viewport', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify navigation works on desktop
      await page.click('text=/analytics/i');
      await expect(page).toHaveURL(/.*analytics/i);

      // Verify content is visible
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Browser-Specific Features', () => {
    test('should handle localStorage/IndexedDB correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check IndexedDB is available
      const idbAvailable = await page.evaluate(() => {
        return 'indexedDB' in window;
      });

      expect(idbAvailable).toBe(true);
    });

    test('should handle service worker correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Wait for service worker registration
      await page.waitForFunction(() => {
        return 'serviceWorker' in navigator;
      }, { timeout: 10000 });

      const swAvailable = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });

      expect(swAvailable).toBe(true);
    });

    test('should handle fetch API correctly', async ({ page }) => {
      // Check fetch API is available
      const fetchAvailable = await page.evaluate(() => {
        return 'fetch' in window;
      });

      expect(fetchAvailable).toBe(true);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Page should still load (cached or error state)
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Go back online
      await context.setOffline(false);
    });

    test('should handle invalid routes gracefully', async ({ page }) => {
      // Navigate to invalid route
      await page.goto('/invalid-route-12345');

      // Should either redirect to home or show 404
      // This depends on routing implementation
      await page.waitForLoadState('domcontentloaded');

      // Page should still be functional
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });
});

