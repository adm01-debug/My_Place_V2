import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type TipoItem = 
  | 'comissao_vendas' | 'bonus_meta' | 'bonus_produtividade' 
  | 'plr' | 'premio_assiduidade' | 'gratificacao' | 'hora_extra'
  | 'adicional_noturno' | 'periculosidade' | 'insalubridade' | 'outros';

type StatusRemuneracao = 'previsto' | 'confirmado' | 'pago' | 'cancelado';
type StatusMeta = 'em_andamento' | 'atingida' | 'nao_atingida' | 'cancelada';

interface ItemRemuneracao {
  id: string;
  tipo: TipoItem;
  descricao: string;
  base: number | null;
  percentual: number | null;
  valor: number;
  referencia: string | null;
}

interface RemuneracaoVariavel {
  id: string;
  mes: number;
  ano: number;
  total: number;
  status: StatusRemuneracao;
  data_pagamento: string | null;
  observacao: string | null;
  itens: ItemRemuneracao[];
}

interface Meta {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  valor_meta: number;
  valor_atual: number;
  unidade: string;
  bonus: number;
  bonus_percentual: number | null;
  periodo: string;
  data_inicio: string;
  data_fim: string;
  status: StatusMeta;
  percentual: number; // Calculado
}

interface RemuneracaoData {
  remuneracoes: RemuneracaoVariavel[];
  metas: Meta[];
  totalAno: number;
  mediaMensal: number;
  dadosGrafico: { mes: number; valor: number }[];
}

export function useRemuneracaoVariavel(ano?: number) {
  const anoAtual = ano || new Date().getFullYear();
  const [data, setData] = useState<RemuneracaoData>({
    remuneracoes: [],
    metas: [],
    totalAno: 0,
    mediaMensal: 0,
    dadosGrafico: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRemuneracao = async () => {
    if (!user) return;

    setIsLoading(true);

    // Fetch remunerações do ano
    const { data: remuneracoesData, error: remError } = await supabase
      .from('remuneracao_variavel' as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('ano', anoAtual)
      .order('mes', { ascending: false }) as { data: any[] | null; error: any };

    if (remError) {
      console.error('Error fetching remuneracao:', remError);
      toast({
        title: 'Erro ao carregar remuneração variável',
        description: remError.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Fetch itens de cada remuneração
    const remuneracoesWithItens = await Promise.all(
      (remuneracoesData || []).map(async (rem) => {
        const { data: itensData } = await supabase
          .from('itens_remuneracao' as any)
          .select('*')
          .eq('remuneracao_id', rem.id) as { data: any[] | null };

        return {
          ...rem,
          itens: (itensData || []) as ItemRemuneracao[],
        } as RemuneracaoVariavel;
      })
    );

    // Fetch metas ativas
    const { data: metasData } = await supabase
      .from('metas')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['em_andamento', 'atingida'])
      .order('data_fim', { ascending: true });

    // Processar metas com percentual calculado
    const metas = (metasData || []).map(meta => ({
      ...meta,
      percentual: meta.valor_meta > 0 
        ? Math.min(100, Math.round((meta.valor_atual / meta.valor_meta) * 100))
        : 0,
    })) as Meta[];

    // Calcular totais
    const totalAno = remuneracoesWithItens.reduce((acc, r) => acc + Number(r.total), 0);
    const mesesComValor = remuneracoesWithItens.filter(r => Number(r.total) > 0).length;
    const mediaMensal = mesesComValor > 0 ? totalAno / mesesComValor : 0;

    // Dados para gráfico (12 meses)
    const dadosGrafico = Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const rem = remuneracoesWithItens.find(r => r.mes === mes);
      return {
        mes,
        valor: rem ? Number(rem.total) : 0,
      };
    });

    setData({
      remuneracoes: remuneracoesWithItens,
      metas,
      totalAno,
      mediaMensal,
      dadosGrafico,
    });

    setIsLoading(false);
  };

  const atualizarMeta = async (metaId: string, valorAtual: number) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    // Buscar meta atual para verificar se atingiu
    const meta = data.metas.find(m => m.id === metaId);
    if (!meta) return { success: false, error: 'Meta não encontrada' };

    const novoStatus = valorAtual >= meta.valor_meta ? 'atingida' : 'em_andamento';

    const { error } = await supabase
      .from('metas')
      .update({
        valor_atual: valorAtual,
        status: novoStatus,
      })
      .eq('id', metaId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchRemuneracao();
    return { success: true };
  };

  const getRemuneracaoPorMes = (mes: number): RemuneracaoVariavel | undefined => {
    return data.remuneracoes.find(r => r.mes === mes);
  };

  const getMetasAtivas = (): Meta[] => {
    return data.metas.filter(m => m.status === 'em_andamento');
  };

  const getMetasAtingidas = (): Meta[] => {
    return data.metas.filter(m => m.status === 'atingida');
  };

  useEffect(() => {
    fetchRemuneracao();
  }, [user, anoAtual]);

  return {
    ...data,
    isLoading,
    atualizarMeta,
    getRemuneracaoPorMes,
    getMetasAtivas,
    getMetasAtingidas,
    refetch: fetchRemuneracao,
  };
}
