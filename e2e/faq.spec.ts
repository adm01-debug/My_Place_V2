import { test, expect } from '@playwright/test';
test.describe('FAQ', () => {
  test('should display FAQ', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.locator('h1, h2').first()).toContainText(/FAQ|Perguntas/i);
  });
  test('should have search', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.locator('input[type="text"], input[type="search"]').first()).toBeVisible();
  });
});
