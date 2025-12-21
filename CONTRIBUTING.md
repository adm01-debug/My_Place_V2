# Contribuindo para o MY-PLACE Portal do Colaborador

Obrigado pelo interesse em contribuir! Este documento contém as diretrizes para contribuição no projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Setup do Ambiente](#setup-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Commits e Pull Requests](#commits-e-pull-requests)
- [Testes](#testes)
- [Documentação](#documentação)

## 📜 Código de Conduta

Este projeto segue um código de conduta. Ao participar, você concorda em manter um ambiente respeitoso e inclusivo.

## 🚀 Como Contribuir

### Reportando Bugs

1. Verifique se o bug já não foi reportado nas [Issues](../../issues)
2. Crie uma nova issue com:
   - Título descritivo
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots se aplicável
   - Ambiente (navegador, OS, etc)

### Sugerindo Melhorias

1. Abra uma issue com a tag `enhancement`
2. Descreva a melhoria proposta
3. Explique o problema que ela resolve
4. Sugira uma implementação se possível

### Submetendo Código

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Faça commits seguindo as [convenções](#commits-e-pull-requests)
4. Envie para seu fork (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 💻 Setup do Ambiente

### Pré-requisitos

- Node.js 18+ 
- npm ou bun
- Supabase CLI (para desenvolvimento local)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/adm01-debug/my-place.git
cd my-place

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

### Supabase Local (Opcional)

```bash
# Inicie o Supabase local
supabase start

# Execute as migrations
supabase db push

# Deploy das Edge Functions
supabase functions deploy
```

## 📝 Padrões de Código

### TypeScript

- Use tipos explícitos sempre que possível
- Evite `any`, prefira `unknown` quando necessário
- Use interfaces para objetos, types para unions/primitivos

```typescript
// ✅ Bom
interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ Evitar
const user: any = {};
```

### React

- Use componentes funcionais com hooks
- Memoize callbacks e valores computados
- Separe lógica de negócio em hooks customizados

```typescript
// ✅ Bom
const MyComponent: React.FC<Props> = ({ data }) => {
  const processedData = useMemo(() => 
    data.map(item => transform(item)), 
    [data]
  );
  
  const handleClick = useCallback(() => {
    // ...
  }, []);

  return <div onClick={handleClick}>{/* ... */}</div>;
};
```

### Estrutura de Arquivos

```
src/
├── components/
│   ├── portal/         # Componentes específicos do portal
│   └── ui/             # Componentes shadcn/ui
├── contexts/           # React Contexts
├── hooks/              # Custom hooks
├── lib/                # Utilitários
├── pages/              # Páginas/rotas
├── test/               # Testes
└── types/              # Tipos TypeScript
```

### Nomenclatura

- **Componentes**: PascalCase (`UserCard.tsx`)
- **Hooks**: camelCase com prefixo use (`useUserData.ts`)
- **Utilitários**: camelCase (`formatDate.ts`)
- **Tipos**: PascalCase (`UserProfile.ts`)
- **Constantes**: SCREAMING_SNAKE_CASE (`API_BASE_URL`)

## 📦 Commits e Pull Requests

### Mensagens de Commit

Usamos [Conventional Commits](https://conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos permitidos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (sem mudança de código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

**Exemplos:**
```
feat(auth): adiciona autenticação biométrica
fix(ponto): corrige cálculo de horas extras
docs(readme): atualiza instruções de instalação
```

### Pull Requests

1. Use o template de PR
2. Vincule issues relacionadas
3. Aguarde aprovação de pelo menos 1 reviewer
4. Garanta que o CI passou
5. Faça squash dos commits antes do merge

## 🧪 Testes

### Executando Testes

```bash
# Todos os testes
npm run test

# Com cobertura
npm run test:coverage

# Watch mode
npm run test:watch

# UI mode
npm run test:ui
```

### Escrevendo Testes

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click', async () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Cobertura Mínima

- Linhas: 70%
- Branches: 60%
- Funções: 70%

## 📚 Documentação

### Componentes

Use JSDoc para documentar componentes:

```typescript
/**
 * Card de estatísticas para o dashboard
 * 
 * @param title - Título do card
 * @param value - Valor numérico a ser exibido
 * @param icon - Ícone Lucide
 * @param trend - Tendência (up/down/neutral)
 * 
 * @example
 * <StatCard 
 *   title="Horas Trabalhadas" 
 *   value={168} 
 *   icon={Clock}
 *   trend="up"
 * />
 */
export const StatCard: React.FC<StatCardProps> = ({ ... }) => {
```

### Hooks

Documente inputs, outputs e exemplos de uso:

```typescript
/**
 * Hook para gerenciar férias do colaborador
 * 
 * @returns {Object} Dados e funções de férias
 * @returns {Ferias[]} data - Lista de férias
 * @returns {boolean} isLoading - Estado de carregamento
 * @returns {Function} create - Cria nova solicitação
 * 
 * @example
 * const { data, create, isLoading } = useFerias();
 */
```

## ❓ Dúvidas

Abra uma issue com a tag `question` ou entre em contato com a equipe de desenvolvimento.

---

Obrigado por contribuir! 🎉
