import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Pesquisa {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  anonima: boolean;
  status: string;
  perguntas?: Pergunta[];
  participacao?: Participacao;
}

interface Pergunta {
  id: string;
  pesquisa_id: string;
  texto: string;
  tipo: string;
  categoria: string;
  ordem: number;
  obrigatoria: boolean;
  opcoes: any;
}

interface Resposta {
  id: string;
  pesquisa_id: string;
  pergunta_id: string;
  user_id: string;
  valor_escala: number | null;
  valor_texto: string | null;
}

interface Participacao {
  id: string;
  pesquisa_id: string;
  user_id: string;
  concluida: boolean;
  data_inicio: string | null;
  data_conclusao: string | null;
}

interface HistoricoEngajamento {
  mes: string;
  satisfacao: number;
  engajamento: number;
  enps: number;
}

export function usePesquisasClima() {
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([]);
  const [pesquisaAtual, setPesquisaAtual] = useState<Pesquisa | null>(null);
  const [respostas, setRespostas] = useState<Record<string, number | string>>({});
  const [historico, setHistorico] = useState<HistoricoEngajamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const fetchPesquisas = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch pesquisas ativas
      const { data: pesquisasData, error: pesquisasError } = await supabase
        .from('pesquisas_clima')
        .select('*')
        .eq('status', 'ativo')
        .order('data_fim', { ascending: true });

      if (pesquisasError) throw pesquisasError;

      const pesquisasList = (pesquisasData || []) as Pesquisa[];

      // Fetch participações do usuário
      const { data: participacoesData } = await supabase
        .from('participacoes_clima')
        .select('*')
        .eq('user_id', user.id);

      const participacoes = (participacoesData || []) as Participacao[];

      // Enrich pesquisas with participação
      for (const pesquisa of pesquisasList) {
        pesquisa.participacao = participacoes.find(p => p.pesquisa_id === pesquisa.id);
        
        // Fetch perguntas
        const { data: perguntasData } = await supabase
          .from('perguntas_clima')
          .select('*')
          .eq('pesquisa_id', pesquisa.id)
          .order('ordem', { ascending: true });
        
        pesquisa.perguntas = (perguntasData || []) as Pergunta[];
      }

      setPesquisas(pesquisasList);

      // Set pesquisa atual (primeira não concluída)
      const pendente = pesquisasList.find(p => !p.participacao?.concluida);
      if (pendente) {
        setPesquisaAtual(pendente);
        
        // Fetch respostas existentes
        const { data: respostasData } = await supabase
          .from('respostas_clima')
          .select('*')
          .eq('pesquisa_id', pendente.id)
          .eq('user_id', user.id);

        const respostasMap: Record<string, number | string> = {};
        for (const resp of (respostasData || []) as Resposta[]) {
          respostasMap[resp.pergunta_id] = resp.valor_escala ?? resp.valor_texto ?? '';
        }
        setRespostas(respostasMap);
      }

      // Generate mock histórico for demo
      setHistorico([
        { mes: 'Jul/24', satisfacao: 3.8, engajamento: 4.0, enps: 35 },
        { mes: 'Ago/24', satisfacao: 3.9, engajamento: 4.1, enps: 40 },
        { mes: 'Set/24', satisfacao: 4.0, engajamento: 4.0, enps: 42 },
        { mes: 'Out/24', satisfacao: 4.1, engajamento: 4.2, enps: 48 },
        { mes: 'Nov/24', satisfacao: 4.2, engajamento: 4.3, enps: 52 },
        { mes: 'Dez/24', satisfacao: 4.3, engajamento: 4.4, enps: 55 },
      ]);

    } catch (error) {
      console.error('Erro ao carregar pesquisas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const responderPergunta = (perguntaId: string, valor: number | string) => {
    setRespostas(prev => ({ ...prev, [perguntaId]: valor }));
  };

  const enviarRespostas = async () => {
    if (!user || !pesquisaAtual) return false;

    setIsSaving(true);

    try {
      // Verificar se todas as obrigatórias foram respondidas
      const perguntasObrigatorias = pesquisaAtual.perguntas?.filter(p => p.obrigatoria) || [];
      const naoRespondidas = perguntasObrigatorias.filter(p => !respostas[p.id]);
      
      if (naoRespondidas.length > 0) {
        toast.error('Responda todas as perguntas obrigatórias');
        setIsSaving(false);
        return false;
      }

      // Criar ou atualizar participação
      const { data: participacaoData, error: participacaoError } = await supabase
        .from('participacoes_clima')
        .upsert({
          pesquisa_id: pesquisaAtual.id,
          user_id: user.id,
          concluida: true,
          data_conclusao: new Date().toISOString(),
        }, {
          onConflict: 'pesquisa_id,user_id'
        })
        .select()
        .single();

      if (participacaoError) throw participacaoError;

      // Inserir respostas
      for (const [perguntaId, valor] of Object.entries(respostas)) {
        const pergunta = pesquisaAtual.perguntas?.find(p => p.id === perguntaId);
        if (!pergunta) continue;

        // Delete existing response first
        await supabase
          .from('respostas_clima')
          .delete()
          .eq('pesquisa_id', pesquisaAtual.id)
          .eq('pergunta_id', perguntaId)
          .eq('user_id', user.id);

        // Insert new response
        await supabase.from('respostas_clima').insert({
          pesquisa_id: pesquisaAtual.id,
          pergunta_id: perguntaId,
          user_id: user.id,
          valor_escala: pergunta.tipo === 'escala' ? Number(valor) : null,
          valor_texto: pergunta.tipo === 'texto' ? String(valor) : null,
        });
      }

      toast.success('Respostas enviadas com sucesso! Obrigado por participar.');
      fetchPesquisas();
      return true;

    } catch (error) {
      console.error('Erro ao enviar respostas:', error);
      toast.error('Erro ao enviar respostas');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const getEstatisticas = useCallback(() => {
    const total = pesquisas.length;
    const respondidas = pesquisas.filter(p => p.participacao?.concluida).length;
    const pendentes = total - respondidas;
    
    // Calcular média geral do último histórico
    const ultimo = historico[historico.length - 1];
    const satisfacaoMedia = ultimo?.satisfacao || 0;
    const engajamentoMedio = ultimo?.engajamento || 0;
    const enps = ultimo?.enps || 0;

    return { total, respondidas, pendentes, satisfacaoMedia, engajamentoMedio, enps };
  }, [pesquisas, historico]);

  useEffect(() => {
    fetchPesquisas();
  }, [fetchPesquisas]);

  return {
    pesquisas,
    pesquisaAtual,
    respostas,
    historico,
    isLoading,
    isSaving,
    responderPergunta,
    enviarRespostas,
    getEstatisticas,
    refetch: fetchPesquisas,
  };
}
