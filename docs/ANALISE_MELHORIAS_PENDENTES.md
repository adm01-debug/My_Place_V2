# MY-PLACE - Análise Exaustiva de Melhorias Pendentes

**Data da Análise:** 2025-12-20  
**Versão do Projeto:** ~95% Completo (conforme MELHORIAS_IMPLEMENTACAO.md)

---

## 📊 RESUMO EXECUTIVO

Após análise detalhada de todos os arquivos do repositório, foram identificadas **18 melhorias pendentes** categorizadas por prioridade:

| Prioridade | Quantidade | Status |
|------------|------------|--------|
| 🔴 Alta | 4 | Críticas para produção |
| 🟡 Média | 8 | Importantes para completude |
| 🟢 Baixa | 6 | Opcionais/futuras |

---

## 🔴 MELHORIAS DE ALTA PRIORIDADE

### 1. **VAPID Keys para Push Notifications Real**
**Arquivo:** `src/hooks/usePushNotifications.ts` (linha 14)

**Problema:**
```typescript
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
```
- VAPID key é uma chave de exemplo/demo, não funciona para produção
- O backend (`enviar-push/index.ts`) NÃO envia push real, apenas cria notificações no banco

**Solução:**
- Gerar par de chaves VAPID próprias (web-push generate-vapid-keys)
- Adicionar `VAPID_PRIVATE_KEY` como secret
- Implementar web-push real na edge function usando biblioteca Deno

**Status:** ❌ NÃO IMPLEMENTADO

---

### 2. **Web-Push Real no Backend**
**Arquivo:** `supabase/functions/enviar-push/index.ts` (linhas 91-106)

**Problema:**
```typescript
// Em produção, aqui você usaria web-push com VAPID keys
// Por enquanto, vamos simular e criar notificações no banco
const { error: notifError } = await supabase.rpc('criar_notificacao', {
```
- O código está apenas criando notificações no banco, NÃO enviando push real
- Falta biblioteca web-push para Deno
- Comentário no código confirma: "Por enquanto, vamos simular"

**Solução:**
- Instalar/usar web-push para Deno
- Implementar envio real usando endpoint + p256dh + auth da subscription
- Tratar erros 410 (subscription expirada)

**Status:** ❌ NÃO IMPLEMENTADO

---

### 3. **Tabela FAQ no Banco de Dados**
**Arquivo:** `src/hooks/useFAQ.ts` (linhas 23-129)

**Problema:**
```typescript
// FAQs estáticas para o portal
const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    pergunta: 'Como solicitar férias?',
    // ...dados hardcoded
  },
```
- Todas as FAQs estão hardcoded no frontend
- Funções `incrementarVisualizacao` e `registrarUtilidade` são no-op
- Admin não pode gerenciar FAQs dinamicamente

**Solução:**
- Criar tabela `faq` no banco
- Implementar RLS policies
- Criar funções RPC para incrementar views/utilidade
- Migrar dados estáticos para o banco

**Status:** ❌ NÃO IMPLEMENTADO

---

### 4. **Sincronização Offline para Registro de Ponto**
**Arquivos:** `public/sw-push.js`, `src/hooks/useOffline.ts`

**Problema:**
```javascript
// sw-push.js linha 228
const response = await fetch('/api/registros-ponto', {
  method: 'POST',
  // ...
```
- O sync tenta fazer POST para `/api/registros-ponto` que NÃO EXISTE
- Deveria chamar Supabase diretamente ou uma edge function
- Hook `useOffline` salva em localStorage mas sync não funciona

**Solução:**
- Criar edge function `sync-ponto-offline`
- Atualizar SW para chamar a edge function correta
- Testar fluxo completo offline → online

**Status:** ⚠️ PARCIALMENTE IMPLEMENTADO (estrutura existe, sync não funciona)

---

## 🟡 MELHORIAS DE MÉDIA PRIORIDADE

### 5. **Campos Adicionais no Holerite (Schema do Banco)**
**Arquivo:** `supabase/functions/gerar-holerite-pdf/index.ts` (linhas 10-21)

