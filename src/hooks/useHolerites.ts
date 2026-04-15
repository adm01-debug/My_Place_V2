import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';

const log = createLogger('Holerites');

export interface HoleriteItem {
  codigo: string;
  descricao: string;
  referencia: string;
  valor: number;
}

export interface HoleriteDetalhes {
  proventos: HoleriteItem[];
  descontos: HoleriteItem[];
}

export interface Holerite {
  id: string;
  user_id: string;
  mes: number;
  ano: number;
  salario_bruto: number;
  salario_liquido: number;
  descontos: number;
  pdf_url: string | null;
  detalhes: HoleriteDetalhes | null;
  created_at: string;
}

const mesesNomes = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function useHolerites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [holerites, setHolerites] = useState<Holerite[]>([]);

  const fetchHolerites = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('holerites')
        .select('*')
        .eq('user_id', user.id)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });

      if (error) throw error;
      // Map database response to Holerite interface
      const mappedHolerites = (data || []).map((h: any) => ({
        ...h,
        detalhes: h.detalhes as HoleriteDetalhes | null,
      })) as Holerite[];
      setHolerites(mappedHolerites);
    } catch (err: any) {
      log.error('Erro ao buscar holerites:', err);
      toast({ title: 'Erro ao carregar holerites', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const ultimoHolerite = useMemo(() => holerites[0] || null, [holerites]);

  const estatisticasAno = useMemo(() => {
    const anoAtual = new Date().getFullYear();
    const holeriteAno = holerites.filter(h => h.ano === anoAtual);
    if (holeriteAno.length === 0) return { total: 0, media: 0, meses: 0 };
    const total = holeriteAno.reduce((acc, h) => acc + h.salario_liquido, 0);
    return { total, media: total / holeriteAno.length, meses: holeriteAno.length };
  }, [holerites]);

  const downloadPdf = async (holerite: Holerite) => {
    if (holerite.pdf_url) {
      try {
        if (holerite.pdf_url.includes('supabase')) {
          const path = holerite.pdf_url.split('/').pop();
          if (path) {
            const { data, error } = await supabase.storage.from('documentos').createSignedUrl(path, 3600);
            if (error) throw error;
            window.open(data.signedUrl, '_blank');
            return { success: true };
          }
        }
        window.open(holerite.pdf_url, '_blank');
        return { success: true };
      } catch (err) { log.error('Erro ao baixar PDF:', err); }
    }

    setIsGeneratingPdf(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-holerite-pdf`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ holerite_id: holerite.id }),
        }
      );
      if (!response.ok) throw new Error((await response.json()).error || 'Erro ao gerar PDF');
      const result = await response.json();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(result.html);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
      }
      toast({ title: 'PDF gerado', description: 'Use Ctrl+P para salvar como PDF.' });
      return { success: true };
    } catch (err: any) {
      toast({ title: 'Erro ao gerar PDF', description: err.message, variant: 'destructive' });
      return { success: false, error: err.message };
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getHoleritesAno = useCallback((ano: number) => holerites.filter(h => h.ano === ano), [holerites]);
  const getHoleriteMes = useCallback((mes: number, ano: number) => holerites.find(h => h.mes === mes && h.ano === ano), [holerites]);
  const getAnosDisponiveis = useCallback(() => [...new Set(holerites.map(h => h.ano))].sort((a, b) => b - a), [holerites]);
  const getMesNome = (mes: number) => mesesNomes[mes - 1] || '';

  const calcularTotais = (holerite: Holerite) => {
    const { proventos = [], descontos = [] } = holerite.detalhes || {};
    return {
      totalProventos: proventos.reduce((acc, p) => acc + p.valor, 0) || holerite.salario_bruto,
      totalDescontos: descontos.reduce((acc, d) => acc + d.valor, 0) || holerite.descontos,
      liquido: holerite.salario_liquido,
    };
  };

  useEffect(() => { fetchHolerites(); }, [fetchHolerites]);

  return {
    holerites, ultimoHolerite, estatisticasAno,
    isLoading, isGeneratingPdf,
    downloadPdf, getHoleritesAno, getHoleriteMes, getAnosDisponiveis, getMesNome, calcularTotais,
    refetch: fetchHolerites,
  };
}
