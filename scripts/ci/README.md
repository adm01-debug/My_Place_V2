# scripts/ci

Guards que protegem as instruções de agente deste repo. Rodam no CI pelo
`.github/workflows/agents-guard.yml` e podem (devem) ser rodados local antes de abrir PR.

| Script | O que faz | Como rodar |
|---|---|---|
| `check-agents-md-integrity.mjs` | Falha se `AGENTS.md` sumir, perder uma das 8 seções obrigatórias, ou se o conjunto `AGENTS.md` + `CLAUDE.md` + `docs/agentes/*.md` encolher >30% (ou um arquivo vigiado encolher >50%) em relação à base. Base = `AGENTS_MD_BASE` (no CI, `origin/main`); sem a variável compara com o `HEAD`. | `node scripts/ci/check-agents-md-integrity.mjs` |
| `agents-docs-baseline.unit.mjs` | Prende os docs à realidade: temas esperados em `docs/agentes/`, banco oficial no `AGENTS.md`, backdoor do `migrate-helper` registrado, "Branch not protected", contagem real de workflows/migrations/edge functions e skills espelhados. | `node --test scripts/ci/*.unit.mjs` |

Secrets usados: nenhum. Precisa apenas de Node (>=20) e do histórico do Git (`fetch-depth: 0` no CI,
para que `origin/main` exista como base de comparação).

Mudou a realidade (workflow novo, migration nova, edge function nova)? O teste falha de propósito:
atualize o doc correspondente **no mesmo PR**.
