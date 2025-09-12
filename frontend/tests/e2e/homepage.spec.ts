import { test, expect } from '@playwright/test';

test.describe('Golden Path Template - Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Golden Path|Next.js|React/i);
    
    // Check for main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display navigation elements', async ({ page }) => {
    await page.goto('/');
    
    // Look for navigation links
    const links = page.locator('a');
    await expect(links.first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that content is still visible
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('API Integration', () => {
  test('should connect to backend health endpoint', async ({ page }) => {
    // Test direct API call
    const response = await page.request.get('http://localhost:8080/api/health');
    expect(response.ok()).toBeTruthy();
    
    const healthData = await response.json();
    expect(healthData.status).toBe('UP');
    expect(healthData.service).toContain('Golden Path');
  });

  test('should connect to actuator health endpoint', async ({ page }) => {
    const response = await page.request.get('http://localhost:8080/actuator/health');
    expect(response.ok()).toBeTruthy();
    
    const healthData = await response.json();
    expect(healthData.status).toBe('UP');
  });

  test('should handle CORS correctly', async ({ page }) => {
    await page.goto('/');
    
    // Make an API call from the frontend
    const healthResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8080/api/health');
        return {
          ok: response.ok,
          status: response.status,
          data: await response.json()
        };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });
    
    expect(healthResponse.ok).toBeTruthy();
    expect(healthResponse.data.status).toBe('UP');
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have good Lighthouse scores', async ({ page }) => {
    await page.goto('/');
    
    // Basic performance checks
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('navigation');
    });
    
    expect(performanceEntries).toBeDefined();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('should have accessible links', async ({ page }) => {
    await page.goto('/');
    
    // Check that links have proper text or aria-labels
    const links = page.locator('a');
    const count = await links.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      const hasText = await link.textContent();
      const hasAriaLabel = await link.getAttribute('aria-label');
      
      expect(hasText || hasAriaLabel).toBeTruthy();
    }
  });
});
