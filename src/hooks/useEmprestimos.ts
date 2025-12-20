import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, addMonths, isBefore, isAfter } from 'date-fns';

type StatusEmprestimo = 'ativo' | 'quitado' | 'cancelado';
type StatusParcela = 'pendente' | 'paga' | 'atrasada';

interface Parcela {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;
  data_pagamento: string | null;
  status: StatusParcela;
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
  status: StatusEmprestimo;
  data_contratacao: string;
  motivo: string | null;
  observacao: string | null;
  created_at: string;
  parcelas: Parcela[];
}

interface SimulacaoEmprestimo {
  valor_original: number;
  taxa_juros: number;
  quantidade_parcelas: number;
  total_com_juros: number;
  valor_parcela: number;
  custo_total: number;
}

export function useEmprestimos() {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [emprestimoAtivo, setEmprestimoAtivo] = useState<Emprestimo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEmprestimos = async () => {
    if (!user) return;

    setIsLoading(true);

    // Fetch empréstimos
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

    // Fetch parcelas para cada empréstimo
    const emprestimosWithParcelas = await Promise.all(
      (emprestimosData || []).map(async (emp) => {
        const { data: parcelasData } = await supabase
          .from('parcelas_emprestimo')
          .select('*')
          .eq('emprestimo_id', emp.id)
          .order('numero', { ascending: true });

        // Atualizar status de parcelas atrasadas
        const hoje = new Date();
        const parcelas = (parcelasData || []).map(p => {
          if (p.status === 'pendente' && isBefore(new Date(p.vencimento), hoje)) {
            return { ...p, status: 'atrasada' as StatusParcela };
          }
          return p;
        }) as Parcela[];

        return {
          ...emp,
          parcelas,
        } as Emprestimo;
      })
    );

    setEmprestimos(emprestimosWithParcelas);
    
    // Encontrar empréstimo ativo
    const ativo = emprestimosWithParcelas.find(e => e.status === 'ativo') || null;
    setEmprestimoAtivo(ativo);

    setIsLoading(false);
  };

  // Simular empréstimo
  const simularEmprestimo = (
    valorOriginal: number,
    quantidadeParcelas: number,
    taxaJuros: number = 1.5
  ): SimulacaoEmprestimo => {
    // Juros compostos
    const totalComJuros = valorOriginal * Math.pow(1 + taxaJuros / 100, quantidadeParcelas);
    const valorParcela = totalComJuros / quantidadeParcelas;
    const custoTotal = totalComJuros - valorOriginal;

    return {
      valor_original: valorOriginal,
      taxa_juros: taxaJuros,
      quantidade_parcelas: quantidadeParcelas,
      total_com_juros: Math.round(totalComJuros * 100) / 100,
      valor_parcela: Math.round(valorParcela * 100) / 100,
      custo_total: Math.round(custoTotal * 100) / 100,
    };
  };

  // Solicitar empréstimo
  const solicitarEmprestimo = async (
    valor_original: number,
    quantidade_parcelas: number,
    motivo: string,
    observacao?: string
  ) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    // Verificar se já tem empréstimo ativo
    if (emprestimoAtivo) {
      return { success: false, error: 'Você já possui um empréstimo ativo' };
    }

    // Validações
    if (valor_original < 100) {
      return { success: false, error: 'Valor mínimo é R$ 100,00' };
    }
    if (quantidade_parcelas < 1 || quantidade_parcelas > 24) {
      return { success: false, error: 'Quantidade de parcelas deve ser entre 1 e 24' };
    }

    const simulacao = simularEmprestimo(valor_original, quantidade_parcelas);
    const numero_contrato = `EMP-${Date.now().toString(36).toUpperCase()}`;

    // Criar empréstimo
    const { data: emprestimo, error: empError } = await supabase
      .from('emprestimos')
      .insert({
        user_id: user.id,
        numero_contrato,
        valor_original,
        taxa_juros: simulacao.taxa_juros,
        total_com_juros: simulacao.total_com_juros,
        quantidade_parcelas,
        valor_parcela: simulacao.valor_parcela,
        saldo_devedor: simulacao.total_com_juros,
        motivo,
        observacao,
        status: 'ativo',
      })
      .select()
      .single();

    if (empError) {
      return { success: false, error: empError.message };
    }

    // Criar parcelas
    const parcelas = Array.from({ length: quantidade_parcelas }, (_, i) => {
      const vencimento = addMonths(new Date(), i + 1);
      return {
        emprestimo_id: emprestimo.id,
        numero: i + 1,
        valor: simulacao.valor_parcela,
        vencimento: format(vencimento, 'yyyy-MM-dd'),
        status: 'pendente',
      };
    });

    const { error: parcError } = await supabase
      .from('parcelas_emprestimo')
      .insert(parcelas);

    if (parcError) {
      // Rollback - deletar empréstimo
      await supabase.from('emprestimos').delete().eq('id', emprestimo.id);
      return { success: false, error: parcError.message };
    }

    await fetchEmprestimos();
    return { success: true, data: emprestimo };
  };

  // Antecipar parcela
  const anteciparParcela = async (parcelaId: string, emprestimoId: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const emprestimo = emprestimos.find(e => e.id === emprestimoId);
    if (!emprestimo) return { success: false, error: 'Empréstimo não encontrado' };

    const parcela = emprestimo.parcelas.find(p => p.id === parcelaId);
    if (!parcela) return { success: false, error: 'Parcela não encontrada' };

    if (parcela.status === 'paga') {
      return { success: false, error: 'Parcela já foi paga' };
    }

    // Atualizar parcela
    const { error: parcelaError } = await supabase
      .from('parcelas_emprestimo')
      .update({
        status: 'paga',
        data_pagamento: format(new Date(), 'yyyy-MM-dd'),
      })
      .eq('id', parcelaId);

    if (parcelaError) {
      return { success: false, error: parcelaError.message };
    }

    // Atualizar empréstimo
    const novasParcPagas = emprestimo.parcelas_pagas + 1;
    const novoSaldoDevedor = emprestimo.saldo_devedor - parcela.valor;
    const novoStatus = novasParcPagas >= emprestimo.quantidade_parcelas ? 'quitado' : 'ativo';

    const { error: empError } = await supabase
      .from('emprestimos')
      .update({
        parcelas_pagas: novasParcPagas,
        saldo_devedor: Math.max(0, novoSaldoDevedor),
        status: novoStatus,
      })
      .eq('id', emprestimoId);

    if (empError) {
      return { success: false, error: empError.message };
    }

    await fetchEmprestimos();
    
    if (novoStatus === 'quitado') {
      toast({
        title: '🎉 Empréstimo quitado!',
        description: 'Parabéns por quitar seu empréstimo!',
      });
    }

    return { success: true };
  };

  // Obter próxima parcela
  const getProximaParcela = (emprestimo: Emprestimo): Parcela | null => {
    return emprestimo.parcelas.find(p => p.status === 'pendente' || p.status === 'atrasada') || null;
  };

  // Obter parcelas atrasadas
  const getParcelasAtrasadas = (emprestimo: Emprestimo): Parcela[] => {
    return emprestimo.parcelas.filter(p => p.status === 'atrasada');
  };

  // Calcular progresso
  const calcularProgresso = (emprestimo: Emprestimo): number => {
    return (emprestimo.parcelas_pagas / emprestimo.quantidade_parcelas) * 100;
  };

  useEffect(() => {
    fetchEmprestimos();
  }, [user]);

  return {
    emprestimos,
    emprestimoAtivo,
    isLoading,
    simularEmprestimo,
    solicitarEmprestimo,
    anteciparParcela,
    getProximaParcela,
    getParcelasAtrasadas,
    calcularProgresso,
    refetch: fetchEmprestimos,
  };
}
