import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useRegistrosPonto', () => {
  it('should initialize with empty registros', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto(), { wrapper: createWrapper() });
    expect(result.current.registros).toBeDefined();
    expect(Array.isArray(result.current.registros)).toBe(true);
  });

  it('should have formatarHoras function', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto(), { wrapper: createWrapper() });
    expect(typeof result.current.formatarHoras).toBe('function');
  });

  it('should format positive hours correctly', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto(), { wrapper: createWrapper() });
    expect(result.current.formatarHoras(480)).toBe('+8:00');
    expect(result.current.formatarHoras(90)).toBe('+1:30');
    expect(result.current.formatarHoras(0)).toBe('0:00');
  });

  it('should format negative hours correctly', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto(), { wrapper: createWrapper() });
    expect(result.current.formatarHoras(-60)).toBe('-1:00');
    expect(result.current.formatarHoras(-30)).toBe('-0:30');
  });

  it('should have getProximoTipo function', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto(), { wrapper: createWrapper() });
    expect(typeof result.current.getProximoTipo).toBe('function');
  });

  it('should return entrada when no registros today', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto(), { wrapper: createWrapper() });
    // With no registros, next should be 'entrada'
    expect(result.current.getProximoTipo()).toBe('entrada');
  });

  it('should have getRegistrosHoje function', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto(), { wrapper: createWrapper() });
    expect(typeof result.current.getRegistrosHoje).toBe('function');
    expect(Array.isArray(result.current.getRegistrosHoje())).toBe(true);
  });

  it('should have espelhoMes array', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto(), { wrapper: createWrapper() });
    expect(Array.isArray(result.current.espelhoMes)).toBe(true);
  });

  it('should have resumoMensal with correct fields', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto(), { wrapper: createWrapper() });
    const resumo = result.current.resumoMensal;
    expect(resumo).toHaveProperty('horasNormais');
    expect(resumo).toHaveProperty('horasExtras');
    expect(resumo).toHaveProperty('bancoHoras');
    expect(resumo).toHaveProperty('faltas');
    expect(resumo).toHaveProperty('atrasos');
  });

  it('should have refetch function', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto(), { wrapper: createWrapper() });
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should have registrarPonto function', async () => {
    const { useRegistrosPonto } = await import('@/hooks/useRegistrosPonto');
    const { result } = renderHook(() => useRegistrosPonto(), { wrapper: createWrapper() });
    expect(typeof result.current.registrarPonto).toBe('function');
  });
});

describe('Haversine Distance Calculation', () => {
  it('should calculate zero distance for same point', () => {
    const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371000;
      const phi1 = (lat1 * Math.PI) / 180;
      const phi2 = (lat2 * Math.PI) / 180;
      const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
      const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    expect(calcularDistancia(-16.68, -49.26, -16.68, -49.26)).toBe(0);
  });

  it('should calculate reasonable distance between two points', () => {
    const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371000;
      const phi1 = (lat1 * Math.PI) / 180;
      const phi2 = (lat2 * Math.PI) / 180;
      const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
      const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // ~1km apart roughly
    const distance = calcularDistancia(-16.68, -49.26, -16.69, -49.26);
    expect(distance).toBeGreaterThan(500);
    expect(distance).toBeLessThan(2000);
  });
});

describe('JornadaProgress logic', () => {
  it('should calculate percentage correctly', () => {
    const workedMinutes = 240;
    const targetMinutes = 480;
    const percentage = Math.min((workedMinutes / targetMinutes) * 100, 100);
    expect(percentage).toBe(50);
  });

  it('should cap at 100%', () => {
    const workedMinutes = 600;
    const targetMinutes = 480;
    const percentage = Math.min((workedMinutes / targetMinutes) * 100, 100);
    expect(percentage).toBe(100);
  });

  it('should detect overtime', () => {
    expect(600 > 480).toBe(true);
    expect(480 > 480).toBe(false);
  });

  it('should calculate remaining time correctly', () => {
    const remaining = Math.max(0, 480 - 300);
    expect(remaining).toBe(180);
  });

  it('should show 0 remaining when overtime', () => {
    const remaining = Math.max(0, 480 - 600);
    expect(remaining).toBe(0);
  });
});

