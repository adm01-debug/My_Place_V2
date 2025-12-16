import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Holerite {
  id: string;
  mes: number;
  ano: number;
  salario_bruto: number;
  descontos: number;
  salario_liquido: number;
  detalhes: Record<string, unknown> | null;
  pdf_url: string | null;
  created_at: string;
}

export function useHolerites() {
  const [holerites, setHolerites] = useState<Holerite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchHolerites = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('holerites')
      .select('*')
      .eq('user_id', user.id)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false });

    if (error) {
      console.error('Error fetching holerites:', error);
      toast({
        title: 'Erro ao carregar holerites',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setHolerites(data as Holerite[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHolerites();
  }, [user]);

  return {
    holerites,
    isLoading,
    refetch: fetchHolerites,
  };
}
