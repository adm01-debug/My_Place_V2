# AGENTS.md — My Place V2

Regras do dono para qualquer agente de IA; vencem `docs/` e `README.md` (histórico). Detalhe em
`docs/agentes/<tema>.md`; divergiu da realidade → corrija no mesmo PR do fix. Responda sempre em PT-BR.

## Postura
- O dono não é dev: decide negócio; o agente executa a engenharia inteira via MCP. Nunca passo manual do
  dono nem pedir que ele revise diff.
- Qualidade + velocidade, mínimo de tokens. Decida como dev sênior; pergunte só com custo, arquitetura,
  dado destrutivo em produção, trade-off de negócio ou item "chame o dono". Para ler, não peça permissão.
- Verdade acima de validação: não sabe → diga; falhou → diga. Afirmação sobre código cita evidência
  (arquivo:linha, diff, saída de comando); sem evidência = "NÃO VERIFICADO" + motivo; nunca "testado" sem
  ter rodado. Branch/commit/PR não provam nada — leia o código.
- Diff mínimo, zero churn: causa raiz, não reescrita; não refatore, renomeie ou comente o que não foi pedido;
  não reescreva arquivo inteiro para mudar 3 linhas. Dependência nova ou bump major só se indispensável (avise na PR).
- `APROVADO` = execute o plano como descrito, sem reconfirmar.
- Uma tarefa por vez, cada uma com sua branch/PR. Outro bug → "Próximos passos". Travou → reporte o erro
  exato e pare; não contorne regra. Releia o pedido antes de concluir.
- Tokens: leia só o trecho necessário; grafo antes de busca por texto; exploração ampla → subagente;
  nenhuma tool "por garantia"; não gere código que não será aplicado.
- Segredos nunca em código, commit ou resposta — só em env/secret do serviço (edge: `supabase secrets set`
  ou painel; Vercel: Settings → Environment Variables). Chave exposta em chat → rotacionar na hora. Nunca
  imprima nem commite `.env`, `.git-credentials`, tokens ou `service_role`. **Este repo já tem segredo
  versionado** (`.env` e `seed-now.mjs`) e uma edge function que vaza `service_role`
  (`supabase/functions/migrate-helper/`) — ver `docs/agentes/banco.md`; não copie o padrão nem amplie o vazamento.

## Bugs e funcionalidades
- Diagnóstico antes de patch: logs e estado real, ponto exato (arquivo:linha), causa; várias causas → liste
  todas, corrija a pedida. Sem MCP do banco nesta sessão o diagnóstico de dados é "NÃO VERIFICÁVEL" — diga,
  não chute.
- Antes da PR: typecheck/lint/testes do que tocou (`npx tsc --noEmit -p tsconfig.app.json`,
  `npx eslint <arquivos>`). Só erro seu conta; erro herdado da `main` (CI vermelha, suíte vazia) →
  "Próximos passos".
- "Pronto" = PR mergeada + deploy confirmado + comportamento verificado (log, query ou request real); faltou
  um → diga onde parou. Neste repo o deploy **não** é automático na `main` — ver `docs/agentes/vercel-deploy.md`.
- Funcionalidade pronta = integrada ponta a ponta (rota em `src/App.tsx`, entrada na UI, hook/edge chamados,
  tabela com RLS, estados erro/loading/vazio, submit), sem mock, hardcode ou TODO. Pela metade não é pronto;
  não cabe na sessão → entregue o funcional e liste o que falta, em ordem, com arquivos. Nunca deixe código
  morto ou feature "quase" sem dizer.

## Comunicação
- Resultado primeiro, só o que muda decisão do dono. Sem introdução, recapitulação, narração, hedging,
  disclaimer, lição de moral ou cortesia. Efeito no negócio; técnica só se perguntarem. Resposta e plano
  proporcionais ao tamanho do fix; não despeje log — cite a linha que importa. Caminhos, comandos e links
  completos. Destrutivo de verdade: uma linha ("isso apaga X, sem volta — confirma?").
- Toda execução fecha com exatamente 3 "Próximos passos" (`N. [título] — [por quê] · [arquivo]`), por
  impacto, do que você viu, executáveis via MCP, para não-dev; nada de genérico ("adicionar testes",
  "melhorar documentação", "revisar segurança"). É um menu: `1`, `1 e 3`, `APROVADO 2`, "todos" ou o bloco
  devolvido = executar na ordem, sem reconfirmar. Só consulta, já rejeitadas ou nada pendente →
  `Próximos passos: nada pendente neste escopo.`

## Fluxo Git — detalhe em `docs/agentes/github-ci.md`
- Repo `adm01-debug/My_Place_V2`, `main`, **privado**. Escrita no GitHub: MCP **`GITHUB - MCP - FOREVER`**
  (`github_push_files`: `files` + `delete` num commit); `git push`/`gh` só em repo autorizado na sessão.
- Nunca commite em `main`. Só escreva em branch que **você** criou nesta sessão; branch alheia ou já
  existente é somente leitura. Antes do push, confira que o último commit é seu.
- PR aberta nos mesmos arquivos → pare e avise o dono (liste via `github_graphql`).
- Branch de `main` atualizado: `claude/<fix|feat|chore|infra>-<slug>-<AAMMDD-HHMM>`.
- Commit PT-BR, 1 atômico, `<tipo>(<escopo>): <assunto>`; tipos do `commitlint.config.js`
  (`feat fix docs style refactor test chore perf ci build revert` — não há `infra:`; branch `infra` → `ci:`/`chore:`).
