# Arquitetura do MY-PLACE Portal do Colaborador

## 📋 Visão Geral

O MY-PLACE é um portal do colaborador construído com arquitetura moderna, focando em:
- **Performance**: Otimizações de bundle, lazy loading, caching
- **Escalabilidade**: Componentização, hooks reutilizáveis
- **Manutenibilidade**: TypeScript, testes, documentação
- **Experiência Offline**: PWA com Service Worker

## 🏗️ Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Vite                               │
│  ├── shadcn/ui (Componentes UI)                             │
│  ├── TailwindCSS (Styling)                                  │
│  ├── React Router 6 (Routing)                               │
│  ├── TanStack Query (Data fetching/caching)                 │
│  ├── React Hook Form + Zod (Forms/Validation)               │
│  └── Framer Motion (Animações)                              │
├─────────────────────────────────────────────────────────────┤
│                         PWA                                  │
│  ├── vite-plugin-pwa (Manifest/SW generation)               │
│  ├── Service Worker (Offline/Push/Background Sync)          │
│  └── IndexedDB (Cache local)                                │
├─────────────────────────────────────────────────────────────┤
│                        BACKEND                               │
│  Supabase                                                    │
│  ├── PostgreSQL (Database)                                  │
│  ├── Auth (Autenticação)                                    │
│  ├── Realtime (WebSockets)                                  │
│  ├── Storage (Arquivos)                                     │
│  └── Edge Functions (Deno)                                  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estrutura de Diretórios

```
my-place/
├── .github/
│   └── workflows/          # CI/CD pipelines
├── docs/                   # Documentação
├── public/
│   ├── sw-push.js          # Service Worker customizado
│   └── *.png               # PWA icons
├── src/
│   ├── components/
│   │   ├── portal/         # Componentes do portal
│   │   └── ui/             # shadcn/ui components
│   ├── contexts/
│   │   ├── AuthContext.tsx # Autenticação + RBAC
│   │   └── NotificationContext.tsx
│   ├── hooks/
│   │   ├── use*.ts         # Custom hooks
│   │   └── index.ts        # Barrel export
│   ├── integrations/
│   │   └── supabase/       # Cliente e tipos Supabase
│   ├── lib/
│   │   ├── utils.ts        # Utilitários gerais
│   │   ├── validators.ts   # Validações (CPF, CNPJ, etc)
│   │   └── accessibility.ts # Helpers de acessibilidade
│   ├── pages/              # Páginas/Rotas
│   ├── test/               # Testes
│   └── types/              # TypeScript types
├── supabase/
│   ├── functions/          # Edge Functions (Deno)
│   └── migrations/         # Database migrations
└── package.json
```

## 🔐 Autenticação e Autorização

### Fluxo de Autenticação

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│  Supabase   │────▶│   JWT       │
│   Form      │     │   Auth      │     │   Token     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Session    │
                    │  + Profile  │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  RBAC       │
                    │  Roles      │
                    └─────────────┘
```

### Roles e Permissões

| Role | Permissões |
|------|------------|
| `colaborador` | Próprios dados, visualizar comunicados |
| `gestor` | + Dados do time, aprovar solicitações |
| `rh` | + Todos os dados, gerenciar benefícios |
| `admin` | Acesso total |
| `diretor` | Acesso total |

### Implementação

```typescript
// AuthContext.tsx
const ROLE_PERMISSIONS = {
  colaborador: {
    view: ['own_data', 'comunicados'],
    edit: ['own_profile'],
    delete: [],
    approve: [],
  },
  gestor: {
    view: ['own_data', 'team_data', 'dashboard_gestor'],
    edit: ['own_profile', 'team_solicitacoes'],
    approve: ['team_ferias'],
  },
  // ...
};
```

## 📊 Data Flow

### TanStack Query Pattern

```typescript
// Hook
const { data, isLoading } = useQuery({
  queryKey: ['ferias', userId],
  queryFn: () => fetchFerias(userId),
  staleTime: 5 * 60 * 1000, // 5 min
});

