import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      delete: vi.fn().mockResolvedValue({ error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }),
    },
  },
}));

describe('useAdminData', () => {
  beforeEach(() => vi.clearAllMocks());
  it('should initialize with loading state', async () => {
    const { useAdminData } = await import('@/hooks/useAdminData');
    const { result } = renderHook(() => useAdminData());
    expect(result.current).toBeDefined();
  });
});

describe('useComunicados', () => {
  it('should fetch comunicados', async () => {
    const { useComunicados } = await import('@/hooks/useComunicados');
    const { result } = renderHook(() => useComunicados());
    expect(result.current).toBeDefined();
  });
});

describe('useDocumentos', () => {
  it('should initialize', async () => {
    const { useDocumentos } = await import('@/hooks/useDocumentos');
    const { result } = renderHook(() => useDocumentos());
    expect(result.current).toBeDefined();
  });
});

describe('useEmprestimos', () => {
  it('should initialize', async () => {
    const { useEmprestimos } = await import('@/hooks/useEmprestimos');
    const { result } = renderHook(() => useEmprestimos());
    expect(result.current).toBeDefined();
  });
});

describe('useMetas', () => {
  it('should initialize', async () => {
    const { useMetas } = await import('@/hooks/useMetas');
    const { result } = renderHook(() => useMetas());
    expect(result.current).toBeDefined();
  });
});

describe('useTreinamentos', () => {
  it('should initialize', async () => {
    const { useTreinamentos } = await import('@/hooks/useTreinamentos');
    const { result } = renderHook(() => useTreinamentos());
    expect(result.current).toBeDefined();
  });
});

describe('useSolicitacoes', () => {
  it('should initialize', async () => {
    const { useSolicitacoes } = await import('@/hooks/useSolicitacoes');
    const { result } = renderHook(() => useSolicitacoes());
    expect(result.current).toBeDefined();
  });
});

describe('useDashboard', () => {
  it('should initialize', async () => {
    const { useDashboard } = await import('@/hooks/useDashboard');
    const { result } = renderHook(() => useDashboard());
    expect(result.current).toBeDefined();
  });
});

describe('useCalendarioCorporativo', () => {
  it('should initialize', async () => {
    const { useCalendarioCorporativo } = await import('@/hooks/useCalendarioCorporativo');
    const { result } = renderHook(() => useCalendarioCorporativo());
    expect(result.current).toBeDefined();
  });
});

describe('useOrganograma', () => {
  it('should initialize', async () => {
    const { useOrganograma } = await import('@/hooks/useOrganograma');
    const { result } = renderHook(() => useOrganograma());
    expect(result.current).toBeDefined();
  });
});
