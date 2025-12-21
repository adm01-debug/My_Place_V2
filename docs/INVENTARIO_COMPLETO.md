# 📦 INVENTÁRIO COMPLETO DO REPOSITÓRIO MY-PLACE

**Portal do Colaborador - Análise Exaustiva**

**Data da Análise:** 21 de Dezembro de 2025  
**Repositório:** https://github.com/adm01-debug/my-place  
**Colaboração:** Claude AI + Lovable.dev

---

## 📊 ESTATÍSTICAS GERAIS

| Métrica | Quantidade |
|---------|------------|
| **Arquivos na Raiz** | 16 |
| **Componentes Portal** | 26 |
| **Componentes UI (shadcn)** | 49 |
| **Componentes Admin** | 3 |
| **Hooks Customizados** | 38 |
| **Páginas** | 26 |
| **Utilitários (lib)** | 3 |
| **Testes** | 6 |
| **Edge Functions** | 18 |
| **Migrations SQL** | 33 |
| **Documentação** | 7 |
| **Workflows CI/CD** | 3 |

---

## 🗂️ ESTRUTURA COMPLETA DO REPOSITÓRIO

```
my-place/
├── 📄 .env (350 bytes)
├── 📄 .gitignore (253 bytes)
├── 📄 CHANGELOG.md (3247 bytes) ⬅️ CLAUDE
├── 📄 CONTRIBUTING.md (6145 bytes) ⬅️ CLAUDE
├── 📄 README.md (2102 bytes)
├── 📄 SECURITY.md (3282 bytes) ⬅️ CLAUDE
├── 📄 bun.lockb (198722 bytes)
├── 📄 components.json (414 bytes)
├── 📄 eslint.config.js (765 bytes)
├── 📄 index.html (2513 bytes)
├── 📄 package-lock.json (407246 bytes)
├── 📄 package.json (3194 bytes)
├── 📄 postcss.config.js (81 bytes)
├── 📄 tailwind.config.ts (6836 bytes)
├── 📄 tsconfig.app.json (652 bytes)
├── 📄 tsconfig.json (369 bytes)
├── 📄 tsconfig.node.json (481 bytes)
├── 📄 vite.config.ts (2425 bytes)
├── 📄 vitest.config.ts (658 bytes)
│
├── 📁 .github/
│   └── 📁 workflows/
│       ├── 📄 ci.yml (1215 bytes) ⬅️ CLAUDE
│       ├── 📄 deploy.yml (986 bytes) ⬅️ CLAUDE
│       └── 📄 preview.yml (966 bytes) ⬅️ CLAUDE
│
├── 📁 docs/
│   ├── 📄 ANALISE_MELHORIAS_PENDENTES.md (10069 bytes) ⬅️ CLAUDE
│   ├── 📄 API.md (7157 bytes) ⬅️ CLAUDE
│   ├── 📄 ARCHITECTURE.md (11133 bytes) ⬅️ CLAUDE
│   ├── 📄 MELHORIAS_IMPLEMENTACAO.md (5798 bytes) ⬅️ CLAUDE
│   ├── 📄 RELATORIO_48_MELHORIAS_FINAL.md (7779 bytes) ⬅️ CLAUDE
│   ├── 📄 RESUMO_MELHORIAS_FINAIS.md (5904 bytes) ⬅️ CLAUDE
│   └── 📄 n8n-workflows.md (7442 bytes) ⬅️ CLAUDE
│
├── 📁 public/
│   ├── 📄 apple-touch-icon.png (14769 bytes)
│   ├── 📄 favicon.ico (20373 bytes)
│   ├── 📄 manifest.json (3157 bytes) ⬅️ CLAUDE (atualizado)
│   ├── 📄 mask-icon.svg (280 bytes)
│   ├── 📄 offline.html (3560 bytes) ⬅️ LOVABLE
│   ├── 📄 placeholder.svg (3253 bytes)
│   ├── 📄 pwa-192x192.png (11953 bytes)
│   ├── 📄 pwa-512x512.png (19204 bytes)
│   ├── 📄 robots.txt (160 bytes)
│   └── 📄 sw-push.js (11936 bytes) ⬅️ LOVABLE
│
├── 📁 src/
│   ├── 📄 App.css
│   ├── 📄 App.tsx ⬅️ LOVABLE
│   ├── 📄 index.css
│   ├── 📄 main.tsx
│   └── 📄 vite-env.d.ts
│
├── 📁 src/components/
│   ├── 📄 AnimatedPage.tsx ⬅️ LOVABLE
│   ├── 📄 ErrorBoundary.tsx ⬅️ LOVABLE
│   ├── 📄 NavLink.tsx ⬅️ LOVABLE
│   ├── 📄 ProtectedAdminRoute.tsx ⬅️ LOVABLE
│   ├── 📄 ProtectedRoute.tsx ⬅️ LOVABLE
│   ├── 📄 PullToRefresh.tsx ⬅️ LOVABLE
│   └── 📄 ThemeProvider.tsx ⬅️ LOVABLE
│
├── 📁 src/components/admin/
│   ├── 📄 AdminAprovacaoModal.tsx (8982 bytes) ⬅️ LOVABLE
│   ├── 📄 AdminComunicadoModal.tsx (5392 bytes) ⬅️ LOVABLE
│   └── 📄 AdminTreinamentoModal.tsx (6148 bytes) ⬅️ LOVABLE
│
├── 📁 src/components/portal/ (26 arquivos)
│   ├── 📄 AlertCard.tsx (2374 bytes) ⬅️ LOVABLE
│   ├── 📄 AniversariantesCard.tsx (8582 bytes) ⬅️ LOVABLE
│   ├── 📄 AssistenteVirtual.tsx (7900 bytes) ⬅️ LOVABLE
│   ├── 📄 AvatarUpload.tsx (6415 bytes) ⬅️ LOVABLE
│   ├── 📄 BottomNav.tsx (2282 bytes) ⬅️ LOVABLE
│   ├── 📄 Breadcrumbs.tsx (8541 bytes) ⬅️ CLAUDE
│   ├── 📄 DashboardCharts.tsx (5062 bytes) ⬅️ LOVABLE
│   ├── 📄 DataTable.tsx (14947 bytes) ⬅️ CLAUDE
│   ├── 📄 EmptyState.tsx (10948 bytes) ⬅️ LOVABLE
│   ├── 📄 FeedbackDashboard.tsx (13667 bytes) ⬅️ LOVABLE
│   ├── 📄 FilterBar.tsx (7973 bytes) ⬅️ LOVABLE
│   ├── 📄 GlobalSearch.tsx (10292 bytes) ⬅️ LOVABLE
│   ├── 📄 Header.tsx (8220 bytes) ⬅️ LOVABLE
│   ├── 📄 HistoricoPonto.tsx (13469 bytes) ⬅️ LOVABLE
│   ├── 📄 JustificativaPontoModal.tsx (7730 bytes) ⬅️ LOVABLE
│   ├── 📄 LoadMore.tsx (10785 bytes) ⬅️ CLAUDE
│   ├── 📄 NotificationsPanel.tsx (6368 bytes) ⬅️ LOVABLE
│   ├── 📄 OfflineIndicator.tsx (6561 bytes) ⬅️ LOVABLE
│   ├── 📄 PageLayout.tsx (2118 bytes) ⬅️ LOVABLE
│   ├── 📄 PushNotificationSettings.tsx (5598 bytes) ⬅️ LOVABLE
│   ├── 📄 RegistroPonto.tsx (13732 bytes) ⬅️ LOVABLE
│   ├── 📄 Skeleton.tsx (4080 bytes) ⬅️ CLAUDE
│   ├── 📄 Skeletons.tsx (4022 bytes) ⬅️ LOVABLE
│   ├── 📄 StatCard.tsx (2988 bytes) ⬅️ LOVABLE
│   ├── 📄 ThemeSwitcher.tsx (6219 bytes) ⬅️ CLAUDE
│   └── 📄 index.ts (1262 bytes) ⬅️ CLAUDE
│
├── 📁 src/components/ui/ (49 componentes shadcn/ui)
│   ├── 📄 accordion.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 alert-dialog.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 alert.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 aspect-ratio.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 avatar.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 badge.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 breadcrumb.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 button.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 calendar.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 card.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 carousel.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 chart.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 checkbox.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 collapsible.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 command.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 context-menu.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 dialog.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 drawer.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 dropdown-menu.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 form.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 hover-card.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 input-otp.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 input.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 label.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 menubar.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 navigation-menu.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 pagination.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 popover.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 progress.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 radio-group.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 resizable.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 scroll-area.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 select.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 separator.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 sheet.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 sidebar.tsx (22837 bytes) ⬅️ LOVABLE/SHADCN
│   ├── 📄 skeleton.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 slider.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 sonner.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 switch.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 table.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 tabs.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 textarea.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 toast.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 toaster.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 toggle-group.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 toggle.tsx ⬅️ LOVABLE/SHADCN
│   ├── 📄 tooltip.tsx ⬅️ LOVABLE/SHADCN
│   └── 📄 use-toast.ts ⬅️ LOVABLE/SHADCN
│
├── 📁 src/contexts/
│   ├── 📄 AuthContext.tsx (20438 bytes) ⬅️ LOVABLE + CLAUDE (RBAC)
│   └── 📄 NotificationContext.tsx (1000 bytes) ⬅️ LOVABLE
│
├── 📁 src/hooks/ (38 hooks)
│   ├── 📄 index.ts (2333 bytes) ⬅️ LOVABLE
│   ├── 📄 use-mobile.tsx (576 bytes) ⬅️ LOVABLE
│   ├── 📄 use-toast.ts (3935 bytes) ⬅️ LOVABLE
│   ├── 📄 useAdminData.ts (11308 bytes) ⬅️ LOVABLE
│   ├── 📄 useAniversariantes.ts (4067 bytes) ⬅️ LOVABLE
│   ├── 📄 useAssistenteRH.ts (4412 bytes) ⬅️ LOVABLE
│   ├── 📄 useBeneficios.ts (5851 bytes) ⬅️ LOVABLE
│   ├── 📄 useBiometricAuth.ts (6002 bytes) ⬅️ LOVABLE
│   ├── 📄 useCalendarioCorporativo.ts (5447 bytes) ⬅️ LOVABLE
│   ├── 📄 useComunicados.ts (5709 bytes) ⬅️ LOVABLE
│   ├── 📄 useCrudBase.ts (9992 bytes) ⬅️ CLAUDE
│   ├── 📄 useDashboard.ts (9659 bytes) ⬅️ LOVABLE
│   ├── 📄 useDashboardGestor.ts (2073 bytes) ⬅️ LOVABLE
│   ├── 📄 useDocumentos.ts (4686 bytes) ⬅️ LOVABLE
│   ├── 📄 useEmprestimos.ts (8675 bytes) ⬅️ LOVABLE
│   ├── 📄 useExportPDF.ts (8856 bytes) ⬅️ LOVABLE
│   ├── 📄 useFAQ.ts (3372 bytes) ⬅️ LOVABLE
│   ├── 📄 useFeedback360.ts (9266 bytes) ⬅️ LOVABLE
│   ├── 📄 useFerias.ts (6315 bytes) ⬅️ LOVABLE
│   ├── 📄 useFilters.ts (5245 bytes) ⬅️ LOVABLE
│   ├── 📄 useHolerites.ts (5369 bytes) ⬅️ LOVABLE
│   ├── 📄 useJustificativasPonto.ts (4348 bytes) ⬅️ LOVABLE
│   ├── 📄 useLoadingState.ts (322 bytes) ⬅️ LOVABLE
│   ├── 📄 useLocaisPermitidos.ts (5198 bytes) ⬅️ LOVABLE
│   ├── 📄 useMetas.ts (7244 bytes) ⬅️ LOVABLE
│   ├── 📄 useNotificacoes.ts (5924 bytes) ⬅️ LOVABLE
│   ├── 📄 useNotifications.ts (4659 bytes) ⬅️ LOVABLE
│   ├── 📄 useOffline.ts (7460 bytes) ⬅️ LOVABLE
│   ├── 📄 useOrganograma.ts (3204 bytes) ⬅️ LOVABLE
│   ├── 📄 usePWAInstall.ts (1789 bytes) ⬅️ LOVABLE
│   ├── 📄 usePesquisasClima.ts (7348 bytes) ⬅️ LOVABLE
│   ├── 📄 usePushNotifications.ts (9864 bytes) ⬅️ LOVABLE
│   ├── 📄 useRegistrosPonto.ts (7576 bytes) ⬅️ LOVABLE
│   ├── 📄 useRemuneracaoVariavel.ts (5661 bytes) ⬅️ LOVABLE
│   ├── 📄 useSolicitacoes.ts (2120 bytes) ⬅️ LOVABLE
│   ├── 📄 useTreinamentos.ts (5848 bytes) ⬅️ LOVABLE
│   ├── 📄 useUserRoles.ts (1595 bytes) ⬅️ LOVABLE
│   └── 📄 useValidation.ts (17236 bytes) ⬅️ LOVABLE + CLAUDE
│
├── 📁 src/integrations/supabase/
│   ├── 📄 client.ts (590 bytes) ⬅️ LOVABLE
│   └── 📄 types.ts (46729 bytes) ⬅️ LOVABLE (auto-generated)
│
├── 📁 src/lib/
│   ├── 📄 accessibility.ts (10600 bytes) ⬅️ CLAUDE
│   ├── 📄 monitoring.ts (8778 bytes) ⬅️ CLAUDE
│   └── 📄 utils.ts (169 bytes) ⬅️ LOVABLE
│
├── 📁 src/pages/ (26 páginas)
│   ├── 📄 Admin.tsx (18572 bytes) ⬅️ LOVABLE
│   ├── 📄 Beneficios.tsx (7236 bytes) ⬅️ LOVABLE
│   ├── 📄 Calculadora.tsx (21558 bytes) ⬅️ LOVABLE
│   ├── 📄 Calendario.tsx (15449 bytes) ⬅️ LOVABLE
│   ├── 📄 Comunicados.tsx (9272 bytes) ⬅️ LOVABLE
│   ├── 📄 Dashboard.tsx (12110 bytes) ⬅️ LOVABLE
│   ├── 📄 DashboardGestor.tsx (10680 bytes) ⬅️ LOVABLE
│   ├── 📄 Documentos.tsx (5979 bytes) ⬅️ LOVABLE
│   ├── 📄 Emprestimos.tsx (16895 bytes) ⬅️ LOVABLE
│   ├── 📄 FAQ.tsx (14775 bytes) ⬅️ LOVABLE
│   ├── 📄 Feedback360.tsx (21824 bytes) ⬅️ LOVABLE
│   ├── 📄 Ferias.tsx (12628 bytes) ⬅️ LOVABLE
│   ├── 📄 Holerites.tsx (10299 bytes) ⬅️ LOVABLE
│   ├── 📄 Index.tsx (469 bytes) ⬅️ LOVABLE
│   ├── 📄 Login.tsx (16917 bytes) ⬅️ LOVABLE
│   ├── 📄 Menu.tsx (10611 bytes) ⬅️ LOVABLE
│   ├── 📄 Metas.tsx (24828 bytes) ⬅️ LOVABLE
│   ├── 📄 NotFound.tsx (727 bytes) ⬅️ LOVABLE
│   ├── 📄 Onboarding.tsx (7661 bytes) ⬅️ LOVABLE
│   ├── 📄 Organograma.tsx (15849 bytes) ⬅️ LOVABLE
│   ├── 📄 Perfil.tsx (14213 bytes) ⬅️ LOVABLE
│   ├── 📄 PesquisasClima.tsx (20215 bytes) ⬅️ LOVABLE
│   ├── 📄 Ponto.tsx (20653 bytes) ⬅️ LOVABLE
│   ├── 📄 RemuneracaoVariavel.tsx (8403 bytes) ⬅️ LOVABLE
│   ├── 📄 Solicitacoes.tsx (11408 bytes) ⬅️ LOVABLE
│   └── 📄 Treinamentos.tsx (10834 bytes) ⬅️ LOVABLE
│
├── 📁 src/test/ (6 testes)
│   ├── 📄 auth.test.ts (2420 bytes) ⬅️ CLAUDE
│   ├── 📄 components.test.tsx (6372 bytes) ⬅️ LOVABLE
│   ├── 📄 hooks.test.ts (7072 bytes) ⬅️ LOVABLE
│   ├── 📄 integration.test.ts (2750 bytes) ⬅️ CLAUDE
│   ├── 📄 pages.test.tsx (1826 bytes) ⬅️ CLAUDE
│   └── 📄 setup.ts (2776 bytes) ⬅️ LOVABLE
│
├── 📁 src/types/
│   └── 📄 portal.ts (7244 bytes) ⬅️ LOVABLE
│
└── 📁 supabase/
    ├── 📄 config.toml ⬅️ LOVABLE
    │
    ├── 📁 functions/ (18 Edge Functions)
    │   ├── 📁 _shared/
    │   │   └── 📄 rate-limit.ts (8561 bytes) ⬅️ CLAUDE
    │   ├── 📁 assistente-rh/
    │   │   └── 📄 index.ts (5868 bytes) ⬅️ LOVABLE
    │   ├── 📁 bitrix24-sync/
    │   │   └── 📄 index.ts (8121 bytes) ⬅️ LOVABLE
    │   ├── 📁 calcular-ferias/
    │   │   └── 📄 index.ts (2734 bytes) ⬅️ CLAUDE
    │   ├── 📁 dashboard-gestor/
    │   │   └── 📄 index.ts (8891 bytes) ⬅️ LOVABLE
    │   ├── 📁 enviar-email/
    │   │   └── 📄 index.ts (3483 bytes) ⬅️ CLAUDE
    │   ├── 📁 enviar-push/
    │   │   └── 📄 index.ts (14263 bytes) ⬅️ LOVABLE
    │   ├── 📁 exportar-relatorio/
    │   │   └── 📄 index.ts (4684 bytes) ⬅️ CLAUDE
    │   ├── 📁 gerar-espelho-ponto/
    │   │   └── 📄 index.ts (10995 bytes) ⬅️ LOVABLE
    │   ├── 📁 gerar-feedback-360-pdf/
    │   │   └── 📄 index.ts (13702 bytes) ⬅️ LOVABLE
    │   ├── 📁 gerar-holerite-pdf/
    │   │   └── 📄 index.ts (9563 bytes) ⬅️ LOVABLE
    │   ├── 📁 gerar-informe-rendimentos/
    │   │   └── 📄 index.ts (9522 bytes) ⬅️ LOVABLE
    │   ├── 📁 gerar-resumo-diario/
    │   │   └── 📄 index.ts (5467 bytes) ⬅️ LOVABLE
    │   ├── 📁 sync-ponto-offline/
    │   │   └── 📄 index.ts (5237 bytes) ⬅️ LOVABLE
    │   ├── 📁 validar-cpf-cnpj/
    │   │   └── 📄 index.ts (4252 bytes) ⬅️ CLAUDE
    │   ├── 📁 verificar-aniversariantes/
    │   │   └── 📄 index.ts (3825 bytes) ⬅️ LOVABLE
    │   ├── 📁 verificar-vencimentos/
    │   │   └── 📄 index.ts (9836 bytes) ⬅️ LOVABLE
    │   └── 📁 webhook-integracoes/
    │       └── 📄 index.ts (4063 bytes) ⬅️ LOVABLE
    │
    └── 📁 migrations/ (33 arquivos SQL)
        ├── 📄 000_create_update_function.sql
        ├── 📄 001_create_beneficios.sql
        ├── 📄 002_create_treinamentos.sql
        ├── 📄 003_create_documentos.sql
        ├── 📄 004_create_comunicados.sql
        ├── 📄 005_create_remuneracao_variavel.sql
        ├── 📄 006_create_notificacoes.sql
        ├── 📄 007_create_locais_justificativas.sql
        ├── 📄 008_configure_storage.sql
        ├── 📄 009_create_parcelas_emprestimo.sql
        ├── 📄 010_add_missing_columns.sql
        ├── 📄 011_notificacoes_triggers_adicionais.sql
        ├── 📄 012_create_faq.sql
        └── ... (21 migrations adicionais do Lovable)
```

