# Codex CLI — baseline deste repo

Suplemento ao `AGENTS.md` da raiz (fonte de verdade). Aqui fica só o que é específico do Codex CLI.

## Repo Skill

- Skill para o Codex: `.agents/skills/my-place-v2/SKILL.md`
- Skill equivalente para o Claude Code: `.claude/skills/my-place-v2/SKILL.md`
- Os dois arquivos são cópias; mudou um, mude o outro no mesmo PR.
- Credenciais e MCPs privados ficam em `~/.codex/config.toml`, **nunca** neste repo.

## MCP Baseline

`.codex/config.toml` é o baseline seguro para trabalho neste repositório (GitHub, Context7, Exa, Memory,
Playwright, Sequential Thinking). Escrita no GitHub continua sendo pelo MCP `GITHUB - MCP - FOREVER`
(ver `docs/agentes/github-ci.md`).

## Multi-agente

- Explorer: levantamento de evidência, só leitura
- Reviewer: correção, segurança e regressão
- Docs researcher: verificação de API e release notes

## Workflows

Não há arquivos de workflow de tarefa gerados para este repo. Os guards que valem antes de abrir PR estão
em `docs/agentes/github-ci.md`.
