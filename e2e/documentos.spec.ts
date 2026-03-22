import { test, expect } from '@playwright/test';

test.describe('Documentos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/documentos');
  });

  test('should display documentos page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/Documento/i);
  });
});
