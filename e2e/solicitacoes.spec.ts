import { test, expect } from '@playwright/test';

test.describe('Solicitações', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/solicitacoes');
  });

  test('should display solicitacoes page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/Solicitaç/i);
  });
});
