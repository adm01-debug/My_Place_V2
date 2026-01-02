import { test, expect } from '@playwright/test';
test.describe('Dashboard Gestor', () => {
  test('should display gestao dashboard', async ({ page }) => {
    await page.goto('/gestao');
    await expect(page.locator('h1, h2').first()).toContainText(/Gestão|Dashboard|Equipe/i);
  });
});
