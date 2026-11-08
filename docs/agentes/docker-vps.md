# Docker / VPS (Traefik) — referência para agentes

Ler ao mexer em `Dockerfile`, `nginx.conf`, `docker-compose.yml` ou `.dockerignore`.

| O que | Valor |
|---|---|
| Imagem | multi-stage: `node:20-alpine` (deps + build) → `nginx:alpine` (produção), `EXPOSE 80`, healthcheck em `/health` |
| Comandos | `npm run docker:build` (tag `my-place`), `npm run docker:run` (3000→80), `npm run docker:dev` (perfil `dev`) |
| Compose | serviço `app` (porta `3000:80`), `dev` (perfil `dev`, Vite em 5173), `supabase` (perfil `local`, `supabase/edge-runtime`) |
| Rede | `my-place-network` (bridge) |
| Traefik | labels no serviço `app`: `Host(...my-place.promobrindes.com.br...)`, entrypoint `websecure`, certresolver `letsencrypt` |
| nginx | gzip, cache longo em assets, `sw-push.js` sem cache, SPA fallback, HSTS, CSP com `*.supabase.co` em `script-src`/`connect-src`, `X-Frame-Options: SAMEORIGIN` |

Fatos que mudam decisão:

- **Nenhum workflow constrói ou publica esta imagem** (`.github/workflows/` não tem build Docker): subir
  essa imagem é passo manual na VPS. Logo, mudar `Dockerfile`/`nginx.conf` **não** chega em produção por
  merge — diga isso em vez de "deploy feito".
- O estágio `deps` prefere `bun.lockb`; o repo tem **`bun.lock`** (formato texto, nome diferente), então o
  `if [ -f bun.lockb ]` falha e o build cai no `npm ci`. Não "conserte" trocando para bun sem decidir o
  gerenciador único (ver `mapa-repo.md`).
- O `Dockerfile` declara `ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}` sem `ARG` correspondente: na prática
  as duas variáveis chegam **vazias** no `npm run build` e o bundle sai sem Supabase configurado. O
  `docker-compose.yml` passa `args:`, mas sem `ARG` no Dockerfile eles também não são usados. Qualquer
  trabalho sério de container passa por corrigir isso (mudança de infra → chame o dono).
- CSP permite `'unsafe-inline'` e `'unsafe-eval'` em `script-src`. Mexer nisso é mudança de segurança com
  risco de quebrar o PWA/Lovable tagger — só com o dono.
