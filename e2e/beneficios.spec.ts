import { test, expect } from '@playwright/test';
test.describe('Beneficios', () => {
  test('should display beneficios page', async ({ page }) => {
    await page.goto('/beneficios');
    await expect(page.locator('h1, h2').first()).toContainText(/Benefícios/i);
  });
  test('should list benefits', async ({ page }) => {
    await page.goto('/beneficios');
    await expect(page.locator('[data-testid="benefit-card"]').or(page.locator('.card'))).toBeVisible();
  });
});
