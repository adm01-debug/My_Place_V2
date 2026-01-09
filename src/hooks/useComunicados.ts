import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type CategoriaComunicado = 
  | 'RH' | 'Financeiro' | 'Institucional' | 'Saúde' 
  | 'TI' | 'Eventos' | 'Benefícios' | 'Treinamentos' | 'Outros';

interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  resumo: string | null;
  categoria: CategoriaComunicado;
  importante: boolean;
  fixado: boolean;
  anexo_url: string | null;
  anexo_nome: string | null;
  data_publicacao: string;
  lido: boolean;
  lido_em: string | null;
}

interface ComunicadosData {
  comunicados: Comunicado[];
  importantes: Comunicado[];
  naoLidos: Comunicado[];
  totalNaoLidos: number;
}

export function useComunicados() {
  const [data, setData] = useState<ComunicadosData>({
    comunicados: [],
    importantes: [],
    naoLidos: [],
    totalNaoLidos: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComunicados = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);

    // Fetch comunicados com status de leitura
    const { data: comunicadosData, error } = await supabase
      .from('comunicados')
      .select(`
        *,
        comunicados_lidos!left(id, lido_em)
      `)
      .eq('ativo', true)
      .or('data_expiracao.is.null,data_expiracao.gt.now()')
      .order('fixado', { ascending: false })
      .order('importante', { ascending: false })
      .order('data_publicacao', { ascending: false });

    if (error) {
      console.error('Error fetching comunicados:', error);
      toast({
        title: 'Erro ao carregar comunicados',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Processar dados
    const comunicados = (comunicadosData || []).map((c: any) => {
      const leitura = Array.isArray(c.comunicados_lidos) 
        ? c.comunicados_lidos.find((l: any) => l) 
        : c.comunicados_lidos;
      
      return {
        id: c.id,
        titulo: c.titulo,
        conteudo: c.conteudo,
        resumo: c.resumo,
        categoria: c.categoria as CategoriaComunicado,
        importante: c.importante,
        fixado: c.fixado,
        anexo_url: c.anexo_url,
        anexo_nome: c.anexo_nome,
        data_publicacao: c.data_publicacao,
        lido: !!leitura,
        lido_em: leitura?.lido_em || null,
      } as Comunicado;
    });

    const importantes = comunicados.filter(c => c.importante);
    const naoLidos = comunicados.filter(c => !c.lido);

    setData({
      comunicados,
      importantes,
      naoLidos,
      totalNaoLidos: naoLidos.length,
    });

    setIsLoading(false);
  }, [user, toast]);

  const marcarComoLido = async (comunicadoId: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { error } = await supabase
      .from('comunicados_lidos')
      .upsert({
        comunicado_id: comunicadoId,
        user_id: user.id,
        lido_em: new Date().toISOString(),
      }, {
        onConflict: 'comunicado_id,user_id',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Atualizar estado local
    setData(prev => ({
      ...prev,
      comunicados: prev.comunicados.map(c => 
        c.id === comunicadoId ? { ...c, lido: true, lido_em: new Date().toISOString() } : c
      ),
      naoLidos: prev.naoLidos.filter(c => c.id !== comunicadoId),
      totalNaoLidos: prev.totalNaoLidos - 1,
    }));

    return { success: true };
  };

  const marcarTodosComoLidos = async () => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const naoLidosIds = data.naoLidos.map(c => c.id);
    
    if (naoLidosIds.length === 0) {
      return { success: true };
    }

    const inserts = naoLidosIds.map(comunicado_id => ({
      comunicado_id,
      user_id: user.id,
      lido_em: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('comunicados_lidos')
      .upsert(inserts, {
        onConflict: 'comunicado_id,user_id',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchComunicados();
    return { success: true };
  };

  const getComunicadosPorCategoria = (categoria: CategoriaComunicado): Comunicado[] => {
    return data.comunicados.filter(c => c.categoria === categoria);
  };

  const getComunicadosRecentes = (limite: number = 3): Comunicado[] => {
    return data.comunicados.slice(0, limite);
  };

  // Realtime subscription para novos comunicados
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('comunicados-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comunicados',
        },
        (payload) => {
          // Novo comunicado publicado
          toast({
            title: 'Novo comunicado',
            description: (payload.new as any).titulo,
          });
          fetchComunicados();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchComunicados, toast]);

  useEffect(() => {
    fetchComunicados();
  }, [fetchComunicados]);

  return {
    ...data,
    isLoading,
    marcarComoLido,
    marcarTodosComoLidos,
    getComunicadosPorCategoria,
    getComunicadosRecentes,
    refetch: fetchComunicados,
  };
}
