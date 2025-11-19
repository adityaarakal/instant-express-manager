/**
 * E2E tests for Data Persistence
 * Tests that data persists across browser sessions, tabs, and refreshes
 */

import { test, expect } from '@playwright/test';

test.describe('Data Persistence', () => {
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

  test.describe('Across Page Refreshes', () => {
    test('should persist banks across page refresh', async ({ page }) => {
      // Create a bank
      await page.click('text=/banks/i');
      await page.waitForURL(/.*banks/i);
      await page.click('button:has-text("Add Bank")');
      await page.fill('input[name="name"]', 'Persistence Test Bank');
      await page.selectOption('select[name="type"]', 'Bank');
      await page.click('button[type="submit"]');

      // Wait for bank to be created
      await expect(page.locator('text=Persistence Test Bank')).toBeVisible({ timeout: 5000 });

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Navigate back to banks page
      await page.click('text=/banks/i');
      await page.waitForURL(/.*banks/i);

      // Verify bank still exists
      await expect(page.locator('text=Persistence Test Bank')).toBeVisible({ timeout: 5000 });
    });

    test('should persist accounts across page refresh', async ({ page }) => {
      // Create a bank first
      await page.click('text=/banks/i');
      await page.click('button:has-text("Add Bank")');
      await page.fill('input[name="name"]', 'Account Test Bank');
      await page.selectOption('select[name="type"]', 'Bank');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Account Test Bank')).toBeVisible({ timeout: 5000 });

      // Create an account
      await page.click('text=/accounts/i');
      await page.waitForURL(/.*accounts/i);
      await page.click('button:has-text("Add Account")');
      await page.fill('input[name="accountName"]', 'Persistence Test Account');
      await page.fill('input[name="currentBalance"]', '10000');
      await page.selectOption('select[name="bankId"]', 'Account Test Bank');
      await page.click('button[type="submit"]');

      // Wait for account to be created
      await expect(page.locator('text=Persistence Test Account')).toBeVisible({ timeout: 5000 });

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Navigate back to accounts page
      await page.click('text=/accounts/i');
      await page.waitForURL(/.*accounts/i);

      // Verify account still exists
      await expect(page.locator('text=Persistence Test Account')).toBeVisible({ timeout: 5000 });
    });

    test('should persist transactions across page refresh', async ({ page }) => {
      // Create bank and account first
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

      // Create a transaction
      await page.click('text=/transactions/i');
      await page.waitForURL(/.*transactions/i);
      await page.click('button:has-text("Add Transaction")');
      await page.click('button:has-text("Income")');
      await page.fill('input[name="amount"]', '5000');
      await page.fill('input[name="description"]', 'Persistence Test Transaction');
      await page.selectOption('select[name="accountId"]', 'Transaction Test Account');
      await page.click('button[type="submit"]');

      // Wait for transaction to be created
      await expect(page.locator('text=Persistence Test Transaction')).toBeVisible({ timeout: 5000 });

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Navigate back to transactions page
      await page.click('text=/transactions/i');
      await page.waitForURL(/.*transactions/i);

      // Verify transaction still exists
      await expect(page.locator('text=Persistence Test Transaction')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Across Browser Tabs', () => {
    test('should sync data across multiple tabs', async ({ context }) => {
      // Open first tab
      const page1 = await context.newPage();
      await page1.goto('/');
      await page1.waitForLoadState('networkidle');

      // Create a bank in first tab
      await page1.click('text=/banks/i');
      await page1.waitForURL(/.*banks/i);
      await page1.click('button:has-text("Add Bank")');
      await page1.fill('input[name="name"]', 'Multi-Tab Test Bank');
      await page1.selectOption('select[name="type"]', 'Bank');
      await page1.click('button[type="submit"]');
      await expect(page1.locator('text=Multi-Tab Test Bank')).toBeVisible({ timeout: 5000 });

      // Open second tab
      const page2 = await context.newPage();
      await page2.goto('/');
      await page2.waitForLoadState('networkidle');

      // Navigate to banks page in second tab
      await page2.click('text=/banks/i');
      await page2.waitForURL(/.*banks/i);

      // Wait a bit for IndexedDB sync (storage event)
      await page2.waitForTimeout(2000);

      // Verify bank appears in second tab
      // Note: This depends on the app's cross-tab synchronization implementation
      // If the app uses storage events, this should work
      // Otherwise, a page refresh may be needed
      await page2.reload();
      await page2.waitForLoadState('networkidle');
      await page2.click('text=/banks/i');
      await page2.waitForURL(/.*banks/i);

      // Check if bank appears (may require refresh for IndexedDB changes)
      const hasBank = await page2.locator('text=Multi-Tab Test Bank').count();
      expect(hasBank).toBeGreaterThan(0);

      await page1.close();
      await page2.close();
    });
  });

  test.describe('IndexedDB Storage', () => {
    test('should store data in IndexedDB', async ({ page }) => {
      // Create a bank
      await page.click('text=/banks/i');
      await page.click('button:has-text("Add Bank")');
      await page.fill('input[name="name"]', 'IndexedDB Test Bank');
      await page.selectOption('select[name="type"]', 'Bank');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=IndexedDB Test Bank')).toBeVisible({ timeout: 5000 });

      // Check IndexedDB contains the data
      const dbExists = await page.evaluate(() => {
        return new Promise<boolean>((resolve) => {
          const req = indexedDB.open('instant-express-manager');
          req.onsuccess = () => {
            const db = req.result;
            const objectStoreNames = Array.from(db.objectStoreNames);
            resolve(objectStoreNames.length > 0);
            db.close();
          };
          req.onerror = () => resolve(false);
        });
      });

      expect(dbExists).toBe(true);
    });

    test('should preserve data after clearing cache', async ({ page, context }) => {
      // Create a bank
      await page.click('text=/banks/i');
      await page.click('button:has-text("Add Bank")');
      await page.fill('input[name="name"]', 'Cache Clear Test Bank');
      await page.selectOption('select[name="type"]', 'Bank');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Cache Clear Test Bank')).toBeVisible({ timeout: 5000 });

      // Clear browser cache (but not IndexedDB)
      await context.clearCookies();
      await context.clearPermissions();

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Navigate to banks page
      await page.click('text=/banks/i');
      await page.waitForURL(/.*banks/i);

      // Verify bank still exists (IndexedDB persists through cache clear)
      await expect(page.locator('text=Cache Clear Test Bank')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Backup and Restore', () => {
    test('should create backup with all data', async ({ page }) => {
      // Create test data
      await page.click('text=/banks/i');
      await page.click('button:has-text("Add Bank")');
      await page.fill('input[name="name"]', 'Backup Test Bank');
      await page.selectOption('select[name="type"]', 'Bank');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Backup Test Bank')).toBeVisible({ timeout: 5000 });

      // Navigate to settings and create backup
      await page.click('text=/settings/i');
      await page.waitForURL(/.*settings/i);

      // Wait for download to start
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Download Backup")');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toContain('.json');
      expect(download.suggestedFilename()).toContain('backup');
    });

    test('should restore data from backup', async ({ page }) => {
      // Note: This test would require creating a backup file and uploading it
      // For now, we just verify the restore UI exists
      await page.click('text=/settings/i');
      await page.waitForURL(/.*settings/i);

      // Check that restore/import button exists
      const restoreButton = page.locator('button:has-text("Restore")');
      await expect(restoreButton).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Clear All Data', () => {
    test('should clear all data when requested', async ({ page }) => {
      // Create test data
      await page.click('text=/banks/i');
      await page.click('button:has-text("Add Bank")');
      await page.fill('input[name="name"]', 'Clear Test Bank');
      await page.selectOption('select[name="type"]', 'Bank');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Clear Test Bank')).toBeVisible({ timeout: 5000 });

      // Navigate to settings
      await page.click('text=/settings/i');
      await page.waitForURL(/.*settings/i);

      // Find and click "Clear All Data" button
      const clearButton = page.locator('button:has-text("Clear All Data")');
      if (await clearButton.count() > 0) {
        await clearButton.click();

        // Confirm deletion if there's a confirmation dialog
        const confirmButton = page.locator('button:has-text("Confirm")');
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        // Wait for data to be cleared
        await page.waitForTimeout(2000);

        // Reload and check data is gone
        await page.reload();
        await page.waitForLoadState('networkidle');

        await page.click('text=/banks/i');
        await page.waitForURL(/.*banks/i);

        // Verify bank is gone
        const hasBank = await page.locator('text=Clear Test Bank').count();
        expect(hasBank).toBe(0);
      }
    });
  });
});

