import { test, expect } from '@playwright/test';
test.describe('Feedback360', () => {
  test('should display feedback page', async ({ page }) => {
    await page.goto('/feedback');
    await expect(page.locator('h1, h2').first()).toContainText(/Feedback|360|Avaliação/i);
  });
});
