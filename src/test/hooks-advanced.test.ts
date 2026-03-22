import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// Uses global mock from setup.ts which supports deep chaining

describe('useFeedback360', () => {
  it('should initialize', async () => {
    const { useFeedback360 } = await import('@/hooks/useFeedback360');
    const { result } = renderHook(() => useFeedback360());
    expect(result.current).toBeDefined();
  });
});

describe('usePesquisasClima', () => {
  it('should initialize', async () => {
    const { usePesquisasClima } = await import('@/hooks/usePesquisasClima');
    const { result } = renderHook(() => usePesquisasClima());
    expect(result.current).toBeDefined();
  });
});

describe('useRemuneracaoVariavel', () => {
  it('should initialize', async () => {
    const { useRemuneracaoVariavel } = await import('@/hooks/useRemuneracaoVariavel');
    const { result } = renderHook(() => useRemuneracaoVariavel());
    expect(result.current).toBeDefined();
  });
});

describe('useDashboardGestor', () => {
  it('should initialize', async () => {
    const { useDashboardGestor } = await import('@/hooks/useDashboardGestor');
    const { result } = renderHook(() => useDashboardGestor());
    expect(result.current).toBeDefined();
  });
});

describe('useAniversariantes', () => {
  it('should initialize', async () => {
    const { useAniversariantes } = await import('@/hooks/useAniversariantes');
    const { result } = renderHook(() => useAniversariantes());
    expect(result.current).toBeDefined();
  });
});

describe('useJustificativasPonto', () => {
  it('should initialize', async () => {
    const { useJustificativasPonto } = await import('@/hooks/useJustificativasPonto');
    const { result } = renderHook(() => useJustificativasPonto());
    expect(result.current).toBeDefined();
  });
});

describe('useLocaisPermitidos', () => {
  it('should initialize', async () => {
    const { useLocaisPermitidos } = await import('@/hooks/useLocaisPermitidos');
    const { result } = renderHook(() => useLocaisPermitidos());
    expect(result.current).toBeDefined();
  });
});

describe('usePushNotifications', () => {
  it('should initialize', async () => {
    const { usePushNotifications } = await import('@/hooks/usePushNotifications');
    const { result } = renderHook(() => usePushNotifications());
    expect(result.current).toBeDefined();
  });
});

describe('useExportPDF', () => {
  it('should initialize', async () => {
    const { useExportPDF } = await import('@/hooks/useExportPDF');
    const { result } = renderHook(() => useExportPDF());
    expect(result.current).toBeDefined();
  });
});

describe('useUserRoles', () => {
  it('should initialize', async () => {
    const { useUserRoles } = await import('@/hooks/useUserRoles');
    const { result } = renderHook(() => useUserRoles());
    expect(result.current).toBeDefined();
  });
});
