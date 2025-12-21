import { test, expect } from '@playwright/test';

test.describe('Kudos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kudos');
  });

  test('should display kudos page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/Kudos/i);
  });

  test('should display stats cards', async ({ page }) => {
    const statsLabels = ['Nível', 'Recebidos', 'Enviados', 'Badges'];
    for (const label of statsLabels) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible();
    }
  });

  test('should display tabs', async ({ page }) => {
    await expect(page.locator('text=Feed')).toBeVisible();
    await expect(page.locator('text=Ranking')).toBeVisible();
    await expect(page.locator('text=Badges')).toBeVisible();
  });

  test('should open send kudo dialog', async ({ page }) => {
    await page.click('button:has-text("Enviar Kudo")');
    await expect(page.locator('text=Enviar Reconhecimento')).toBeVisible();
  });

  test('should switch to ranking tab', async ({ page }) => {
    await page.click('text=Ranking');
    await expect(page.locator('text=Top 10')).toBeVisible();
  });
});
