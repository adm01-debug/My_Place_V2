# GitHub (perímetro, CI, workflows) — referência para agentes

Ler quando mexer em settings do repo, `.github/workflows/`, ou quando um merge ou workflow falhar.

## Escrita no GitHub

- Repo **`adm01-debug/My_Place_V2`** (privado), branch `main`.
- **Escrita: somente MCP `GITHUB - MCP - FOREVER`** (`github_push_files`). O MCP padrão do GitHub
  retorna 403 em write. `github_push_files` sobrescreve o arquivo — mande o conteúdo integral com apenas a
  mudança semântica e confira depois que o arquivo remoto bate com o que você testou; aceita `files` e
  `delete` no mesmo commit (1 commit atômico).
- Commits: `<tipo>(<escopo>): <assunto>`, tipos do `commitlint.config.js`
  (`feat fix docs style refactor test chore perf ci build revert`; `subject-case` desligado).
  **Os hooks locais não validam nada**: `.husky/commit-msg` chama `commitlint` e `.husky/pre-commit` chama
  `lint-staged`, mas `husky`, `@commitlint/*`, `lint-staged` e `prettier` **não estão nas devDependencies**
  e não há script `prepare` — siga o padrão à mão.
- Para listar PRs abertas com os arquivos que tocam numa chamada só, use `github_graphql`
  (`pullRequests(states:OPEN){ nodes { number files { nodes { path } } } }`).

## Perímetro do GitHub — estado canônico

**Regra:** qualquer mudança nos campos abaixo atualiza **esta tabela** no mesmo PR.

| Campo | Estado canônico (verificado 2026-11-08) | Como verificar |
|---|---|---|
| Visibilidade | `private` | `github_get_repo` |
| Branch padrão | `main` | `github_get_repo` |
| Branch protection da `main` | **nenhuma** — API responde `404 Branch not protected` | `github_get_branch_protection` |
| Required checks | **nenhum** (sem proteção) | idem |
| Merge | `allow_squash_merge=true` · `allow_merge_commit=true` · `allow_rebase_merge=true` · `allow_auto_merge=false` · `delete_branch_on_merge=false` | `github_get_repo` |
| Squash | `squash_merge_commit_message=COMMIT_MESSAGES` · `squash_merge_commit_title=COMMIT_OR_PR_TITLE` | `github_get_repo` |
| Homepage | `https://my-place-v2.vercel.app` | `github_get_repo` |
| Dependabot | npm, semanal, agrupado, limite 10 PRs | `.github/dependabot.yml` |
| Environments | `production` (usado por `deploy.yml`) | `.github/workflows/deploy.yml` |
| GitHub Apps | `gpt-engineer-app[bot]` (Lovable) commita direto na `main` — ver histórico `9fc5fc2` | `git log` |

Sem branch protection, **nada impede push direto na `main`** — a regra "nunca commitar em `main`" é
disciplina de agente, não trava técnica. E porque o Lovable escreve direto na `main`, re-sincronize
(`git fetch origin main`) antes de abrir branch.

## Workflows (5 arquivos em `.github/workflows/`)

| Arquivo | Gatilho | Estado real |
|---|---|---|
| `ci.yml` | push em `main`/`develop`, PR para `main` | o job `lint-and-type-check` roda `npm run lint` + `npm run type-check` (script criado nesta sessão). Os 8 erros de lint pré-existentes foram corrigidos nesta sessão — o job passa até aí. O job `test` ainda falha: `setupFiles: ./src/test/setup.ts` (vitest.config.ts) não existe e não há nenhum arquivo `*.test.*`/`*.spec.*` em `src/` — **isso não foi corrigido** (escrever testes é tarefa maior, fora do escopo desta sessão); `build` fica `skipped` por `needs: test` |
| `deploy.yml` | push em `main`, `workflow_dispatch` | environment `production`; passo Vercel só roda `if vars.DEPLOY_TARGET == 'vercel'`; o passo seguinte roda `supabase functions deploy` com a **lista explícita** das 8 functions do repo (corrigido nesta sessão; antes rodava sem lista e publicava `migrate-helper` junto) |
| `codeql.yml` | push/PR em `main` + cron `0 6 * * 1` | javascript/typescript; **falha sempre** com `Code scanning is not enabled for this repository`. Repo **privado**: ligar code scanning aqui normalmente exige GitHub Advanced Security (feature paga fora de Enterprise) — **decisão de custo do dono**, não mexi nisso. Nas Settings: Security → Code security → Code scanning |
| `agents-guard.yml` | PR para `main` tocando instruções de agente/CI, push em `main`, `workflow_dispatch` | roda `scripts/ci/check-agents-md-integrity.mjs` (base `origin/main`) e `node --test scripts/ci/*.unit.mjs`. Verde no GitHub no head `fd281c2` e local (10/10 testes + guard exit 0) |
| `audit-pdf.yml` | push que altera `docs/audit_report.md`, `workflow_dispatch` | gera HTML/PDF com pandoc + wkhtmltopdf e **commita de volta** com `git push` |