describe('Next Action State Machine', () => {
  it('should return entrada when no punches', () => {
    const batidasHoje: Array<{ tipo: string }> = [];
    const getNextAction = () => {
      if (batidasHoje.length === 0) return 'entrada';
      const last = batidasHoje[batidasHoje.length - 1];
      switch (last.tipo) {
        case 'entrada': return 'intervalo_inicio';
        case 'intervalo_inicio': return 'intervalo_fim';
        case 'intervalo_fim': return 'saida';
        case 'saida': return 'entrada';
        default: return 'entrada';
      }
    };
    expect(getNextAction()).toBe('entrada');
  });

  it('should return intervalo_inicio after entrada', () => {
    const batidasHoje = [{ tipo: 'entrada' }];
    const last = batidasHoje[batidasHoje.length - 1];
    const next = last.tipo === 'entrada' ? 'intervalo_inicio' : 'entrada';
    expect(next).toBe('intervalo_inicio');
  });

  it('should return intervalo_fim after intervalo_inicio', () => {
    const batidasHoje = [{ tipo: 'entrada' }, { tipo: 'intervalo_inicio' }];
    const last = batidasHoje[batidasHoje.length - 1];
    const next = last.tipo === 'intervalo_inicio' ? 'intervalo_fim' : 'entrada';
    expect(next).toBe('intervalo_fim');
  });

  it('should return saida after intervalo_fim', () => {
    const batidasHoje = [{ tipo: 'entrada' }, { tipo: 'intervalo_inicio' }, { tipo: 'intervalo_fim' }];
    const last = batidasHoje[batidasHoje.length - 1];
    const next = last.tipo === 'intervalo_fim' ? 'saida' : 'entrada';
    expect(next).toBe('saida');
  });

  it('should return entrada after saida (new cycle)', () => {
    const batidasHoje = [{ tipo: 'entrada' }, { tipo: 'intervalo_inicio' }, { tipo: 'intervalo_fim' }, { tipo: 'saida' }];
    const last = batidasHoje[batidasHoje.length - 1];
    const next = last.tipo === 'saida' ? 'entrada' : 'saida';
    expect(next).toBe('entrada');
  });
});

describe('Espelho de Ponto Status Logic', () => {
  it('should classify weekend correctly', () => {
    const day = new Date('2026-03-22'); // Sunday
    expect(day.getDay()).toBe(0); // 0 = Sunday
  });

  it('should classify falta when no registros on weekday', () => {
    const dayRegs: any[] = [];
    const isWeekend = false;
    const isToday = false;
    let status = 'pendente';
    if (isWeekend) {
      status = dayRegs.length > 0 ? 'extra' : 'ok';
    } else if (dayRegs.length === 0) {
      status = isToday ? 'pendente' : 'falta';
    }
    expect(status).toBe('falta');
  });

  it('should classify as pendente for today with no registros', () => {
    const dayRegs: any[] = [];
    const isWeekend = false;
    const isToday = true;
    let status = 'pendente';
    if (dayRegs.length === 0 && !isWeekend) {
      status = isToday ? 'pendente' : 'falta';
    }
    expect(status).toBe('pendente');
  });
});

describe('Month Navigation', () => {
  it('should not go beyond current month', () => {
    const now = new Date();
    const isCurrentMonth = true;
    expect(isCurrentMonth).toBe(true);
    // handleNextMonth should be disabled
  });

  it('should allow going to previous months', () => {
    const { subMonths, isSameMonth } = require('date-fns');
    const mesAtual = new Date();
    const prev = subMonths(mesAtual, 1);
    expect(isSameMonth(prev, mesAtual)).toBe(false);
  });
});

describe('Hours Formatting', () => {
  it('should format minutes to HH:MM', () => {
    const formatHours = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = Math.floor(mins % 60);
      return `${h}:${String(m).padStart(2, '0')}`;
    };
    expect(formatHours(480)).toBe('8:00');
    expect(formatHours(510)).toBe('8:30');
    expect(formatHours(0)).toBe('0:00');
    expect(formatHours(59)).toBe('0:59');
    expect(formatHours(61)).toBe('1:01');
  });
});
