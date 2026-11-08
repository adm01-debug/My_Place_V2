#!/usr/bin/env node
// Baseline dos fatos que os docs de agente afirmam: se a realidade do repo mudar (workflow novo,
// migration nova, edge function nova) ou se alguem reescrever os docs perdendo um fato que ja custou
// retrabalho, este teste falha e obriga a atualizar o doc no mesmo PR.
// Rodar: node --test scripts/ci/*.unit.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const ler = (p) => readFileSync(p, 'utf8');
const AGENTES = 'docs/agentes';
const DOCS_ESPERADOS = ['banco.md', 'docker-vps.md', 'github-ci.md', 'mapa-repo.md', 'regras-dominio.md', 'vercel-deploy.md'];

test('CLAUDE.md so aponta para AGENTS.md', () => {
  assert.equal(ler('CLAUDE.md').trim(), '@AGENTS.md');
});

test('docs/agentes tem exatamente os temas esperados', () => {
  const achados = readdirSync(AGENTES).filter((f) => f.endsWith('.md')).sort();
  assert.deepEqual(achados, DOCS_ESPERADOS);
});

test('AGENTS.md aponta o banco oficial e marca o antigo como proibido', () => {
  const t = ler('AGENTS.md');
  assert.match(t, /twdechwttlqtmmfzwapc/, 'banco oficial precisa estar no AGENTS.md');
  assert.match(t, /pwxaijahjuxnusrlkgic/, 'o projeto Lovable antigo precisa continuar sinalizado');
  assert.match(t, /GITHUB - MCP - FOREVER/, 'a regra de escrita no GitHub precisa continuar explicita');
});

test('banco.md registra a rotacao pendente da service_role e o limite de evidencia', () => {
  const t = ler(`${AGENTES}/banco.md`);
  assert.match(t, /migrate-helper/);
  assert.match(t, /service_role/);
  assert.match(t, /NÃO VERIFICÁVEL/);
});

test('github-ci.md mantem o estado real do perimetro', () => {
  const t = ler(`${AGENTES}/github-ci.md`);
  assert.match(t, /Branch not protected/, 'a ausencia de branch protection e fato de perimetro');
  assert.match(t, /type-check/, 'a CI vermelha por script ausente precisa continuar documentada');
});

test('github-ci.md conta os workflows que existem de verdade', () => {
  const n = readdirSync('.github/workflows').filter((f) => /\.ya?ml$/.test(f)).length;
  const t = ler(`${AGENTES}/github-ci.md`);
  assert.match(t, new RegExp(`\\(${n} arquivos em`), `workflows: ha ${n} arquivos; atualize a contagem em github-ci.md`);
});

test('banco.md conta as migrations que existem de verdade', () => {
  const n = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length;
  const t = ler(`${AGENTES}/banco.md`);
  assert.match(t, new RegExp(`${n} arquivos \\\`.sql\\\``), `migrations: ha ${n} arquivos .sql; atualize a contagem em banco.md`);
});

test('mapa-repo.md conta as edge functions que existem de verdade', () => {
  const dirs = readdirSync('supabase/functions', { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_shared').length;
  const t = ler(`${AGENTES}/mapa-repo.md`);
  assert.match(t, new RegExp(`${dirs} edge functions`), `edge functions: ha ${dirs}; atualize mapa-repo.md`);
});

test('o grafo de codigo continua configurado', () => {
  assert.ok(existsSync('scripts/graphify/setup.sh'), 'scripts/graphify/setup.sh precisa existir');
  assert.ok(existsSync('.claude/hooks/session-start.sh'), 'hook de sessao da nuvem precisa existir');
  assert.match(ler('.gitignore'), /graphify-out\//, 'graphify-out/ precisa continuar fora do Git');
  assert.match(ler('package.json'), /"graph:setup"/, 'package.json precisa manter o script graph:setup');
});

test('skills do Claude e do Codex seguem espelhados', () => {
  assert.equal(
    ler('.claude/skills/my-place-v2/SKILL.md'),
    ler('.agents/skills/my-place-v2/SKILL.md'),
    'as duas copias do SKILL.md precisam ser identicas (mesmo PR)',
  );
});
