import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ItemHolerite {
  codigo?: string;
  descricao: string;
  referencia?: string;
  valor: number;
}

interface DetalhesHolerite {
  proventos?: ItemHolerite[];
  descontos?: ItemHolerite[];
  baseInss?: number;
  baseIrrf?: number;
  fgtsMes?: number;
}

interface Holerite {
  id: string;
  mes: number;
  ano: number;
  salario_bruto: number;
  descontos: number;
  salario_liquido: number;
  detalhes: DetalhesHolerite | null;
  pdf_url: string | null;
  created_at: string;
}

interface HoleritesData {
  holerites: Holerite[];
  ultimoHolerite: Holerite | null;
  totalAno: number;
  mediaAnual: number;
}

export function useHolerites(ano?: number) {
  const anoAtual = ano || new Date().getFullYear();
  const [data, setData] = useState<HoleritesData>({
    holerites: [],
    ultimoHolerite: null,
    totalAno: 0,
    mediaAnual: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchHolerites = async () => {
    if (!user) return;

    setIsLoading(true);
    
    const { data: holeriteData, error } = await supabase
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
      setIsLoading(false);
      return;
    }

    const holerites = (holeriteData || []) as Holerite[];
    
    // Último holerite
    const ultimoHolerite = holerites[0] || null;

    // Calcular totais do ano atual
    const holeritesAno = holerites.filter(h => h.ano === anoAtual);
    const totalAno = holeritesAno.reduce((acc, h) => acc + h.salario_liquido, 0);
    const mediaAnual = holeritesAno.length > 0 ? totalAno / holeritesAno.length : 0;

    setData({
      holerites,
      ultimoHolerite,
      totalAno,
      mediaAnual,
    });

    setIsLoading(false);
  };

  const downloadPdf = async (holerite: Holerite) => {
    if (!holerite.pdf_url) {
      toast({
        title: 'PDF não disponível',
        description: 'O PDF deste holerite ainda não foi gerado.',
        variant: 'destructive',
      });
      return { success: false, error: 'PDF não disponível' };
    }

    try {
      // Se é URL do Supabase Storage
      if (holerite.pdf_url.includes('supabase')) {
        const path = holerite.pdf_url.split('/').pop();
        if (path) {
          const { data, error } = await supabase.storage
            .from('documentos')
            .createSignedUrl(path, 3600);

          if (error) throw error;
          window.open(data.signedUrl, '_blank');
          return { success: true };
        }
      }

      // URL externa
      window.open(holerite.pdf_url, '_blank');
      return { success: true };
    } catch (error: any) {
      toast({
        title: 'Erro ao baixar PDF',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const getHoleritesAno = (year: number): Holerite[] => {
    return data.holerites.filter(h => h.ano === year);
  };

  const getHoleriteMes = (mes: number, year: number): Holerite | undefined => {
    return data.holerites.find(h => h.mes === mes && h.ano === year);
  };

  const getAnosDisponiveis = (): number[] => {
    const anos = [...new Set(data.holerites.map(h => h.ano))];
    return anos.sort((a, b) => b - a);
  };

  // Calcular totais de proventos e descontos
  const calcularTotais = (holerite: Holerite) => {
    const proventos = holerite.detalhes?.proventos || [];
    const descontos = holerite.detalhes?.descontos || [];

    const totalProventos = proventos.reduce((acc, p) => acc + p.valor, 0);
    const totalDescontos = descontos.reduce((acc, d) => acc + d.valor, 0);

    return {
      totalProventos: totalProventos || holerite.salario_bruto,
      totalDescontos: totalDescontos || holerite.descontos,
      liquido: holerite.salario_liquido,
    };
  };

  useEffect(() => {
    fetchHolerites();
  }, [user]);

  return {
    holerites: data.holerites,
    ultimoHolerite: data.ultimoHolerite,
    totalAno: data.totalAno,
    mediaAnual: data.mediaAnual,
    isLoading,
    downloadPdf,
    getHoleritesAno,
    getHoleriteMes,
    getAnosDisponiveis,
    calcularTotais,
    refetch: fetchHolerites,
  };
}
