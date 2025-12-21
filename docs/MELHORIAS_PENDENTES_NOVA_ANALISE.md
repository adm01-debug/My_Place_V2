# 🔍 ANÁLISE EXAUSTIVA - MELHORIAS PENDENTES MY-PLACE

**Data da Análise:** 21 de Dezembro de 2025  
**Método:** Varredura completa via API do GitHub

---

## 📊 RESUMO EXECUTIVO

| Categoria | Pendentes | Prioridade |
|-----------|-----------|------------|
| Configurações Externas (Supabase) | 6 | 🔴 CRÍTICA |
| Integrações Dashboard/Perfil | 2 | 🟠 ALTA |
| DevOps (Storybook, CodeQL) | 2 | 🟡 MÉDIA |
| Shared Edge Functions | 2 | 🟡 MÉDIA |
| Internacionalização | 2 | 🟢 BAIXA |
| Validators/Utils | 1 | 🟢 BAIXA |
| Cobertura de Testes | ~30 | 🔵 MELHORIA CONTÍNUA |
| **TOTAL DE GAPS** | **~45** | - |

---

## 🔴 PRIORIDADE CRÍTICA (Configurações Externas)

> ⚠️ **NOTA:** Estas são configurações que precisam ser feitas NO SUPABASE, não no código.

### 1. VAPID Keys no Supabase Secrets
- **Status:** ❌ PENDENTE (configuração externa)
- **O que fazer:** 
  - Acessar Supabase Dashboard > Settings > Edge Functions > Secrets
  - Adicionar: `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`
- **Código pronto:** ✅ usePushNotifications.ts usa VAPID_PUBLIC_KEY

### 2. Bitrix24 Secrets
- **Status:** ❌ PENDENTE (configuração externa)
- **O que fazer:**
  - Adicionar: `BITRIX_WEBHOOK_URL`, `BITRIX_USER_ID`, `BITRIX_RH_GROUP_ID`
- **Código pronto:** ✅ bitrix24-sync edge function existe

### 3. Cron Jobs do Supabase (pg_cron)
- **Status:** ❌ PENDENTE (habilitar extensão)
- **O que fazer:**
  - Habilitar pg_cron no Supabase
  - Executar migration 013_create_cron_jobs.sql
- **Migration pronta:** ✅ 013_create_cron_jobs.sql existe

### 4. Email Service (Resend)
- **Status:** ❌ PENDENTE (configuração externa)
- **O que fazer:**
  - Adicionar: `RESEND_API_KEY`
- **Código pronto:** ✅ enviar-email edge function existe

### 5. Sentry DSN
- **Status:** ❌ PENDENTE (configuração externa)
- **O que fazer:**
  - Adicionar: `VITE_SENTRY_DSN` ao .env de produção
- **Código pronto:** ✅ monitoring.ts existe

### 6. Analytics Key
- **Status:** ❌ PENDENTE (decisão de ferramenta)
- **Opções:** Plausible, PostHog, Google Analytics
- **Sugestão:** Usar Plausible (privacy-first)

---

## 🟠 PRIORIDADE ALTA (Integrações Pendentes)

### 7. Dashboard.tsx - Integrar KudosWidget e TrilhasWidget
- **Status:** ❌ PENDENTE
- **Problema:** Widgets existem mas não são importados no Dashboard
- **Ação:** Adicionar import e renderização dos widgets
- **Arquivo:** `src/pages/Dashboard.tsx`
- **Esforço:** 15 min

### 8. Perfil.tsx - Seção de Badges e Trilhas
- **Status:** ❌ PENDENTE
- **Problema:** Página não mostra badges conquistados nem progresso de trilhas
- **Ação:** Adicionar seções usando BadgeDisplay e TrilhaProgress
- **Arquivo:** `src/pages/Perfil.tsx`
- **Esforço:** 1h

---

## 🟡 PRIORIDADE MÉDIA (DevOps)

### 9. Storybook
- **Status:** ❌ NÃO EXISTE
- **Problema:** Sem documentação visual de componentes
- **Ação:** Configurar Storybook com stories para componentes portal
- **Arquivos a criar:**
  - `.storybook/main.ts`
  - `.storybook/preview.ts`
  - `src/stories/*.stories.tsx`
- **Esforço:** 4h

### 10. CodeQL Analysis (Segurança)
- **Status:** ❌ NÃO EXISTE
- **Problema:** Sem análise automática de segurança
- **Ação:** Adicionar workflow de CodeQL
- **Arquivo:** `.github/workflows/codeql.yml`
- **Esforço:** 30 min

### 11. _shared/cors.ts
- **Status:** ❌ NÃO EXISTE
- **Problema:** CORS headers duplicados em cada edge function
- **Ação:** Criar módulo compartilhado
- **Arquivo:** `supabase/functions/_shared/cors.ts`
- **Esforço:** 15 min

### 12. _shared/supabase-client.ts
- **Status:** ❌ NÃO EXISTE
- **Problema:** Cliente Supabase criado em cada edge function
- **Ação:** Criar módulo compartilhado
- **Arquivo:** `supabase/functions/_shared/supabase-client.ts`
- **Esforço:** 15 min

