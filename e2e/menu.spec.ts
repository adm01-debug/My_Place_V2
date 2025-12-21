import { test, expect } from '@playwright/test';

test.describe('Menu', () => {
  test('should display all menu sections', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.locator('text=Meus Dados')).toBeVisible();
    await expect(page.locator('text=Financeiro')).toBeVisible();
    await expect(page.locator('text=Desenvolvimento')).toBeVisible();
  });

  test('should navigate to kudos', async ({ page }) => {
    await page.goto('/menu');
    await page.click('text=Kudos');
    await expect(page).toHaveURL(/\/kudos/);
  });

  test('should navigate to trilhas', async ({ page }) => {
    await page.goto('/menu');
    await page.click('text=Trilhas');
    await expect(page).toHaveURL(/\/trilhas/);
  });
});
