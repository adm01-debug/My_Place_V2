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

## Workflows (6 arquivos em `.github/workflows/`)

| Arquivo | Gatilho | Estado real |
|---|---|---|
| `ci.yml` | push em `main`/`develop`, PR para `main` | **vermelha por construção**: o job `lint-and-type-check` morre antes do typecheck, no `npm run lint` (8 erros na `main`); o passo seguinte chama `npm run type-check`, script que **não existe** no `package.json`; e o job `test` rodaria `npm run test -- --coverage` com `setupFiles: ./src/test/setup.ts` inexistente e **zero arquivos de teste** — hoje fica `skipped` junto com `build` |
| `deploy.yml` | push em `main`, `workflow_dispatch` | environment `production`; passo Vercel só roda `if vars.DEPLOY_TARGET == 'vercel'`; o passo seguinte roda `supabase functions deploy` com a **lista explícita** das 8 functions do repo (corrigido nesta sessão; antes rodava sem lista e publicava `migrate-helper` junto) |
| `preview.yml` | PR (opened/synchronize/reopened) | **falha sempre**: `Error: Input required and not supplied: vercel-token` — o secret `VERCEL_TOKEN` não existe. O preview que funciona vem da integração Git do Vercel, não daqui |
| `codeql.yml` | push/PR em `main` + cron `0 6 * * 1` | javascript/typescript; **falha sempre** com `Code scanning is not enabled for this repository` (configuração do repo, não do código) |
| `agents-guard.yml` | PR para `main` tocando instruções de agente/CI, push em `main`, `workflow_dispatch` | roda `scripts/ci/check-agents-md-integrity.mjs` (base `origin/main`) e `node --test scripts/ci/*.unit.mjs`. Verde no GitHub no head `fd281c2` e local (10/10 testes + guard exit 0) |
| `audit-pdf.yml` | push que altera `docs/audit_report.md`, `workflow_dispatch` | gera HTML/PDF com pandoc + wkhtmltopdf e **commita de volta** com `git push` |

Estado dos runs na `main` (`github_list_workflow_runs`, 590 runs; leitura em 2026-11-08): os três últimos
workflows a rodar na `main` terminaram em **failure** — `CI` e `Deploy` no push de 2026-09-01 e `CodeQL`
em toda execução agendada desde 2026-09-07 (última: 2026-11-02). Não há run verde recente na `main`.

**Actions roda, mas a fila é lenta:** na PR #1 (2026-11-08) os jobs ficaram ~8 min em `QUEUED` antes de
qualquer runner pegar. `QUEUED` por alguns minutos aqui é normal, não é travamento.

Resultado real daquele head (`fd281c2`), para calibrar expectativa:

| Check | Conclusão | Por quê |
|---|---|---|
| `Instrucoes de agente` (Agents Guard) | **success** | guard deste repo passa no CI |
| `security-scan` | success | `npm audit` com `continue-on-error` |
| `lint-and-type-check` | **failure** | morre em `npm run lint` com **8 erros** pré-existentes (2× `no-empty-object-type`, 3× `react-hooks/rules-of-hooks`, `prefer-const` em `supabase/functions/integracoes-dispatcher/index.ts:98`, `no-explicit-any` em `totp-2fa/index.ts:459`, `no-require-imports` em `tailwind.config.ts:195`). O passo `npm run type-check` **nem chega a rodar** |
| `test`, `build` | skipped | dependem (`needs`) do job vermelho |
| `preview` | **failure** | `Error: Input required and not supplied: vercel-token` — o secret `VERCEL_TOKEN` não existe no repo |
| `Analyze (javascript/typescript)` (CodeQL) | **failure** | erro de configuração, não de código: `Code scanning is not enabled for this repository`. É o mesmo motivo de todas as execuções agendadas falharem desde 2026-09-07 — ligar code scanning nas Settings do repo é decisão do dono |

Ou seja: nenhuma PR consegue CI verde enquanto os 8 erros de lint estiverem na `main`, e os workflows que
dependem de `VERCEL_TOKEN` nunca funcionaram.

Fatos que já custaram retrabalho:

- **CI verde não é alcançável hoje.** Não trate vermelho como "seu" sem olhar o job: erro de lint em
  arquivo que você não tocou, `npm run type-check` (script ausente), `No test files found` ou
  `vercel-token` ausente são heranças da `main` → "Próximos passos".
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
