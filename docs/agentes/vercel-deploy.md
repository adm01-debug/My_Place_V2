# Vercel e deploy — referência para agentes

Ler quando for confirmar um deploy, mexer em env vars do Vercel, domínio ou deploy de edge functions.

| O que | Valor (verificado 2026-11-08 via MCP `Vercel`) |
|---|---|
| Projeto | `my-place-v2` — `prj_80WoqWFwhNfPbVlwa0SjT9B2RlsQ` |
| Team/conta | `team_QyN41X0q8hrqhW80AwokbFLv` (slug visível nos domínios: `juca1`) |
| Framework / build / output | Vite · `npm run build` · `dist/` |
| Node no projeto | **24.x** (CI e Dockerfile usam 20 — divergência real) |
| Domínios | `my-place-v2.vercel.app`, `my-place-v2-juca1.vercel.app`, `my-place-v2-git-main-juca1.vercel.app` |
| Proteção | **SSO protection ligada** (`all_except_custom_domains`) — URL `.vercel.app` pede login Vercel; não é "site fora do ar" |
| Último deploy de produção | `dpl_HKe41Nqt5atR6yrSZQw69BSE6zjV`, `READY`, criado em **2026-09-01**, mesmo dia da criação do projeto. Nenhum deploy depois. |
| `live` | `false` no projeto |
| MCP Vercel | `mcp__Vercel__*`; escrita = ação de produção |

### Limite de evidência

`get_project` funciona **sem** `teamId`; com `teamId` responde `404 not_found`, e `list_deployments`
responde `403 forbidden`. Isso é escopo do token da sessão, **não** prova de projeto errado nem de
permissão revogada. Histórico de deploys e logs de runtime: **NÃO VERIFICÁVEL** aqui.

## Deploy, env vars e pendências

### Como o deploy realmente acontece

- **O último run do workflow `Deploy` falhou** (push de 2026-09-01, `conclusion: failure` —
  `github_list_workflow_runs`): o deploy de produção que existe no Vercel é o da criação do projeto, não
  um deploy do workflow.
- **Merge em `main` não publica o front sozinho.** `deploy.yml` roda no push da `main`, mas o passo Vercel
  é condicional: `if: ${{ vars.DEPLOY_TARGET == 'vercel' }}`. Se a variável de repositório `DEPLOY_TARGET`
  não estiver em `vercel`, o job builda e não deploya. **Não existe deploy Git automático confirmado**
  (o único deploy de produção é o da criação do projeto) — confirme sempre antes de dizer "subiu".
- **Edge functions:** o passo seguinte do mesmo job (`if: success()`) roda
  `supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}` sem lista de funções →
  publica **todas**, inclusive `migrate-helper` (backdoor de `service_role`, ver `banco.md`). Nunca rode
  `supabase functions deploy` à mão sem `--project-ref`: o `supabase/config.toml` aponta para o projeto
  Lovable antigo.
- **Preview:** `preview.yml` deploya preview a cada PR e comenta a URL. Depende de `VERCEL_TOKEN`,
  `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

### Regras de env vars no Vercel

- Vars `VITE_*` entram no bundle e são **públicas** — nunca segredo com prefixo `VITE_`.
- O projeto hoje tem, no escopo `production`, segredos de servidor injetados pela **integração
  Supabase↔Vercel** (`configurationId icfg_l6F3AhnOcvXqyj1eMSD7Jpxb`): `POSTGRES_URL`,
  `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_USER/HOST/PASSWORD/DATABASE`,
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`,
  `SUPABASE_SECRET_KEY` e os `NEXT_PUBLIC_SUPABASE_*`. **Não são lidos por este front** (Vite só expõe
  `VITE_*`), mas existem: não apague à mão (quebra a integração) e não acrescente novos segredos de
  servidor por fora dela.
- Vars próprias do projeto (production+preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
  `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `BITRIX_WEBHOOK_URL`, `BITRIX_USER_ID`,
  `BITRIX_RH_GROUP_ID`, `RESEND_API_KEY`, `VITE_SENTRY_DSN`. As de Bitrix/Resend/VAPID privadas são
  consumidas por **edge function**, não pelo front: o lugar certo delas é `supabase secrets`.

### Pendências (dependem de decisão do dono)

1. Definir se o deploy é Vercel (ligar `DEPLOY_TARGET=vercel` e confirmar o link Git) ou Docker/VPS
   (`docker-vps.md`) — hoje os dois caminhos existem e nenhum está comprovadamente ativo.
2. Node 20 (CI/Docker) vs 24.x (Vercel): alinhar antes de culpar build por diferença de ambiente.
3. Tirar `migrate-helper` da lista implícita de deploy (e do repo) + rotacionar `service_role`.
