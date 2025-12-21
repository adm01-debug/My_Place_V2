import { test, expect } from '@playwright/test';

test.describe('Holerites', () => {
  test('should display holerites page', async ({ page }) => {
    await page.goto('/holerites');
    await expect(page.locator('h1, h2').first()).toContainText(/Holerites|Contracheque/i);
  });

  test('should display month selector', async ({ page }) => {
    await page.goto('/holerites');
    await expect(page.locator('select, [role="combobox"]').first()).toBeVisible();
  });

  test('should display salary info', async ({ page }) => {
    await page.goto('/holerites');
    await expect(page.locator('text=Salário')).toBeVisible();
  });
});