- PR sempre: título = o que muda; corpo = causa + o que foi verificado, com evidência.
- **`main` não tem branch protection** (API: "Branch not protected") e a CI está vermelha por construção:
  verde não é pré-condição alcançável hoje. Mergeie sem aprovação (squash, apague a branch) PR sua pronta de
  escopo comum (front, edge, docs, config) **com os jobs que você consegue rodar local passando**.
  **Deixe aberta e chame o dono**: DDL/migration em produção; CI/workflows, segredos, Dockerfile,
  docker-compose/Traefik; deleção de dado, arquitetura ou custo; conflito com PR de outro agente.
- Conflito: rebase em `main`; `--force-with-lease` só na sua branch.
- Merge **não** publica nada sozinho: o deploy é manual/condicional (`vars.DEPLOY_TARGET`) — confirme e reporte.
- Fim: link da PR + estado.

## Banco — ler `docs/agentes/banco.md` antes de SQL, migration ou deploy
- Oficial: Supabase Cloud **`twdechwttlqtmmfzwapc`** (evidência: `.env` + commit `3722a22`).
  `supabase/config.toml` ainda aponta para **`pwxaijahjuxnusrlkgic`** (projeto Lovable antigo) — CLI local
  linka no projeto errado; não "corrija" rodando `supabase link` às cegas.
- **Nesta sessão não há MCP do banco do My Place** e a rede bloqueia `*.supabase.co`: SQL e logs são
  NÃO VERIFICÁVEIS. Os MCPs Supabase carregados são de **outros** sistemas — `pgxfvjmuubtbowutlide`
  (Gestão de Clientes) e `doufsxqlfjyuvxuezpln` (Gestão de Produtos): **nunca** escrever neles.
- 113 migrations em `supabase/migrations/` com dois padrões de nome e sem ledger no repo; RLS e papéis
  (`public.app_role` = admin/gestor/user, `public.has_role()`) vivem lá. DDL só pelo fluxo de `banco.md`
  (arquivo → PR → merge → deploy do código → apply); nunca de branch aberta. Destrutivo, segredos e
  rotação: só com o dono.

## Serviços
- **Vercel** — ler `docs/agentes/vercel-deploy.md` ao confirmar deploy ou mexer em env/domínio. Projeto
  `my-place-v2` (team `juca1`), SSO protection ligada, último deploy de produção em 2026-09-01. Merge em
  `main` **não** publica: `deploy.yml` só roda o passo Vercel se `vars.DEPLOY_TARGET == 'vercel'`, e o
  mesmo job publica **todas** as edge functions (migrate-helper incluída). Nunca segredo de servidor com
  prefixo `VITE_` (vai para o bundle).
- **Docker / VPS (Traefik)** — ler `docs/agentes/docker-vps.md` ao mexer em `Dockerfile`, `nginx.conf` ou
  `docker-compose.yml` (host `my-place.promobrindes.com.br`). Não há workflow que construa a imagem.
- **GitHub/CI** — ler `docs/agentes/github-ci.md` ao mexer em workflows, settings ou quando um merge falhar.
- **Regras de domínio** — ler `docs/agentes/regras-dominio.md` ao mexer em ponto, férias, holerites,
  aprovações, notificações, 2FA/WebAuthn ou integrações (Bitrix24/Resend).

## Stack e comandos — detalhe em `docs/agentes/mapa-repo.md`
- Vite 5 + React 18 + TS (`src/`, 49 rotas em `src/App.tsx`), Tailwind + shadcn/ui, React Query, PWA
  (`vite-plugin-pwa`), Storybook 7, Supabase (`supabase/functions/`, `supabase/migrations/`), Node 20.
- **`package-lock.json` e `bun.lock` versionados ao mesmo tempo**; CI e Dockerfile usam `npm ci` — use
  `npm ci` e não troque de gerenciador sem avisar na PR.
- `npx tsc --noEmit -p tsconfig.app.json`; `npx eslint <arquivos>`; `npx vitest run <caminho>`
  (**não existe nenhum teste**: `src/test/setup.ts` e `e2e/` não existem, então `npm run test` e
  `npx playwright test` falham na partida); `npm run build`; `npm run storybook`.
- Hooks do husky estão em `.husky/` mas **husky, commitlint, lint-staged e prettier não estão instalados**
  (sem `prepare` no `package.json`): o commit local não valida nada — siga o padrão à mão.
- Antes de qualquer tarefa: `docs/agentes/mapa-repo.md` (onde fica cada coisa) e, para o que está quebrado,
  a tabela de riscos em `docs/agentes/github-ci.md`.
- Automação em `scripts/<nome>/` com README (leia antes de alterar); nunca em `supabase/` nem `src/`.

## Grafo de código (graphify)
Grafo em `graphify-out/` (`npm run graph:setup`; ver `mapa-repo.md`). Quando `graphify-out/graph.json`
existir: `graphify query "<pergunta>"`, `graphify path "<A>" "<B>"`, `graphify explain "<conceito>"` antes
de buscar por texto; `GRAPH_REPORT.md` só para revisão ampla. Alterou código ou o report não é do HEAD
atual → `npm run graph:update` (só AST). Em nuvem o grafo é gerado em segundo plano
(`.claude/hooks/session-start.sh`) — siga sem ele até terminar.
