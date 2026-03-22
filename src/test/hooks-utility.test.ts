import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Uses global mock from setup.ts

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useLoadingState', () => {
  it('should return loading initially then false', async () => {
    vi.useFakeTimers();
    const { useLoadingState } = await import('@/hooks/useLoadingState');
    const { result } = renderHook(() => useLoadingState(100));
    expect(result.current).toBe(true);
    act(() => { vi.advanceTimersByTime(150); });
    expect(result.current).toBe(false);
    vi.useRealTimers();
  });
});

describe('useFilters', () => {
  it('should initialize with filters', async () => {
    const { useFilters } = await import('@/hooks/useFilters');
    const mockItems = [{ id: '1', status: 'active' }];
    const mockConfigs = [{ key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }] }];
    const { result } = renderHook(() => useFilters(mockItems, mockConfigs));
    expect(result.current.filteredItems).toBeDefined();
  });
});

describe('useValidation', () => {
  it('should initialize', async () => {
    const { useValidation, validateRequired } = await import('@/hooks/useValidation');
    const { result } = renderHook(() => useValidation('', validateRequired));
    expect(result.current).toBeDefined();
  });
});

describe('useCrudBase', () => {
  it('should initialize', async () => {
    const { useCrudBase } = await import('@/hooks/useCrudBase');
    const { result } = renderHook(() => useCrudBase({
      queryKey: ['test'],
      fetchFn: async () => [],
    }), { wrapper: createWrapper() });
    expect(result.current).toBeDefined();
  });
});

describe('useBiometricAuth', () => {
  it('should initialize', async () => {
    const { useBiometricAuth } = await import('@/hooks/useBiometricAuth');
    const { result } = renderHook(() => useBiometricAuth());
    expect(result.current).toBeDefined();
  });
});

describe('usePWAInstall', () => {
  it('should initialize', async () => {
    const { usePWAInstall } = await import('@/hooks/usePWAInstall');
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current).toBeDefined();
  });
});

describe('useDocumentosDownload', () => {
  it('should initialize', async () => {
    const { useDocumentosDownload } = await import('@/hooks/useDocumentosDownload');
    const { result } = renderHook(() => useDocumentosDownload());
    expect(result.current).toBeDefined();
  });
});

describe('useAssistenteRH', () => {
  it('should initialize', async () => {
    const { useAssistenteRH } = await import('@/hooks/useAssistenteRH');
    const { result } = renderHook(() => useAssistenteRH());
    expect(result.current).toBeDefined();
  });
});
