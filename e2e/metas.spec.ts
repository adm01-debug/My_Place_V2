import { test, expect } from '@playwright/test';
test.describe('Metas', () => {
  test('should display metas page', async ({ page }) => {
    await page.goto('/metas');
    await expect(page.locator('h1, h2').first()).toContainText(/Metas|OKR|Objetivos/i);
  });
});
