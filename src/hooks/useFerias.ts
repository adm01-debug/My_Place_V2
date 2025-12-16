import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Ferias {
  id: string;
  data_inicio: string;
  data_fim: string;
  dias_solicitados: number;
  tipo: 'ferias' | 'abono' | 'venda';
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
  observacao: string | null;
  created_at: string;
}

export function useFerias() {
  const [ferias, setFerias] = useState<Ferias[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFerias = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('ferias')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ferias:', error);
      toast({
        title: 'Erro ao carregar férias',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setFerias(data as Ferias[]);
    }
    setIsLoading(false);
  };

  const solicitarFerias = async (
    data_inicio: string,
    data_fim: string,
    dias_solicitados: number,
    tipo: Ferias['tipo'] = 'ferias',
    observacao?: string
  ) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { data, error } = await supabase
      .from('ferias')
      .insert({
        user_id: user.id,
        data_inicio,
        data_fim,
        dias_solicitados,
        tipo,
        observacao,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    setFerias(prev => [data as Ferias, ...prev]);
    return { success: true, data };
  };

  useEffect(() => {
    fetchFerias();
  }, [user]);

  return {
    ferias,
    isLoading,
    solicitarFerias,
    refetch: fetchFerias,
  };
}
