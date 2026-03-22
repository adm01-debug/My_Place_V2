import { test, expect } from '@playwright/test';

test.describe('Comunicados', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/comunicados');
  });

  test('should display comunicados page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/Comunicado/i);
  });
});
