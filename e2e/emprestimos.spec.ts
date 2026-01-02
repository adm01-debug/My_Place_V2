import { test, expect } from '@playwright/test';
test.describe('Emprestimos', () => {
  test('should display emprestimos', async ({ page }) => {
    await page.goto('/emprestimos');
    await expect(page.locator('h1, h2').first()).toContainText(/Empréstimos|Consignado/i);
  });
});
