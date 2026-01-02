import { test, expect } from '@playwright/test';
test.describe('Login', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
  test('should have submit button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button[type="submit"]').or(page.locator('text=Entrar'))).toBeVisible();
  });
});
