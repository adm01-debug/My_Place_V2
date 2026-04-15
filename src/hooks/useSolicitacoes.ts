import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';

const log = createLogger('Solicitacoes');

interface Solicitacao {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado' | 'concluido';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  resposta: string | null;
  created_at: string;
  updated_at: string;
}

export function useSolicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSolicitacoes = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('solicitacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      log.error('Error fetching solicitacoes:', error);
      toast({
        title: 'Erro ao carregar solicitações',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSolicitacoes(data as Solicitacao[]);
    }
    setIsLoading(false);
  };

  const criarSolicitacao = async (
    tipo: string,
    titulo: string,
    descricao?: string,
    prioridade: Solicitacao['prioridade'] = 'normal'
  ) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { data, error } = await supabase
      .from('solicitacoes')
      .insert({
        user_id: user.id,
        tipo,
        titulo,
        descricao,
        prioridade,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    setSolicitacoes(prev => [data as Solicitacao, ...prev]);
    return { success: true, data };
  };

  useEffect(() => {
    fetchSolicitacoes();
  }, [user]);

  return {
    solicitacoes,
    isLoading,
    criarSolicitacao,
    refetch: fetchSolicitacoes,
  };
}
