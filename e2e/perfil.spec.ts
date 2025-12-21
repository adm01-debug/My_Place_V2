import { test, expect } from '@playwright/test';

test.describe('Perfil', () => {
  test('should display perfil page', async ({ page }) => {
    await page.goto('/perfil');
    await expect(page.locator('h1, h2').first()).toContainText(/Perfil|Meus Dados/i);
  });

  test('should display avatar', async ({ page }) => {
    await page.goto('/perfil');
    await expect(page.locator('[data-testid="avatar"], .avatar, img[alt*="avatar"]').first()).toBeVisible();
  });

  test('should display badges section', async ({ page }) => {
    await page.goto('/perfil');
    await expect(page.locator('text=Conquistas')).toBeVisible();
  });
});
