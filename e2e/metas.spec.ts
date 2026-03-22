import { test, expect } from '@playwright/test';

test.describe('Metas e OKRs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/metas');
  });

  test('should display metas page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/Meta|OKR/i);
  });
});
