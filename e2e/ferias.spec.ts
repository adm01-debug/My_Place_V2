import { test, expect } from '@playwright/test';

test.describe('Férias', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ferias');
  });

  test('should display ferias page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/Férias/i);
  });

  test('should display saldo info', async ({ page }) => {
    const content = await page.textContent('body');
    expect(content).toMatch(/saldo|dias|disponíve/i);
  });
});