---

## 🟢 PRIORIDADE BAIXA (Nice to Have)

### 13. Internacionalização (i18n)
- **Status:** ❌ NÃO EXISTE
- **Problema:** App apenas em português
- **Ação:** Configurar i18next ou similar
- **Arquivos a criar:**
  - `src/i18n/index.ts`
  - `src/locales/pt-BR.json`
  - `src/locales/en.json`
- **Esforço:** 8h

### 14. src/lib/validators.ts
- **Status:** ❌ NÃO EXISTE
- **Problema:** Validações dispersas no código
- **Ação:** Centralizar validações (CPF, CNPJ, email, etc)
- **Esforço:** 2h

---

## 🔵 MELHORIA CONTÍNUA (Cobertura de Testes)

### Hooks sem testes dedicados (~30):
```
useAdminData, useAniversariantes, useAssistenteRH, useBeneficios,
useBiometricAuth, useCalendarioCorporativo, useComunicados, useCrudBase,
useDashboard, useDashboardGestor, useDocumentos, useDocumentosDownload,
useEmprestimos, useExportPDF, useFeedback360, useFerias, useFilters,
useHolerites, useJustificativasPonto, useLocaisPermitidos, useMetas,
useNotificacoes, useOrganograma, usePWAInstall, usePesquisasClima,
usePushNotifications, useRegistrosPonto, useRemuneracaoVariavel,
useSolicitacoes, useTreinamentos, useUserRoles, useValidation
```

### Páginas sem testes E2E:
- Admin.tsx
- Beneficios.tsx
- Calculadora.tsx
- Calendario.tsx
- Comunicados.tsx
- Documentos.tsx
- Emprestimos.tsx
- FAQ.tsx
- Feedback360.tsx
- Holerites.tsx
- Metas.tsx
- Onboarding.tsx
- Organograma.tsx
- Perfil.tsx
- PesquisasClima.tsx
- RemuneracaoVariavel.tsx
- Solicitacoes.tsx
- Treinamentos.tsx

### Edge Functions sem testes:
- Todas as 19 edge functions não possuem testes automatizados

---

## ⚠️ ITENS JÁ IMPLEMENTADOS (Confirmados)

| Item | Status |
|------|--------|
| useKudos.ts | ✅ EXISTE |
| useTrilhas.ts | ✅ EXISTE |
| useDocumentosDownload.ts | ✅ EXISTE |
| Kudos.tsx | ✅ EXISTE |
| Trilhas.tsx | ✅ EXISTE |
| KudosCard.tsx | ✅ EXISTE |
| BadgeDisplay.tsx | ✅ EXISTE |
| TrilhaProgress.tsx | ✅ EXISTE |
| CertificadoCard.tsx | ✅ EXISTE |
| KudosWidget.tsx | ✅ EXISTE |
| TrilhasWidget.tsx | ✅ EXISTE |
| Rotas /kudos e /trilhas | ✅ EXISTEM |
| Links no Menu | ✅ EXISTEM |
| Dockerfile | ✅ EXISTE |
| docker-compose.yml | ✅ EXISTE |
| playwright.config.ts | ✅ EXISTE |
| 7 testes E2E | ✅ EXISTEM |
| 8 testes unitários | ✅ EXISTEM |
| Migrations SQL (013-015) | ✅ EXISTEM |
| notificacoes-agendadas | ✅ EXISTE |
| Documentação (17 docs) | ✅ COMPLETA |

---

## 📋 PLANO DE AÇÃO RECOMENDADO

### Semana 1: Configurações Críticas
1. ⏱️ 15min - Configurar VAPID Keys no Supabase
2. ⏱️ 15min - Configurar Bitrix24 Secrets
3. ⏱️ 30min - Habilitar pg_cron e executar migrations
4. ⏱️ 15min - Configurar Resend API Key
5. ⏱️ 15min - Configurar Sentry DSN

### Semana 2: Integrações de UI
6. ⏱️ 15min - Integrar widgets no Dashboard
7. ⏱️ 1h - Adicionar badges/trilhas no Perfil
8. ⏱️ 30min - Criar _shared/cors.ts
9. ⏱️ 30min - Criar _shared/supabase-client.ts

### Semana 3: DevOps
10. ⏱️ 30min - Adicionar CodeQL workflow
11. ⏱️ 4h - Configurar Storybook

### Backlog:
- Internacionalização (8h)
- validators.ts (2h)
- Testes adicionais (ongoing)

---

## 📊 MÉTRICAS ATUAIS

| Métrica | Valor |
|---------|-------|
| Total de Hooks | 41 |
| Total de Páginas | 28 |
| Total de Componentes Portal | 37 |
| Total de Componentes UI | 49 |
| Total de Edge Functions | 19 |
| Total de Migrations | 36 |
| Total de Testes E2E | 6 |
| Total de Testes Unit | 7 |
| Total de Docs | 17 |
| **Completude Estimada** | **~95%** |

---

*Análise realizada via API do GitHub em 21/12/2025*
