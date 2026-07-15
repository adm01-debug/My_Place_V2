import { isToday, isYesterday, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Notificacao } from './types';

export const groupLabel = (date: Date): string => {
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  if (isThisWeek(date, { locale: ptBR })) return 'Esta semana';
  return 'Anteriores';
};

/**
 * Score de relevância (0–200+):
 * - Tipo: erro 100, alerta 70, info 30, sucesso 20
 * - Não lida: +40
 * - Palavras-chave de urgência no título: +25
 * - Recência: até +30, decaindo linearmente ao longo de 72h
 */
export const URGENCY_RX =
  /(urgente|vencido|vencendo|pendente|expirad|atrasa|crític|obrigat[óo]ri)/i;

export const relevanceScore = (n: Notificacao): number => {
  const tipoScore =
    n.tipo === 'erro' ? 100 : n.tipo === 'alerta' ? 70 : n.tipo === 'info' ? 30 : 20;
  const unreadScore = n.lida ? 0 : 40;
  const urgencyScore = URGENCY_RX.test(`${n.titulo} ${n.mensagem}`) ? 25 : 0;
  const ageHours =
    (Date.now() - new Date(n.created_at).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 30 - (ageHours / 72) * 30);
  return tipoScore + unreadScore + urgencyScore + recencyScore;
};
