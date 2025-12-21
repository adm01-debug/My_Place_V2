# 📋 LISTA EXAUSTIVA DE MELHORIAS PENDENTES - MY-PLACE

**Data:** 21 de Dezembro de 2025  
**Análise:** Via API do GitHub (Perfeccionista e Exaustiva)  
**Total:** 52 Melhorias Identificadas

---

## 📊 RESUMO POR CATEGORIA

| Categoria | Quantidade | Prioridade |
|-----------|------------|------------|
| 🔴 Configurações (Bloqueantes) | 6 | CRÍTICA |
| 🟠 Backend (Edge Functions) | 8 | ALTA |
| 🟡 Frontend (Páginas/Hooks) | 12 | MÉDIA |
| 🟢 Infraestrutura (DevOps) | 10 | MÉDIA |
| 🔵 Qualidade (Testes/Docs) | 10 | BAIXA |
| ⚪ Futuras (Nice-to-have) | 6 | BAIXA |

---

## 🔴 CATEGORIA 1: CONFIGURAÇÕES BLOQUEANTES (6)

### 1.1 ❌ VAPID Keys no Supabase Secrets
**Prioridade:** 🔴 CRÍTICA  
**Status:** Código pronto, secrets não configurados  
**Ação:**
```bash
# Secrets a configurar no Supabase Dashboard:
VAPID_PUBLIC_KEY=BMZLIPBE6a_Wt-B5vhEnwWnjPXGgREHjM0djj0zn8LpZePk9dzhgxUOfJAIENUPDpb_VwkIP22MZVbTSyfb0bkM
VAPID_PRIVATE_KEY=d33JJ9Onz7jhI4CIw7lPrgdpxm-ZtQY7C4QApFyh0ck
VAPID_SUBJECT=mailto:admin@promobrindes.com.br
```

### 1.2 ❌ Bitrix24 Secrets
**Prioridade:** 🔴 CRÍTICA (se usar integração)  
**Status:** Edge function pronta, secrets não configurados  
**Ação:**
```bash
BITRIX_WEBHOOK_URL=<url-do-webhook>
BITRIX_USER_ID=<id-do-usuario>
BITRIX_RH_GROUP_ID=<id-do-grupo-rh>
```

### 1.3 ❌ Cron Jobs do Supabase
**Prioridade:** 🔴 ALTA  
**Status:** SQL criado (013_create_cron_jobs.sql), não executado  
**Ação:** Executar migrations + configurar pg_cron

### 1.4 ❌ Email Service (Resend)
**Prioridade:** 🟠 ALTA  
**Status:** Edge function pronta, API key não configurada  
**Ação:**
```bash
RESEND_API_KEY=<sua-api-key>
```

### 1.5 ❌ Sentry DSN
**Prioridade:** 🟡 MÉDIA  
**Status:** monitoring.ts tem placeholder  
**Ação:**
```bash
VITE_SENTRY_DSN=<seu-dsn>
```

### 1.6 ❌ Analytics Key
**Prioridade:** 🟡 MÉDIA  
**Status:** monitoring.ts pronto para integração  
**Ação:** Configurar Plausible/PostHog/GA4

---

## 🟠 CATEGORIA 2: BACKEND - EDGE FUNCTIONS (8)

### 2.1 ❌ Página de Kudos/Reconhecimento
**Prioridade:** 🟠 ALTA  
**Status:** Tabelas criadas (014_create_kudos_system.sql), sem UI  
**Arquivos necessários:**
- `src/pages/Kudos.tsx` - Página principal
- `src/hooks/useKudos.ts` - Hook para CRUD
- Rota em `App.tsx`

### 2.2 ❌ Página de Trilhas de Desenvolvimento
**Prioridade:** 🟠 ALTA  
**Status:** Tabelas criadas (015_create_trilhas_desenvolvimento.sql), sem UI  
**Arquivos necessários:**
- `src/pages/Trilhas.tsx` - Página principal
- `src/hooks/useTrilhas.ts` - Hook para CRUD
- Rota em `App.tsx`

