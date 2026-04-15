import { useCallback } from 'react';
import { differenceInMinutes, format } from 'date-fns';

/**
 * Calculates total worked hours from time records.
 */
export function calcularHorasTrabalhadas(registros: Array<{ tipo: string; data_hora: string }> | null): string {
  if (!registros || registros.length === 0) return '0:00';

  let totalMinutos = 0;
  const entradas = registros.filter(r => r.tipo === 'entrada');
  const saidas = registros.filter(r => r.tipo === 'saida');

  for (let i = 0; i < entradas.length; i++) {
    const entrada = new Date(entradas[i].data_hora);
    const saida = saidas[i] ? new Date(saidas[i].data_hora) : new Date();
    totalMinutos += differenceInMinutes(saida, entrada);
  }

  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return `${horas}:${String(minutos).padStart(2, '0')}`;
}

/**
 * Calculates hours bank (banco de horas) balance from monthly records.
 */
export function calcularBancoHoras(registros: Array<{ tipo: string; data_hora: string }> | null): string {
  if (!registros || registros.length === 0) return '0:00';

  const JORNADA_DIARIA = 8 * 60;
  const registrosPorDia: Record<string, Array<{ tipo: string; data_hora: string }>> = {};

  registros.forEach(r => {
    const dateKey = format(new Date(r.data_hora), 'yyyy-MM-dd');
    if (!registrosPorDia[dateKey]) registrosPorDia[dateKey] = [];
    registrosPorDia[dateKey].push(r);
  });

  let saldoMinutos = 0;
  Object.values(registrosPorDia).forEach(dayRegs => {
    const entradas = dayRegs
      .filter(r => r.tipo === 'entrada' || r.tipo === 'intervalo_fim')
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    const saidas = dayRegs
      .filter(r => r.tipo === 'saida' || r.tipo === 'intervalo_inicio')
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

    let minutesDia = 0;
    for (let i = 0; i < entradas.length; i++) {
      const entrada = new Date(entradas[i].data_hora);
      const saida = saidas[i] ? new Date(saidas[i].data_hora) : null;
      if (saida) minutesDia += differenceInMinutes(saida, entrada);
    }

    if (saidas.length > 0) {
      saldoMinutos += minutesDia - JORNADA_DIARIA;
    }
  });

  const horas = Math.floor(Math.abs(saldoMinutos) / 60);
  const mins = Math.abs(saldoMinutos) % 60;
  const sinal = saldoMinutos >= 0 ? '+' : '-';
  return `${sinal}${horas}:${String(mins).padStart(2, '0')}`;
}

/**
 * Hook that returns memoized calculator functions.
 */
export function useHorasCalculator() {
  const calcHoras = useCallback(calcularHorasTrabalhadas, []);
  const calcBanco = useCallback(calcularBancoHoras, []);
  return { calcularHoras: calcHoras, calcularBancoHoras: calcBanco };
}
