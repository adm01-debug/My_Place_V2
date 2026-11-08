---
name: my-place-v2
description: Convenções de código e commit do My Place V2 (TypeScript, Conventional Commits). Use ao alterar código, criar testes ou escrever mensagem de commit neste repositório; as regras operacionais ficam em AGENTS.md.
---

# My Place V2 — convenções

As regras de trabalho (banco, fluxo Git, PR, comunicação) estão em `AGENTS.md` na raiz — este skill só
resume convenções de código e commit.

## Commits

Padrão Conventional Commits de `commitlint.config.js`: `<tipo>(<escopo>): <descrição>` — escopo opcional;
tipos: `feat fix docs style refactor test chore perf ci build revert` (`subject-case` desligado).
Mensagem em PT-BR, modo imperativo, primeira linha curta.

Atenção: os hooks `.husky/commit-msg` e `.husky/pre-commit` **não rodam** neste clone — `husky`,
`@commitlint/*`, `lint-staged` e `prettier` não estão nas devDependencies e não há script `prepare`.
Nada valida a mensagem: cumpra o padrão à mão.

Exemplo: `fix(notificacoes): corrige import de cors na edge de digest`

## Código

- Linguagem: TypeScript (front Vite + React em `src/`, edge functions Deno em `supabase/functions/`).
- Alias `@/` → `src/` (`vite.config.ts`, `tsconfig.app.json`); use-o em vez de caminhos relativos longos.
- Funções/hooks `camelCase` (`useAlgo`), componentes/classes `PascalCase`, constantes
  `SCREAMING_SNAKE_CASE`. Siga o padrão de import e de export do arquivo vizinho.
- UI: componentes shadcn/ui em `src/components/ui/` — reaproveite em vez de criar primitivo novo;
  Tailwind com os tokens do `tailwind.config.ts`, sem cor literal quando existir token.
- Dado do Supabase: tipos vêm de `src/integrations/supabase/types.ts` (**gerado — não editar à mão**);
  `src/integrations/lovable/index.ts` também é gerado.
- Toda tela nova precisa de rota em `src/App.tsx`, estados de loading/erro/vazio e, no banco, RLS.
- Testes: `npx vitest run <caminho>` para o que você tocou. Hoje **não existe** nenhum teste, nem
  `src/test/setup.ts`, nem `e2e/` — criar qualquer um deles muda o resultado do CI; avise na PR.
- Typecheck/lint do que tocou: `npx tsc --noEmit -p tsconfig.app.json` e `npx eslint <arquivos>`
  (depois de `npm ci`).
