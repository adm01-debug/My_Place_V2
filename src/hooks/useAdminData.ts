import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  resumo: string | null;
  categoria: string;
  importante: boolean;
  fixado: boolean;
  ativo: boolean;
  data_publicacao: string;
  data_expiracao: string | null;
}

interface Treinamento {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  carga_horaria: number;
  obrigatorio: boolean;
  ativo: boolean;
  instrutor: string | null;
}

interface Solicitacao {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  resposta: string | null;
  created_at: string;
  profile?: {
    nome: string;
    email: string;
    departamento: string | null;
  };
}

interface Ferias {
  id: string;
  user_id: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  dias_solicitados: number;
  status: string;
  observacao: string | null;
  created_at: string;
  profile?: {
    nome: string;
    email: string;
    departamento: string | null;
  };
}

interface Emprestimo {
  id: string;
  user_id: string;
  valor_original: number;
  quantidade_parcelas: number;
  status: string;
  motivo: string | null;
  created_at: string;
  profile?: {
    nome: string;
    email: string;
    departamento: string | null;
  };
}

interface JustificativaPonto {
  id: string;
  user_id: string;
  data: string;
  tipo: string;
  motivo: string;
  status: string;
  created_at: string;
  profile?: {
    nome: string;
    email: string;
    departamento: string | null;
  };
}

interface AdminData {
  comunicados: Comunicado[];
  treinamentos: Treinamento[];
  solicitacoes: Solicitacao[];
  ferias: Ferias[];
  emprestimos: Emprestimo[];
  justificativas: JustificativaPonto[];
  stats: {
    pendentesTotal: number;
    solicitacoesPendentes: number;
    feriasPendentes: number;
    emprestimosPendentes: number;
    justificativasPendentes: number;
  };
}

