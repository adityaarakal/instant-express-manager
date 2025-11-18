/**
 * E2E tests for EMI creation and management flow
 * Tests the complete user journey of creating and managing EMIs
 */

import { test, expect } from '@playwright/test';

test.describe('EMIs Flow', () => {
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

    // Create a bank and account for EMIs
    await page.click('text=/banks/i');
    await page.click('button:has-text("Add Bank")');
    await page.fill('input[name="name"]', 'EMI Test Bank');
    await page.selectOption('select[name="type"]', 'Bank');
    await page.click('button[type="submit"]');

    await page.click('text=/accounts/i');
    await page.click('button:has-text("Add Account")');
    await page.selectOption('select[name="bankId"]', { label: /EMI Test Bank/i });
    await page.fill('input[name="name"]', 'EMI Test Account');
    await page.selectOption('select[name="accountType"]', 'Savings');
    await page.fill('input[name="accountNumber"]', '777666');
    await page.fill('input[name="currentBalance"]', '100000');
    await page.click('button[type="submit"]');
  });

  test('should create expense EMI and verify installments are generated', async ({ page }) => {
    await page.goto('/emis');

    // Select Expense tab
    await page.click('button[role="tab"]:has-text("Expense")');

    // Click Add EMI button
    await page.click('button:has-text("Add")');

    // Fill expense EMI form
    await page.fill('input[name="name"]', 'Car Loan E2E');
    await page.selectOption('select[name="accountId"]', { label: /EMI Test Account/i });
    await page.selectOption('select[name="category"]', 'Loan');
    await page.selectOption('select[name="bucket"]', 'Expense');
    await page.fill('input[name="description"]', 'Monthly Car Loan Payment');
    await page.fill('input[name="principalAmount"]', '500000');
    await page.fill('input[name="emiAmount"]', '15000');
    await page.fill('input[name="totalInstallments"]', '36');
    await page.selectOption('select[name="frequency"]', 'Monthly');
    await page.fill('input[name="dayOfMonth"]', '15');
    await page.fill('input[name="startDate"]', '2025-01-15');
    await page.selectOption('select[name="status"]', 'Active');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for EMI to appear
    await expect(page.locator('text=Car Loan E2E')).toBeVisible({ timeout: 5000 });

    // Verify installments were generated (should see progress or installment count)
    await expect(page.locator('text=/36|installments|EMI/i')).toBeVisible({ timeout: 5000 });

    // Verify transactions were generated
    await page.goto('/transactions');
    await page.click('button[role="tab"]:has-text("Expense")');
    
    const transactionCount = await page.locator('text=/Monthly Car Loan Payment/i').count();
    expect(transactionCount).toBeGreaterThan(0);
  });

  test('should create savings EMI', async ({ page }) => {
    await page.goto('/emis');

    // Select Savings tab
    await page.click('button[role="tab"]:has-text("Savings")');

    // Click Add EMI button
    await page.click('button:has-text("Add")');

    // Fill savings EMI form
    await page.fill('input[name="name"]', 'Mutual Fund SIP E2E');
    await page.selectOption('select[name="accountId"]', { label: /EMI Test Account/i });
    await page.selectOption('select[name="destination"]', 'Mutual Fund');
    await page.selectOption('select[name="type"]', 'SIP');
    await page.fill('input[name="description"]', 'Monthly SIP Investment');
    await page.fill('input[name="principalAmount"]', '600000');
    await page.fill('input[name="emiAmount"]', '5000');
    await page.fill('input[name="totalInstallments"]', '120');
    await page.selectOption('select[name="frequency"]', 'Monthly');
    await page.fill('input[name="dayOfMonth"]', '5');
    await page.fill('input[name="startDate"]', '2025-01-05');
    await page.selectOption('select[name="status"]', 'Active');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for EMI to appear
    await expect(page.locator('text=Mutual Fund SIP E2E')).toBeVisible({ timeout: 5000 });

    // Verify transactions were generated
    await page.goto('/transactions');
    await page.click('button[role="tab"]:has-text("Savings")');
    
    const transactionCount = await page.locator('text=/Monthly SIP Investment/i').count();
    expect(transactionCount).toBeGreaterThan(0);
  });

  test('should track EMI progress', async ({ page }) => {
    await page.goto('/emis');

    // Create an EMI first
    await page.click('button[role="tab"]:has-text("Expense")');
    await page.click('button:has-text("Add")');
    await page.fill('input[name="name"]', 'Progress Test EMI E2E');
    await page.selectOption('select[name="accountId"]', { label: /EMI Test Account/i });
    await page.selectOption('select[name="category"]', 'Loan');
    await page.fill('input[name="principalAmount"]', '200000');
    await page.fill('input[name="emiAmount"]', '10000');
    await page.fill('input[name="totalInstallments"]', '20');
    await page.selectOption('select[name="frequency"]', 'Monthly');
    await page.fill('input[name="dayOfMonth"]', '10');
    await page.fill('input[name="startDate"]', '2025-01-10');
    await page.click('button[type="submit"]');

    // Wait for EMI to appear
    await expect(page.locator('text=Progress Test EMI E2E')).toBeVisible({ timeout: 5000 });

    // Verify progress is displayed (should show 0/20 or similar)
    await expect(page.locator('text=/0.*20|installment|progress/i')).toBeVisible({ timeout: 5000 });
  });

  test('should update EMI amount', async ({ page }) => {
    await page.goto('/emis');

    // Create an EMI first
    await page.click('button[role="tab"]:has-text("Expense")');
    await page.click('button:has-text("Add")');
    await page.fill('input[name="name"]', 'Update Test EMI E2E');
    await page.selectOption('select[name="accountId"]', { label: /EMI Test Account/i });
    await page.selectOption('select[name="category"]', 'Loan');
    await page.fill('input[name="principalAmount"]', '100000');
    await page.fill('input[name="emiAmount"]', '5000');
    await page.fill('input[name="totalInstallments"]', '24');
    await page.selectOption('select[name="frequency"]', 'Monthly');
    await page.fill('input[name="dayOfMonth"]', '20');
    await page.fill('input[name="startDate"]', '2025-01-20');
    await page.click('button[type="submit"]');

    // Wait for EMI to appear
    await expect(page.locator('text=Update Test EMI E2E')).toBeVisible({ timeout: 5000 });

    // Edit the EMI
    await page.click('button[aria-label*="Edit"], button[aria-label*="edit"]').catch(() => {
      page.locator('text=Update Test EMI E2E').click();
    });

    // Update EMI amount
    await page.fill('input[name="emiAmount"]', '5500');
    await page.click('button[type="submit"]');

    // Verify update
    await expect(page.locator('text=5500')).toBeVisible({ timeout: 5000 });
  });
});

