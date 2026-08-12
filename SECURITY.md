# Política de Segurança

## 🔐 Versões Suportadas

| Versão | Suportada          |
| ------ | ------------------ |
| 0.9.x  | :white_check_mark: |
| 0.8.x  | :white_check_mark: |
| < 0.8  | :x:                |

## 🚨 Reportando Vulnerabilidades

### Processo

1. **NÃO** abra uma issue pública para vulnerabilidades de segurança
2. Envie um email para: security@promo-brindes.com.br
3. Inclua:
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestão de correção (se houver)

### Tempo de Resposta

- **Confirmação de recebimento**: 24 horas
- **Avaliação inicial**: 72 horas
- **Correção para vulnerabilidades críticas**: 7 dias
- **Correção para vulnerabilidades moderadas**: 30 dias

## 🛡️ Práticas de Segurança

### Autenticação

- Supabase Auth com JWT
- Tokens expiram em 1 hora
- Refresh tokens com rotação
- MFA disponível (opcional)

### Autorização

- Row Level Security (RLS) em todas as tabelas
- RBAC (Role-Based Access Control)
- Princípio do menor privilégio

### Dados

- Criptografia em trânsito (TLS 1.3)
- Criptografia em repouso (AES-256)
- Dados sensíveis (CPF, senhas) hasheados
- Backups criptografados

### API

- Rate limiting nas Edge Functions
- CORS restritivo
- Validação de input (Zod)
- Sanitização de output

### Frontend

- CSP (Content Security Policy)
- HttpOnly cookies
- SameSite cookies
- XSS prevention (React escaping)

## ⚠️ Vulnerabilidades Conhecidas

### Nível Baixo

Atualmente não há vulnerabilidades conhecidas.

### Histórico

| Data | Severidade | Descrição | Status |
|------|------------|-----------|--------|
| - | - | - | - |

## 📋 Checklist de Segurança para PRs

- [ ] Credenciais não estão hardcoded
- [ ] Secrets estão em variáveis de ambiente
- [ ] Input do usuário é validado
- [ ] SQL injection prevenido (parameterized queries)
- [ ] XSS prevenido (escape de output)
- [ ] CSRF tokens utilizados em forms
- [ ] RLS policies atualizadas se necessário
- [ ] Logs não contêm dados sensíveis
- [ ] Dependencies atualizadas (`npm audit`)

## 🔧 Configurações Recomendadas

### Headers de Segurança (Vercel/Netlify)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(self)" }
      ]
    }
  ]
}
```

### Variáveis de Ambiente

```env
# Nunca commitar esses valores
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx  # Apenas servidor
VAPID_PRIVATE_KEY=xxx             # Apenas servidor
```

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [React Security Best Practices](https://reactjs.org/docs/security.html)

## 📞 Contato

Para questões de segurança:
- Email: security@promo-brindes.com.br
- Resposta: 24-72 horas

---

*Última atualização: Dezembro 2025*
