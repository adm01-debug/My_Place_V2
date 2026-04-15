// Constantes globais da aplicação

export const APP_NAME = 'MY-PLACE';
export const APP_VERSION = '1.0.0';

// Paginação
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Debounce
export const SEARCH_DEBOUNCE_MS = 300;
export const AUTOSAVE_DEBOUNCE_MS = 1000;

// Cache
export const CACHE_TIME_MS = 5 * 60 * 1000; // 5 minutos
export const STALE_TIME_MS = 1 * 60 * 1000; // 1 minuto

// Formato de data
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Status de férias
export const FERIAS_STATUS = {
  PENDENTE: 'pendente',
  APROVADO: 'aprovado',
  REJEITADO: 'rejeitado',
  CANCELADO: 'cancelado',
  EM_GOZO: 'em_gozo',
  CONCLUIDO: 'concluido',
} as const;

// Status de ponto
export const PONTO_STATUS = {
  PENDENTE: 'pendente',
  APROVADO: 'aprovado',
  AJUSTADO: 'ajustado',
  REJEITADO: 'rejeitado',
} as const;

// Tipos de notificação
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

// Cores do tema
export const THEME_COLORS = {
  primary: '#6366f1',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const;

// Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  RH: 'rh',
  GESTOR: 'gestor',
  COLABORADOR: 'colaborador',
} as const;

// Upload
export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// API
export const API_TIMEOUT_MS = 30000;
export const RETRY_COUNT = 3;

// Solicitações
export const SOLICITACAO_STATUS = {
  PENDENTE: 'pendente',
  APROVADO: 'aprovado',
  REJEITADO: 'rejeitado',
  CONCLUIDO: 'concluido',
} as const;

// Empréstimos
export const EMPRESTIMO_STATUS = {
  PENDENTE: 'pendente',
  ATIVO: 'ativo',
  QUITADO: 'quitado',
  REJEITADO: 'rejeitado',
} as const;

export const EMPRESTIMO_TAXA_PADRAO = 1.5;

// Treinamentos
export const TREINAMENTO_STATUS = {
  NAO_INICIADO: 'nao_iniciado',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDO: 'concluido',
} as const;

// Metas
export const META_STATUS = {
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDA: 'concluida',
  CANCELADA: 'cancelada',
  ATRASADA: 'atrasada',
} as const;

// Remuneração Variável
export const REMUNERACAO_TIPO = {
  COMISSAO: 'comissao',
  BONUS: 'bonus',
  PLR: 'plr',
  GRATIFICACAO: 'gratificacao',
} as const;

// Jornada de trabalho
export const JORNADA = {
  HORAS_DIA: 8,
  HORAS_SEMANA: 44,
  INTERVALO_MIN: 60,
  TOLERANCIA_MIN: 10,
} as const;

// Meses
export const MESES_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

// Storage buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  DOCUMENTOS: 'documentos',
  ATESTADOS: 'atestados',
  CERTIFICADOS: 'certificados',
  COMUNICADOS: 'comunicados',
  ANEXOS: 'anexos',
} as const;
