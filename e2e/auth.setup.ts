import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/login');
  
  // Fill in credentials (use test account)
  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@promobrindes.com.br');
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'Test123!');
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/', { timeout: 30000 });
  
  // Verify we're logged in
  await expect(page.locator('text=Dashboard')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});
