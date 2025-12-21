# 🧪 Testing Guide - MY-PLACE

Guia completo para execução e criação de testes.

## 📦 Estrutura de Testes

```
src/test/           # Unit tests (Vitest)
├── setup.ts        # Setup global
├── hooks.test.ts   # Testes de hooks
├── components.test.tsx # Testes de componentes
├── auth.test.ts    # Testes de autenticação
├── integration.test.ts # Testes de integração
├── pages.test.tsx  # Testes de páginas
├── kudos.test.ts   # Testes do useKudos
└── trilhas.test.ts # Testes do useTrilhas

e2e/                # E2E tests (Playwright)
├── auth.setup.ts   # Setup de autenticação
├── dashboard.spec.ts
├── ponto.spec.ts
├── kudos.spec.ts
├── trilhas.spec.ts
├── menu.spec.ts
└── ferias.spec.ts
```

## 🚀 Comandos

### Unit Tests (Vitest)

```bash
# Modo watch (desenvolvimento)
npm run test

# Execução única
npm run test:run

# Com coverage
npm run test:coverage

# UI interativa
npm run test:ui
```

### E2E Tests (Playwright)

```bash
# Executar todos os testes
npm run test:e2e

# UI interativa
npm run test:e2e:ui

# Modo debug
npm run test:e2e:debug

# Gerar relatório
npm run test:e2e:report
```

## 📝 Criando Testes

### Unit Test (Hook)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useKudos } from '@/hooks/useKudos';

describe('useKudos', () => {
  it('should initialize with empty arrays', async () => {
    const { result } = renderHook(() => useKudos());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.kudos).toEqual([]);
  });
});
```

### E2E Test (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Kudos Page', () => {
  test('should display feed', async ({ page }) => {
    await page.goto('/kudos');
    await expect(page.locator('text=Feed')).toBeVisible();
  });
});
```

## 🎯 Coverage Target

| Categoria | Target | Atual |
|-----------|--------|-------|
| Hooks | 80% | ~70% |
| Components | 75% | ~65% |
| Pages | 60% | ~50% |
| Utils | 90% | ~85% |

## 🔧 Configuração

### Vitest (vitest.config.ts)

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

### Playwright (playwright.config.ts)

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
});
```

## 🔐 Autenticação em Testes

### Variáveis de Ambiente

```env
TEST_USER_EMAIL=test@promobrindes.com.br
TEST_USER_PASSWORD=Test123!
```

### Storage State (Playwright)

O arquivo `e2e/auth.setup.ts` salva o estado de autenticação em `e2e/.auth/user.json` para reutilização.

## 📊 CI/CD

Os testes são executados automaticamente via GitHub Actions:

- **CI Workflow**: Roda em cada push/PR
- **Coverage Report**: Publicado como artifact
- **E2E Report**: HTML report disponível após execução

## 🆘 Troubleshooting

### Testes falhando localmente

```bash
# Limpar cache
rm -rf node_modules/.vitest

# Reinstalar
npm install
```

### Playwright não encontra browser

```bash
# Instalar browsers
npx playwright install
```

### Timeout em testes E2E

Aumentar timeout no `playwright.config.ts`:

```typescript
timeout: 60000,
```

---

*Última atualização: Dezembro 2025*