**Problema:**
```typescript
interface HoleriteData {
  salario_base: number;  // NÃO existe no banco
  total_proventos: number;  // NÃO existe no banco
  total_descontos: number;  // NÃO existe no banco
```
- A interface espera campos que não existem na tabela `holerites`
- Schema atual: `salario_bruto`, `descontos`, `salario_liquido`
- Edge function usa campos inexistentes

**Campos faltantes no banco:**
- `salario_base`
- `total_proventos`
- `total_descontos`
- `horas_trabalhadas` (mencionado em docs)
- `horas_extras`
- `faltas`

**Status:** ⚠️ INCOMPATIBILIDADE (edge function vs schema)

---

### 6. **Campo `nome_completo` vs `nome` no Profile**
**Arquivos:** Múltiplos (edge functions e hooks)

**Problema:**
- Edge functions usam `nome_completo` (ex: `gerar-holerite-pdf/index.ts` linha 25)
- Banco e types.ts usam apenas `nome`
- Inconsistência pode causar erros

**Ocorrências:**
- `gerar-holerite-pdf/index.ts`: `profile.nome_completo`
- `gerar-informe-rendimentos/index.ts`: `profile.nome_completo`
- `bitrix24-sync/index.ts`: `profile.nome_completo`

**Status:** ⚠️ INCONSISTÊNCIA

---

### 7. **Campo `cpf` no Profile**
**Arquivo:** `supabase/functions/gerar-informe-rendimentos/index.ts` (linha 53)

**Problema:**
```typescript
.select('nome_completo, cpf, data_admissao, cargo')
```
- Tabela `profiles` NÃO tem campo `cpf` no schema
- Informe de rendimentos precisa do CPF

**Status:** ❌ CAMPO NÃO EXISTE

---

### 8. **Campo `bitrix_id` no Profile**
**Arquivo:** `supabase/functions/bitrix24-sync/index.ts` (linhas 116-119)

**Problema:**
```typescript
await supabase
  .from('profiles')
  .update({ bitrix_id: bitrixId })
```
- Campo `bitrix_id` não existe na tabela `profiles`
- Integração Bitrix24 não funciona corretamente

**Status:** ❌ CAMPO NÃO EXISTE

---

### 9. **Campo `bitrix_task_id` em Férias**
**Arquivo:** `supabase/functions/bitrix24-sync/index.ts` (linhas 166-169)

**Problema:**
```typescript
await supabase
  .from('ferias')
  .update({ bitrix_task_id: taskId.task?.id || taskId })
```
- Campo `bitrix_task_id` não existe na tabela `ferias`

**Status:** ❌ CAMPO NÃO EXISTE

---

### 10. **Secrets Faltantes para Integrações**
**Arquivo:** `supabase/functions/bitrix24-sync/index.ts` (linhas 10-11)

**Secrets necessários não configurados:**
- `BITRIX_WEBHOOK_URL`
- `BITRIX_USER_ID`
- `BITRIX_RH_GROUP_ID`

**Status:** ❌ NÃO CONFIGURADOS

---

### 11. **Exportação PDF de Relatórios Adicionais**
**Arquivo:** `src/hooks/useExportPDF.ts`

**Implementado:**
- ✅ Holerite

**Faltando:**
- ❌ Relatório de Feedback 360°
- ❌ Espelho de Ponto
- ❌ Histórico de Férias
- ❌ Certificados de Treinamento

**Status:** ⚠️ PARCIALMENTE IMPLEMENTADO

---

### 12. **Workflows n8n (Apenas Documentação)**
**Arquivo:** `docs/n8n-workflows.md`

**Problema:**
- Documentação completa existe
- Nenhum webhook real implementado no banco
- Triggers mencionados no doc não existem no schema

**Status:** ⚠️ APENAS DOCUMENTAÇÃO

---

## 🟢 MELHORIAS DE BAIXA PRIORIDADE

### 13. **Sistema de Kudos/Reconhecimento Social**
**Referência:** `docs/MELHORIAS_IMPLEMENTACAO.md` (linha 129)

