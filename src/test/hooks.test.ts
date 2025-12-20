import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// =====================================================
// TESTES: useFAQ
// =====================================================

describe('useFAQ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com loading true', async () => {
    const { useFAQ } = await import('@/hooks/useFAQ');
    const { result } = renderHook(() => useFAQ());
    
    expect(result.current.isLoading).toBe(true);
  });

  it('deve ter categorias padrão', async () => {
    const { useFAQ } = await import('@/hooks/useFAQ');
    const { result } = renderHook(() => useFAQ());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.categorias).toBeDefined();
  });

  it('deve filtrar por termo de busca', async () => {
    const { useFAQ } = await import('@/hooks/useFAQ');
    const { result } = renderHook(() => useFAQ());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    result.current.setSearchTerm('férias');
    expect(result.current.searchTerm).toBe('férias');
  });
});

// =====================================================
// TESTES: useOffline
// =====================================================

describe('useOffline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });

  it('deve detectar estado online', async () => {
    const { useOffline } = await import('@/hooks/useOffline');
    const { result } = renderHook(() => useOffline());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('deve inicializar com contador zero', async () => {
    const { useOffline } = await import('@/hooks/useOffline');
    const { result } = renderHook(() => useOffline());
    
    expect(result.current.offlineCount).toBe(0);
  });

  it('não deve estar sincronizando inicialmente', async () => {
    const { useOffline } = await import('@/hooks/useOffline');
    const { result } = renderHook(() => useOffline());
    
    expect(result.current.isSyncing).toBe(false);
  });
});

// =====================================================
// TESTES: useHolerites
// =====================================================

describe('useHolerites', () => {
  it('deve inicializar com array vazio', async () => {
    const { useHolerites } = await import('@/hooks/useHolerites');
    const { result } = renderHook(() => useHolerites());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.holerites).toEqual([]);
  });

  it('deve ter função getMesNome', async () => {
    const { useHolerites } = await import('@/hooks/useHolerites');
    const { result } = renderHook(() => useHolerites());
    
    expect(result.current.getMesNome(1)).toBe('Janeiro');
    expect(result.current.getMesNome(12)).toBe('Dezembro');
  });

  it('deve calcular totais corretamente', async () => {
    const { useHolerites } = await import('@/hooks/useHolerites');
    const { result } = renderHook(() => useHolerites());
    
    const mockHolerite = {
      id: '1',
      user_id: 'test',
      mes: 12,
      ano: 2025,
      salario_base: 5000,
      salario_bruto: 6000,
      salario_liquido: 4500,
      descontos: 1500,
      horas_trabalhadas: 176,
      horas_extras: 0,
      faltas: 0,
      pdf_url: null,
      detalhes: null,
      created_at: '2025-12-01',
    };
    
    const totais = result.current.calcularTotais(mockHolerite);
    expect(totais.liquido).toBe(4500);
  });
});

// =====================================================
// TESTES: useFerias
// =====================================================

describe('useFerias', () => {
  it('deve inicializar com saldo padrão', async () => {
    const { useFerias } = await import('@/hooks/useFerias');
    const { result } = renderHook(() => useFerias());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.saldo).toBeDefined();
  });

  it('deve ter histórico vazio inicialmente', async () => {
    const { useFerias } = await import('@/hooks/useFerias');
    const { result } = renderHook(() => useFerias());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.historico).toEqual([]);
  });
});

// =====================================================
// TESTES: useNotificacoes
// =====================================================

describe('useNotificacoes', () => {
  it('deve inicializar com notificações vazias', async () => {
    const { useNotificacoes } = await import('@/hooks/useNotificacoes');
    const { result } = renderHook(() => useNotificacoes());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.notificacoes).toEqual([]);
  });

  it('deve ter contador de não lidas zero', async () => {
    const { useNotificacoes } = await import('@/hooks/useNotificacoes');
    const { result } = renderHook(() => useNotificacoes());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.naoLidas).toBe(0);
  });
});

// =====================================================
// TESTES: useBeneficios
// =====================================================

describe('useBeneficios', () => {
  it('deve inicializar com benefícios vazios', async () => {
    const { useBeneficios } = await import('@/hooks/useBeneficios');
    const { result } = renderHook(() => useBeneficios());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.beneficios).toEqual([]);
  });

  it('deve ter resumo com valores zerados', async () => {
    const { useBeneficios } = await import('@/hooks/useBeneficios');
    const { result } = renderHook(() => useBeneficios());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.resumo).toBeDefined();
    expect(result.current.resumo.totalMensal).toBe(0);
  });
});

// =====================================================
// TESTES: useRegistrosPonto
// =====================================================

describe('useRegistrosPonto', () => {
  it('deve inicializar com registros vazios', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.registros).toEqual([]);
  });

  it('não deve estar registrando inicialmente', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto());
    
    expect(result.current.isRegistering).toBe(false);
  });
});
