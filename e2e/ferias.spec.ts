import { test, expect } from '@playwright/test';

test.describe('Férias', () => {
  test('should display ferias page', async ({ page }) => {
    await page.goto('/ferias');
    await expect(page.locator('h1, h2').first()).toContainText(/Férias/i);
  });

  test('should display saldo', async ({ page }) => {
    await page.goto('/ferias');
    await expect(page.locator('text=Saldo')).toBeVisible();
  });
});
