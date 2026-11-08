# Mapa do repositório — referência para agentes

Ler quando precisar saber onde fica algo antes de buscar por texto.

## Onde olhar primeiro

| Precisa de | Leia |
|---|---|
| Regras de trabalho, banco, Git, serviços | `AGENTS.md` + `docs/agentes/*.md` (esta pasta) |
| O que está quebrado hoje (CI, deploy, segredos) | `docs/agentes/github-ci.md` e `docs/agentes/banco.md` |
| Qual banco, migrations, RLS, papéis | `docs/agentes/banco.md` |
| Deploy, env vars, domínio | `docs/agentes/vercel-deploy.md` e `docs/agentes/docker-vps.md` |
| Regra de negócio que o código não deixa óbvio | `docs/agentes/regras-dominio.md` |
| Arquitetura/API/schema descritos pelo gerador | `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DATABASE_SCHEMA.md`, `docs/DEPLOYMENT.md` — **contexto, não fonte de verdade** (usam placeholders tipo `https://seu-projeto.supabase.co`) |
| Auditoria antiga | `docs/audit_report.md` (+ `.html`/`.pdf` gerados pelo `audit-pdf.yml`) |

## Mapa rápido

| Onde | O que tem |
|---|---|
| `src/` | front Vite + React + TS (203 arquivos `.ts`/`.tsx`): `pages/` (50 telas), `components/` (16 entradas: `admin/`, `auth/`, `bi/`, `home/`, `integracoes/`, `layout/`, `notificacoes/`, `ponto/`, `portal/`, `security/`, `ui/` shadcn, `vales/` + `ProtectedRoute.tsx`, `ErrorBoundary.tsx`, `ThemeProvider.tsx`, `AnimatedPage.tsx`), `hooks/` (20 arquivos, 13 de notificações), `contexts/` (`AuthContext.tsx`, `auth-permissions.ts`), `lib/` (`calc-fiscal.ts`, `date-utils.ts`, `errors.ts`, `logger.ts`, `utils.ts`, `webauthn.ts`), `integrations/supabase/` (`client.ts`, `types.ts` gerado) e `integrations/lovable/` (gerado pelo Lovable — não editar) |
| `src/App.tsx` | **49 rotas** em um só arquivo; é o índice real das telas |
| `supabase/functions/` | 8 edge functions + `_shared/` (`cors.ts` com `Access-Control-Allow-Origin: *`, `rate-limit.ts`, `supabase-client.ts`): `admin-user-mgmt`, `bi-export`, `integracoes-dispatcher`, `integracoes-test`, `link-preview`, `notificacoes-digest`, `totp-2fa`, `webauthn`. `migrate-helper` (backdoor de `service_role`) foi removida nesta sessão — ver `banco.md` sobre a rotação de chave pendente |
| `supabase/migrations/` | 113 `.sql`, dois padrões de nome, sem ledger no repo |
| `supabase/scripts/` | 8 `.sql` de bancada (seed, `seed-rls-disable.sql`) — nunca contra produção |
| `scripts/` | automações: `scripts/graphify/` (grafo), `scripts/ci/` (guards). Um subdiretório por automação, cada um com `README.md`. Nada solto na raiz; nunca em `supabase/` nem `src/` |
| `.storybook/` | Storybook 7 configurado, **zero arquivos `*.stories.*`** no `src/` |
| raiz | `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `seed-now.mjs` (**chave hardcoded**), `.env` (**versionado**) |

Pastas citadas por config mas **inexistentes**: `e2e/` (`playwright.config.ts` aponta `testDir: './e2e'`) e
`src/test/` (`vitest.config.ts` aponta `setupFiles: ['./src/test/setup.ts']`). Criar qualquer um deles muda
o resultado do CI — avise na PR.

## Comandos

Gerenciador: **`npm ci`** (há `package-lock.json`; `bun.lock` também está versionado, mas CI e Dockerfile
usam npm). `node_modules/` não vem no clone — rode `npm ci` antes de typecheck/lint.

- typecheck: `npm run type-check` (script criado nesta sessão; `tsc --noEmit -p tsconfig.app.json`);
- lint: `npm run lint` roda o repo inteiro e hoje passa com 0 erros (8 erros pré-existentes corrigidos
  nesta sessão); lint só do que tocou: `npx eslint <arquivos>`;
- testes unitários: `npx vitest run <caminho>` — **não há nenhum teste**; `npm run test` falha por
  `setupFiles` inexistente;
- E2E: `npx playwright test` — falha por falta de `e2e/`; e o `baseURL` padrão é `http://localhost:5173`
  enquanto o dev server do Vite roda em **8080** (`vite.config.ts`): passe `PLAYWRIGHT_BASE_URL`;
- build: `npm run build` · preview: `npm run preview` · Storybook: `npm run storybook`;
- guards de agente: `node scripts/ci/check-agents-md-integrity.mjs`, `node --test scripts/ci/*.unit.mjs`.

Hooks do husky: `husky` foi instalado nesta sessão (`package.json` ganhou `prepare: "husky || true"`).
`.husky/commit-msg` valida a mensagem (`node scripts/ci/commit-msg-lint.mjs`, zero dependência nova na
lógica — ver `commitlint.config.js` para os tipos aceitos). `.husky/pre-commit` é **no-op de propósito**:
`lint-staged`/`prettier` continuam sem instalar, então rodar `npx lint-staged` ali bloquearia todo commit;
use `npm run lint <arquivos>`/`npm run type-check` à mão antes de commitar.

## Grafo de código (graphify) — detalhes

`npm run graph:setup` → `scripts/graphify/setup.sh`; precisa de `uv` ou `pipx`. `graphify-out/` (~7 MB
neste repo) está no `.gitignore`: cada clone gera o seu. Verificado nesta sessão com a versão `0.9.68`:
**2714 nós, 6011 arestas, 239 comunidades**, a partir do commit `bb90f299`.

Frescor: compare `git rev-parse --short HEAD` com a linha "Built from commit" de
`graphify-out/GRAPH_REPORT.md`; divergiu → `npm run graph:update` (`graphify update .`, só AST, sem custo
de API). Diferente do Zapp Web V2, **não** rodamos `graphify hook install` aqui — o `prepare` deste repo
só cuida do hook de commit-msg; ligar o rebuild automático do graphify via husky é trabalho futuro, não
feito nesta sessão. O update continua manual. Em sessão de nuvem,
`.claude/hooks/session-start.sh` instala o graphify e gera o grafo em segundo plano (log em
`graphify-out/.session-start.log`; pula se o grafo já é do commit atual). Os hooks `PreToolUse` em
`.claude/settings.json` chamam `graphify hook-guard` e não fazem nada onde o graphify não estiver instalado.
