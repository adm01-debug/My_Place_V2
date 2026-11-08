# scripts/graphify

Instala o [graphify](https://pypi.org/project/graphifyy/) e gera o grafo de código em `graphify-out/`
(fora do Git: cada clone gera o seu).

- `npm run graph:setup` → `bash scripts/graphify/setup.sh` (precisa de `uv` ou `pipx`; versão fixada
  em `GRAPHIFY_VERSION`, hoje `0.9.68` — mesma versão usada pelo hook de sessão da nuvem).
- `npm run graph:update` → `graphify update .` (só AST, sem custo de API) depois de alterar código.
- Consulta: `graphify query "<pergunta>"`, `graphify path "<A>" "<B>"`, `graphify explain "<conceito>"`.
- Frescor: compare `git rev-parse --short HEAD` com a linha "Built from commit" de
  `graphify-out/GRAPH_REPORT.md`.

Secrets usados: nenhum. O que fica fora do grafo está em `.graphifyignore` (`.env`, `seed-now.mjs`,
`supabase/scripts/`, artefatos gerados).
