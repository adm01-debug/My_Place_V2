import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Uses global mock from setup.ts which supports deep chaining

describe('useFeedback360', () => {
  it('should initialize', async () => {
    const { useFeedback360 } = await import('@/hooks/useFeedback360');
    const { result } = renderHook(() => useFeedback360());
    // Wait for async effects to settle
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current).toBeDefined();
  });
});

describe('usePesquisasClima', () => {
  it('should initialize', async () => {
    const { usePesquisasClima } = await import('@/hooks/usePesquisasClima');
    const { result } = renderHook(() => usePesquisasClima());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current).toBeDefined();
  });
});

describe('useRemuneracaoVariavel', () => {
  it('should initialize', async () => {
    const { useRemuneracaoVariavel } = await import('@/hooks/useRemuneracaoVariavel');
    const { result } = renderHook(() => useRemuneracaoVariavel());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current).toBeDefined();
  });
});

describe('useDashboardGestor', () => {
  it('should initialize', async () => {
    const { useDashboardGestor } = await import('@/hooks/useDashboardGestor');
    const { result } = renderHook(() => useDashboardGestor());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current).toBeDefined();
  });
});

describe('useAniversariantes', () => {
  it('should initialize', async () => {
    const { useAniversariantes } = await import('@/hooks/useAniversariantes');
    const { result } = renderHook(() => useAniversariantes());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current).toBeDefined();
  });
});

describe('useJustificativasPonto', () => {
  it('should initialize', async () => {
    const { useJustificativasPonto } = await import('@/hooks/useJustificativasPonto');
    const { result } = renderHook(() => useJustificativasPonto());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current).toBeDefined();
  });
});

describe('useLocaisPermitidos', () => {
  it('should initialize', async () => {
    const { useLocaisPermitidos } = await import('@/hooks/useLocaisPermitidos');
    const { result } = renderHook(() => useLocaisPermitidos());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current).toBeDefined();
  });
});

describe('usePushNotifications', () => {
  it('should initialize', async () => {
    const { usePushNotifications } = await import('@/hooks/usePushNotifications');
    const { result } = renderHook(() => usePushNotifications());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
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
    const { result } = renderHook(() => useUserRoles());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current).toBeDefined();
  });
});