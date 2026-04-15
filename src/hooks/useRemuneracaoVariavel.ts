import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('RemuneracaoVariavel');

export type RemuneracaoVariavel = Tables<'remuneracao_variavel'>;
export type RemuneracaoVariavelInsert = TablesInsert<'remuneracao_variavel'>;
export type RemuneracaoVariavelUpdate = TablesUpdate<'remuneracao_variavel'>;

export type TipoRemuneracao = 'comissao' | 'bonificacao' | 'premio' | 'plr' | 'outro';
export type StatusRemuneracao = 'pendente' | 'aprovado' | 'pago' | 'cancelado';

interface RemuneracaoFilters {
  mes?: number;
  ano?: number;
  tipo?: TipoRemuneracao;
  status?: StatusRemuneracao;
}

interface RemuneracaoStats {
  totalAno: number;
  totalMes: number;
  mediaMensal: number;
  porTipo: Record<TipoRemuneracao, number>;
  dadosGrafico: { mes: number; nome: string; valor: number }[];
}

const MESES_NOMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function useRemuneracaoVariavel(filters?: RemuneracaoFilters) {
  const anoAtual = filters?.ano || new Date().getFullYear();
  const mesAtual = filters?.mes || new Date().getMonth() + 1;

  const [remuneracoes, setRemuneracoes] = useState<RemuneracaoVariavel[]>([]);
  const [stats, setStats] = useState<RemuneracaoStats>({
    totalAno: 0,
    totalMes: 0,
    mediaMensal: 0,
    porTipo: { comissao: 0, bonificacao: 0, premio: 0, plr: 0, outro: 0 },
    dadosGrafico: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all remuneracoes with filters
  const fetchRemuneracoes = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('remuneracao_variavel')
        .select('*')
        .eq('user_id', user.id)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.ano) {
        query = query.eq('ano', filters.ano);
      }
      if (filters?.mes) {
        query = query.eq('mes', filters.mes);
      }
      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setRemuneracoes(data || []);

      // Calculate stats for the year
      const { data: anoData } = await supabase
        .from('remuneracao_variavel')
        .select('*')
        .eq('user_id', user.id)
        .eq('ano', anoAtual)
        .in('status', ['aprovado', 'pago']);

      const remuneracoesAno = anoData || [];
      
      // Total do ano
      const totalAno = remuneracoesAno.reduce((acc, r) => acc + Number(r.valor), 0);
      
      // Total do mês atual
      const remuneracoesMes = remuneracoesAno.filter(r => r.mes === mesAtual);
      const totalMes = remuneracoesMes.reduce((acc, r) => acc + Number(r.valor), 0);
      
      // Média mensal (considerando apenas meses com valores)
      const mesesComValor = new Set(remuneracoesAno.map(r => r.mes)).size;
      const mediaMensal = mesesComValor > 0 ? totalAno / mesesComValor : 0;

      // Por tipo
      const porTipo: Record<TipoRemuneracao, number> = {
        comissao: 0,
        bonificacao: 0,
        premio: 0,
        plr: 0,
        outro: 0,
      };
      remuneracoesAno.forEach(r => {
        const tipo = r.tipo as TipoRemuneracao;
        if (tipo in porTipo) {
          porTipo[tipo] += Number(r.valor);
        }
      });

      // Dados para gráfico (12 meses)
      const dadosGrafico = Array.from({ length: 12 }, (_, i) => {
        const mes = i + 1;
        const valorMes = remuneracoesAno
          .filter(r => r.mes === mes)
          .reduce((acc, r) => acc + Number(r.valor), 0);
        return {
          mes,
          nome: MESES_NOMES[i],
          valor: valorMes,
        };
      });

      setStats({
        totalAno,
        totalMes,
        mediaMensal,
        porTipo,
        dadosGrafico,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar remuneração variável';
      setError(message);
      log.error('Error fetching remuneracao:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, filters?.ano, filters?.mes, filters?.tipo, filters?.status, anoAtual, mesAtual]);

  // Create new remuneracao
  const create = async (data: Omit<RemuneracaoVariavelInsert, 'user_id'>): Promise<{ success: boolean; data?: RemuneracaoVariavel; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      const { data: newData, error: insertError } = await supabase
        .from('remuneracao_variavel')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: 'Remuneração registrada',
        description: 'O registro foi criado com sucesso.',
      });

      await fetchRemuneracoes();
      return { success: true, data: newData };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar registro';
      toast({
        title: 'Erro ao criar registro',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    }
  };

  // Update existing remuneracao
  const update = async (id: string, data: RemuneracaoVariavelUpdate): Promise<{ success: boolean; data?: RemuneracaoVariavel; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      const { data: updatedData, error: updateError } = await supabase
        .from('remuneracao_variavel')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: 'Registro atualizado',
        description: 'As alterações foram salvas.',
      });

      await fetchRemuneracoes();
      return { success: true, data: updatedData };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar registro';
      toast({
        title: 'Erro ao atualizar',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    }
  };

  // Delete remuneracao
  const remove = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      const { error: deleteError } = await supabase
        .from('remuneracao_variavel')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Registro removido',
        description: 'O registro foi excluído com sucesso.',
      });

      await fetchRemuneracoes();
      return { success: true };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover registro';
      toast({
        title: 'Erro ao remover',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    }
  };

  // Get single remuneracao by ID
  const getById = async (id: string): Promise<RemuneracaoVariavel | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('remuneracao_variavel')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      log.error('Error fetching remuneracao by id:', error);
      return null;
    }

    return data;
  };

  // Approve remuneracao (for admins)
  const aprovar = async (id: string): Promise<{ success: boolean; error?: string }> => {
    return update(id, { status: 'aprovado', aprovado_por: user?.id });
  };

  // Mark as paid
  const marcarComoPago = async (id: string, dataPagamento?: string): Promise<{ success: boolean; error?: string }> => {
    return update(id, { 
      status: 'pago', 
      data_pagamento: dataPagamento || new Date().toISOString().split('T')[0] 
    });
  };

  // Cancel remuneracao
  const cancelar = async (id: string, observacao?: string): Promise<{ success: boolean; error?: string }> => {
    return update(id, { 
      status: 'cancelado',
      observacao: observacao || 'Cancelado pelo usuário',
    });
  };

  // Get remuneracoes by month
  const getByMes = (mes: number, ano?: number): RemuneracaoVariavel[] => {
    return remuneracoes.filter(r => r.mes === mes && r.ano === (ano || anoAtual));
  };

  // Get remuneracoes by type
  const getByTipo = (tipo: TipoRemuneracao): RemuneracaoVariavel[] => {
    return remuneracoes.filter(r => r.tipo === tipo);
  };

  // Get pending remuneracoes
  const getPendentes = (): RemuneracaoVariavel[] => {
    return remuneracoes.filter(r => r.status === 'pendente');
  };

  // Get approved remuneracoes
  const getAprovados = (): RemuneracaoVariavel[] => {
    return remuneracoes.filter(r => r.status === 'aprovado' || r.status === 'pago');
  };

  useEffect(() => {
    fetchRemuneracoes();
  }, [fetchRemuneracoes]);

  return {
    // Data
    remuneracoes,
    stats,
    isLoading,
    error,
    
    // CRUD operations
    create,
    update,
    remove,
    getById,
    
    // Status operations
    aprovar,
    marcarComoPago,
    cancelar,
    
    // Filter helpers
    getByMes,
    getByTipo,
    getPendentes,
    getAprovados,
    
    // Refetch
    refetch: fetchRemuneracoes,
  };
}
