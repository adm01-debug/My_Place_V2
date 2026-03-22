import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to all main routes', async ({ page }) => {
    const routes = [
      { path: '/', pattern: /Dashboard|Início/i },
      { path: '/ponto', pattern: /Ponto|Registro/i },
      { path: '/ferias', pattern: /Férias/i },
      { path: '/holerites', pattern: /Holerite/i },
      { path: '/beneficios', pattern: /Benefício/i },
      { path: '/comunicados', pattern: /Comunicado/i },
      { path: '/treinamentos', pattern: /Treinamento/i },
      { path: '/metas', pattern: /Meta|OKR/i },
      { path: '/documentos', pattern: /Documento/i },
      { path: '/solicitacoes', pattern: /Solicitaç/i },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show 404 for invalid routes', async ({ page }) => {
    await page.goto('/rota-inexistente');
    const content = await page.textContent('body');
    expect(content).toMatch(/404|não encontrad|not found/i);
  });

  test('should have responsive bottom navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
  });
});
