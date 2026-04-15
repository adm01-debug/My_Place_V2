import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

// =====================================================
// TESTES: useFAQ
// =====================================================

describe('useFAQ', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('deve inicializar com searchTerm vazio', async () => {
    const { useFAQ } = await import('@/hooks/useFAQ');
    const { result } = renderHook(() => useFAQ(), { wrapper: createWrapper() });
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current.searchTerm).toBe('');
    expect(result.current.categoriaAtiva).toBe('todos');
  });

  it('deve atualizar searchTerm', async () => {
    const { useFAQ } = await import('@/hooks/useFAQ');
    const { result } = renderHook(() => useFAQ(), { wrapper: createWrapper() });
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    act(() => { result.current.setSearchTerm('férias'); });
    await waitFor(() => {
      expect(result.current.searchTerm).toBe('férias');
    });
  });
});

// =====================================================
// TESTES: useOffline
// =====================================================

describe('useOffline', () => {
  it('deve retornar estado de sincronização', async () => {
    const { useOffline } = await import('@/hooks/useOffline');
    const { result } = renderHook(() => useOffline());
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.offlineCount).toBe(0);
    expect(typeof result.current.isOnline).toBe('boolean');
  });
});

// =====================================================
// TESTES: useHolerites
// =====================================================

describe('useHolerites', () => {
  it('deve ter função getMesNome', async () => {
    const { useHolerites } = await import('@/hooks/useHolerites');
    const { result } = renderHook(() => useHolerites());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current.getMesNome(1)).toBe('Janeiro');
    expect(result.current.getMesNome(12)).toBe('Dezembro');
  });

  it('deve calcular totais corretamente', async () => {
    const { useHolerites } = await import('@/hooks/useHolerites');
    const { result } = renderHook(() => useHolerites());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    const mockHolerite = {
      id: '1', user_id: 'test', mes: 12, ano: 2025,
      salario_bruto: 6000, salario_liquido: 4500, descontos: 1500,
      pdf_url: null as string | null, detalhes: null as Record<string, unknown> | null, created_at: '2025-12-01',
    };
    const totais = result.current.calcularTotais(mockHolerite);
    expect(totais.liquido).toBe(4500);
  });
});

// =====================================================
// TESTES: useFerias
// =====================================================

describe('useFerias', () => {
  it('deve ter saldoTotal definido', async () => {
    const { useFerias } = await import('@/hooks/useFerias');
    const { result } = renderHook(() => useFerias());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current.saldoTotal).toBeDefined();
  });
});

// =====================================================
// TESTES: useNotificacoes
// =====================================================

describe('useNotificacoes', () => {
  it('deve exportar hook', async () => {
    const mod = await import('@/hooks/useNotificacoes');
    expect(mod.useNotificacoes).toBeDefined();
  });
});

// =====================================================
// TESTES: useBeneficios
// =====================================================

describe('useBeneficios', () => {
  it('deve inicializar com benefícios vazios', async () => {
    const { useBeneficios } = await import('@/hooks/useBeneficios');
    const { result } = renderHook(() => useBeneficios());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current.beneficios).toEqual([]);
  });

  it('deve ter resumoDescontos com total zero', async () => {
    const { useBeneficios } = await import('@/hooks/useBeneficios');
    const { result } = renderHook(() => useBeneficios());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current.resumoDescontos).toBeDefined();
    expect(result.current.resumoDescontos.total).toBe(0);
  });
});

// =====================================================
// TESTES: useRegistrosPonto
// =====================================================

describe('useRegistrosPonto', () => {
  it('deve ter função formatarHoras', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current.formatarHoras(60)).toBe('+1:00');
    expect(result.current.formatarHoras(-30)).toBe('-0:30');
    expect(result.current.formatarHoras(0)).toBe('0:00');
  });

  it('deve inicializar com registros vazios', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current.registros).toEqual([]);
  });
});