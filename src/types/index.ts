// Barrel export de todos os tipos
export * from './portal';

// Tipos comuns
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface User {
  id: string;
  email: string;
  nome: string;
  avatar_url?: string;
  cargo?: string;
  departamento?: string;
}

export interface Notification {
  id: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export type Status = 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  user_id: string;
  created_at: string;
}
