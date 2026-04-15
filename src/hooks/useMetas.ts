import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface KeyResult {
  id: string;
  meta_id: string;
  titulo: string;
  descricao?: string | null;
  valor_meta: number;
  valor_atual: number;
  unidade: string;
  peso: number;
}

export interface Meta {
  id: string;
  user_id: string;
  titulo: string;
  descricao?: string | null;
  tipo: string;
  status: string;
  data_inicio: string;
  data_fim: string;
  valor_meta: number;
  valor_atual: number;
  unidade: string;
  key_results?: KeyResult[];
  progresso?: number;
}

export interface MetaFormData {
  titulo: string;
  descricao?: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  valor_meta: number;
  unidade: string;
}

export interface KeyResultFormData {
  titulo: string;
  descricao?: string;
  valor_meta: number;
  unidade: string;
  peso?: number;
}

export function useMetas() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const calcularProgresso = (meta: Meta): number => {
    if (meta.key_results && meta.key_results.length > 0) {
      const pesoTotal = meta.key_results.reduce((sum, kr) => sum + kr.peso, 0);
      const progressoPonderado = meta.key_results.reduce((sum, kr) => {
        const progressoKr = Math.min((kr.valor_atual / kr.valor_meta) * 100, 100);
        return sum + (progressoKr * kr.peso);
      }, 0);
      return Math.round(progressoPonderado / pesoTotal);
    }
    return meta.valor_meta > 0 
      ? Math.min(Math.round((meta.valor_atual / meta.valor_meta) * 100), 100)
      : 0;
  };

  const fetchMetas = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Buscar metas
      const { data: metasData, error: metasError } = await supabase
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .order('data_fim', { ascending: true });

      if (metasError) throw metasError;

      // Buscar key results
      const metaIds = metasData?.map(m => m.id) || [];
      let keyResultsData: any[] = [];
      
      if (metaIds.length > 0) {
        const { data: krData, error: krError } = await supabase
          .from('key_results')
          .select('*')
          .in('meta_id', metaIds)
          .order('created_at');

        if (krError) throw krError;
        keyResultsData = krData || [];
      }

      // Combinar metas com key results
      const metasComKr = (metasData || []).map(meta => {
        const krs = keyResultsData.filter(kr => kr.meta_id === meta.id);
        const metaComKr = {
          ...meta,
          key_results: krs,
        };
        return {
          ...metaComKr,
          progresso: calcularProgresso(metaComKr),
        };
      });

      setMetas(metasComKr);
    } catch (err) {
      console.error('Erro ao buscar metas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar metas');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const criarMeta = async (data: MetaFormData): Promise<Meta | null> => {
    if (!user) return null;

    try {
      const { data: novaMeta, error } = await supabase
        .from('metas')
        .insert({
          user_id: user.id,
          titulo: data.titulo,
          descricao: data.descricao,
          tipo: data.tipo,
          data_inicio: data.data_inicio,
          data_fim: data.data_fim,
          valor_meta: data.valor_meta,
          valor_atual: 0,
          unidade: data.unidade,
          status: 'em_andamento',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Meta criada com sucesso!');
      await fetchMetas();
      return novaMeta;
    } catch (err) {
      console.error('Erro ao criar meta:', err);
      toast.error('Erro ao criar meta');
      return null;
    }
  };

  const atualizarMeta = async (id: string, data: Partial<Meta>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('metas')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast.success('Meta atualizada!');
      await fetchMetas();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar meta:', err);
      toast.error('Erro ao atualizar meta');
      return false;
    }
  };

  const atualizarProgresso = async (id: string, valorAtual: number): Promise<boolean> => {
    return atualizarMeta(id, { valor_atual: valorAtual });
  };

  const adicionarKeyResult = async (metaId: string, data: KeyResultFormData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('key_results')
        .insert({
          meta_id: metaId,
          titulo: data.titulo,
          descricao: data.descricao,
          valor_meta: data.valor_meta,
          valor_atual: 0,
          unidade: data.unidade,
          peso: data.peso || 1,
        });

      if (error) throw error;

      toast.success('Key Result adicionado!');
      await fetchMetas();
      return true;
    } catch (err) {
      console.error('Erro ao adicionar key result:', err);
      toast.error('Erro ao adicionar key result');
      return false;
    }
  };

  const atualizarKeyResult = async (id: string, valorAtual: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('key_results')
        .update({ valor_atual: valorAtual })
        .eq('id', id);

      if (error) throw error;

      toast.success('Progresso atualizado!');
      await fetchMetas();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar key result:', err);
      toast.error('Erro ao atualizar progresso');
      return false;
    }
  };

  const excluirMeta = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Meta excluída!');
      await fetchMetas();
      return true;
    } catch (err) {
      console.error('Erro ao excluir meta:', err);
      toast.error('Erro ao excluir meta');
      return false;
    }
  };

  useEffect(() => {
    fetchMetas();
  }, [fetchMetas]);

  // Estatísticas
  const stats = {
    total: metas.length,
    emAndamento: metas.filter(m => m.status === 'em_andamento').length,
    concluidas: metas.filter(m => m.status === 'concluida').length,
    atrasadas: metas.filter(m => {
      const hoje = new Date();
      const dataFim = new Date(m.data_fim);
      return dataFim < hoje && m.status === 'em_andamento';
    }).length,
    progressoMedio: metas.length > 0 
      ? Math.round(metas.reduce((sum, m) => sum + (m.progresso || 0), 0) / metas.length)
      : 0,
  };

  return {
    metas,
    isLoading,
    error,
    stats,
    refetch: fetchMetas,
    criarMeta,
    atualizarMeta,
    atualizarProgresso,
    adicionarKeyResult,
    atualizarKeyResult,
    excluirMeta,
  };
}