// Mutation
const mutation = useMutation({
  mutationFn: createFerias,
  onSuccess: () => {
    queryClient.invalidateQueries(['ferias']);
  },
});
```

### Realtime Updates

```typescript
// Subscription
useEffect(() => {
  const channel = supabase
    .channel('notifications')
    .on('postgres_changes', 
      { event: 'INSERT', table: 'notificacoes' },
      (payload) => {
        queryClient.invalidateQueries(['notificacoes']);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

## 🔌 Edge Functions

### Estrutura

```
supabase/functions/
├── assistente-rh/          # AI Assistant
├── bitrix24-sync/          # CRM Integration
├── dashboard-gestor/       # Manager Dashboard
├── enviar-push/            # Push Notifications
├── gerar-espelho-ponto/    # Time Card PDF
├── gerar-feedback-360-pdf/ # Feedback Report
├── gerar-holerite-pdf/     # Payslip PDF
├── gerar-informe-rendimentos/ # Annual Statement
├── gerar-resumo-diario/    # Daily Summary
├── sync-ponto-offline/     # Offline Sync
├── verificar-aniversariantes/ # Birthday Check
├── verificar-vencimentos/  # Expiry Check
└── webhook-integracoes/    # External Webhooks
```

### Exemplo de Edge Function

```typescript
// enviar-push/index.ts
import { createClient } from 'supabase';

Deno.serve(async (req) => {
  const { user_ids, notification } = await req.json();
  
  // Buscar subscriptions
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', user_ids);
  
  // Enviar push via Web Push Protocol
  for (const sub of subscriptions) {
    await sendWebPush(sub, notification);
  }
  
  return Response.json({ success: true });
});
```

## 📱 PWA Architecture

### Service Worker

```javascript
// sw-push.js
self.addEventListener('push', async (event) => {
  const data = event.data.json();
  
  await self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/mask-icon.svg',
    data: data.data,
  });
});

self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-ponto') {
    event.waitUntil(syncRegistrosPonto());
  }
});
```

### Offline Strategy

```
┌─────────────────────────────────────────┐
│           Network Request               │
└─────────────────┬───────────────────────┘
                  │
          ┌───────▼───────┐
          │   Online?     │
          └───────┬───────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   ┌────▼────┐        ┌─────▼─────┐
   │   Yes   │        │    No     │
   └────┬────┘        └─────┬─────┘
        │                   │
   ┌────▼────┐        ┌─────▼─────┐
   │ Network │        │   Cache   │
   │ + Cache │        │ + IndexDB │
   └─────────┘        └───────────┘
```

## 🧪 Testing Strategy

### Pirâmide de Testes

```
          /\
         /  \
        / E2E \           <- Playwright (futuro)
       /────────\
      /  Integra- \       <- Vitest + MSW
     /    ção      \
    /────────────────\
   /    Unitários     \   <- Vitest + RTL
  /____________________\
```

### Cobertura

- **Hooks**: Lógica de negócio, validações
- **Components**: Renderização, eventos
- **Pages**: Fluxos principais
- **Utils**: Funções puras

## 🚀 Performance

### Otimizações

1. **Code Splitting**: Lazy loading de páginas
2. **Bundle Size**: Tree shaking, dynamic imports
3. **Caching**: TanStack Query, Service Worker
4. **Images**: WebP, lazy loading, srcset

### Métricas Alvo

| Métrica | Alvo |
|---------|------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| Bundle | < 300KB |

## 🔄 Deployment

### CI/CD Pipeline

```
Push → Lint → Test → Build → Deploy
  │      │      │       │       │
  │      │      │       │       └── Vercel/Netlify
  │      │      │       └── Vite build
  │      │      └── Vitest
  │      └── ESLint + TypeScript
  └── GitHub Actions trigger
```

### Environments

| Env | URL | Branch |
|-----|-----|--------|
| Development | localhost:5173 | feature/* |
| Preview | *.vercel.app | PR |
| Production | my-place.app | main |

## 📈 Monitoramento (Futuro)

- **Errors**: Sentry
- **Analytics**: Plausible/Posthog
- **Performance**: Lighthouse CI
- **Uptime**: UptimeRobot

---

*Última atualização: Dezembro 2025*
