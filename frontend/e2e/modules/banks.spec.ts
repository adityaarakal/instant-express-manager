/**
 * E2E test for Banks module
 * 
 * Test: User should be able to create a bank and see it in the banks list
 */

import { test, expect } from '@playwright/test';
import { createBank } from '../helpers/bank-helpers';

test.describe('Banks Module - User Flows', () => {
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
  });

  test('should be able to create a bank and see it in the banks list', async ({ page }) => {
    const bankName = `Test Bank ${Date.now()}`;
    
    // Use reusable helper function to create bank
    await createBank(page, bankName);
    
    // Verify we're still on the banks page
    await expect(page).toHaveURL(/.*\/banks/);
  });
});
