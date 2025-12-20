import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Aniversariante {
  id: string;
  nome: string;
  cargo: string | null;
  departamento: string | null;
  avatar_url: string | null;
  dia: number;
  parabenizado: boolean;
}

interface ProfileWithBirthday {
  id: string;
  nome: string;
  cargo: string | null;
  departamento: string | null;
  avatar_url: string | null;
  data_nascimento: string | null;
}

interface ParabensRecord {
  aniversariante_id: string;
}

export function useAniversariantes() {
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAniversariantes = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const mesAtual = new Date().getMonth() + 1;
      
      // Buscar profiles com aniversário no mês atual
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, nome, cargo, departamento, avatar_url, data_nascimento') as { 
          data: ProfileWithBirthday[] | null; 
          error: any 
        };
      
      if (error) throw error;

      // Filtrar aniversariantes do mês
      const aniversariantesMes = (profiles || [])
        .filter(p => {
          if (!p.data_nascimento) return false;
          const data = new Date(p.data_nascimento);
          return data.getMonth() + 1 === mesAtual;
        })
        .map(p => ({
          id: p.id,
          nome: p.nome,
          cargo: p.cargo,
          departamento: p.departamento,
          avatar_url: p.avatar_url,
          dia: new Date(p.data_nascimento!).getDate(),
          parabenizado: false,
        }))
        .sort((a, b) => a.dia - b.dia);

      // Buscar quem já foi parabenizado
      if (aniversariantesMes.length > 0) {
        const { data: parabens } = await supabase
          .from('aniversario_parabens' as any)
          .select('aniversariante_id')
          .eq('user_id', user.id)
          .eq('mes', mesAtual)
          .eq('ano', new Date().getFullYear()) as { data: ParabensRecord[] | null; error: any };

        const parabenizadosIds = new Set((parabens || []).map(p => p.aniversariante_id));
        
        aniversariantesMes.forEach(a => {
          a.parabenizado = parabenizadosIds.has(a.id);
        });
      }

      setAniversariantes(aniversariantesMes);
    } catch (error) {
      console.error('Erro ao buscar aniversariantes:', error);
    }
    setIsLoading(false);
  };

  const enviarParabens = async (aniversarianteId: string, mensagem?: string) => {
    if (!user) return false;

    try {
      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();

      const { error } = await supabase
        .from('aniversario_parabens' as any)
        .insert({
          user_id: user.id,
          aniversariante_id: aniversarianteId,
          mensagem: mensagem || 'Feliz aniversário! 🎉',
          mes: mesAtual,
          ano: anoAtual,
        } as any);

      if (error) throw error;

      // Atualizar estado local
      setAniversariantes(prev => 
        prev.map(a => 
          a.id === aniversarianteId 
            ? { ...a, parabenizado: true } 
            : a
        )
      );

      toast({
        title: 'Parabéns enviado!',
        description: 'Sua mensagem foi enviada com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Erro ao enviar parabéns:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar os parabéns.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchAniversariantes();
  }, [user]);

  return {
    aniversariantes,
    isLoading,
    enviarParabens,
    refetch: fetchAniversariantes,
  };
}