---

## 🎯 FUNCIONALIDADES POR MÓDULO

### 📱 PÁGINAS (26)

| Página | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/` | Painel principal com estatísticas |
| Login | `/login` | Autenticação |
| Onboarding | `/onboarding` | Primeiro acesso |
| Perfil | `/perfil` | Dados do colaborador |
| Ponto | `/ponto` | Registro de ponto |
| Férias | `/ferias` | Solicitação de férias |
| Holerites | `/holerites` | Contracheques |
| Benefícios | `/beneficios` | VT, VR, Plano de Saúde |
| Treinamentos | `/treinamentos` | Cursos e certificados |
| Documentos | `/documentos` | Documentos pessoais |
| Comunicados | `/comunicados` | Avisos da empresa |
| Solicitações | `/solicitacoes` | Tickets de RH |
| Empréstimos | `/emprestimos` | Empréstimo consignado |
| Metas | `/metas` | OKRs e metas |
| Feedback 360° | `/feedback` | Avaliação de desempenho |
| Pesquisas Clima | `/clima` | Pesquisas organizacionais |
| Organograma | `/organograma` | Estrutura da empresa |
| Calendário | `/calendario` | Eventos corporativos |
| FAQ | `/faq` | Perguntas frequentes |
| Calculadora | `/calculadora` | Cálculos trabalhistas |
| Remuneração Variável | `/variavel` | Comissões e bônus |
| Menu | `/menu` | Menu principal mobile |
| Admin | `/admin` | Painel administrativo |
| Dashboard Gestor | `/gestao` | Visão do gestor |
| NotFound | `*` | Página 404 |

### 🪝 HOOKS (38)

| Categoria | Hooks |
|-----------|-------|
| **Dados Principais** | useBeneficios, useTreinamentos, useDocumentos, useComunicados, useRemuneracaoVariavel, useNotificacoes, useDashboard |
| **Funcionalidades** | useFerias, useHolerites, useRegistrosPonto, useEmprestimos, useLocaisPermitidos, useJustificativasPonto |
| **Administrativos** | useAdminData, useDashboardGestor, useUserRoles |
| **Módulos Extras** | useFAQ, useFeedback360, useMetas, useOrganograma, usePesquisasClima, useCalendarioCorporativo, useAniversariantes, useSolicitacoes |
| **UI/Utilidades** | useLoadingState, useFilters, useExportPDF |
| **PWA/Offline** | useOffline, usePWAInstall, usePushNotifications, useBiometricAuth |
| **Especiais** | useAssistenteRH, useCrudBase, useValidation |

### ⚡ EDGE FUNCTIONS (18)

| Função | Descrição | Autor |
|--------|-----------|-------|
| `_shared/rate-limit` | Rate limiting para APIs | CLAUDE |
| `assistente-rh` | IA para RH | LOVABLE |
| `bitrix24-sync` | Sync com Bitrix24 CRM | LOVABLE |
| `calcular-ferias` | Cálculo de férias | CLAUDE |
| `dashboard-gestor` | Dados do dashboard gestor | LOVABLE |
| `enviar-email` | Envio de emails (Resend) | CLAUDE |
| `enviar-push` | Push notifications | LOVABLE |
| `exportar-relatorio` | Exportação CSV/XLSX | CLAUDE |
| `gerar-espelho-ponto` | PDF espelho de ponto | LOVABLE |
| `gerar-feedback-360-pdf` | PDF feedback 360 | LOVABLE |
| `gerar-holerite-pdf` | PDF holerite | LOVABLE |
| `gerar-informe-rendimentos` | PDF informe anual | LOVABLE |
| `gerar-resumo-diario` | Resumo diário | LOVABLE |
| `sync-ponto-offline` | Sync ponto offline | LOVABLE |
| `validar-cpf-cnpj` | Validação documentos | CLAUDE |
| `verificar-aniversariantes` | Cron aniversários | LOVABLE |
| `verificar-vencimentos` | Cron vencimentos | LOVABLE |
| `webhook-integracoes` | Webhooks externos | LOVABLE |

---

## 📊 CONTRIBUIÇÃO POR FONTE

| Fonte | Arquivos | % |
|-------|----------|---|
| **LOVABLE** | ~180 | 75% |
| **CLAUDE** | ~35 | 15% |
| **SHADCN/UI** | 49 | 10% |

### Detalhamento CLAUDE:
- 3 Workflows CI/CD
- 7 Documentações
- 6 Componentes Portal
- 1 Hook (useCrudBase)
- 2 Libs (accessibility, monitoring)
- 3 Testes
- 5 Edge Functions
- 1 Manifest PWA (atualizado)
- Contribuições em AuthContext e useValidation

---

## 🔐 SISTEMA DE PERMISSÕES (RBAC)

```typescript
type UserRole = 'colaborador' | 'gestor' | 'rh' | 'admin' | 'diretor';

