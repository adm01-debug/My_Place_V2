# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado
- CI/CD com GitHub Actions (ci.yml, deploy.yml, preview.yml)
- Componentes de acessibilidade (accessibility.ts)
- DataTable com paginação, ordenação e busca
- LoadMore com infinite scroll
- Breadcrumbs com geração automática
- ThemeSwitcher (light/dark/system)
- useCrudBase hook para CRUD completo
- Documentação completa (CONTRIBUTING, ARCHITECTURE, SECURITY, API)

### Melhorado
- Testes expandidos (pages.test, auth.test, integration.test)
- Validações de CPF, CNPJ, CEP, PIS

## [0.9.0] - 2025-12-20

### Adicionado
- Tabela FAQ no banco de dados
- Edge function sync-ponto-offline
- Push Notifications real com Web Push
- Edge function gerar-espelho-ponto
- Edge function gerar-feedback-360-pdf
- Campos bitrix_id, cpf no schema

### Melhorado
- AuthContext com Role-Based Access Control
- ErrorBoundary com fallback customizável
- EmptyState para diferentes contextos

## [0.8.0] - 2025-12-19

### Adicionado
- useOffline hook para PWA
- usePushNotifications hook
- useBiometricAuth hook
- Componente PullToRefresh
- Service Worker completo (sw-push.js)

### Corrigido
- Sync offline apontando para endpoint correto

## [0.7.0] - 2025-12-18

### Adicionado
- Página Feedback 360°
- Página Pesquisas de Clima
- Componente FeedbackDashboard
- Charts com Recharts

### Melhorado
- Dashboard com mais estatísticas
- Filtros avançados nas páginas

## [0.6.0] - 2025-12-17

### Adicionado
- Sistema de notificações com realtime
- Painel de notificações
- Badge de notificações não lidas
- Triggers de notificação no banco

### Melhorado
- Header com notificações
- Performance de realtime

## [0.5.0] - 2025-12-16

### Adicionado
- Página Admin
- Modais de aprovação (AdminAprovacaoModal)
- Gestão de comunicados
- Gestão de treinamentos

### Melhorado
- ProtectedAdminRoute
- Separação de permissões

## [0.4.0] - 2025-12-16

### Adicionado
- Registro de ponto com geolocalização
- Histórico de ponto
- Justificativas de ponto
- Locais permitidos

### Melhorado
- usRegistrosPonto hook
- Validação de localização

## [0.3.0] - 2025-12-16

### Adicionado
- Página de Empréstimos
- Sistema de parcelas
- Simulação de empréstimo
- Exportação de PDF (holerite)

### Corrigido
- Cálculos financeiros

## [0.2.0] - 2025-12-16

### Adicionado
- Autenticação Supabase
- AuthContext
- Página de Login
- Página de Cadastro
- Onboarding

### Melhorado
- Proteção de rotas

## [0.1.0] - 2025-12-16

### Adicionado
- Setup inicial do projeto
- Vite + React + TypeScript
- TailwindCSS + shadcn/ui
- Estrutura de pastas
- Páginas básicas (Dashboard, Menu, Perfil)
- PWA básico

---

## Tipos de Mudanças

- **Adicionado** para novas funcionalidades
- **Alterado** para mudanças em funcionalidades existentes
- **Depreciado** para funcionalidades que serão removidas
- **Removido** para funcionalidades removidas
- **Corrigido** para correções de bugs
- **Segurança** para correções de vulnerabilidades
