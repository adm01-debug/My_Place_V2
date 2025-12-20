# Workflows n8n - Portal do Colaborador

Este diretório contém templates de workflows n8n para automações do portal my-place.

## Pré-requisitos

1. n8n instalado e rodando
2. Credenciais configuradas:
   - Supabase (URL + Service Role Key)
   - SMTP para emails
   - WhatsApp Business API (opcional)
   - Firebase Cloud Messaging (para push)

## Workflows Disponíveis

### 1. Férias Aprovadas → Email + WhatsApp

**Trigger:** Webhook do Supabase (UPDATE em ferias.status = 'aprovado')

```json
{
  "nodes": [
    {
      "name": "Webhook Férias",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "ferias-status",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Filtrar Aprovados",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.record.status }}",
              "value2": "aprovado"
            }
          ]
        }
      }
    },
    {
      "name": "Buscar Colaborador",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "get",
        "tableId": "profiles",
        "matchType": "id",
        "id": "={{ $json.record.user_id }}"
      }
    },
    {
      "name": "Enviar Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "toEmail": "={{ $json.email }}",
        "subject": "🏖️ Suas férias foram aprovadas!",
        "html": "<h2>Olá {{ $json.nome_completo }}!</h2><p>Suas férias foram aprovadas.</p><p><strong>Período:</strong> {{ $node['Webhook Férias'].json.record.data_inicio }} a {{ $node['Webhook Férias'].json.record.data_fim }}</p>"
      }
    }
  ]
}
```

### 2. Parcela Vencendo → Notificação (Cron Diário)

**Trigger:** Cron às 08:00

```json
{
  "nodes": [
    {
      "name": "Cron Diário",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "triggerTimes": {
          "item": [{ "hour": 8, "minute": 0 }]
        }
      }
    },
    {
      "name": "Buscar Parcelas Vencendo",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "getAll",
        "tableId": "parcelas_emprestimo",
        "filters": {
          "filters": [
            { "column": "status", "value": "pendente" },
            { "column": "data_vencimento", "operator": "lte", "value": "={{ $today.plus({days: 5}).toISODate() }}" },
            { "column": "data_vencimento", "operator": "gte", "value": "={{ $today.toISODate() }}" }
          ]
        }
      }
    },
    {
      "name": "Loop Parcelas",
      "type": "n8n-nodes-base.splitInBatches"
    },
    {
      "name": "Criar Notificação",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "tableId": "notificacoes",
        "data": {
          "user_id": "={{ $json.user_id }}",
          "tipo": "warning",
          "categoria": "emprestimo",
          "titulo": "Parcela vencendo",
          "mensagem": "A parcela {{ $json.numero }} vence em {{ $json.data_vencimento }}"
        }
      }
    }
  ]
}
```

### 3. Novo Comunicado → Push Notification

**Trigger:** Webhook do Supabase (INSERT em comunicados)

```json
{
  "nodes": [
    {
      "name": "Webhook Comunicado",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "novo-comunicado",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Buscar Subscriptions",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "getAll",
        "tableId": "push_subscriptions"
      }
    },
    {
      "name": "Loop Subscriptions",
      "type": "n8n-nodes-base.splitInBatches"
    },
    {
      "name": "Enviar Push",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "={{ $json.endpoint }}",
        "headers": {
          "Authorization": "key={{ $credentials.fcmServerKey }}",
          "Content-Type": "application/json"
        },
        "body": {
          "title": "{{ $node['Webhook Comunicado'].json.record.titulo }}",
          "body": "{{ $node['Webhook Comunicado'].json.record.resumo }}",
          "icon": "/pwa-192x192.png",
          "data": {
            "url": "/comunicados"
          }
        }
      }
    }
  ]
}
```

### 4. Espelho de Ponto Mensal → Email

**Trigger:** Cron dia 5 de cada mês às 10:00

```json
{
  "nodes": [
    {
      "name": "Cron Mensal",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "triggerTimes": {
          "item": [{ "mode": "everyMonth", "dayOfMonth": 5, "hour": 10 }]
        }
      }
    },
    {
      "name": "Buscar Colaboradores",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "getAll",
        "tableId": "profiles"
      }
    },
    {
      "name": "Loop Colaboradores",
      "type": "n8n-nodes-base.splitInBatches"
    },
    {
      "name": "Buscar Registros Mês",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "getAll",
        "tableId": "registros_ponto",
        "filters": {
          "filters": [
            { "column": "user_id", "value": "={{ $json.id }}" },
            { "column": "data_hora", "operator": "gte", "value": "={{ $today.minus({months: 1}).startOf('month').toISODate() }}" },
            { "column": "data_hora", "operator": "lt", "value": "={{ $today.startOf('month').toISODate() }}" }
          ]
        }
      }
    },
    {
      "name": "Gerar HTML Espelho",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Gerar tabela HTML com registros de ponto\nconst registros = $input.all();\n// ... lógica de geração\nreturn { html: '<table>...</table>' };"
      }
    },
    {
      "name": "Enviar Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "toEmail": "={{ $node['Loop Colaboradores'].json.email }}",
        "subject": "📋 Espelho de Ponto - {{ $today.minus({months: 1}).toFormat('MMMM/yyyy') }}",
        "html": "={{ $json.html }}"
      }
    }
  ]
}
```

## Configuração no Supabase

### Webhooks de Database

Configure webhooks no Supabase para disparar os workflows:

```sql
-- Webhook para férias aprovadas
CREATE OR REPLACE FUNCTION notify_n8n_ferias()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('aprovado', 'rejeitado') AND OLD.status != NEW.status THEN
    PERFORM net.http_post(
      url := 'https://seu-n8n.com/webhook/ferias-status',
      body := json_build_object(
        'table', 'ferias',
        'type', 'UPDATE',
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )::text,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_n8n_ferias
  AFTER UPDATE ON public.ferias
  FOR EACH ROW
  EXECUTE FUNCTION notify_n8n_ferias();
```

## Variáveis de Ambiente

Configure no n8n:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=portal@empresa.com
SMTP_PASS=xxx
FCM_SERVER_KEY=xxx
WHATSAPP_TOKEN=xxx
```

## Importando Workflows

1. Acesse n8n → Workflows → Import
2. Cole o JSON do workflow desejado
3. Configure as credenciais
4. Ative o workflow

## Monitoramento

Recomendamos configurar:
- Logs de execução
- Alertas de falha via Slack/Email
- Dashboard de métricas
