import { test, expect } from '@playwright/test';

test('capture home page screenshot', async ({ page }) => {
  // Navigate to home page
  await page.goto('/');

  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');

  // Wait for the main dashboard elements to be visible
  await expect(page.locator('.dashboard-container')).toBeVisible();
  await expect(page.locator('.date-display')).toBeVisible();
  await expect(page.locator('.speedometer-container')).toBeVisible();
  await expect(page.locator('.odometer-container')).toBeVisible();
  await expect(page.locator('.control-container')).toBeVisible();

  // Take a screenshot of the full page
  await page.screenshot({
    path: 'kmtrack-home-dashboard.png',
    fullPage: true
  });

  // Also take a screenshot of just the dashboard area
  await page.locator('.dashboard-container').screenshot({
    path: 'kmtrack-dashboard-only.png'
  });

  console.log('Screenshots captured successfully!');
});