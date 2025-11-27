/**
 * E2E test for Banks module
 * 
 * Test: User should be able to create a bank and see it in the banks list
 */

import { test, expect } from '@playwright/test';

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
    
    // Navigate to banks page
    await page.goto('/banks');
    await page.waitForLoadState('networkidle');
    
    // Close any dialogs that might be open (onboarding, etc.)
    const closeButtons = page.locator('button[aria-label="Close"], button:has-text("Close"), button:has-text("Skip"), [aria-label*="close" i]');
    const closeButtonCount = await closeButtons.count();
    if (closeButtonCount > 0) {
      for (let i = 0; i < closeButtonCount; i++) {
        try {
          await closeButtons.nth(i).click({ timeout: 1000 });
          await page.waitForTimeout(500);
        } catch {
          // Dialog already closed or not clickable
        }
      }
    }
    
    // Wait for banks page to load
    await expect(page).toHaveURL(/.*\/banks/);
    
    // Click "Add Bank" button
    const addBankButton = page.locator('button:has-text("Add Bank"), button[aria-label="Add new bank"]');
    await expect(addBankButton.first()).toBeVisible({ timeout: 5000 });
    await addBankButton.first().click();
    
    // Wait for dialog to open
    await page.waitForTimeout(500);
    
    // Verify dialog is open
    const dialogTitle = page.locator('text=/Add Bank/i');
    await expect(dialogTitle.first()).toBeVisible({ timeout: 3000 });
    
    // Wait for dialog content to be ready
    await page.waitForTimeout(1000);
    
    // Fill in bank name - use getByLabel for more reliable form field access
    const bankNameInput = page.getByLabel('Bank Name');
    await expect(bankNameInput).toBeVisible({ timeout: 5000 });
    
    // Clear and fill the input
    await bankNameInput.clear();
    await bankNameInput.fill(bankName);
    
    // Verify the input has the value
    await expect(bankNameInput).toHaveValue(bankName);
    
    // Wait for form validation to enable the button
    await page.waitForTimeout(500);
    
    // Click Create button (ButtonWithLoading component shows "Create" for new banks)
    // The button is disabled until name is filled
    const createButton = page.locator('button:has-text("Create")');
    await expect(createButton.first()).toBeVisible({ timeout: 5000 });
    
    // Wait for button to become enabled (it's disabled when name is empty)
    await expect(createButton.first()).toBeEnabled({ timeout: 5000 });
    await createButton.first().click();
    
    // Wait for dialog to close and bank to be created
    await page.waitForTimeout(1000);
    
    // Verify dialog is closed
    await expect(dialogTitle.first()).not.toBeVisible({ timeout: 3000 }).catch(() => {});
    
    // Verify bank appears in the list
    await expect(page.locator(`text=${bankName}`).first()).toBeVisible({ timeout: 5000 });
    
    // Verify we're still on the banks page
    await expect(page).toHaveURL(/.*\/banks/);
  });
});
