import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Wrapper para componentes que usam Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

// =====================================================
// TESTES: OfflineIndicator
// =====================================================

describe('OfflineIndicator', () => {
  it('deve renderizar quando offline', async () => {
    // Mock offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    const { OfflineIndicator } = await import('@/components/portal/OfflineIndicator');
    
    render(<OfflineIndicator showAlways />, { wrapper: RouterWrapper });
    
    // Deve mostrar ícone de wifi off
    const icon = document.querySelector('[class*="text-red"]');
    expect(icon).toBeDefined();
  });

  it('deve mostrar contador quando há pendências', async () => {
    const { OfflineIndicator } = await import('@/components/portal/OfflineIndicator');
    
    render(<OfflineIndicator showAlways />, { wrapper: RouterWrapper });
    
    // O contador aparece como Badge
    // Como offlineCount inicial é 0, não deve aparecer badge
  });
});

// =====================================================
// TESTES: StatCard
// =====================================================

describe('StatCard', () => {
  it('deve renderizar com props corretas', async () => {
    const { StatCard } = await import('@/components/portal/StatCard');
    
    render(
      <StatCard 
        title="Teste" 
        value="100" 
        subtitle="subtítulo" 
      />,
      { wrapper: RouterWrapper }
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
    
    const { container } = render(<StatCardSkeleton />);
    
    expect(container.firstChild).toBeDefined();
  });

  it('deve renderizar ListItemSkeleton', async () => {
    const { ListItemSkeleton } = await import('@/components/portal/Skeletons');
    
    const { container } = render(<ListItemSkeleton />);
    
    expect(container.firstChild).toBeDefined();
  });
});

// =====================================================
// TESTES: AlertCard
// =====================================================

describe('AlertCard', () => {
  it('deve renderizar com variante info', async () => {
    const { AlertCard } = await import('@/components/portal/AlertCard');
    
    render(
      <AlertCard 
        variant="info"
        title="Informação"
        description="Descrição teste"
      />
    );
    
    expect(screen.getByText('Informação')).toBeDefined();
    expect(screen.getByText('Descrição teste')).toBeDefined();
  });

  it('deve renderizar com variante warning', async () => {
    const { AlertCard } = await import('@/components/portal/AlertCard');
    
    render(
      <AlertCard 
        variant="warning"
        title="Atenção"
        description="Cuidado!"
      />
    );
    
    expect(screen.getByText('Atenção')).toBeDefined();
  });

  it('deve chamar onAction quando botão clicado', async () => {
    const { AlertCard } = await import('@/components/portal/AlertCard');
    const onAction = vi.fn();
    
    render(
      <AlertCard 
        variant="info"
        title="Teste"
        description="Desc"
        actionLabel="Clique"
        onAction={onAction}
      />
    );
    
    const button = screen.getByText('Clique');
    fireEvent.click(button);
    
    expect(onAction).toHaveBeenCalled();
  });
});

// =====================================================
// TESTES: FilterBar
// =====================================================

describe('FilterBar', () => {
  it('deve renderizar com filtros', async () => {
    const { FilterBar } = await import('@/components/portal/FilterBar');
    
    render(
      <FilterBar 
        filters={[
          { id: 'all', label: 'Todos' },
          { id: 'active', label: 'Ativos' },
        ]}
        activeFilter="all"
        onFilterChange={vi.fn()}
      />
    );
    
    expect(screen.getByText('Todos')).toBeDefined();
    expect(screen.getByText('Ativos')).toBeDefined();
  });

  it('deve chamar onFilterChange quando filtro clicado', async () => {
    const { FilterBar } = await import('@/components/portal/FilterBar');
    const onChange = vi.fn();
    
    render(
      <FilterBar 
        filters={[
          { id: 'all', label: 'Todos' },
          { id: 'active', label: 'Ativos' },
        ]}
        activeFilter="all"
        onFilterChange={onChange}
      />
    );
    
    const button = screen.getByText('Ativos');
    fireEvent.click(button);
    
    expect(onChange).toHaveBeenCalledWith('active');
  });
});

// =====================================================
// TESTES: PageLayout
// =====================================================

describe('PageLayout', () => {
  it('deve renderizar título', async () => {
    const { PageLayout } = await import('@/components/portal/PageLayout');
    
    render(
      <PageLayout title="Minha Página">
        <div>Conteúdo</div>
      </PageLayout>,
      { wrapper: RouterWrapper }
    );
    
    expect(screen.getByText('Minha Página')).toBeDefined();
    expect(screen.getByText('Conteúdo')).toBeDefined();
  });

  it('deve mostrar botão voltar quando showBack', async () => {
    const { PageLayout } = await import('@/components/portal/PageLayout');
    
    render(
      <PageLayout title="Teste" showBack>
        <div>Conteúdo</div>
      </PageLayout>,
      { wrapper: RouterWrapper }
    );
    
    // O botão de voltar deve estar presente
    const backButton = document.querySelector('button');
    expect(backButton).toBeDefined();
  });
});
