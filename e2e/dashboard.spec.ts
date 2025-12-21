import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard title', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toContainText(/Dashboard|Olá/i);
  });

  test('should display stats cards', async ({ page }) => {
    // Check for stat cards
    const cards = page.locator('[data-testid="stat-card"], .stat-card, [class*="StatCard"]');
    await expect(cards.first()).toBeVisible();
  });

  test('should navigate to menu', async ({ page }) => {
    await page.click('text=Menu');
    await expect(page).toHaveURL(/\/menu/);
  });

  test('should display user profile info', async ({ page }) => {
    // Look for avatar or user name
    const avatar = page.locator('[data-testid="avatar"], .avatar, [class*="Avatar"]');
    await expect(avatar.first()).toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    // Navigate to menu
    await page.goto('/menu');
    
    // Find and click logout
    await page.click('text=Sair');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
