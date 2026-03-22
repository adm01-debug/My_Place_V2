import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(BrowserRouter, null, children)
    );
};

// =====================================================
// TESTES: StatCard
// =====================================================

describe('StatCard', () => {
  it('deve renderizar com props corretas', async () => {
    const { StatCard } = await import('@/components/portal/StatCard');
    const { FileText } = await import('lucide-react');
    
    render(
      React.createElement(StatCard, { icon: FileText, label: 'Teste', value: '100', subValue: 'subtítulo' }),
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText('Teste')).toBeDefined();
    expect(screen.getByText('100')).toBeDefined();
  });
});

// =====================================================
// TESTES: Skeletons
// =====================================================

describe('Skeletons', () => {
  it('deve renderizar StatCardSkeleton', async () => {
    const { StatCardSkeleton } = await import('@/components/portal/Skeletons');
    const { container } = render(React.createElement(StatCardSkeleton));
    expect(container.firstChild).toBeDefined();
  });

  it('deve renderizar ListItemSkeleton', async () => {
    const { ListItemSkeleton } = await import('@/components/portal/Skeletons');
    const { container } = render(React.createElement(ListItemSkeleton));
    expect(container.firstChild).toBeDefined();
  });
});

// =====================================================
// TESTES: AlertCard
// =====================================================

describe('AlertCard', () => {
  it('deve renderizar com alerta info', async () => {
    const { AlertCard } = await import('@/components/portal/AlertCard');
    
    render(
      React.createElement(AlertCard, {
        alerta: { id: '1', tipo: 'info', titulo: 'Informação', descricao: 'Descrição teste' },
      }),
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText('Informação')).toBeDefined();
    expect(screen.getByText('Descrição teste')).toBeDefined();
  });

  it('deve renderizar com alerta warning', async () => {
    const { AlertCard } = await import('@/components/portal/AlertCard');
    
    render(
      React.createElement(AlertCard, {
        alerta: { id: '2', tipo: 'warning', titulo: 'Atenção', descricao: 'Cuidado!' },
      }),
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText('Atenção')).toBeDefined();
  });

  it('deve renderizar com ação', async () => {
    const { AlertCard } = await import('@/components/portal/AlertCard');
    
    render(
      React.createElement(AlertCard, {
        alerta: { id: '3', tipo: 'info', titulo: 'Teste', descricao: 'Desc', acao: { label: 'Clique', link: '/teste' } },
      }),
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText('Clique')).toBeDefined();
  });
});

// =====================================================
// TESTES: FilterBar
// =====================================================

describe('InlineFilter', () => {
  it('deve renderizar com filtros', async () => {
    const { InlineFilter } = await import('@/components/portal/FilterBar');
    
    render(
      React.createElement(InlineFilter, {
        options: [
          { value: 'all', label: 'Todos' },
          { value: 'active', label: 'Ativos' },
        ],
        value: 'all',
        onChange: vi.fn(),
      })
    );
    
    expect(screen.getByText('Todos')).toBeDefined();
    expect(screen.getByText('Ativos')).toBeDefined();
  });

  it('deve chamar onChange quando filtro clicado', async () => {
    const { InlineFilter } = await import('@/components/portal/FilterBar');
    const onChange = vi.fn();
    
    render(
      React.createElement(InlineFilter, {
        options: [
          { value: 'all', label: 'Todos' },
          { value: 'active', label: 'Ativos' },
        ],
        value: 'all',
        onChange,
      })
    );
    
    fireEvent.click(screen.getByText('Ativos'));
    expect(onChange).toHaveBeenCalledWith('active');
  });
});

// =====================================================
// TESTES: OfflineIndicator
// =====================================================

describe('OfflineIndicator', () => {
  it('deve renderizar sem erro', async () => {
    const { OfflineIndicator } = await import('@/components/portal/OfflineIndicator');
    const { container } = render(
      React.createElement(OfflineIndicator, { showAlways: true }),
      { wrapper: createWrapper() }
    );
    expect(container).toBeDefined();
  });
});

// =====================================================
// TESTES: PageLayout
// =====================================================

describe('PageLayout', () => {
  it('deve renderizar children', async () => {
    const { PageLayout } = await import('@/components/portal/PageLayout');
    
    const el = React.createElement(PageLayout, { title: 'Minha Página', children: React.createElement('div', null, 'Conteúdo') });
    render(el, { wrapper: createWrapper() });
    
    expect(screen.getByText('Conteúdo')).toBeDefined();
  });
});
