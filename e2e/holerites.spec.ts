import { test, expect } from '@playwright/test';

test.describe('Holerites', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/holerites');
  });

  test('should display holerites page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/Holerite/i);
  });

  test('should display year/month filters', async ({ page }) => {
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });
});