export function useAdminData() {
  const [data, setData] = useState<AdminData>({
    comunicados: [],
    treinamentos: [],
    solicitacoes: [],
    ferias: [],
    emprestimos: [],
    justificativas: [],
    stats: {
      pendentesTotal: 0,
      solicitacoesPendentes: 0,
      feriasPendentes: 0,
      emprestimosPendentes: 0,
      justificativasPendentes: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      // Fetch comunicados
      const { data: comunicadosData } = await supabase
        .from('comunicados' as any)
        .select('*')
        .order('created_at', { ascending: false }) as { data: any[] | null };

      // Fetch treinamentos
      const { data: treinamentosData } = await supabase
        .from('treinamentos' as any)
        .select('*')
        .order('created_at', { ascending: false }) as { data: any[] | null };

      // Fetch solicitações pendentes com profile
      const { data: solicitacoesData } = await supabase
        .from('solicitacoes' as any)
        .select(`
          *,
          profiles!solicitacoes_user_id_fkey(nome, email, departamento)
        `)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false }) as { data: any[] | null };

      // Fetch férias pendentes com profile
      const { data: feriasData } = await supabase
        .from('ferias' as any)
        .select(`
          *,
          profiles!ferias_user_id_fkey(nome, email, departamento)
        `)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false }) as { data: any[] | null };

      // Fetch empréstimos pendentes com profile
      const { data: emprestimosData } = await supabase
        .from('emprestimos' as any)
        .select(`
          *,
          profiles!emprestimos_user_id_fkey(nome, email, departamento)
        `)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false }) as { data: any[] | null };

      // Fetch justificativas pendentes
      const { data: justificativasData } = await supabase
        .from('justificativas_ponto' as any)
        .select(`
          *,
          profiles!justificativas_ponto_user_id_fkey(nome, email, departamento)
        `)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false }) as { data: any[] | null };

      const comunicados = (comunicadosData || []) as Comunicado[];
      const treinamentos = (treinamentosData || []) as Treinamento[];
      
      const solicitacoes = (solicitacoesData || []).map((s: any) => ({
        ...s,
        profile: s.profiles,
      })) as Solicitacao[];
      
      const ferias = (feriasData || []).map((f: any) => ({
        ...f,
        profile: f.profiles,
      })) as Ferias[];
      
      const emprestimos = (emprestimosData || []).map((e: any) => ({
        ...e,
        profile: e.profiles,
      })) as Emprestimo[];
      
      const justificativas = (justificativasData || []).map((j: any) => ({
        ...j,
        profile: j.profiles,
      })) as JustificativaPonto[];

      const stats = {
        solicitacoesPendentes: solicitacoes.length,
        feriasPendentes: ferias.length,
        emprestimosPendentes: emprestimos.length,
        justificativasPendentes: justificativas.length,
        pendentesTotal: solicitacoes.length + ferias.length + emprestimos.length + justificativas.length,
      };

      setData({
        comunicados,
        treinamentos,
        solicitacoes,
        ferias,
        emprestimos,
        justificativas,
        stats,
      });
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  }, [toast]);

  // CRUD Comunicados
  const criarComunicado = async (comunicado: Partial<Comunicado>) => {
    const { error } = await supabase
      .from('comunicados' as any)
      .insert(comunicado as any);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  const atualizarComunicado = async (id: string, updates: Partial<Comunicado>) => {
    const { error } = await supabase
      .from('comunicados' as any)
      .update(updates as any)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  const excluirComunicado = async (id: string) => {
    const { error } = await supabase
      .from('comunicados' as any)
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  // CRUD Treinamentos
  const criarTreinamento = async (treinamento: Partial<Treinamento>) => {
    const { error } = await supabase
      .from('treinamentos' as any)
      .insert(treinamento as any);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  const atualizarTreinamento = async (id: string, updates: Partial<Treinamento>) => {
    const { error } = await supabase
      .from('treinamentos' as any)
      .update(updates as any)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  const excluirTreinamento = async (id: string) => {
    const { error } = await supabase
      .from('treinamentos' as any)
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  // Aprovar/Rejeitar Solicitações
  const aprovarSolicitacao = async (id: string, resposta?: string) => {
    const { error } = await supabase
      .from('solicitacoes' as any)
      .update({ status: 'aprovado', resposta } as any)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  const rejeitarSolicitacao = async (id: string, resposta: string) => {
    const { error } = await supabase
      .from('solicitacoes' as any)
      .update({ status: 'rejeitado', resposta } as any)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  // Aprovar/Rejeitar Férias
  const aprovarFerias = async (id: string, aprovadoPor: string) => {
    const { error } = await supabase
      .from('ferias' as any)
      .update({ status: 'aprovado', aprovado_por: aprovadoPor } as any)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  const rejeitarFerias = async (id: string, observacao: string) => {
    const { error } = await supabase
      .from('ferias' as any)
      .update({ status: 'rejeitado', observacao } as any)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  // Aprovar/Rejeitar Empréstimos
  const aprovarEmprestimo = async (id: string) => {
    const { error } = await supabase
      .from('emprestimos' as any)
      .update({ status: 'ativo' } as any)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  const rejeitarEmprestimo = async (id: string, observacao: string) => {
    const { error } = await supabase
      .from('emprestimos' as any)
      .update({ status: 'rejeitado', observacao } as any)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  // Aprovar/Rejeitar Justificativas
  const aprovarJustificativa = async (id: string) => {
    const { error } = await supabase
      .from('justificativas_ponto' as any)
      .update({ status: 'aprovado' } as any)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  const rejeitarJustificativa = async (id: string, resposta: string) => {
    const { error } = await supabase
      .from('justificativas_ponto' as any)
      .update({ status: 'rejeitado', resposta } as any)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await fetchData();
    return { success: true };
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...data,
    isLoading,
    refetch: fetchData,
    // Comunicados
    criarComunicado,
    atualizarComunicado,
    excluirComunicado,
    // Treinamentos
    criarTreinamento,
    atualizarTreinamento,
    excluirTreinamento,
    // Aprovações
    aprovarSolicitacao,
    rejeitarSolicitacao,
    aprovarFerias,
    rejeitarFerias,
    aprovarEmprestimo,
    rejeitarEmprestimo,
    aprovarJustificativa,
    rejeitarJustificativa,
  };
}
