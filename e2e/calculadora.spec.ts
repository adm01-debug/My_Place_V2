import { test, expect } from '@playwright/test';
test.describe('Calculadora', () => {
  test('should display calculadora page', async ({ page }) => {
    await page.goto('/calculadora');
    await expect(page.locator('h1, h2').first()).toContainText(/Calculadora|Simulador/i);
  });
  test('should have input fields', async ({ page }) => {
    await page.goto('/calculadora');
    await expect(page.locator('input').first()).toBeVisible();
  });
});
