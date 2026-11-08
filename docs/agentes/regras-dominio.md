# Regras de domínio que o código não deixa óbvio — referência para agentes

Ler ao mexer em papéis/permissões, ponto, notificações, 2FA ou integrações.

## Papéis e permissão — o front e o banco não falam a mesma língua

- **Banco:** `public.app_role` tem **três** valores: `admin`, `gestor`, `user`
  (migration `20251220131515`; confirmado em `src/integrations/supabase/types.ts:4251`). Nenhum
  `ALTER TYPE ... ADD VALUE` existe no repo. A autorização real é RLS + `public.has_role()`.
- **Front:** `src/contexts/auth-permissions.ts:1` declara `UserRole = 'admin' | 'gestor' | 'colaborador' | 'rh' | 'diretor'`.
  `colaborador`, `rh` e `diretor` **não existem no banco**, então `isRH` e `isDiretor`
  (`src/contexts/AuthContext.tsx:101`, `src/hooks/useUserRoles.ts`) são sempre falsos com dado real, e
  `ROLE_PERMISSIONS['user']` não existe → `hasPermission()` retorna `false` para o papel mais comum.
  Mudar isso = mudar os três juntos (migration do enum + `auth-permissions.ts` + `useUserRoles.ts`).
- **Não há guarda de papel nas rotas.** `src/components/ProtectedRoute.tsx` só checa `isAuthenticated`;
  `ROUTE_ACCESS` só mapeia `/` e `/perfil` e `canAccess()` (`AuthContext.tsx:112`) retorna **`true`** para
  qualquer rota fora do mapa. Ou seja: `/admin/*` é alcançável por qualquer usuário logado e só o RLS
  impede a leitura/escrita. Antes de "esconder o menu", lembre que a proteção de verdade é no banco.

## Ponto eletrônico

- A validação de geolocalização é **no banco**: `supabase.rpc('fn_validar_ponto_no_raio', …)`
  (`src/pages/Ponto.tsx:228`), que devolve `local_nome` e `distancia_metros`. Os locais vêm de
  `locais_permitidos` (migration `007_create_locais_justificativas.sql`), administrados em
  `/admin/locais` (`src/pages/AdminLocais.tsx`). Não reimplemente o raio no front.

## Notificações

- 13 dos 20 arquivos de `src/hooks/` são de notificação (dados, filtros, realtime, threads, preferências,
  export, atalhos, deep link, alerta) — mais `useFaviconBadge.ts`. Mexer em um costuma exigir o vizinho.
- **Digest depende de agendador externo.** `supabase/functions/notificacoes-digest/index.ts` diz "chamado
  periodicamente por pg_cron (a cada 15 minutos)", com janelas: `horario` sempre, `diario` só quando
  UTC hour == 11 (~08:00 BRT), `semanal` só segunda nessa hora; `{ "freq": "diario" }` no body força.
  Mas `supabase/migrations/013_create_cron_jobs.sql` deixa `CREATE EXTENSION pg_cron` **comentado** e
  `011_notificacoes_triggers_adicionais.sql` registra em comentário que os lembretes precisam de "cron
  externo". Não afirme que digest/lembretes rodam sem conferir o agendador no projeto.
- **A função está quebrada na `main`:** `index.ts:2` importa `corsHeaders` de
  `"npm:@supabase/supabase-js@2/cors"`, subpath que não existe. O fix (`6b8c92b`, que trocava para
  `../_shared/cors.ts`) foi desfeito pelo commit `a1e20e1`. Qualquer tarefa de notificação por e-mail/push
  começa por aí.
- Push usa VAPID (`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT`) e o service worker
  `public/sw-push.js`, que o `nginx.conf` serve sem cache. Trocar a chave VAPID invalida as inscrições
  existentes.

## 2FA / WebAuthn

- Edge functions `totp-2fa` e `webauthn`; front em `src/lib/webauthn.ts` e `src/components/security/`.
  Tabelas `webauthn_credentials` e `webauthn_challenges` (migration `20260711182232`). Credencial é
  por domínio (RP ID): mudar o domínio de produção invalida as chaves já registradas.

## Integrações (Bitrix24 / Resend)

- `integracoes-dispatcher` (envio) e `integracoes-test` (teste de conexão), UI em
  `src/components/integracoes/` e `/admin/integracoes`. Segredos: `BITRIX_WEBHOOK_URL`, `BITRIX_USER_ID`,
  `BITRIX_RH_GROUP_ID`, `RESEND_API_KEY` — pertencem a `supabase secrets`, não ao front
  (hoje também estão no Vercel; ver `vercel-deploy.md`).

## Edge functions — o que o `_shared/` promete e o que entrega

- `_shared/cors.ts` libera `Access-Control-Allow-Origin: *` e é importado por **uma só** função
  (`link-preview`). As outras repetem CORS inline.
- `_shared/rate-limit.ts` existe e **nenhuma função o importa** — helper morto. Se precisar de rate limit,
  use-o em vez de escrever outro (e diga na PR que passou a ser usado).

## PWA

- `vite-plugin-pwa` com `registerType: 'autoUpdate'` e `navigateFallbackDenylist: [/^\/~oauth/]`
  (`vite.config.ts`) — a rota `/~oauth` é do login social do Lovable (`src/integrations/lovable/`,
  arquivo gerado: não editar). Mexer no workbox sem manter esse denylist quebra o OAuth.
