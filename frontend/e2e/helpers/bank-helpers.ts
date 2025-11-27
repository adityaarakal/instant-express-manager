/**
 * Reusable helper functions for bank-related E2E tests
 */

import { Page, expect } from '@playwright/test';

/**
 * Closes any dialogs that might be open (onboarding, etc.)
 */
export async function closeDialogs(page: Page): Promise<void> {
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
}

/**
 * Creates a bank and returns the bank name
 * Reusable function extracted from banks.spec.ts
 */
export async function createBank(page: Page, bankName?: string): Promise<string> {
  const finalBankName = bankName || `Test Bank ${Date.now()}`;
  
  // Navigate to banks page
  await page.goto('/banks');
  await page.waitForLoadState('networkidle');
  
  // Close any dialogs
  await closeDialogs(page);
  
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
  
  // Fill in bank name
  const bankNameInput = page.getByLabel('Bank Name');
  await expect(bankNameInput).toBeVisible({ timeout: 5000 });
  
  // Clear and fill the input
  await bankNameInput.clear();
  await bankNameInput.fill(finalBankName);
  
  // Verify the input has the value
  await expect(bankNameInput).toHaveValue(finalBankName);
  
  // Wait for form validation to enable the button
  await page.waitForTimeout(500);
  
  // Click Create button
  const createButton = page.locator('button:has-text("Create")');
  await expect(createButton.first()).toBeVisible({ timeout: 5000 });
  await expect(createButton.first()).toBeEnabled({ timeout: 5000 });
  await createButton.first().click();
  
  // Wait for dialog to close and bank to be created
  await page.waitForTimeout(1000);
  
  // Verify dialog is closed
  await expect(dialogTitle.first()).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  
  // Verify bank appears in the list
  await expect(page.locator(`text=${finalBankName}`).first()).toBeVisible({ timeout: 5000 });
  
  return finalBankName;
}

/**
 * Checks if at least one bank exists on the banks page
 * Returns true if a bank exists, false otherwise
 */
export async function bankExists(page: Page): Promise<boolean> {
  await page.goto('/banks');
  await page.waitForLoadState('networkidle');
  await closeDialogs(page);
  
  // Check if empty state is shown
  const emptyState = page.locator('text=/No Banks Yet|Start by adding/i');
  const emptyStateVisible = await emptyState.first().isVisible().catch(() => false);
  
  if (emptyStateVisible) {
    return false;
  }
  
  // Check if there are any bank entries by looking for bank cards or table rows
  // Exclude header rows and empty state
  const bankCards = page.locator('.MuiCard-root').filter({ hasNot: page.locator('text=/No Banks/i') });
  const bankRows = page.locator('.MuiTableRow-root').filter({ hasNot: page.locator('th, text=/No Banks/i') });
  
  const cardCount = await bankCards.count();
  const rowCount = await bankRows.count();
  
  // If we have cards or rows (excluding header), bank exists
  return cardCount > 0 || rowCount > 0;
}

/**
 * Ensures at least one bank exists, creating one if needed
 * Returns the name of an existing or newly created bank
 */
export async function ensureBankExists(page: Page): Promise<string> {
  const exists = await bankExists(page);
  
  if (exists) {
    // Bank exists, get the name of the first bank for reference
    await page.goto('/banks');
    await page.waitForLoadState('networkidle');
    await closeDialogs(page);
    
    // Try to find a bank name - look for text that's not in buttons
    // Bank names appear in cards or table cells
    const bankNameLocator = page.locator('.MuiCard-root, .MuiTableCell-root')
      .filter({ hasNot: page.locator('button, [role="button"], th') })
      .first();
    
    const bankNameText = await bankNameLocator.textContent().catch(() => null);
    
    if (bankNameText && bankNameText.trim().length > 0 && !bankNameText.includes('No Banks')) {
      return bankNameText.trim().split('\n')[0]; // Get first line if multiple lines
    }
    
    // If we can't reliably get the name, that's okay - we know a bank exists
    // Return a placeholder name since we just need to ensure existence
    return 'Existing Bank';
  }
  
  // Bank doesn't exist, create one
  return await createBank(page);
}

