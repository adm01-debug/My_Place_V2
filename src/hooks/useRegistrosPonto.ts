import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RegistroPonto {
  id: string;
  tipo: 'entrada' | 'saida' | 'intervalo_inicio' | 'intervalo_fim';
  data_hora: string;
  latitude: number | null;
  longitude: number | null;
  endereco: string | null;
  status: 'aprovado' | 'pendente' | 'rejeitado' | 'fora_area';
  observacao: string | null;
}

export function useRegistrosPonto() {
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRegistros = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('registros_ponto')
      .select('*')
      .eq('user_id', user.id)
      .order('data_hora', { ascending: false });

    if (error) {
      console.error('Error fetching registros:', error);
      toast({
        title: 'Erro ao carregar registros',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setRegistros(data as RegistroPonto[]);
    }
    setIsLoading(false);
  };

  const registrarPonto = async (
    tipo: RegistroPonto['tipo'],
    latitude?: number,
    longitude?: number,
    endereco?: string
  ) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { data, error } = await supabase
      .from('registros_ponto')
      .insert({
        user_id: user.id,
        tipo,
        latitude,
        longitude,
        endereco,
        status: 'aprovado',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    setRegistros(prev => [data as RegistroPonto, ...prev]);
    return { success: true, data };
  };

  useEffect(() => {
    fetchRegistros();
  }, [user]);

  return {
    registros,
    isLoading,
    registrarPonto,
    refetch: fetchRegistros,
  };
}
