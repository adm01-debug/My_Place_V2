# 🚀 Guia de Deployment - MY-PLACE

Este guia cobre todas as opções de deployment para o MY-PLACE Portal do Colaborador.

## 📋 Pré-requisitos

- Node.js 20+ ou Bun 1.0+
- Conta no Supabase
- Docker (opcional)
- Vercel/Netlify account (opcional)

## 🔧 Variáveis de Ambiente

### Obrigatórias

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon

# Push Notifications (para produção)
VAPID_PUBLIC_KEY=sua-chave-publica
VAPID_PRIVATE_KEY=sua-chave-privada
VAPID_SUBJECT=mailto:admin@seudominio.com.br
```

### Opcionais

```env
# Monitoring
VITE_SENTRY_DSN=seu-dsn-sentry

# Integrações
BITRIX_WEBHOOK_URL=url-webhook-bitrix
BITRIX_USER_ID=id-usuario
BITRIX_RH_GROUP_ID=id-grupo-rh

# Email
RESEND_API_KEY=sua-api-key-resend
```

## 📦 Opções de Deployment

### 1. Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy produção
vercel --prod
```

**Configuração no Dashboard:**
1. Conectar repositório GitHub
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Adicionar variáveis de ambiente

### 2. Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# Deploy produção
netlify deploy --prod
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Docker

```bash
# Build da imagem
docker build -t my-place .

# Rodar container
docker run -p 3000:80 \
  -e VITE_SUPABASE_URL=url \
  -e VITE_SUPABASE_PUBLISHABLE_KEY=key \
  my-place

# Usando docker-compose
docker-compose up -d
```

### 4. GitHub Pages (Estático)

```bash
# Adicionar ao package.json
"homepage": "https://usuario.github.io/my-place"

# Build e deploy
npm run build
npm run deploy # com gh-pages
```

### 5. VPS/Servidor Próprio

```bash
# Build local
npm run build

# Copiar para servidor
scp -r dist/* user@server:/var/www/my-place/

# Nginx config
# Veja nginx.conf no repositório
```

## 🗄️ Supabase Setup

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Criar novo projeto
3. Copiar URL e chave anon

### 2. Executar Migrations

```bash
# Instalar Supabase CLI
npm i -g supabase

# Login
supabase login

# Link projeto
supabase link --project-ref seu-projeto

# Executar migrations
supabase db push
```

### 3. Deploy Edge Functions

```bash
# Deploy todas as functions
supabase functions deploy

# Deploy específica
supabase functions deploy enviar-push
```

### 4. Configurar Secrets

```bash
# Via CLI
supabase secrets set VAPID_PRIVATE_KEY=xxx
supabase secrets set RESEND_API_KEY=xxx

# Ou via Dashboard:
# Project Settings > Edge Functions > Secrets
```

### 5. Configurar Cron Jobs

```sql
-- No Supabase SQL Editor:
SELECT cron.schedule(
  'verificar-aniversariantes',
  '0 8 * * *',
  'SELECT fn_execute_cron_job(''verificar_aniversariantes'')'
);
```

## 🔐 Segurança

### Headers de Segurança

O nginx.conf já inclui:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### CORS

Configurar no Supabase Dashboard:
- Project Settings > API > CORS
- Adicionar domínio de produção

### Rate Limiting

Edge functions já implementam rate limiting via `_shared/rate-limit.ts`.

## 📊 Monitoramento

### Sentry

```javascript
// Já configurado em monitoring.ts
// Apenas adicionar VITE_SENTRY_DSN
```

### Health Check

```bash
# Endpoint disponível
curl https://seu-dominio.com/health
```

### Logs

```bash
# Vercel
vercel logs

# Supabase Functions
supabase functions logs enviar-push
```

## 🔄 CI/CD

O repositório já inclui GitHub Actions:

- `.github/workflows/ci.yml` - Build, lint, test
- `.github/workflows/deploy.yml` - Deploy automático
- `.github/workflows/preview.yml` - Preview PRs

### Secrets do GitHub

Adicionar em Settings > Secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📱 PWA

A aplicação é uma PWA completa:
- Service Worker: `public/sw-push.js`
- Manifest: `public/manifest.json`
- Icons: `public/pwa-*.png`

Verificar instalação:
1. Lighthouse > PWA
2. Chrome DevTools > Application > Manifest

## 🆘 Troubleshooting

### Build falha

```bash
# Limpar cache
rm -rf node_modules dist
npm install
npm run build
```

### Push não funciona

1. Verificar VAPID keys no Supabase
2. Verificar HTTPS (obrigatório para push)
3. Verificar service worker registrado

### Offline não funciona

1. Verificar service worker ativo
2. Verificar IndexedDB
3. Verificar cache de assets

## 📞 Suporte

- Issues: GitHub Issues
- Email: dev@promo-brindes.com.br
- Docs: `/docs/`

---

*Última atualização: Dezembro 2025*
