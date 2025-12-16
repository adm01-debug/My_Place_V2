import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Parcela {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;
  data_pagamento: string | null;
  status: 'pendente' | 'paga' | 'atrasada';
}

interface Emprestimo {
  id: string;
  numero_contrato: string;
  valor_original: number;
  taxa_juros: number;
  total_com_juros: number;
  quantidade_parcelas: number;
  valor_parcela: number;
  parcelas_pagas: number;
  saldo_devedor: number;
  status: 'ativo' | 'quitado' | 'cancelado';
  data_contratacao: string;
  motivo: string | null;
  observacao: string | null;
  created_at: string;
  parcelas?: Parcela[];
}

export function useEmprestimos() {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEmprestimos = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    // Fetch emprestimos
    const { data: emprestimosData, error: emprestimosError } = await supabase
      .from('emprestimos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (emprestimosError) {
      console.error('Error fetching emprestimos:', emprestimosError);
      toast({
        title: 'Erro ao carregar empréstimos',
        description: emprestimosError.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Fetch parcelas for each emprestimo
    const emprestimosWithParcelas = await Promise.all(
      (emprestimosData || []).map(async (emp) => {
        const { data: parcelasData } = await supabase
          .from('parcelas_emprestimo')
          .select('*')
          .eq('emprestimo_id', emp.id)
          .order('numero', { ascending: true });
        
        return {
          ...emp,
          parcelas: parcelasData || [],
        } as Emprestimo;
      })
    );

    setEmprestimos(emprestimosWithParcelas);
    setIsLoading(false);
  };

  const solicitarEmprestimo = async (
    valor_original: number,
    quantidade_parcelas: number,
    motivo: string,
    observacao?: string
  ) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const taxa_juros = 1.5; // 1.5% ao mês
    const total_com_juros = valor_original * Math.pow(1 + taxa_juros / 100, quantidade_parcelas);
    const valor_parcela = total_com_juros / quantidade_parcelas;
    const numero_contrato = `EMP-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from('emprestimos')
      .insert({
        user_id: user.id,
        numero_contrato,
        valor_original,
        taxa_juros,
        total_com_juros,
        quantidade_parcelas,
        valor_parcela,
        saldo_devedor: total_com_juros,
        motivo,
        observacao,
        status: 'ativo',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Create parcelas
    const parcelas = Array.from({ length: quantidade_parcelas }, (_, i) => {
      const vencimento = new Date();
      vencimento.setMonth(vencimento.getMonth() + i + 1);
      return {
        emprestimo_id: data.id,
        numero: i + 1,
        valor: valor_parcela,
        vencimento: vencimento.toISOString().split('T')[0],
        status: 'pendente',
      };
    });

    await supabase.from('parcelas_emprestimo').insert(parcelas);

    await fetchEmprestimos();
    return { success: true, data };
  };

  const anteciparParcela = async (parcelaId: string, emprestimoId: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    // Get current emprestimo data
    const emprestimo = emprestimos.find(e => e.id === emprestimoId);
    if (!emprestimo) return { success: false, error: 'Empréstimo não encontrado' };

    const parcela = emprestimo.parcelas?.find(p => p.id === parcelaId);
    if (!parcela) return { success: false, error: 'Parcela não encontrada' };

    if (parcela.status === 'paga') {
      return { success: false, error: 'Parcela já foi paga' };
    }

    // Update parcela status
    const { error: parcelaError } = await supabase
      .from('parcelas_emprestimo')
      .update({ 
        status: 'paga', 
        data_pagamento: new Date().toISOString().split('T')[0] 
      })
      .eq('id', parcelaId);

    if (parcelaError) {
      return { success: false, error: parcelaError.message };
    }

    // Update emprestimo totals
    const novasParcPagas = emprestimo.parcelas_pagas + 1;
    const novoSaldoDevedor = emprestimo.saldo_devedor - parcela.valor;
    const novoStatus = novasParcPagas >= emprestimo.quantidade_parcelas ? 'quitado' : 'ativo';

    const { error: empError } = await supabase
      .from('emprestimos')
      .update({
        parcelas_pagas: novasParcPagas,
        saldo_devedor: novoSaldoDevedor,
        status: novoStatus,
      })
      .eq('id', emprestimoId);

    if (empError) {
      return { success: false, error: empError.message };
    }

    await fetchEmprestimos();
    return { success: true };
  };

  useEffect(() => {
    fetchEmprestimos();
  }, [user]);

  return {
    emprestimos,
    isLoading,
    solicitarEmprestimo,
    anteciparParcela,
    refetch: fetchEmprestimos,
  };
}
