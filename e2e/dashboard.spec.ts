import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/Dashboard|Início/i);
  });

  test('should display stat cards', async ({ page }) => {
    const cards = page.locator('[class*="card"], [class*="Card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('should display bottom navigation', async ({ page }) => {
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
  });
});
