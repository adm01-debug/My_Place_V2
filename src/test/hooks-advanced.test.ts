import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Uses global mock from setup.ts which supports deep chaining

describe('useFeedback360', () => {
  it('should initialize', async () => {
    const { useFeedback360 } = await import('@/hooks/useFeedback360');
    let result: any;
    await act(async () => {
      const hook = renderHook(() => useFeedback360());
      result = hook.result;
    });
    expect(result.current).toBeDefined();
  });
});

describe('usePesquisasClima', () => {
  it('should initialize', async () => {
    const { usePesquisasClima } = await import('@/hooks/usePesquisasClima');
    let result: any;
    await act(async () => {
      const hook = renderHook(() => usePesquisasClima());
      result = hook.result;
    });
    expect(result.current).toBeDefined();
  });
});

describe('useRemuneracaoVariavel', () => {
  it('should initialize', async () => {
    const { useRemuneracaoVariavel } = await import('@/hooks/useRemuneracaoVariavel');
    let result: any;
    await act(async () => {
      const hook = renderHook(() => useRemuneracaoVariavel());
      result = hook.result;
    });
    expect(result.current).toBeDefined();
  });
});

describe('useDashboardGestor', () => {
  it('should initialize', async () => {
    const { useDashboardGestor } = await import('@/hooks/useDashboardGestor');
    let result: any;
    await act(async () => {
      const hook = renderHook(() => useDashboardGestor());
      result = hook.result;
    });
    expect(result.current).toBeDefined();
  });
});

describe('useAniversariantes', () => {
  it('should initialize', async () => {
    const { useAniversariantes } = await import('@/hooks/useAniversariantes');
    let result: any;
    await act(async () => {
      const hook = renderHook(() => useAniversariantes());
      result = hook.result;
    });
    expect(result.current).toBeDefined();
  });
});

describe('useJustificativasPonto', () => {
  it('should initialize', async () => {
    const { useJustificativasPonto } = await import('@/hooks/useJustificativasPonto');
    let result: any;
    await act(async () => {
      const hook = renderHook(() => useJustificativasPonto());
      result = hook.result;
    });
    expect(result.current).toBeDefined();
  });
});

describe('useLocaisPermitidos', () => {
  it('should initialize', async () => {
    const { useLocaisPermitidos } = await import('@/hooks/useLocaisPermitidos');
    let result: any;
    await act(async () => {
      const hook = renderHook(() => useLocaisPermitidos());
      result = hook.result;
    });
    expect(result.current).toBeDefined();
  });
});

describe('usePushNotifications', () => {
  it('should initialize', async () => {
    const { usePushNotifications } = await import('@/hooks/usePushNotifications');
    let result: any;
    await act(async () => {
      const hook = renderHook(() => usePushNotifications());
      result = hook.result;
    });
    expect(result.current).toBeDefined();
  });
});

describe('useExportPDF', () => {
  it('should initialize with all export methods', async () => {
    const { useExportPDF } = await import('@/hooks/useExportPDF');
    const { result } = renderHook(() => useExportPDF());
    expect(result.current).toBeDefined();
    expect(result.current.exportToPDF).toBeDefined();
    expect(result.current.exportHolerite).toBeDefined();
    expect(result.current.exportEspelhoPonto).toBeDefined();
    expect(result.current.exportFeedback360).toBeDefined();
    expect(result.current.exportCertificado).toBeDefined();
  });
});

describe('useUserRoles', () => {
  it('should initialize', async () => {
    const { useUserRoles } = await import('@/hooks/useUserRoles');
    let result: any;
    await act(async () => {
      const hook = renderHook(() => useUserRoles());
      result = hook.result;
    });
    expect(result.current).toBeDefined();
  });
});