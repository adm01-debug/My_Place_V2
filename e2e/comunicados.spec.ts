import { test, expect } from '@playwright/test';
test.describe('Comunicados', () => {
  test('should display comunicados', async ({ page }) => {
    await page.goto('/comunicados');
    await expect(page.locator('h1, h2').first()).toContainText(/Comunicados|Avisos/i);
  });
});
