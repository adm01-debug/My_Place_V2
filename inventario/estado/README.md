# Estado real do projeto — inventário gerado

Pasta de **dados gerados por script**, não de relatórios escritos à mão. É a fonte de consulta dos
agentes para "o que existe hoje" no banco e no código. Se um número aqui divergir do que você mediu,
regere o arquivo (comandos abaixo) em vez de corrigir à mão.

| Arquivo | Como gerar | O que tem |
|---|---|---|
| `banco.json` | `SUPABASE_ACCESS_TOKEN=... node scripts/inventario/gerar-banco.mjs` (Management API: `/database/query/read-only` + `/functions`, só leitura) **ou**, sem token, rodar `scripts/inventario/banco.sql` no MCP oficial do projeto (`db_query` / `execute_sql`), salvar a resposta e `node scripts/inventario/gerar-banco.mjs --entrada <arquivo>` | banco oficial (`pwxaijahjuxnusrlkgic`), só leitura: cada tabela (RLS, policies, triggers, linhas, tamanho, se é citada em função/view e quantos `.from()` e `/rest/v1/<tabela>` tem em `src/` e `supabase/functions/`), tabelas órfãs, cada cron job (agenda, funções chamadas, falhas e taxa em 24 h/7 d), tamanho do histórico do cron, edge functions publicadas × pastas do repo (só com token; sem token fica `publicadas: null`) e a lista `alertas` |
| `rotas.json` | `node scripts/inventario/gerar-rotas.mjs` (`--check` só confere se está em dia) | as rotas de `src/App.tsx` (caminho, rótulo do `<Page name>`, componente, arquivo, se está dentro do `AuthenticatedLayout`), o item de menu correspondente em `Navbar.tsx`/`GlobalSearch.tsx` e, por rota, os hooks, tabelas, RPCs, buckets e edge functions alcançados pelos imports, mais a lista `problemas` (rota sem arquivo, rota sem entrada de menu, menu sem rota, import quebrado) |
| `edges.json` | `node scripts/inventario/gerar-repo.mjs` | as edge functions: linhas, segredos lidos (`Deno.env.get`) e quem invoca cada uma (src, migrations, outras edges, e2e, CI) |
| `tabelas-uso.json` (não versionado) | `node scripts/inventario/gerar-repo.mjs < lista-de-tabelas.txt` | quantos `.from('tabela')` cada tabela tem — também sai em `banco.json` → `tabelas[].uso_no_codigo` |

## Como ler

- **`alertas`** (em `banco.json`) é o que um agente precisa saber antes de mexer: `tabela_sem_rls`,
  `cron_falhando` (taxa ≥ 5 % em 7 dias), `historico_cron_sem_limpeza` (> 50 mil linhas com mais de
  7 dias), `edge_sem_deploy` e `edge_publicada_sem_codigo`. Os limiares estão em `LIMIARES` no script.
- **`tabelas_orfas`**: 0 linhas + não citada em função/view do banco + nenhum `.from()` nem `/rest/v1/`
  no código (`.from(variavel)` não é resolvido). Candidata a limpeza, não prova de que pode apagar
  (pode ser usada por RPC com outro nome ou por sistema externo).
- **`linhas`** é `count(*)` exato quando a tabela tem menos de 200 mil linhas (`linhas_exatas: true`);
  acima disso, a estimativa do planner.
- A resposta só é gravada se as tabelas baterem (≥ 90 %, nos dois sentidos) com a lista esperada pelo
  repo — `supabase/schema-manifest.json` quando existir, senão as tabelas de
  `src/integrations/supabase/types.ts` — **e** o ledger bater com `supabase/migrations/`. Isso barra
  resposta colada de outro banco. Só migrations com carimbo de 14 dígitos contam no ledger: `000_`,
  `001_` e `002_` foram escritas à mão e nunca entraram em `supabase_migrations.schema_migrations`.
- Nada de segredo sai do banco: de `cron.job` só o nome das funções chamadas (nunca o comando, que
  pode ter URL/cabeçalho). O script se recusa a gravar saída com cara de credencial (Bearer, JWT,
  `sb_secret_`).
- O PR semanal (`.github/workflows/inventario-estado-semanal.yml`) só abre quando algo estrutural
  mudou de verdade: tabela nova/apagada, alerta novo, RLS/policy, contagem real de linhas, rota, edge.
  `medido_em`/`gerado_em` e a telemetria viva (janela rolante de 7 dias) sozinhos não abrem PR — por
  isso esses campos podem ficar atrasados no commitado; confie neles só depois de regenerar.
