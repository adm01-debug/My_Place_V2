#!/usr/bin/env node
/**
 * Inventario das rotas do front -> inventario/estado/rotas.json (fonte de consulta dos agentes).
 *
 * Le o codigo, nao documentacao:
 *  - Rotas: src/App.tsx (<Route path=...>, o rotulo do <Page name="...">, o componente lazy e o
 *    arquivo de cada um; `protegida` = estar dentro do <Route element={<AuthenticatedLayout />}>,
 *    que embrulha tudo em <ProtectedRoute>)
 *  - Menu: src/components/layout/Navbar.tsx (navItems) e src/components/layout/GlobalSearch.tsx
 *    (`pages` e `adminPages`), casados pelo `path`
 *  - Para cada rota: segue os imports a partir do arquivo da pagina (src/components/<feature>/,
 *    src/hooks/, src/lib/, src/contexts/, src/integrations/) e lista hooks, edge functions
 *    invocadas, RPCs, tabelas (.from e /rest/v1) e buckets de storage (storage.from).
 *  - `problemas`: rota sem arquivo, rota fora do menu e da busca global, entrada de menu apontando
 *    para rota que nao existe e import local que nao resolve.
 *
 * Uso:
 *   node scripts/inventario/gerar-rotas.mjs           grava inventario/estado/rotas.json
 *   node scripts/inventario/gerar-rotas.mjs --check   exit 1 se o arquivo commitado esta desatualizado
 * Saida deterministica (sem data): o mesmo codigo gera o mesmo arquivo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAIDA_REL = 'inventario/estado/rotas.json';
const EXTENSOES = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];
const ARQ_ROTAS = 'src/App.tsx';
const ARQ_NAVBAR = 'src/components/layout/Navbar.tsx';
const ARQ_BUSCA = 'src/components/layout/GlobalSearch.tsx';

const ler = (raiz, rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');
const rel = (raiz, abs) => path.relative(raiz, abs).split(path.sep).join('/');
const unico = (lista) => [...new Set(lista)].sort();

/** Resolve um especificador de import para um arquivo do repo (ou null se externo/inexistente). */
export function resolverImport(raiz, deArquivoAbs, especificador) {
  let base;
  if (especificador.startsWith('@/')) base = path.join(raiz, 'src', especificador.slice(2));
  else if (especificador.startsWith('.')) base = path.resolve(path.dirname(deArquivoAbs), especificador);
  else return null;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of EXTENSOES) if (fs.existsSync(base + ext)) return base + ext;
  return undefined; // local, mas nao existe
}