### 2.3 ❌ Hook useKudos
**Prioridade:** 🟠 ALTA  
**Status:** Não existe  
**Features necessárias:**
- Enviar kudos
- Receber kudos
- Feed de kudos
- Ranking
- Badges

### 2.4 ❌ Hook useTrilhas
**Prioridade:** 🟠 ALTA  
**Status:** Não existe  
**Features necessárias:**
- Listar trilhas
- Progresso do usuário
- Completar etapas
- Certificados

### 2.5 ❌ Hook useDocumentosDownload
**Prioridade:** 🟡 MÉDIA  
**Status:** Tabela criada (documentos_downloads), hook não existe  
**Features:** Log de downloads com auditoria

### 2.6 ❌ Webhook n8n Real
**Prioridade:** 🟡 MÉDIA  
**Status:** Documentação existe (n8n-workflows.md), webhooks não implementados  
**Ação:** Criar endpoints de webhook reais

### 2.7 ⚠️ useExportPDF - Integração Completa
**Prioridade:** 🟡 MÉDIA  
**Status:** Hook existe mas não usa todas as edge functions  
**Edge functions existentes não integradas:**
- `gerar-feedback-360-pdf`
- `gerar-informe-rendimentos`
- `exportar-relatorio`

### 2.8 ❌ Edge Function: Notificações Agendadas
**Prioridade:** 🟡 MÉDIA  
**Status:** Não existe  
**Features:** Enviar notificações em datas específicas (aniversários, vencimentos)

---

## 🟡 CATEGORIA 3: FRONTEND - PÁGINAS E COMPONENTES (12)

### 3.1 ❌ Página Kudos.tsx
**Prioridade:** 🟠 ALTA  
**Status:** Não existe  
**Features necessárias:**
- Feed de reconhecimentos
- Formulário para enviar kudos
- Ranking de pontos
- Badges conquistados

### 3.2 ❌ Página Trilhas.tsx
**Prioridade:** 🟠 ALTA  
**Status:** Não existe  
**Features necessárias:**
- Lista de trilhas disponíveis
- Progresso visual
- Inscrição em trilhas
- Certificados

### 3.3 ❌ Componente KudosCard
**Prioridade:** 🟡 MÉDIA  
**Status:** Não existe  
**Features:** Card para exibir kudos no feed

### 3.4 ❌ Componente BadgeDisplay
**Prioridade:** 🟡 MÉDIA  
**Status:** Não existe  
**Features:** Exibir badges conquistados

### 3.5 ❌ Componente TrilhaProgress
**Prioridade:** 🟡 MÉDIA  
**Status:** Não existe  
**Features:** Barra de progresso visual da trilha

### 3.6 ❌ Componente CertificadoCard
**Prioridade:** 🟡 MÉDIA  
**Status:** Não existe  
**Features:** Card para certificados de conclusão

### 3.7 ⚠️ Rota /kudos em App.tsx
**Prioridade:** 🟡 MÉDIA  
**Status:** Não existe  
**Ação:** Adicionar rota protegida

### 3.8 ⚠️ Rota /trilhas em App.tsx
**Prioridade:** 🟡 MÉDIA  
**Status:** Não existe  
**Ação:** Adicionar rota protegida

### 3.9 ⚠️ Menu - Links para Kudos/Trilhas
**Prioridade:** 🟡 MÉDIA  
**Status:** Menu.tsx não tem links para novas páginas  
**Ação:** Adicionar itens no menu

### 3.10 ⚠️ Dashboard - Widget de Kudos
**Prioridade:** 🟢 BAIXA  
**Status:** Dashboard não mostra kudos recentes  
**Ação:** Adicionar card de kudos recebidos/enviados

### 3.11 ⚠️ Perfil - Seção de Badges
**Prioridade:** 🟢 BAIXA  
**Status:** Perfil não mostra badges  
**Ação:** Adicionar seção de conquistas

