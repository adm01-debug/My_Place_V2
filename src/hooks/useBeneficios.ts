import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Dependente {
  id: string;
  nome: string;
  parentesco: 'conjuge' | 'filho' | 'filha' | 'pai' | 'mae' | 'outro';
  data_nascimento: string | null;
  cpf: string | null;
  numero_carteirinha: string | null;
  ativo: boolean;
}

interface Beneficio {
  id: string;
  tipo: string;
  nome: string;
  ativo: boolean;
  credito_mensal: number;
  desconto: number;
  saldo_cartao: number;
  valor_empresa: number;
  valor_mensal: number;
  valor_desconto: number;
  operadora: string | null;
  plano: string | null;
  numero_cartao: string | null;
  numero_carteirinha: string | null;
  ultima_recarga: string | null;
  data_adesao: string | null;
  detalhes: Record<string, unknown>;
  dependentes?: Dependente[];
}

interface ResumoDescontos {
  vt: number;
  vr: number;
  va: number;
  saude: number;
  odonto: number;
  outros: number;
  total: number;
}

interface BeneficiosData {
  beneficios: Beneficio[];
  valeTransporte: Beneficio | null;
  valeRefeicao: Beneficio | null;
  valeAlimentacao: Beneficio | null;
  planoSaude: Beneficio | null;
  planoOdonto: Beneficio | null;
  resumoDescontos: ResumoDescontos;
}

export function useBeneficios() {
  const [data, setData] = useState<BeneficiosData>({
    beneficios: [],
    valeTransporte: null,
    valeRefeicao: null,
    valeAlimentacao: null,
    planoSaude: null,
    planoOdonto: null,
    resumoDescontos: { vt: 0, vr: 0, va: 0, saude: 0, odonto: 0, outros: 0, total: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBeneficios = async () => {
    if (!user) return;

    setIsLoading(true);

    // Fetch benefícios
    const { data: beneficiosData, error: beneficiosError } = await supabase
      .from('beneficios')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .order('tipo');

    if (beneficiosError) {
      console.error('Error fetching beneficios:', beneficiosError);
      toast({
        title: 'Erro ao carregar benefícios',
        description: beneficiosError.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Fetch dependentes para cada benefício de saúde/odonto
    const beneficiosWithDependentes = await Promise.all(
      (beneficiosData || []).map(async (beneficio) => {
        if (['plano_saude', 'plano_odonto'].includes(beneficio.tipo)) {
          const { data: dependentesData } = await supabase
            .from('dependentes_beneficio')
            .select('*')
            .eq('beneficio_id', beneficio.id)
            .eq('ativo', true);
          
          return {
            ...beneficio,
            dependentes: dependentesData || [],
          } as Beneficio;
        }
        return beneficio as Beneficio;
      })
    );

    // Organizar por tipo
    const valeTransporte = beneficiosWithDependentes.find(b => b.tipo === 'vale_transporte') || null;
    const valeRefeicao = beneficiosWithDependentes.find(b => b.tipo === 'vale_refeicao') || null;
    const valeAlimentacao = beneficiosWithDependentes.find(b => b.tipo === 'vale_alimentacao') || null;
    const planoSaude = beneficiosWithDependentes.find(b => b.tipo === 'plano_saude') || null;
    const planoOdonto = beneficiosWithDependentes.find(b => b.tipo === 'plano_odonto') || null;

    // Calcular resumo de descontos
    const resumoDescontos: ResumoDescontos = {
      vt: valeTransporte?.desconto || 0,
      vr: valeRefeicao?.desconto || 0,
      va: valeAlimentacao?.desconto || 0,
      saude: planoSaude?.desconto || 0,
      odonto: planoOdonto?.desconto || 0,
      outros: beneficiosWithDependentes
        .filter(b => !['vale_transporte', 'vale_refeicao', 'vale_alimentacao', 'plano_saude', 'plano_odonto'].includes(b.tipo))
        .reduce((acc, b) => acc + (b.desconto || 0), 0),
      total: 0,
    };
    resumoDescontos.total = resumoDescontos.vt + resumoDescontos.vr + resumoDescontos.va + 
                            resumoDescontos.saude + resumoDescontos.odonto + resumoDescontos.outros;

    setData({
      beneficios: beneficiosWithDependentes,
      valeTransporte,
      valeRefeicao,
      valeAlimentacao,
      planoSaude,
      planoOdonto,
      resumoDescontos,
    });

    setIsLoading(false);
  };

  const adicionarDependente = async (
    beneficioId: string,
    dependente: Omit<Dependente, 'id' | 'ativo'>
  ) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { data, error } = await supabase
      .from('dependentes_beneficio')
      .insert({
        beneficio_id: beneficioId,
        user_id: user.id,
        ...dependente,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchBeneficios();
    return { success: true, data };
  };

  const removerDependente = async (dependenteId: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { error } = await supabase
      .from('dependentes_beneficio')
      .update({ ativo: false })
      .eq('id', dependenteId);

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchBeneficios();
    return { success: true };
  };

  useEffect(() => {
    fetchBeneficios();
  }, [user]);

  return {
    ...data,
    isLoading,
    adicionarDependente,
    removerDependente,
    refetch: fetchBeneficios,
  };
}
