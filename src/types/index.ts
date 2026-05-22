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

export interface UserProfile {
  id: string;
  email: string;
  nome: string;
  avatar_url?: string | null;
  cargo?: string | null;
  departamento?: string | null;
  data_admissao?: string | null;
  matricula?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  salario_base?: number | null;
  valor_hora_extra?: number | null;
  saldo_horas?: number | null;
}

export interface Notification {
  id: string;
  tipo: 'info' | 'sucesso' | 'alerta' | 'erro';
  titulo: string;
  mensagem: string;
  lida: boolean;
  link?: string | null;
  created_at: string;
}

export type Status = 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado' | 'em_analise';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string | null;
  operation: string;
  old_data?: any;
  new_data?: any;
  changed_by: string | null;
  changed_at: string;
}

export type TipoVale = 'adiantamento_salarial' | 'vale_refeicao' | 'vale_transporte' | 'vale_combustivel';
export type StatusVale = 'pendente' | 'em_analise' | 'aprovado' | 'pago' | 'recusado' | 'cancelado';

export interface ValeRequest {
  id: string;
  tipo: TipoVale;
  valor: number;
  data_solicitacao: string;
  status: StatusVale;
  justificativa: string;
  data_pagamento_prevista?: string;
  etapa_atual: number;
  anexo_url?: string | null;
}
