# Documentação da API

## 📋 Visão Geral

O MY-PLACE utiliza Supabase como backend, expondo:
- **Database API**: REST e GraphQL via PostgREST
- **Auth API**: Autenticação e gerenciamento de sessão
- **Storage API**: Upload e download de arquivos
- **Edge Functions**: Lógica customizada no servidor

## 🔑 Autenticação

### Headers

```http
Authorization: Bearer <access_token>
apikey: <supabase_anon_key>
```

### Endpoints de Auth

#### Sign Up
```http
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "senha123",
  "data": {
    "nome": "João Silva"
  }
}
```

#### Sign In
```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "xxx",
  "user": { "id": "uuid", "email": "..." }
}
```

#### Refresh Token
```http
POST /auth/v1/token?grant_type=refresh_token
Content-Type: application/json

{
  "refresh_token": "xxx"
}
```

#### Sign Out
```http
POST /auth/v1/logout
Authorization: Bearer <access_token>
```

## 📊 Database API

Base URL: `https://<project>.supabase.co/rest/v1`

### Profiles

#### Listar
```http
GET /profiles?select=*
Authorization: Bearer <token>
```

#### Buscar por ID
```http
GET /profiles?id=eq.<uuid>&select=*
```

#### Atualizar
```http
PATCH /profiles?id=eq.<uuid>
Content-Type: application/json

{
  "nome": "Novo Nome",
  "cargo": "Novo Cargo"
}
```

### Férias

#### Listar minhas férias
```http
GET /ferias?user_id=eq.<uuid>&order=created_at.desc
```

#### Criar solicitação
```http
POST /ferias
Content-Type: application/json
Prefer: return=representation

{
  "user_id": "<uuid>",
  "data_inicio": "2024-06-01",
  "data_fim": "2024-06-15",
  "tipo": "regular",
  "dias_solicitados": 15,
  "observacao": "Férias de verão"
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "data_inicio": "2024-06-01",
  "data_fim": "2024-06-15",
  "tipo": "regular",
  "status": "pendente",
  "dias_solicitados": 15,
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Holerites

#### Listar por ano
```http
GET /holerites?user_id=eq.<uuid>&ano=eq.2024&order=mes.desc
```

### Registros de Ponto

#### Registrar batida
```http
POST /registros_ponto
Content-Type: application/json

{
  "user_id": "<uuid>",
  "tipo": "entrada",
  "data_hora": "2024-01-15T08:00:00Z",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "endereco": "Av. Paulista, 1000"
}
```

#### Buscar hoje
```http
GET /registros_ponto?user_id=eq.<uuid>&data_hora=gte.2024-01-15&data_hora=lt.2024-01-16&order=data_hora.asc
```

### Notificações

#### Listar não lidas
```http
GET /notificacoes?user_id=eq.<uuid>&lida=eq.false&order=created_at.desc
```

#### Marcar como lida
```http
PATCH /notificacoes?id=eq.<uuid>
Content-Type: application/json

{
  "lida": true,
  "lida_em": "2024-01-15T10:00:00Z"
}
```

### Empréstimos

#### Simular empréstimo
```http
POST /rpc/simular_emprestimo
Content-Type: application/json

{
  "p_valor": 5000,
  "p_parcelas": 12,
  "p_taxa": 0.015
}
```

**Response:**
```json
{
  "valor_parcela": 456.23,
  "valor_total": 5474.76,
  "juros_total": 474.76
}
```

## ⚡ Edge Functions

Base URL: `https://<project>.supabase.co/functions/v1`

### Gerar Holerite PDF

```http
POST /gerar-holerite-pdf
Authorization: Bearer <token>
Content-Type: application/json

{
  "holerite_id": "<uuid>"
}
```

**Response:** `application/pdf` (binary)

### Gerar Espelho de Ponto

```http
POST /gerar-espelho-ponto
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "<uuid>",
  "mes": 1,
  "ano": 2024
}
```

### Enviar Push Notification

```http
POST /enviar-push
Authorization: Bearer <service_role_key>
Content-Type: application/json

{
  "user_ids": ["uuid1", "uuid2"],
  "notification": {
    "title": "Nova mensagem",
    "body": "Você tem uma nova notificação",
    "icon": "/pwa-192x192.png",
    "data": {
      "url": "/notificacoes"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "sent": 2,
  "failed": 0
}
```

### Sync Ponto Offline

```http
POST /sync-ponto-offline
Authorization: Bearer <token>
Content-Type: application/json

{
  "registros": [
    {
      "tipo": "entrada",
      "data_hora": "2024-01-15T08:00:00Z",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "offline_id": "local-uuid"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "synced": 1,
  "errors": []
}
```

### Bitrix24 Sync

```http
POST /bitrix24-sync
Authorization: Bearer <service_role_key>
Content-Type: application/json

{
  "action": "sync_ferias",
  "ferias_id": "<uuid>"
}
```

### Dashboard Gestor

```http
GET /dashboard-gestor
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_colaboradores": 25,
  "presentes_hoje": 22,
  "ferias_pendentes": 3,
  "aniversariantes_mes": 2,
  "resumo_horas": {
    "trabalhadas": 4200,
    "extras": 120,
    "faltas": 16
  }
}
```

## 🔄 Realtime

### Subscribing

```javascript
const channel = supabase
  .channel('notificacoes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notificacoes',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Nova notificação:', payload.new);
    }
  )
  .subscribe();
```

### Unsubscribing

```javascript
supabase.removeChannel(channel);
```

## 📁 Storage

### Upload de Avatar

```http
POST /storage/v1/object/avatars/<user_id>.jpg
Authorization: Bearer <token>
Content-Type: image/jpeg

<binary data>
```

### Download

```http
GET /storage/v1/object/public/avatars/<user_id>.jpg
```

### Signed URL (privado)

```javascript
const { data } = await supabase.storage
  .from('documentos')
  .createSignedUrl('path/file.pdf', 3600);
```

## ❌ Erros

### Formato

```json
{
  "code": "PGRST116",
  "message": "The result contains 0 rows",
  "details": null,
  "hint": null
}
```

### Códigos Comuns

| Código | Descrição |
|--------|-----------|
| `PGRST116` | Nenhum resultado encontrado |
| `23505` | Violação de unique constraint |
| `23503` | Violação de foreign key |
| `42501` | Permissão negada (RLS) |
| `22P02` | Tipo de dado inválido |
| `401` | Não autenticado |
| `403` | Não autorizado |
| `429` | Rate limit excedido |

## 📊 Rate Limits

| Recurso | Limite |
|---------|--------|
| Database API | 500 req/min |
| Auth API | 60 req/min |
| Edge Functions | 100 req/min |
| Storage Upload | 50 req/min |

## 🔧 Filtros Supabase

| Operador | Uso | Exemplo |
|----------|-----|---------|
| eq | Igual | `?status=eq.ativo` |
| neq | Diferente | `?status=neq.cancelado` |
| gt | Maior que | `?valor=gt.100` |
| gte | Maior ou igual | `?valor=gte.100` |
| lt | Menor que | `?valor=lt.1000` |
| lte | Menor ou igual | `?valor=lte.1000` |
| like | Contém | `?nome=like.*Silva*` |
| ilike | Contém (case insensitive) | `?nome=ilike.*silva*` |
| in | Lista | `?status=in.(ativo,pendente)` |
| is | Null check | `?deleted_at=is.null` |

---

*Última atualização: Dezembro 2025*
