// ==================== PORTAL DO COLABORADOR - TYPES ====================

export interface Usuario {
  id: string;
  email: string;
  colaboradorId: string;
  nome: string;
  avatar?: string;
  ultimoAcesso: Date;
  ativo: boolean;
}

export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface PerfilColaborador {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  foto?: string;
  dataNascimento: Date;
  estadoCivil: string;
  telefone: string;
  email: string;
  endereco: Endereco;
  cargo: string;
  departamento: string;
  dataAdmissao: Date;
  tempoCasa: string;
  gestor: string;
  banco: string;
  agencia: string;
  conta: string;
}

export interface ItemHolerite {
  codigo: string;
  descricao: string;
  referencia?: string;
  valor: number;
}

export interface Holerite {
  id: string;
  colaboradorId: string;
  mes: number;
  ano: number;
  tipo: 'mensal' | '13_primeira' | '13_segunda' | 'ferias' | 'rescisao';
  proventos: ItemHolerite[];
  descontos: ItemHolerite[];
  totalProventos: number;
  totalDescontos: number;
  liquido: number;
  baseInss: number;
  baseIrrf: number;
  fgtsMes: number;
  status: 'pendente' | 'processado' | 'pago';
  dataPagamento?: Date;
}

export type TipoVariavel = 
  | 'comissao_vendas'
  | 'bonus_meta'
  | 'bonus_produtividade'
  | 'plr'
  | 'premio_assiduidade'
  | 'gratificacao'
  | 'outros';

export interface ItemVariavel {
  tipo: TipoVariavel;
  descricao: string;
  base?: number;
  percentual?: number;
  valor: number;
}

export interface RemuneracaoVariavel {
  id: string;
  colaboradorId: string;
  mes: number;
  ano: number;
  itens: ItemVariavel[];
  total: number;
  status: 'previsto' | 'confirmado' | 'pago';
  dataPagamento?: Date;
}

export interface Meta {
  id: string;
  titulo: string;
  valorAtual: number;
  valorMeta: number;
  percentual: number;
  bonus: number;
  periodo: string;
}

export interface ParcelaEmprestimo {
  numero: number;
  vencimento: Date;
  valor: number;
  status: 'paga' | 'pendente' | 'atrasada';
  dataPagamento?: Date;
}

export interface Emprestimo {
  id: string;
  colaboradorId: string;
  numeroContrato: string;
  dataContratacao: Date;
  valorOriginal: number;
  taxaJuros: number;
  totalComJuros: number;
  quantidadeParcelas: number;
  valorParcela: number;
  parcelasPagas: number;
  saldoDevedor: number;
  parcelas: ParcelaEmprestimo[];
  status: 'ativo' | 'quitado' | 'inadimplente';
}

export interface Batida {
  tipo: 'entrada' | 'saida';
  horario: string;
  fonte: 'relogio' | 'manual' | 'app';
}

export interface JustificativaPonto {
  motivo: string;
  descricao: string;
  anexo?: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  aprovadoPor?: string;
  dataAprovacao?: Date;
}

export interface DiaPonto {
  data: Date;
  tipo: 'normal' | 'feriado' | 'dsr' | 'ferias' | 'afastamento';
  batidas: Batida[];
  totalHoras: string;
  status: 'ok' | 'atraso' | 'extra' | 'falta' | 'justificado';
  justificativa?: JustificativaPonto;
}

export interface EspelhoPonto {
  colaboradorId: string;
  mes: number;
  ano: number;
  horasNormais: string;
  horasExtras50: string;
  horasExtras100: string;
  adicionalNoturno: string;
  bancoHoras: string;
  faltas: number;
  atrasos: number;
  dias: DiaPonto[];
  status: 'aberto' | 'fechado';
}

export type StatusFerias = 
  | 'solicitada'
  | 'aprovada_gestor'
  | 'rejeitada_gestor'
  | 'aprovada_dp'
  | 'programada'
  | 'em_gozo'
  | 'concluida'
  | 'cancelada';