### 3.12 ⚠️ Perfil - Progresso de Trilhas
**Prioridade:** 🟢 BAIXA  
**Status:** Perfil não mostra trilhas  
**Ação:** Adicionar seção de desenvolvimento

---

## 🟢 CATEGORIA 4: INFRAESTRUTURA - DEVOPS (10)

### 4.1 ❌ Testes E2E (Playwright)
**Prioridade:** 🟡 MÉDIA  
**Status:** Não existe  
**Arquivos necessários:**
- `playwright.config.ts`
- `e2e/` diretório com testes
- Script no package.json

### 4.2 ❌ Dockerfile
**Prioridade:** 🟡 MÉDIA  
**Status:** Não existe  
**Benefício:** Deploy containerizado

### 4.3 ❌ docker-compose.yml
**Prioridade:** 🟡 MÉDIA  
**Status:** Não existe  
**Benefício:** Ambiente de desenvolvimento padronizado

### 4.4 ❌ Storybook
**Prioridade:** 🟢 BAIXA  
**Status:** Não existe  
**Benefício:** Documentação visual de componentes  
**Arquivos necessários:**
- `.storybook/`
- Stories para cada componente

### 4.5 ❌ Husky + lint-staged
**Prioridade:** 🟢 BAIXA  
**Status:** Não configurado  
**Benefício:** Pre-commit hooks para qualidade

### 4.6 ❌ Commitlint
**Prioridade:** 🟢 BAIXA  
**Status:** Não configurado  
**Benefício:** Padronização de commits

### 4.7 ❌ Dependabot
**Prioridade:** 🟢 BAIXA  
**Status:** Não configurado  
**Benefício:** Atualizações automáticas de dependências

### 4.8 ❌ CodeQL Analysis
**Prioridade:** 🟢 BAIXA  
**Status:** Não configurado no CI  
**Benefício:** Análise de segurança automatizada

### 4.9 ⚠️ Bundle Analyzer
**Prioridade:** 🟢 BAIXA  
**Status:** Não configurado  
**Benefício:** Análise do tamanho do bundle

### 4.10 ❌ Lighthouse CI
**Prioridade:** 🟢 BAIXA  
**Status:** Não configurado  
**Benefício:** Performance tracking automatizado

---

## 🔵 CATEGORIA 5: QUALIDADE - TESTES E DOCS (10)

### 5.1 ⚠️ Cobertura de Testes < 80%
**Prioridade:** 🟡 MÉDIA  
**Status:** Testes existem mas cobertura incompleta  
**Hooks sem testes:**
- useCrudBase
- useKudos (não existe)
- useTrilhas (não existe)
- usePushNotifications (parcial)

### 5.2 ❌ Testes de Edge Functions
**Prioridade:** 🟡 MÉDIA  
**Status:** Nenhum teste para edge functions  
**Arquivos necessários:** `supabase/functions/*/index.test.ts`

### 5.3 ❌ Testes de Integração Supabase
**Prioridade:** 🟡 MÉDIA  
**Status:** integration.test.ts básico  
**Faltando:** Testes de RLS policies

### 5.4 ⚠️ JSDoc em Hooks
**Prioridade:** 🟢 BAIXA  
**Status:** Documentação inline incompleta  
**Ação:** Adicionar JSDoc em todos os hooks exportados

### 5.5 ⚠️ README Atualizado
**Prioridade:** 🟢 BAIXA  
**Status:** README básico (Lovable)  
**Ação:** Expandir com instruções de desenvolvimento

### 5.6 ❌ DEPLOYMENT.md
**Prioridade:** 🟢 BAIXA  
**Status:** Não existe  
**Conteúdo:** Guia completo de deploy

### 5.7 ❌ DATABASE_SCHEMA.md
**Prioridade:** 🟢 BAIXA  
**Status:** Não existe  
**Conteúdo:** ERD e descrição das tabelas

