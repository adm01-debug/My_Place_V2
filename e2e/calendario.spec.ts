import { test, expect } from '@playwright/test';
test.describe('Calendario', () => {
  test('should display calendar', async ({ page }) => {
    await page.goto('/calendario');
    await expect(page.locator('h1, h2').first()).toContainText(/Calendário|Agenda/i);
  });
});