export interface SolicitacaoFerias {
  id: string;
  tipo: 'integral' | 'fracionada';
  dataInicio: Date;
  dataFim: Date;
  dias: number;
  abonoPecuniario: boolean;
  diasAbono?: number;
  adiantamento13: boolean;
  valorBruto: number;
  valor13: number;
  valorAbono: number;
  descontos: number;
  valorLiquido: number;
  status: StatusFerias;
  criadaEm: Date;
}

export interface FeriasColaborador {
  colaboradorId: string;
  periodoAquisitivo: {
    inicio: Date;
    fim: Date;
    saldoDias: number;
    vencimento: Date;
  };
  solicitacoes: SolicitacaoFerias[];
  historico: SolicitacaoFerias[];
}

export interface Dependente {
  nome: string;
  parentesco: string;
  dataNascimento: Date;
  numeroCarteirinha: string;
}

export interface BeneficioVT {
  ativo: boolean;
  creditoMensal: number;
  desconto: number;
  saldoCartao?: number;
  ultimaRecarga?: Date;
  numeroCartao: string;
  operadora: string;
}

export interface BeneficioVR {
  tipo: 'refeicao' | 'alimentacao';
  ativo: boolean;
  creditoMensal: number;
  valorDia: number;
  diasUteis: number;
  saldoCartao?: number;
  ultimaRecarga?: Date;
  numeroCartao: string;
  operadora: string;
}

export interface BeneficioSaude {
  ativo: boolean;
  operadora: string;
  plano: string;
  numeroCarteirinha: string;
  valorTotal: number;
  valorEmpresa: number;
  valorDesconto: number;
  dependentes: Dependente[];
}

export interface BeneficiosColaborador {
  colaboradorId: string;
  valeTransporte?: BeneficioVT;
  valeRefeicao?: BeneficioVR;
  planoSaude?: BeneficioSaude;
  planoOdonto?: BeneficioSaude;
  resumoDescontos: {
    vt: number;
    vr: number;
    saude: number;
    odonto: number;
    total: number;
  };
}

export interface Treinamento {
  id: string;
  titulo: string;
  descricao: string;
  cargaHoraria: number;
  tipo: 'obrigatorio' | 'recomendado' | 'opcional';
  categoria: string;
  prazo?: Date;
  urlTreinamento?: string;
  dataRealizacao?: Date;
  nota?: number;
  certificadoUrl?: string;
  validade?: Date;
}

export interface TrilhaDesenvolvimento {
  nivelAtual: string;
  proximoNivel: string;
  progressoPercentual: number;
  treinamentosFaltantes: number;
}

export interface TreinamentosColaborador {
  colaboradorId: string;
  totalRealizados: number;
  totalPendentes: number;
  horasTotal: number;
  pendentes: Treinamento[];
  realizados: Treinamento[];
  trilha?: TrilhaDesenvolvimento;
}

export interface Documento {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  disponivel: boolean;
  url?: string;
  geradoEm?: Date;
}

export type StatusSolicitacao = 
  | 'aberta'
  | 'em_analise'
  | 'aguardando_docs'
  | 'aprovada'
  | 'rejeitada'
  | 'concluida';

export interface Solicitacao {
  id: string;
  numero: string;
  tipo: string;
  categoria: string;
  titulo: string;
  descricao: string;
  status: StatusSolicitacao;
  criadaEm: Date;
  atualizadaEm: Date;
  resolvidaEm?: Date;
  anexos?: string[];
  respostas?: {
    autor: string;
    mensagem: string;
    data: Date;
  }[];
}

export interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  resumo: string;
  categoria: string;
  dataPublicacao: Date;
  lido: boolean;
  anexoUrl?: string;
  importante: boolean;
}

export interface Alerta {
  id: string;
  tipo: 'warning' | 'info' | 'error' | 'success';
  titulo: string;
  descricao: string;
  acao?: {
    label: string;
    link: string;
  };
}

export interface DashboardData {
  colaborador: PerfilColaborador;
  salarioEstimado: number;
  horasTrabalhadas: string;
  saldoFerias: number;
  comissaoMes: number;
  alertas: Alerta[];
  comunicados: Comunicado[];
}
