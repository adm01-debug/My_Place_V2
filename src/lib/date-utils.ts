/**
 * Formata uma data ISO para exibição localizada pt-BR.
 */
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const defaults: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  };
  return new Date(dateStr).toLocaleDateString('pt-BR', defaults);
}

/**
 * Formata data e hora.
 */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Tempo relativo amigável (ex: "há 5min", "há 2h", "há 3d").
 */
export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} mês${months > 1 ? 'es' : ''}`;
  return formatDate(dateStr);
}

/**
 * Formata período de datas (ex: "01/01/2026 — 15/01/2026").
 */
export function formatDateRange(startStr: string, endStr: string): string {
  return `${formatDate(startStr)} — ${formatDate(endStr)}`;
}

/**
 * Formata competência (ex: "2026-01" → "Janeiro 2026").
 */
export function formatCompetencia(comp: string): string {
  const [year, month] = comp.split('-');
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const monthIndex = parseInt(month, 10) - 1;
  return `${meses[monthIndex] || month} ${year}`;
}
