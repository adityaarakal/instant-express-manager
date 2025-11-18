/**
 * E2E tests for EMI ↔ Recurring Template conversion flow
 * Tests the conversion wizard functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Conversion Flow', () => {
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

    // Create a bank and account
    await page.click('text=/banks/i');
    await page.click('button:has-text("Add Bank")');
    await page.fill('input[name="name"]', 'Conversion Test Bank');
    await page.selectOption('select[name="type"]', 'Bank');
    await page.click('button[type="submit"]');

    await page.click('text=/accounts/i');
    await page.click('button:has-text("Add Account")');
    await page.selectOption('select[name="bankId"]', { label: /Conversion Test Bank/i });
    await page.fill('input[name="name"]', 'Conversion Test Account');
    await page.selectOption('select[name="accountType"]', 'Savings');
    await page.fill('input[name="accountNumber"]', '555444');
    await page.fill('input[name="currentBalance"]', '200000');
    await page.click('button[type="submit"]');
  });

  test('should convert expense EMI to recurring template', async ({ page }) => {
    // Create an expense EMI first
    await page.goto('/emis');
    await page.click('button[role="tab"]:has-text("Expense")');
    await page.click('button:has-text("Add")');
    await page.fill('input[name="name"]', 'Convert EMI E2E');
    await page.selectOption('select[name="accountId"]', { label: /Conversion Test Account/i });
    await page.selectOption('select[name="category"]', 'Loan');
    await page.selectOption('select[name="bucket"]', 'Expense');
    await page.fill('input[name="principalAmount"]', '300000');
    await page.fill('input[name="emiAmount"]', '12000');
    await page.fill('input[name="totalInstallments"]', '25');
    await page.selectOption('select[name="frequency"]', 'Monthly');
    await page.fill('input[name="dayOfMonth"]', '25');
    await page.fill('input[name="startDate"]', '2025-01-25');
    await page.click('button[type="submit"]');

    // Wait for EMI to appear
    await expect(page.locator('text=Convert EMI E2E')).toBeVisible({ timeout: 5000 });

    // Find and click convert button (usually an icon button or menu item)
    const convertButton = page.locator('button[aria-label*="Convert"], button:has-text("Convert")').first();
    
    // If convert button not directly visible, might be in a menu
    if (!(await convertButton.isVisible({ timeout: 2000 }))) {
      // Try clicking on the EMI row to open context menu
      await page.locator('text=Convert EMI E2E').click();
      // Look for convert option in dropdown/menu
      await page.locator('text=/convert|Convert/i').first().click();
    } else {
      await convertButton.click();
    }

    // Conversion wizard should open
    await expect(page.locator('text=/convert|Convert EMI to Recurring/i')).toBeVisible({ timeout: 5000 });

    // Complete conversion (click Convert/Confirm button)
    const confirmButton = page.locator('button:has-text("Convert"), button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }

    // Verify EMI is removed and recurring template is created
    await page.goto('/recurring');
    await page.click('button[role="tab"]:has-text("Expense")');
    await expect(page.locator('text=Convert EMI E2E')).toBeVisible({ timeout: 5000 });

    // Verify EMI is gone
    await page.goto('/emis');
    await page.click('button[role="tab"]:has-text("Expense")');
    await expect(page.locator('text=Convert EMI E2E')).not.toBeVisible({ timeout: 5000 });
  });

  test('should convert recurring template to EMI', async ({ page }) => {
    // Create a recurring expense template first
    await page.goto('/recurring');
    await page.click('button[role="tab"]:has-text("Expense")');
    await page.click('button:has-text("Add")');
    await page.fill('input[name="name"]', 'Convert Recurring E2E');
    await page.selectOption('select[name="accountId"]', { label: /Conversion Test Account/i });
    await page.selectOption('select[name="category"]', 'Utilities');
    await page.selectOption('select[name="bucket"]', 'Expense');
    await page.fill('input[name="amount"]', '8000');
    await page.selectOption('select[name="frequency"]', 'Monthly');
    await page.fill('input[name="dayOfMonth"]', '15');
    await page.fill('input[name="startDate"]', '2025-01-15');
    await page.fill('input[name="endDate"]', '2026-01-15');
    await page.click('button[type="submit"]');

    // Wait for template to appear
    await expect(page.locator('text=Convert Recurring E2E')).toBeVisible({ timeout: 5000 });

    // Find and click convert button
    const convertButton = page.locator('button[aria-label*="Convert"], button:has-text("Convert")').first();
    
    if (!(await convertButton.isVisible({ timeout: 2000 }))) {
      await page.locator('text=Convert Recurring E2E').click();
      await page.locator('text=/convert|Convert Recurring to EMI/i').first().click();
    } else {
      await convertButton.click();
    }

    // Conversion wizard should open
    await expect(page.locator('text=/convert|Convert Recurring to EMI/i')).toBeVisible({ timeout: 5000 });

    // Fill EMI details in conversion form
    // These fields might be pre-filled, but we may need to set installments
    const installmentsInput = page.locator('input[name="totalInstallments"]');
    if (await installmentsInput.isVisible({ timeout: 2000 })) {
      await installmentsInput.fill('12');
    }

    // Complete conversion
    const confirmButton = page.locator('button:has-text("Convert"), button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }

    // Verify recurring template is removed and EMI is created
    await page.goto('/emis');
    await page.click('button[role="tab"]:has-text("Expense")');
    await expect(page.locator('text=Convert Recurring E2E')).toBeVisible({ timeout: 5000 });

    // Verify recurring template is gone
    await page.goto('/recurring');
    await page.click('button[role="tab"]:has-text("Expense")');
    await expect(page.locator('text=Convert Recurring E2E')).not.toBeVisible({ timeout: 5000 });
  });

  test('should cancel conversion wizard', async ({ page }) => {
    // Create an EMI first
    await page.goto('/emis');
    await page.click('button[role="tab"]:has-text("Expense")');
    await page.click('button:has-text("Add")');
    await page.fill('input[name="name"]', 'Cancel Test EMI E2E');
    await page.selectOption('select[name="accountId"]', { label: /Conversion Test Account/i });
    await page.selectOption('select[name="category"]', 'Loan');
    await page.fill('input[name="principalAmount"]', '100000');
    await page.fill('input[name="emiAmount"]', '5000');
    await page.fill('input[name="totalInstallments"]', '20');
    await page.selectOption('select[name="frequency"]', 'Monthly');
    await page.fill('input[name="dayOfMonth"]', '10');
    await page.fill('input[name="startDate"]', '2025-01-10');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Cancel Test EMI E2E')).toBeVisible({ timeout: 5000 });

    // Open conversion wizard
    const convertButton = page.locator('button[aria-label*="Convert"], button:has-text("Convert")').first();
    if (!(await convertButton.isVisible({ timeout: 2000 }))) {
      await page.locator('text=Cancel Test EMI E2E').click();
      await page.locator('text=/convert/i').first().click();
    } else {
      await convertButton.click();
    }

    // Cancel conversion
    const cancelButton = page.locator('button:has-text("Cancel")');
    if (await cancelButton.isVisible({ timeout: 2000 })) {
      await cancelButton.click();
    }

    // Verify EMI still exists
    await expect(page.locator('text=Cancel Test EMI E2E')).toBeVisible({ timeout: 5000 });
  });
});