// Recursos protegidos
type ResourceType = 
  | 'dashboard' | 'ponto' | 'ferias' | 'holerites'
  | 'beneficios' | 'treinamentos' | 'documentos'
  | 'comunicados' | 'emprestimos' | 'metas'
  | 'feedback' | 'pesquisas' | 'organograma'
  | 'calendario' | 'solicitacoes' | 'admin'
  | 'gestao' | 'relatorios' | 'usuarios' | 'configuracoes';

// Ações
type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';
```

---

## 🗃️ BANCO DE DADOS (33 Migrations)

### Tabelas Principais:
- `profiles` - Dados do colaborador
- `ferias` - Solicitações de férias
- `registros_ponto` - Batidas de ponto
- `holerites` - Contracheques
- `emprestimos` / `parcelas_emprestimo` - Empréstimos
- `beneficios` - Benefícios
- `treinamentos` / `treinamentos_colaborador` - Treinamentos
- `documentos` - Documentos
- `comunicados` - Comunicados
- `notificacoes` - Notificações
- `metas` - Metas e OKRs
- `feedback_360` - Avaliações
- `pesquisas_clima` - Pesquisas
- `faq` - Perguntas frequentes
- `push_subscriptions` - Push notifications
- `locais_permitidos` - Locais de ponto
- `justificativas_ponto` - Justificativas

---

*Inventário gerado automaticamente via API do GitHub em 21/12/2025*
