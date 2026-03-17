import { test, expect } from '@playwright/test';

test.describe('Trilhas de Desenvolvimento', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trilhas');
  });

  test('should display trilhas page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/Trilhas/i);
  });

  test('should display stats cards', async ({ page }) => {
    const statsLabels = ['Em Andamento', 'Concluídas', 'Horas', 'Disponíveis'];
    for (const label of statsLabels) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible();
    }
  });

  test('should display tabs', async ({ page }) => {
    await expect(page.locator('text=Todas')).toBeVisible();
    await expect(page.locator('text=Em Andamento')).toBeVisible();
    await expect(page.locator('text=Concluídas')).toBeVisible();
  });

  test('should filter by search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await searchInput.fill('Onboarding');
    await page.waitForTimeout(500); // Debounce
  });
});
