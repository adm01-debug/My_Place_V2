export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'sucesso' | 'erro' | 'info' | 'alerta';
  lida: boolean;
  link: string | null;
  created_at: string;
  fixada_em: string | null;
}

export type Filtro = 'todas' | 'nao_lidas' | 'sucesso' | 'erro' | 'alerta' | 'info';
