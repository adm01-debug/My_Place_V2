import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type MotivoJustificativa = 
  | 'esquecimento' | 'problema_sistema' | 'trabalho_externo'
  | 'reuniao_externa' | 'atestado_medico' | 'outros';

type StatusJustificativa = 'pendente' | 'aprovado' | 'rejeitado';

interface Justificativa {
  id: string;
  registro_ponto_id: string;
  motivo: MotivoJustificativa;
  descricao: string;
  anexo_url: string | null;
  status: StatusJustificativa;
  aprovado_por: string | null;
  aprovado_em: string | null;
  motivo_rejeicao: string | null;
  created_at: string;
}

export function useJustificativasPonto() {
  const [justificativas, setJustificativas] = useState<Justificativa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchJustificativas = async () => {
    if (!user) return;

    setIsLoading(true);

    const { data, error } = await supabase
      .from('justificativas_ponto' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }) as { data: any[] | null; error: any };

    if (error) {
      console.error('Error fetching justificativas:', error);
      toast({
        title: 'Erro ao carregar justificativas',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setJustificativas((data || []) as Justificativa[]);
    }

    setIsLoading(false);
  };

  const criarJustificativa = async (
    registroPontoId: string,
    motivo: MotivoJustificativa,
    descricao: string,
    anexoUrl?: string
  ) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { data, error } = await supabase
      .from('justificativas_ponto' as any)
      .insert({
        registro_ponto_id: registroPontoId,
        user_id: user.id,
        motivo,
        descricao,
        anexo_url: anexoUrl || null,
      } as any)
      .select()
      .single() as { data: any; error: any };

    if (error) {
      return { success: false, error: error.message };
    }

    setJustificativas(prev => [data as Justificativa, ...prev]);
    return { success: true, data };
  };

  const atualizarJustificativa = async (
    justificativaId: string,
    descricao: string,
    anexoUrl?: string
  ) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { error } = await supabase
      .from('justificativas_ponto' as any)
      .update({
        descricao,
        anexo_url: anexoUrl,
      } as any)
      .eq('id', justificativaId)
      .eq('user_id', user.id)
      .eq('status', 'pendente');

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchJustificativas();
    return { success: true };
  };

  const getJustificativaPorRegistro = (registroPontoId: string): Justificativa | undefined => {
    return justificativas.find(j => j.registro_ponto_id === registroPontoId);
  };

  const getPendentes = (): Justificativa[] => {
    return justificativas.filter(j => j.status === 'pendente');
  };

  useEffect(() => {
    fetchJustificativas();
  }, [user]);

  return {
    justificativas,
    isLoading,
    criarJustificativa,
    atualizarJustificativa,
    getJustificativaPorRegistro,
    getPendentes,
    refetch: fetchJustificativas,
  };
}
