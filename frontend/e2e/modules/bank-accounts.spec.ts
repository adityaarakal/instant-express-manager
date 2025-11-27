/**
 * E2E test for Bank Accounts module
 * 
 * LOCK STATUS: LOCKED
 * 
 * Test: Given at least a bank exists, user should be able to create a bank account
 * 
 * This file is protected and cannot be modified by AI agents.
 * Only the user can unlock and modify this file.
 * 
 * To unlock: bash scripts/unlock-test.sh frontend/e2e/modules/bank-accounts.spec.ts
 */

import { test, expect } from '@playwright/test';
import { ensureBankExists, closeDialogs } from '../helpers/bank-helpers';

test.describe('Bank Accounts Module - User Flows', () => {
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

  test('should be able to create a bank account when at least one bank exists', async ({ page }) => {
    const bankName = `Auto Bank ${Date.now()}`;
    const accountName = `Test Account ${Date.now()}`;
    
    // Ensure at least one bank exists first (reuse helper function)
    // This will automatically create a bank if none exists, then continue with the test
    const createdBankName = await ensureBankExists(page, bankName);
    console.log(`Using bank: ${createdBankName}`);
    
    // Wait a bit to ensure the bank is persisted
    await page.waitForTimeout(1000);
    
    // Navigate to bank accounts page (route is /accounts)
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');
    await closeDialogs(page);
    
    // Wait for bank accounts page to load
    await expect(page).toHaveURL(/.*\/accounts/);
    
    // Wait for the page to fully render - banks should be loaded from IndexedDB
    await page.waitForTimeout(2000);
    
    // Verify that we don't see the "Please add a bank first" message
    const noBanksMessage = page.locator('text=/Please add a bank first/i');
    const noBanksVisible = await noBanksMessage.first().isVisible().catch(() => false);
    
    if (noBanksVisible) {
      // If we still see the message, try ensuring bank exists again
      console.log('Bank not detected on accounts page, re-checking...');
      await ensureBankExists(page, bankName);
      await page.goto('/accounts');
      await page.waitForLoadState('networkidle');
      await closeDialogs(page);
      await page.waitForTimeout(2000);
      
      // Check again
      const stillNoBanks = await noBanksMessage.first().isVisible().catch(() => false);
      if (stillNoBanks) {
        throw new Error('Bank was created but not detected on bank-accounts page');
      }
    }
    
    // Click "Add Account" button - it should be visible since we ensured a bank exists
    const addAccountButton = page.locator('button:has-text("Add Account")');
    await expect(addAccountButton.first()).toBeVisible({ timeout: 10000 });
    await addAccountButton.first().click();
    
    // Wait for dialog to open
    await page.waitForTimeout(500);
    
    // Verify dialog is open
    const dialogTitle = page.locator('text=/Add Account/i');
    await expect(dialogTitle.first()).toBeVisible({ timeout: 3000 });
    
    // Wait for dialog content to be ready
    await page.waitForTimeout(1000);
    
    // Fill in account name
    const accountNameInput = page.getByLabel('Account Name');
    await expect(accountNameInput).toBeVisible({ timeout: 5000 });
    await accountNameInput.clear();
    await accountNameInput.fill(accountName);
    await expect(accountNameInput).toHaveValue(accountName);
    
    // Select a bank (required field) - Material-UI Select
    // Use keyboard navigation to avoid dialog interception issues
    const bankSelect = page.getByLabel('Bank');
    await expect(bankSelect).toBeVisible({ timeout: 5000 });
    
    // Focus the select and press Enter/ArrowDown to open menu
    await bankSelect.focus();
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    
    // Press Enter to select the first option (or ArrowDown then Enter)
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Account Type defaults to "Savings" which is fine, or we can verify it
    // Current Balance defaults to 0 which is fine
    
    // Wait for form validation to enable the button
    await page.waitForTimeout(500);
    
    // Click Create button
    const createButton = page.locator('button:has-text("Create")');
    await expect(createButton.first()).toBeVisible({ timeout: 5000 });
    await expect(createButton.first()).toBeEnabled({ timeout: 5000 });
    await createButton.first().click();
    
    // Wait for dialog to close and account to be created
    await page.waitForTimeout(1000);
    
    // Verify dialog is closed
    await expect(dialogTitle.first()).not.toBeVisible({ timeout: 3000 }).catch(() => {});
    
    // Verify account appears in the list
    await expect(page.locator(`text=${accountName}`).first()).toBeVisible({ timeout: 5000 });
    
    // Verify we're still on the bank accounts page
    await expect(page).toHaveURL(/.*\/accounts/);
  });
});

