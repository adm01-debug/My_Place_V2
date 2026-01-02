import { test, expect } from '@playwright/test';
test.describe('Documentos', () => {
  test('should display documentos', async ({ page }) => {
    await page.goto('/documentos');
    await expect(page.locator('h1, h2').first()).toContainText(/Documentos/i);
  });
});