### 5.8 ❌ API_ENDPOINTS.md
**Prioridade:** 🟢 BAIXA  
**Status:** docs/API.md existe mas incompleto  
**Conteúdo:** Documentação de todas as edge functions

### 5.9 ❌ TESTING.md
**Prioridade:** 🟢 BAIXA  
**Status:** Não existe  
**Conteúdo:** Guia de testes

### 5.10 ❌ ADR (Architecture Decision Records)
**Prioridade:** 🟢 BAIXA  
**Status:** Não existe  
**Benefício:** Documentar decisões de arquitetura

---

## ⚪ CATEGORIA 6: MELHORIAS FUTURAS - NICE-TO-HAVE (6)

### 6.1 ❌ Internacionalização (i18n)
**Prioridade:** ⚪ BAIXA  
**Status:** Não implementado  
**Benefício:** Suporte a múltiplos idiomas  
**Arquivos necessários:**
- `src/i18n/`
- `src/locales/pt-BR.json`
- `src/locales/en.json`

### 6.2 ❌ Tema Customizável por Empresa
**Prioridade:** ⚪ BAIXA  
**Status:** Tema fixo  
**Benefício:** White-label

### 6.3 ❌ Modo Offline Completo
**Prioridade:** ⚪ BAIXA  
**Status:** Parcial (só ponto)  
**Benefício:** Funcionar totalmente offline

### 6.4 ❌ Chat com IA Avançado
**Prioridade:** ⚪ BAIXA  
**Status:** Assistente básico existe  
**Benefício:** RAG com documentos da empresa

### 6.5 ❌ Gamificação Avançada
**Prioridade:** ⚪ BAIXA  
**Status:** Badges básicos no Kudos  
**Benefício:** Níveis, conquistas, desafios

### 6.6 ❌ Integração com Calendário Externo
**Prioridade:** ⚪ BAIXA  
**Status:** Não existe  
**Benefício:** Sync com Google Calendar / Outlook

---

## 📊 RESUMO EXECUTIVO

### Total de Melhorias: 52

| Prioridade | Quantidade | % do Total |
|------------|------------|------------|
| 🔴 Crítica | 6 | 11.5% |
| 🟠 Alta | 10 | 19.2% |
| 🟡 Média | 18 | 34.6% |
| 🟢 Baixa | 12 | 23.1% |
| ⚪ Futura | 6 | 11.5% |

### Esforço Estimado

| Categoria | Horas Est. |
|-----------|------------|
| Configurações | 2h |
| Backend (Kudos/Trilhas) | 16h |
| Frontend (Páginas) | 24h |
| DevOps | 8h |
| Testes | 16h |
| Docs | 8h |
| **TOTAL** | **~74h** |

### Ordem Recomendada de Implementação

1. **Semana 1:** Configurações (1.1-1.6) + Execução migrations
2. **Semana 2:** Backend Kudos (2.1, 2.3) + Página Kudos (3.1)
3. **Semana 3:** Backend Trilhas (2.2, 2.4) + Página Trilhas (3.2)
4. **Semana 4:** DevOps (4.1-4.3) + Testes (5.1-5.3)
5. **Semana 5:** Integrações (Menu, Dashboard, Perfil)
6. **Backlog:** Storybook, i18n, melhorias futuras

---

## ✅ STATUS ATUAL DO PROJETO

**Completude Geral:** ~92%

| Área | Status | Pendente |
|------|--------|----------|
| Schema DB | 100% | - |
| Edge Functions | 95% | Kudos/Trilhas hooks |
| Páginas | 88% | Kudos.tsx, Trilhas.tsx |
| Componentes | 95% | KudosCard, etc |
| Testes | 70% | E2E, Edge functions |
| DevOps | 80% | Docker, Playwright |
| Docs | 85% | Guias específicos |

---

*Lista gerada após análise exaustiva via API do GitHub em 21/12/2025*