**Descrição:**
- Sistema para enviar elogios entre colaboradores
- Badges e pontos de reconhecimento
- Feed de reconhecimentos

**Status:** ❌ NÃO IMPLEMENTADO

---

### 14. **Tabela `documentos_downloads` para Logs**
**Referência:** `docs/RESUMO_MELHORIAS_FINAIS.md`

**Problema:**
- Hook `useDocumentos` tem lógica de log de downloads
- Mas não existe tabela para persistir

**Status:** ❌ NÃO IMPLEMENTADO

---

### 15. **Tabela `trilha_desenvolvimento`**
**Referência:** Documentação anterior

**Descrição:**
- Trilhas de carreira/desenvolvimento
- Associação com treinamentos
- Progressão de carreira

**Status:** ❌ NÃO IMPLEMENTADO

---

### 16. **Cron Jobs Automatizados**
**Arquivos:** Edge functions de verificação

**Situação:**
- Edge functions existem (`verificar-vencimentos`, `verificar-aniversariantes`, `gerar-resumo-diario`)
- Mas não há cron jobs configurados para executá-las automaticamente
- Precisam ser chamadas manualmente ou via n8n/externo

**Status:** ⚠️ FUNÇÕES EXISTEM, CRON NÃO CONFIGURADO

---

### 17. **Constraint Unique em push_subscriptions**
**Arquivo:** Tabela `push_subscriptions`

**Problema:**
```typescript
// usePushNotifications.ts linha 159
.upsert({...}, { onConflict: 'user_id,endpoint' })
```
- O upsert assume constraint unique em `(user_id, endpoint)`
- Schema atual não mostra essa constraint

**Status:** ⚠️ POSSÍVEL INCONSISTÊNCIA

---

### 18. **Tipos TypeScript para Treinamento**
**Arquivo:** `supabase/functions/verificar-vencimentos/index.ts` (linha 83)

**Problema:**
```typescript
const treinamento = tr.treinamento as unknown as { titulo: string; obrigatorio: boolean } | null;
```
- Type casting forçado indica problema de tipagem
- Relação com tabela `treinamentos` pode não estar correta

**Status:** ⚠️ TYPE CASTING FORÇADO

---

## 📋 CHECKLIST DE AÇÕES

### Ações Imediatas (Antes de Produção)
- [ ] Gerar VAPID keys e configurar secrets
- [ ] Implementar web-push real em `enviar-push`
- [ ] Corrigir endpoint do sync offline (`/api/registros-ponto` → edge function)
- [ ] Adicionar constraint unique em `push_subscriptions`

### Ações de Schema
- [ ] Adicionar `cpf` em `profiles`
- [ ] Adicionar `bitrix_id` em `profiles` (se usar Bitrix)
- [ ] Adicionar `bitrix_task_id` em `ferias` (se usar Bitrix)
- [ ] Criar tabela `faq` com RLS
- [ ] Criar tabela `documentos_downloads`
- [ ] Avaliar campos adicionais em `holerites`

### Ações de Código
- [ ] Padronizar `nome` vs `nome_completo` em edge functions
- [ ] Implementar exports PDF adicionais
- [ ] Configurar cron jobs para edge functions

### Ações Opcionais
- [ ] Implementar sistema Kudos
- [ ] Criar trilhas de desenvolvimento
- [ ] Configurar webhooks n8n reais

---

## 📈 MÉTRICAS DE COMPLETUDE

| Área | Implementado | Pendente | % Completo |
|------|-------------|----------|------------|
| Banco de Dados | 28 tabelas | 3 tabelas | 90% |
| Edge Functions | 10 funções | 1 função | 91% |
| React Hooks | 35 hooks | 0 | 100% |
| Páginas | 23 páginas | 0 | 100% |
| Push Notifications | Estrutura | Envio real | 50% |
| Offline/PWA | Estrutura | Sync funcional | 60% |
| Integrações | Código | Secrets/configs | 40% |
| Relatórios PDF | 1 tipo | 4 tipos | 20% |

**Completude Geral Estimada: ~85%**

---

*Gerado automaticamente após análise do repositório em 2025-12-20*
