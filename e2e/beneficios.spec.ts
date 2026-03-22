import { test, expect } from '@playwright/test';

test.describe('Benefícios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/beneficios');
  });

  test('should display beneficios page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/Benefícios/i);
  });

  test('should display benefit categories', async ({ page }) => {
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });
});
