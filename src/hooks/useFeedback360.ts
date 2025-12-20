import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Ciclo {
  id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string;
  status: string;
  tipo: string;
}

interface Competencia {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  peso: number;
}

interface Avaliacao {
  id: string;
  ciclo_id: string;
  avaliador_id: string;
  avaliado_id: string;
  tipo: string;
  status: string;
  nota_geral: number | null;
  comentario_geral: string | null;
  pontos_fortes: string | null;
  pontos_melhoria: string | null;
  data_envio: string | null;
  avaliado?: { nome: string; cargo: string | null; avatar_url: string | null };
  avaliador?: { nome: string; cargo: string | null; avatar_url: string | null };
  ciclo?: Ciclo;
  notas_competencias?: NotaCompetencia[];
}

interface NotaCompetencia {
  id: string;
  avaliacao_id: string;
  competencia_id: string;
  nota: number;
  comentario: string | null;
  competencia?: Competencia;
}

export function useFeedback360() {
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [avaliacoesEnviadas, setAvaliacoesEnviadas] = useState<Avaliacao[]>([]);
  const [avaliacoesRecebidas, setAvaliacoesRecebidas] = useState<Avaliacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch ciclos ativos
      const { data: ciclosData } = await supabase
        .from('ciclos_avaliacao')
        .select('*')
        .eq('status', 'ativo')
        .order('data_fim', { ascending: true });

      setCiclos((ciclosData || []) as Ciclo[]);

      // Fetch competencias
      const { data: competenciasData } = await supabase
        .from('competencias')
        .select('*')
        .eq('ativa', true)
        .order('categoria', { ascending: true });

      setCompetencias((competenciasData || []) as Competencia[]);

      // Fetch avaliações enviadas
      const { data: enviadasData } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('avaliador_id', user.id)
        .order('created_at', { ascending: false });

      // Enrich with profile data
      const enviadas = (enviadasData || []) as Avaliacao[];
      for (const av of enviadas) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, cargo, avatar_url')
          .eq('id', av.avaliado_id)
          .maybeSingle();
        av.avaliado = profile || undefined;
      }
      setAvaliacoesEnviadas(enviadas);

      // Fetch avaliações recebidas
      const { data: recebidasData } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('avaliado_id', user.id)
        .eq('status', 'enviado')
        .order('data_envio', { ascending: false });

      const recebidas = (recebidasData || []) as Avaliacao[];
      for (const av of recebidas) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, cargo, avatar_url')
          .eq('id', av.avaliador_id)
          .maybeSingle();
        av.avaliador = profile || undefined;
        
        // Fetch notas por competência
        const { data: notas } = await supabase
          .from('avaliacoes_competencias')
          .select('*')
          .eq('avaliacao_id', av.id);
        av.notas_competencias = (notas || []) as NotaCompetencia[];
      }
      setAvaliacoesRecebidas(recebidas);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const criarAvaliacao = async (
    cicloId: string,
    avaliadoId: string,
    tipo: 'par' | 'gestor' | 'auto'
  ) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('avaliacoes')
      .insert({
        ciclo_id: cicloId,
        avaliador_id: user.id,
        avaliado_id: avaliadoId,
        tipo,
        status: 'pendente',
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar avaliação');
      return null;
    }

    toast.success('Avaliação criada com sucesso');
    fetchData();
    return data;
  };

  const enviarAvaliacao = async (
    avaliacaoId: string,
    dados: {
      nota_geral: number;
      comentario_geral: string;
      pontos_fortes: string;
      pontos_melhoria: string;
      notas_competencias: { competencia_id: string; nota: number; comentario?: string }[];
    }
  ) => {
    // Atualizar avaliação
    const { error: updateError } = await supabase
      .from('avaliacoes')
      .update({
        nota_geral: dados.nota_geral,
        comentario_geral: dados.comentario_geral,
        pontos_fortes: dados.pontos_fortes,
        pontos_melhoria: dados.pontos_melhoria,
        status: 'enviado',
        data_envio: new Date().toISOString(),
      })
      .eq('id', avaliacaoId);

    if (updateError) {
      toast.error('Erro ao enviar avaliação');
      return false;
    }

    // Inserir notas por competência
    for (const nota of dados.notas_competencias) {
      await supabase.from('avaliacoes_competencias').insert({
        avaliacao_id: avaliacaoId,
        competencia_id: nota.competencia_id,
        nota: nota.nota,
        comentario: nota.comentario || null,
      });
    }

    toast.success('Avaliação enviada com sucesso!');
    fetchData();
    return true;
  };

  const calcularMediaRecebida = useCallback(() => {
    if (avaliacoesRecebidas.length === 0) return 0;
    const soma = avaliacoesRecebidas.reduce((acc, av) => acc + (av.nota_geral || 0), 0);
    return soma / avaliacoesRecebidas.length;
  }, [avaliacoesRecebidas]);

  const getEstatisticas = useCallback(() => {
    const pendentes = avaliacoesEnviadas.filter(a => a.status === 'pendente').length;
    const enviadas = avaliacoesEnviadas.filter(a => a.status === 'enviado').length;
    const recebidas = avaliacoesRecebidas.length;
    const media = calcularMediaRecebida();

    return { pendentes, enviadas, recebidas, media };
  }, [avaliacoesEnviadas, avaliacoesRecebidas, calcularMediaRecebida]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ciclos,
    competencias,
    avaliacoesEnviadas,
    avaliacoesRecebidas,
    isLoading,
    criarAvaliacao,
    enviarAvaliacao,
    getEstatisticas,
    refetch: fetchData,
  };
}