/** Imports de um arquivo: [{ especificador, nomes[] }] (estaticos e import() dinamico). */
export function extrairImports(texto) {
  const out = [];
  for (const m of texto.matchAll(/import\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
    if (m[1]) continue;
    const nomes = [...m[2].matchAll(/\b([A-Za-z_$][\w$]*)\b(?!\s*as\b)/g)].map((x) => x[1])
      .filter((n) => !['type', 'as', 'default'].includes(n));
    out.push({ especificador: m[3], nomes });
  }
  for (const m of texto.matchAll(/(?:import|export)\s*(?:\*\s*from\s*)?['"]([^'"]+)['"]/g)) out.push({ especificador: m[1], nomes: [] });
  for (const m of texto.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push({ especificador: m[1], nomes: [] });
  for (const m of texto.matchAll(/export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g)) out.push({ especificador: m[1], nomes: [] });
  return out;
}

/**
 * Mapa nome -> valor dos `const NOME = 'literal'` de nivel de modulo no texto. So resolve o caso
 * mais comum: identificador passado direto pra `.from`/`storage.from`/`rpc`/`invoke` que e, no
 * mesmo arquivo, uma constante de string. Conta profundidade de `{`/`}` linha a linha e so aceita
 * o `const` quando a profundidade, ANTES de processar a linha, e zero (nivel de modulo de
 * verdade) — um `const` dentro de funcao tambem pode estar em coluna zero. Contagem ingenua
 * (nao ignora chave dentro de string/template) e de proposito: na duvida, prefere nao resolver a
 * resolver errado.
 */
function constantesDeString(texto) {
  const mapa = new Map();
  let profundidade = 0;
  for (const linha of texto.split('\n')) {
    if (profundidade === 0) {
      const m = linha.match(/^(?:export\s+)?const\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*[^=]+)?=\s*['"`]([A-Za-z0-9_.-]+)['"`]\s*[;,]?\s*$/);
      if (m) mapa.set(m[1], m[2]);
    }
    for (const ch of linha) {
      if (ch === '{') profundidade++;
      else if (ch === '}') profundidade--;
    }
  }
  return mapa;
}

/**
 * Chamadas ao Supabase num texto: tabelas (`.from` do cliente e `/rest/v1/<tabela>`), buckets
 * (`storage.from`), RPCs (`.rpc`) e edges (`functions.invoke`, `/functions/v1/<edge>`).
 */
export function extrairChamadas(texto) {
  const pegar = (re) => [...texto.matchAll(re)].map((m) => m[1]);
  const consts = constantesDeString(texto);
  const tabelas = [];
  const buckets = [];
  for (const m of texto.matchAll(/(\bstorage\s*)?\.from\(\s*['"`]([A-Za-z0-9_-]+)['"`]/g)) (m[1] ? buckets : tabelas).push(m[2]);
  for (const m of texto.matchAll(/(\bstorage\s*)?\.from\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g)) {
    if (consts.has(m[2])) (m[1] ? buckets : tabelas).push(consts.get(m[2]));
  }
  tabelas.push(...pegar(/\/rest\/v1\/([A-Za-z0-9_]+)/g).filter((t) => t !== 'rpc'));
  return {
    tabelas,
    buckets,
    rpcs: [...pegar(/(?:\.|\b)rpc\(\s*['"`]([A-Za-z0-9_]+)['"`]/g), ...pegar(/\/rest\/v1\/rpc\/([A-Za-z0-9_]+)/g)],
    // `functions.invoke('x')`, inclusive quebrado em linha, e a chamada direta pela URL dentro de
    // string/template (`${SUPABASE_URL}/functions/v1/bi-export`).
    edges: [
      ...pegar(/functions\s*\.\s*invoke(?:<[^>()]*>)?\(\s*['"`]([A-Za-z0-9_-]+)(?:\/[^'"`]*)?['"`]/g),
      ...pegar(/['"`][^'"`\n]*\/functions\/v1\/([A-Za-z0-9_-]+)/g),
    ],
  };
}

const ehTeste = (p) => /(\.test\.|\.spec\.|__tests__|\.stories\.)/.test(p);

/**
 * Fecho de imports a partir do arquivo da pagina. Segue sem limite a propria pasta da pagina,
 * src/hooks/, src/lib/, src/contexts/ e src/integrations/ (helpers que chamam edge/RPC);
 * componentes de feature em src/components/ entram ate MAX_SALTOS_FEATURE saltos. Fica de fora so
 * o kit de UI (src/components/ui/) e teste. Import local que nao resolve vira problema.
 */
export const MAX_SALTOS_FEATURE = 2;
export function fechoDaTela(raiz, arquivoTelaAbs) {
  const pastaPagina = path.dirname(arquivoTelaAbs);
  const dentro = (abs, rel_) => abs.startsWith(path.join(raiz, rel_) + path.sep);
  const livre = (abs) => abs.startsWith(pastaPagina + path.sep)
    || ['src/hooks', 'src/lib', 'src/contexts', 'src/integrations'].some((d) => dentro(abs, d));
  const outraFeature = (abs) => dentro(abs, 'src/components') && !dentro(abs, 'src/components/ui');
  const saltosVistos = new Map(); // arquivo -> menor numero de saltos com que foi visitado
  const hooks = new Map();
  const quebrados = new Set();
  const chamadas = { tabelas: [], buckets: [], rpcs: [], edges: [] };
  const fila = [[arquivoTelaAbs, 0]];
  while (fila.length) {
    const [atual, saltos] = fila.shift();
    if (saltosVistos.has(atual) && saltosVistos.get(atual) <= saltos) continue;
    const primeiraVez = !saltosVistos.has(atual);
    saltosVistos.set(atual, saltos);
    const texto = fs.readFileSync(atual, 'utf8');
    if (primeiraVez) {
      const c = extrairChamadas(texto);
      for (const k of Object.keys(chamadas)) chamadas[k].push(...c[k]);
    }
    for (const imp of extrairImports(texto)) {
      const alvo = resolverImport(raiz, atual, imp.especificador);
      if (alvo === undefined && !/\.(css|scss|svg|png|jpe?g|webp|gif|json)(\?.*)?$|\?/.test(imp.especificador)) {
        quebrados.add(`${rel(raiz, atual)} -> ${imp.especificador}`);
      }
      if (!alvo || ehTeste(alvo)) continue;
      for (const nome of imp.nomes) if (/^use[A-Z]/.test(nome) && !hooks.has(nome)) hooks.set(nome, rel(raiz, alvo));
      if (livre(alvo)) fila.push([alvo, saltos]);
      else if (outraFeature(alvo) && saltos < MAX_SALTOS_FEATURE) fila.push([alvo, saltos + 1]);
    }
  }
  return {
    arquivos_lidos: saltosVistos.size,
    hooks: [...hooks.entries()].map(([nome, arquivo]) => ({ nome, arquivo })).sort((a, b) => a.nome.localeCompare(b.nome)),
    buckets: unico(chamadas.buckets),
    edges: unico(chamadas.edges),
    rpcs: unico(chamadas.rpcs),
    tabelas: unico(chamadas.tabelas),
    imports_quebrados: [...quebrados].sort(),
  };
}

/** Recorta o bloco do <Route element={<AuthenticatedLayout />}> (as rotas protegidas). */
export function recorteProtegido(texto) {
  const i = texto.search(/<Route\s+element=\{<AuthenticatedLayout\s*\/>\}>/);
  if (i < 0) return null;
  // O bloco termina no </Route> que fecha esse <Route> de layout.
  const fim = texto.indexOf('</Route>', i);
  return fim < 0 ? [i, texto.length] : [i, fim];
}

/** Rotas do react-router em src/App.tsx. */
export function lerRotas(raiz) {
  const texto = ler(raiz, ARQ_ROTAS);
  const abs = path.join(raiz, ARQ_ROTAS);
  const lazy = Object.fromEntries([...texto.matchAll(/const\s+(\w+)\s*=\s*lazy\w*\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g)]
    .map((m) => [m[1], m[2]]));
  const protegido = recorteProtegido(texto);
  const inicio = texto.indexOf('<Routes>');
  const corpo = texto.slice(inicio, texto.indexOf('</Routes>'));
  const IGNORAR = new Set(['Route', 'Routes', 'Page', 'Navigate', 'Suspense', 'Outlet', 'ErrorBoundary', 'PageErrorBoundary', 'AuthenticatedLayout', 'ProtectedRoute']);
  const pedacos = [];
  for (const m of corpo.matchAll(/<Route\b/g)) pedacos.push({ pos: inicio + m.index, texto: corpo.slice(m.index, corpo.indexOf('<Route', m.index + 6) === -1 ? undefined : corpo.indexOf('<Route', m.index + 6)) });
  return pedacos.map(({ pos, texto: pedaco }) => {
    const caminho = (pedaco.match(/path=["']([^"']+)["']/) || [])[1];
    const redireciona = (pedaco.match(/<Navigate\s+to=["']([^"']+)["']/) || [])[1] ?? null;
    const rotulo = (pedaco.match(/<Page\s+name=["']([^"']+)["']/) || [])[1] ?? null;
    const componente = [...pedaco.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1]).find((n) => !IGNORAR.has(n)) ?? null;
    const alvo = componente && lazy[componente] ? resolverImport(raiz, abs, lazy[componente]) : null;
    return {
      caminho,
      rotulo,
      componente,
      arquivo: alvo ? rel(raiz, alvo) : null,
      protegida: Boolean(protegido && pos > protegido[0] && pos < protegido[1]),
      redireciona,
    };
  }).filter((u) => u.caminho).sort((a, b) => a.caminho.localeCompare(b.caminho));
}

/**
 * Entradas de menu/busca por caminho: { '/ponto': { navbar: 'Ponto', busca: 'Ponto', admin: false } }.
 * Navbar = barra principal; busca = atalhos da GlobalSearch (`pages` e `adminPages`).
 */
export function lerMenu(raiz) {
  const menu = {};
  const registrar = (caminho, origem, rotulo, admin) => {
    menu[caminho] ??= { navbar: null, busca: null, admin: false };
    menu[caminho][origem] = rotulo;
    if (admin) menu[caminho].admin = true;
  };
  const navbar = ler(raiz, ARQ_NAVBAR);
  const bloco = (texto, nome) => {
    const i = texto.indexOf(`${nome} = [`);
    return i < 0 ? '' : texto.slice(i, texto.indexOf('];', i) + 1);
  };
  for (const m of bloco(navbar, 'const navItems').matchAll(/label:\s*'([^']+)',\s*path:\s*'([^']+)'/g)) {
    registrar(m[2], 'navbar', m[1], false);
  }
  if (fs.existsSync(path.join(raiz, ARQ_BUSCA))) {
    const busca = ler(raiz, ARQ_BUSCA);
    for (const [nome, admin] of [['const pages', false], ['const adminPages', true]]) {
      for (const m of bloco(busca, nome).matchAll(/label:\s*'([^']+)',\s*path:\s*'([^']+)'/g)) {
        registrar(m[2], 'busca', m[1], admin);
      }
    }
  }
  return menu;
}

/** Monta o inventario inteiro a partir de uma raiz de repo. */
export function gerarRotas(raiz = RAIZ_PADRAO) {
  const base = lerRotas(raiz);
  const menu = lerMenu(raiz);
  const caminhos = new Set(base.map((r) => r.caminho));
  const rotas = base.map((r) => ({
    ...r,
    menu: menu[r.caminho] ?? null,
    ...(r.arquivo
      ? fechoDaTela(raiz, path.join(raiz, r.arquivo))
      : { arquivos_lidos: 0, hooks: [], buckets: [], edges: [], rpcs: [], tabelas: [], imports_quebrados: [] }),
  }));

  const hooks = {};
  for (const r of rotas) for (const h of r.hooks) {
    hooks[h.nome] ??= { arquivo: h.arquivo, rotas: [] };
    hooks[h.nome].rotas.push(r.caminho);
  }

  const problemas = [
    ...rotas.filter((r) => r.componente && !r.arquivo && !r.redireciona)
      .map((r) => ({ tipo: 'rota_sem_arquivo', id: r.caminho, detalhe: `${r.componente} nao resolve em ${ARQ_ROTAS}` })),
    ...rotas.filter((r) => !r.menu && r.caminho !== '*' && !r.redireciona)
      .map((r) => ({ tipo: 'rota_sem_entrada_de_menu', id: r.caminho, detalhe: 'nao aparece no Navbar nem na busca global: so por URL direta' })),
    ...Object.keys(menu).filter((c) => !caminhos.has(c)).sort()
      .map((c) => ({ tipo: 'menu_sem_rota', id: c, detalhe: `"${menu[c].navbar ?? menu[c].busca}" aponta para um caminho que nao existe em ${ARQ_ROTAS}` })),
    ...rotas.flatMap((r) => r.imports_quebrados.map((q) => ({ tipo: 'import_quebrado', id: r.caminho, detalhe: q }))),
  ];

  return {
    format_version: 1,
    fonte: `scripts/inventario/gerar-rotas.mjs (le ${ARQ_ROTAS}, ${ARQ_NAVBAR}, ${ARQ_BUSCA} e os imports de cada pagina)`,
    resumo: {
      rotas: rotas.length,
      protegidas: rotas.filter((r) => r.protegida).length,
      itens_de_menu: Object.keys(menu).length,
      hooks_distintos: Object.keys(hooks).length,
      problemas: problemas.length,
    },
    rotas,
    hooks: Object.fromEntries(Object.keys(hooks).sort().map((k) => [k, { arquivo: hooks[k].arquivo, rotas: unico(hooks[k].rotas) }])),
    problemas,
  };
}

export const serializar = (inv) => JSON.stringify(inv, null, 2) + '\n';

function main(argv) {
  const saida = path.join(RAIZ_PADRAO, SAIDA_REL);
  const conteudo = serializar(gerarRotas(RAIZ_PADRAO));
  if (argv.includes('--check')) {
    const atual = fs.existsSync(saida) ? fs.readFileSync(saida, 'utf8') : '';
    if (atual !== conteudo) {
      console.error(`${SAIDA_REL} desatualizado: rode node scripts/inventario/gerar-rotas.mjs e commite o resultado.`);
      process.exit(1);
    }
    console.log(`${SAIDA_REL} em dia.`);
    return;
  }
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, conteudo);
  const r = JSON.parse(conteudo).resumo;
  console.log(`rotas.json: ${r.rotas} rotas (${r.protegidas} protegidas), ${r.itens_de_menu} itens de menu, ${r.hooks_distintos} hooks, ${r.problemas} problemas.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
