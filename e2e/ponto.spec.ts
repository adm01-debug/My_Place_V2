import { test, expect } from '@playwright/test';

test.describe('Registro de Ponto', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ponto');
  });

  test('should display ponto page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/Ponto|Registro/i);
  });

  test('should display current time', async ({ page }) => {
    // Check for time display (HH:MM format)
    const timePattern = /\d{2}:\d{2}/;
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(timePattern);
  });

  test('should display registro buttons', async ({ page }) => {
    const registrarBtn = page.locator('button:has-text("Registrar"), button:has-text("Entrada"), button:has-text("Saída")');
    await expect(registrarBtn.first()).toBeVisible();
  });

  test('should display history section', async ({ page }) => {
    const historySection = page.locator('text=Histórico, text=Registros, text=Últimos');
    await expect(historySection.first()).toBeVisible();
  });
});
