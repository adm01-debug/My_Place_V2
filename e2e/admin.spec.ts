import { test, expect } from '@playwright/test';
test.describe('Admin', () => {
  test('should display admin page', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1, h2').first()).toContainText(/Admin|Administração|Painel/i);
  });
  test('should have user management', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('text=Usuários').or(page.locator('text=Colaboradores'))).toBeVisible();
  });
});
