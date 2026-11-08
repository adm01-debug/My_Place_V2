# Banco de dados — referência para agentes

Ler antes de rodar SQL, criar/aplicar migration ou mexer em edge function. Resumo das regras no
`AGENTS.md`; aqui está o detalhe e o que já custou retrabalho neste repo.

## Onde se trabalha

| Situação | Banco | Como |
|---|---|---|
| Diagnóstico | **produção, só leitura** | hoje **sem acesso** nesta sessão (ver "Limite de evidência"); use o painel Supabase do projeto oficial |
| Migration nova | arquivo em `supabase/migrations/` | PR → merge → deploy do código → apply no projeto oficial |
| Teste de comportamento de banco | **Postgres descartável** | nunca no banco oficial; não há script de replay neste repo |
| Migration destrutiva, segredos, rotação de chaves | **só com o dono do projeto** | — |

## Banco OFICIAL

| O que | Valor |
|---|---|
| Projeto Supabase | **`twdechwttlqtmmfzwapc`** (Supabase Cloud) |
| URL | `https://twdechwttlqtmmfzwapc.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/twdechwttlqtmmfzwapc |
| Evidência | `.env` (`VITE_SUPABASE_URL`, versionado) + commit `3722a22` "fix: project_id V2 correto" |
| MCP para SQL | **não existe nesta sessão** |

### Bancos que NÃO são deste projeto (não escrever neles)

- **`pwxaijahjuxnusrlkgic`** — projeto **Lovable antigo**. É o valor que está hoje em
  `supabase/config.toml:1`, reintroduzido pelo commit `a1e20e1` depois de `3722a22` já ter corrigido para
  `twdechwttlqtmmfzwapc`. Consequência real: `supabase link`/`supabase functions deploy` rodados **local**
  sem `--project-ref` apontam para o projeto errado. O `deploy.yml` escapa disso porque passa
  `--project-ref ${{ secrets.SUPABASE_PROJECT_REF }}`.
- **`pgxfvjmuubtbowutlide`** (MCP "SUPABASE - GESTÃO DE CLIENTES") e **`doufsxqlfjyuvxuezpln`**
  (MCP "SUPABASE - GESTÃO DE PRODUTOS") — bancos de **outros sistemas** que aparecem carregados na sessão.
  Verificado por `get_project_url` nos dois MCPs. **Nunca** rodar SQL deles achando que é o My Place.
- **`tnnnlkbymytvtqngbbqh`** — banco do Zapp Web V2. Outro produto.

### Limite de evidência (nesta sessão)

1. Não há MCP do projeto `twdechwttlqtmmfzwapc` carregado.
2. A rede da sessão bloqueia `*.supabase.co` / `supabase.com` (proxy responde `connect_rejected`).

Logo: qualquer afirmação sobre dados, RLS ao vivo, logs ou estado de função é **NÃO VERIFICÁVEL** aqui —
diga isso em vez de supor. Para liberar: ligar um MCP do projeto oficial na sessão (preferido) ou autorizar
o host no ambiente.

## Migrations

- 113 arquivos `.sql` em `supabase/migrations/`, em **dois padrões de nome**: sequencial legado
  (`000_create_update_function.sql` … `013_create_cron_jobs.sql`) e timestamp gerado pelo Lovable
  (`20260713105437_<uuid>.sql`). Não há subpastas nem ledger versionado no repo — a ordem real aplicada
  está no `supabase_migrations.schema_migrations` do projeto oficial, que esta sessão não lê.
- RLS: 68 arquivos com `ENABLE ROW LEVEL SECURITY` e 78 com `CREATE POLICY`. Papéis vêm de
  `public.app_role` (`'admin' | 'gestor' | 'user'`, migration `20251220131515`) + `public.has_role()`.
  **O enum nunca foi estendido** (`grep ALTER TYPE app_role` não acha nada; `src/integrations/supabase/types.ts:4251`
  confirma os três valores) — ver `regras-dominio.md` para o conflito com os 5 papéis do front.
- Ordem obrigatória: **arquivo → PR → merge em `main` → deploy do código → apply**. Nunca DDL a partir de
  branch aberta. `DROP`, `REVOKE`, rename ou mudança de contrato de função usada pelo front/edges nunca
  antes do deploy do código correspondente.
- `supabase/migrations/013_create_cron_jobs.sql` deixa `CREATE EXTENSION pg_cron` **comentado** e
  `011_notificacoes_triggers_adicionais.sql` diz em comentário que as funções de lembrete precisam de
  "cron externo (n8n, pg_cron…)". Não existe agendador no repo: digestão/lembretes de notificação só rodam
  se alguém chamar de fora. Não afirme que rodam.

## Perigos já presentes na `main` (não amplie; corrigir só com o dono)

1. **`supabase/functions/migrate-helper/` é backdoor de credencial.** `supabase/config.toml` declara
   `verify_jwt = false` para ela; o `ACCESS_KEY` está **hardcoded no arquivo versionado**; a ação
   `?action=credentials` devolve `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_DB_URL`. Histórico: removida em
   `50dab43` ("security: remove migrate-helper edge function (exposes service_role key)", 2026-08-11),
   **reintroduzida** em `a1e20e1` (2026-08-12), chave trocada em `3c2a8cb` e revertida em `bb90f29`
   (2026-09-01). O `deploy.yml` atual roda `supabase functions deploy` **sem lista de funções**, então
   publica essa função junto — `3722a22` havia trocado por lista explícita sem ela, e isso também regrediu.
   Remover a função + rotacionar `service_role` é tarefa do dono (muda produção).
2. **Segredos versionados:** `.env` está no Git (`git ls-files .env`) e o `.gitignore` não o ignora;
   `seed-now.mjs:4` tem chave Supabase literal. Qualquer rotação precisa limpar os dois.
3. **`supabase/scripts/*.sql`** (8 arquivos, inclui `seed-rls-disable.sql`) desligam RLS e criam usuários.
   São scripts de bancada — **nunca** rodar contra produção.
