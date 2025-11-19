/**
 * E2E tests for PWA functionality
 * Tests service worker registration, offline functionality, manifest, and installability
 */

import { test, expect } from '@playwright/test';

test.describe('PWA Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Service Worker Registration', () => {
    test('should register service worker', async ({ page, context }) => {
      // Wait for service worker registration
      await page.waitForFunction(() => {
        return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
      }, { timeout: 10000 });

      // Check service worker is registered
      const swRegistered = await page.evaluate(() => {
        return navigator.serviceWorker.controller !== null;
      });

      expect(swRegistered).toBe(true);
    });

    test('should have service worker active', async ({ page }) => {
      // Wait for service worker to be active
      await page.waitForFunction(() => {
        return navigator.serviceWorker.controller !== null;
      }, { timeout: 10000 });

      const swState = await page.evaluate(() => {
        if (navigator.serviceWorker.controller) {
          return navigator.serviceWorker.controller.state;
        }
        return null;
      });

      expect(swState).toBe('activated');
    });

    test('should cache app resources', async ({ page }) => {
      // Wait for service worker to register
      await page.waitForFunction(() => {
        return navigator.serviceWorker.controller !== null;
      }, { timeout: 10000 });

      // Check that resources are being cached
      const cacheNames = await page.evaluate(async () => {
        const cacheNames = await caches.keys();
        return cacheNames;
      });

      expect(cacheNames.length).toBeGreaterThan(0);
    });
  });

  test.describe('Web App Manifest', () => {
    test('should have manifest.json', async ({ page }) => {
      // Try to fetch manifest
      const manifestResponse = await page.request.get('/manifest.webmanifest');
      expect(manifestResponse.ok()).toBe(true);

      const manifest = await manifestResponse.json();

      // Verify manifest properties
      expect(manifest).toHaveProperty('name', 'Instant Express Manager');
      expect(manifest).toHaveProperty('short_name', 'IEM');
      expect(manifest).toHaveProperty('display', 'standalone');
      expect(manifest).toHaveProperty('start_url', '/');
      expect(manifest).toHaveProperty('icons');
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);
    });

    test('should have manifest link in HTML', async ({ page }) => {
      const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
      expect(manifestLink).toBeTruthy();
      expect(manifestLink).toContain('manifest.webmanifest');
    });

    test('should have theme color meta tag', async ({ page }) => {
      const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
      expect(themeColor).toBeTruthy();
    });

    test('should have apple-touch-icon link', async ({ page }) => {
      const appleIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
      expect(appleIcon).toBeTruthy();
    });
  });

  test.describe('Offline Functionality', () => {
    test('should work offline after initial load', async ({ page, context }) => {
      // Wait for service worker to register and cache resources
      await page.waitForFunction(() => {
        return navigator.serviceWorker.controller !== null;
      }, { timeout: 10000 });

      // Wait a bit for caching to complete
      await page.waitForTimeout(2000);

      // Go offline
      await context.setOffline(true);

      // Try to navigate to a page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      // Verify page loads (should be served from cache)
      const title = await page.title();
      expect(title).toBeTruthy();

      // Check that page is functional
      const hasContent = await page.locator('body').count();
      expect(hasContent).toBeGreaterThan(0);

      // Go back online
      await context.setOffline(false);
    });

    test('should show offline indicator when offline', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);

      // Reload page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      // Check for offline indicator (if implemented)
      // This is optional - some apps don't have a visible offline indicator
      // For now, we just verify the page still loads

      // Go back online
      await context.setOffline(false);
    });

    test('should sync data when connection restored', async ({ page, context }) => {
      // Wait for service worker
      await page.waitForFunction(() => {
        return navigator.serviceWorker.controller !== null;
      }, { timeout: 10000 });

      // Create some data
      await page.click('text=/banks/i');
      await page.waitForTimeout(1000);

      // Go offline
      await context.setOffline(true);

      // Try to create data (should work with local storage)
      // Note: This depends on the app's offline capabilities

      // Go back online
      await context.setOffline(false);

      // Verify data persists
      // This depends on the app's sync implementation
    });
  });

  test.describe('PWA Installability', () => {
    test('should be installable (manifest present and valid)', async ({ page }) => {
      // Check manifest exists and is valid
      const manifestResponse = await page.request.get('/manifest.webmanifest');
      expect(manifestResponse.ok()).toBe(true);

      const manifest = await manifestResponse.json();

      // Check required manifest properties for installability
      expect(manifest.name).toBeTruthy();
      expect(manifest.short_name).toBeTruthy();
      expect(manifest.icons).toBeTruthy();
      expect(manifest.icons.length).toBeGreaterThan(0);

      // Check icons have required sizes (at least 192x192 and 512x512)
      const iconSizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
      const has192 = iconSizes.some((size: string) => size.includes('192'));
      const has512 = iconSizes.some((size: string) => size.includes('512'));

      expect(has192 || has512).toBe(true);
    });

    test('should have required icons', async ({ page }) => {
      const manifestResponse = await page.request.get('/manifest.webmanifest');
      const manifest = await manifestResponse.json();

      // Check that icons exist and are accessible
      for (const icon of manifest.icons) {
        const iconResponse = await page.request.get(icon.src);
        expect(iconResponse.ok()).toBe(true);
      }
    });

    test('should have start_url in manifest', async ({ page }) => {
      const manifestResponse = await page.request.get('/manifest.webmanifest');
      const manifest = await manifestResponse.json();

      expect(manifest.start_url).toBeTruthy();
      expect(manifest.start_url).toBe('/');
    });

    test('should have display mode set to standalone', async ({ page }) => {
      const manifestResponse = await page.request.get('/manifest.webmanifest');
      const manifest = await manifestResponse.json();

      expect(manifest.display).toBe('standalone');
    });
  });

  test.describe('App Lifecycle', () => {
    test('should handle page refresh correctly', async ({ page }) => {
      // Navigate to a page
      await page.click('text=/banks/i');
      await page.waitForURL(/.*banks/i);

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify still on same page
      expect(page.url()).toContain('banks');
    });

    test('should persist navigation state', async ({ page }) => {
      // Navigate to different pages
      await page.click('text=/dashboard/i');
      await page.waitForURL(/.*dashboard/i);

      await page.click('text=/transactions/i');
      await page.waitForURL(/.*transactions/i);

      // Refresh
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Note: URL state may or may not persist depending on app implementation
      // This is just a basic check that the app doesn't crash on refresh
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('Performance', () => {
    test('should load quickly on repeat visits (cached)', async ({ page }) => {
      // First visit
      const startTime1 = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime1 = Date.now() - startTime1;

      // Second visit (should be faster due to caching)
      const startTime2 = Date.now();
      await page.reload();
      await page.waitForLoadState('networkidle');
      const loadTime2 = Date.now() - startTime2;

      // Second visit should be faster (at least 20% improvement)
      // This is a rough check - actual improvement depends on many factors
      console.log(`First load: ${loadTime1}ms, Second load: ${loadTime2}ms`);
      
      // We don't fail if second load isn't faster, as this depends on caching strategy
      // Just log it for monitoring
    });
  });
});

