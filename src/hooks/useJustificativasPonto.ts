import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';

const log = createLogger('JustificativasPonto');

export type TipoJustificativa = 
  | 'atestado' 
  | 'falta_justificada' 
  | 'atraso' 
  | 'saida_antecipada'
  | 'esquecimento'
  | 'outros';

export type StatusJustificativa = 'pendente' | 'aprovado' | 'rejeitado';

export interface Justificativa {
  id: string;
  user_id: string;
  registro_ponto_id: string | null;
  data: string;
  tipo: TipoJustificativa;
  motivo: string;
  anexo_url: string | null;
  status: StatusJustificativa;
  resposta: string | null;
  aprovado_por: string | null;
  created_at: string;
  updated_at: string;
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
      .from('justificativas_ponto')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      log.error('Error fetching justificativas:', error);
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
    data: string,
    tipo: TipoJustificativa,
    motivo: string,
    registroPontoId?: string,
    anexoUrl?: string
  ) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { data: result, error } = await supabase
      .from('justificativas_ponto')
      .insert({
        user_id: user.id,
        data,
        tipo,
        motivo,
        registro_ponto_id: registroPontoId || null,
        anexo_url: anexoUrl || null,
        status: 'pendente',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    setJustificativas(prev => [result as Justificativa, ...prev]);
    return { success: true, data: result };
  };

  const uploadAnexo = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('atestados')
      .upload(fileName, file);

    if (error) {
      log.error('Error uploading anexo:', error);
      toast({
        title: 'Erro ao enviar arquivo',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('atestados')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const atualizarJustificativa = async (
    justificativaId: string,
    motivo: string,
    anexoUrl?: string
  ) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { error } = await supabase
      .from('justificativas_ponto')
      .update({
        motivo,
        anexo_url: anexoUrl,
      })
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

  const getJustificativaPorData = (data: string): Justificativa | undefined => {
    return justificativas.find(j => j.data === data);
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
    uploadAnexo,
    atualizarJustificativa,
    getJustificativaPorRegistro,
    getJustificativaPorData,
    getPendentes,
    refetch: fetchJustificativas,
  };
}
