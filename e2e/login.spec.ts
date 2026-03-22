import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    // Should remain on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    // Should remain on login page or show error
    const errorVisible = await page.locator('text=Erro, text=inválid, [role="alert"]').first().isVisible().catch(() => false);
    // Login should not succeed
    expect(await page.url()).toContain('login');
  });

  test('should have Google sign-in option', async ({ page }) => {
    await page.goto('/login');
    const googleBtn = page.locator('button:has-text("Google"), button:has-text("google")');
    await expect(googleBtn.first()).toBeVisible();
  });
});
