import { test, expect } from '@playwright/test';

test.describe('Treinamentos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/treinamentos');
  });

  test('should display treinamentos page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/Treinamento/i);
  });
});