**`preview.yml` foi removido nesta sessão.** Falhava sempre com `Error: Input required and not supplied:
vercel-token` (secret `VERCEL_TOKEN` inexistente) e era redundante: a integração Git do Vercel já cobre
preview em cada push, sem passar por Actions (ver `vercel-deploy.md`). Decisão tomada sem pendência: criar
o secret não teria efeito prático, já que o resultado (preview deployado) já existe pelo outro caminho.

Estado dos runs na `main` antes desta sessão (`github_list_workflow_runs`, 590 runs; leitura em
2026-11-08): os três últimos workflows a rodar terminaram em **failure** — `CI` e `Deploy` no push de
2026-09-01 e `CodeQL` em toda execução agendada desde 2026-09-07 (última: 2026-11-02). Essa leitura é
anterior às correções de lint/type-check/deploy desta sessão.

**Actions roda, mas a fila é lenta:** na PR #1 (2026-11-08) os jobs ficaram ~8 min em `QUEUED` antes de
qualquer runner pegar. `QUEUED` por alguns minutos aqui é normal, não é travamento.

Resultado real no head `fd281c2` (antes das correções desta sessão), para calibrar expectativa histórica:

| Check | Conclusão | Por quê |
|---|---|---|
| `Instrucoes de agente` (Agents Guard) | **success** | guard deste repo passa no CI |
| `security-scan` | success | `npm audit` com `continue-on-error` |
| `lint-and-type-check` | failure | morria em `npm run lint` com 8 erros — **corrigidos nesta sessão** (ver commit que fecha este item) |
| `test`, `build` | skipped | dependiam (`needs`) do job vermelho; `test` **ainda falha** sozinho (`src/test/setup.ts` ausente, zero testes) |
| `preview` | failure | `vercel-token` ausente — **workflow removido** nesta sessão |
| `Analyze (javascript/typescript)` (CodeQL) | failure | `Code scanning is not enabled for this repository` — **decisão de custo do dono**, continua assim |

Fatos que já custaram retrabalho:

- **CI ainda não é 100% verde.** O job `lint-and-type-check` passa desde esta sessão; `test`/`build`
  continuam vermelhos por falta de suíte de teste (não escrita aqui — é tarefa maior) e `CodeQL` continua
  vermelho por decisão de custo pendente com o dono. Não trate vermelho como "seu" sem checar qual job é.
- **`a1e20e1` desfez três fixes do dia anterior** (`3722a22`, `50dab43` e `6b8c92b`): o `project_id` do
  banco oficial, a remoção do `migrate-helper` e o import quebrado de `notificacoes-digest`
  (`npm:@supabase/supabase-js@2/cors`, subpath inexistente). A remoção do `migrate-helper` foi refeita
  nesta sessão (função, `config.toml` e lista do `deploy.yml`); o import quebrado do digest **continua
  quebrado**. Antes de "restaurar" algo em `supabase/config.toml`, `deploy.yml` ou `supabase/functions/`,
  leia esse histórico — ver `banco.md` e `regras-dominio.md`.
- **`audit-pdf.yml` escreve na branch do push.** Alterar `docs/audit_report.md` numa PR faz o workflow
  tentar commitar o PDF; não use esse arquivo como rascunho.
- **Node:** CI e Dockerfile usam Node 20; `.nvmrc` diz `20`; o projeto no Vercel está em **24.x**.

## Guards que você pode rodar antes do PR

- `node scripts/ci/check-agents-md-integrity.mjs` — barra apagar/esvaziar as instruções de agente
  (`AGENTS.md` + `CLAUDE.md` + `docs/agentes/*.md`); roda no CI pelo `agents-guard.yml`.
- `node --test scripts/ci/*.unit.mjs` — baseline dos fatos deste doc (contagem de workflows, "Branch not
  protected", banco oficial).
- `npx tsc --noEmit -p tsconfig.app.json` e `npx eslint <arquivos tocados>` (precisa de `npm ci` antes).
