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
| Integração GitHub↔Vercel | **ativa**: push em branch abre deploy de preview sozinho. Evidência: o push da PR #1 (2026-11-08) gerou `my-place-v2-git-claude04-funny-mccarthy-w50tg5-juca1.vercel.app` com status `Ready`, mais os checks `Vercel Preview Comments` (success) e `Vercel Agent Review` (neutral — "usage billing is not enabled for this team") |
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
- **Preview é automático pela integração Git** (verificado na PR #1). O `preview.yml` **foi removido**
  nesta sessão: falhava sempre com `Error: Input required and not supplied: vercel-token` (secret
  inexistente) e era redundante com a integração Git. Pelo mesmo motivo (`VERCEL_TOKEN` ausente), o passo
  Vercel do `deploy.yml` também não funcionaria se `DEPLOY_TARGET` fosse ligado sem criar o secret antes.
- **Produção pelo workflow é condicional:** `deploy.yml` roda no push da `main`, mas o passo Vercel só
  executa com `if: ${{ vars.DEPLOY_TARGET == 'vercel' }}`; sem essa variável o job builda e não deploya.
  Se a produção sai pela integração Git no merge da `main`, isso **não está verificado** — o último deploy
  de produção no Vercel é de 2026-09-01, da criação do projeto. Confirme o deploy (MCP ou dashboard) antes
  de dizer "subiu".
- **Edge functions:** o passo seguinte do mesmo job (`if: success()`) roda `supabase functions deploy`
  com a **lista explícita** das 8 functions do repo (corrigido nesta sessão). Nunca rode
  `supabase functions deploy` à mão sem `--project-ref`: o `supabase/config.toml` aponta para o projeto
  Lovable antigo.
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

1. Definir o caminho único de deploy: integração Git do Vercel (hoje a única comprovadamente ativa, em
   preview, e a única para preview depois da remoção do `preview.yml`), `deploy.yml` + `DEPLOY_TARGET=vercel`,
   ou Docker/VPS (`docker-vps.md`). Produção continua sem confirmação.
2. Node 20 (CI/Docker) vs 24.x (Vercel): alinhar antes de culpar build por diferença de ambiente.
3. Rotacionar `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_DB_URL` no projeto `twdechwttlqtmmfzwapc` — a chave já esteve em texto claro no histórico do Git (`migrate-helper`, removido nesta sessão).
4. Ligar code scanning (CodeQL) nas Settings do repo — repo privado, provável custo de GitHub Advanced Security; decisão do dono.
