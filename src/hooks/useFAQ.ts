import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FAQItem {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
  tags: string[];
  ordem: number;
  destaque: boolean;
  ativo: boolean;
  visualizacoes: number;
  utilidade_positiva: number;
  utilidade_negativa: number;
  created_at: string;
  updated_at: string;
}

export interface FAQCategoria {
  id: string;
  label: string;
  count: number;
}

export function useFAQ() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos');

  const { data: faqs = [], isLoading, refetch } = useQuery({
    queryKey: ['faq'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });
      if (error) throw error;
      return (data || []) as FAQItem[];
    },
  });

  const categorias = useMemo<FAQCategoria[]>(() => {
    const categoriasMap: Record<string, number> = {};
    faqs.forEach(faq => {
      categoriasMap[faq.categoria] = (categoriasMap[faq.categoria] || 0) + 1;
    });
    const result: FAQCategoria[] = [{ id: 'todos', label: 'Todos', count: faqs.length }];
    Object.entries(categoriasMap).forEach(([cat, count]) => {
      result.push({ id: cat.toLowerCase(), label: cat, count });
    });
    return result;
  }, [faqs]);

  const faqsFiltradas = useMemo(() => {
    let resultado = faqs;
    if (categoriaAtiva !== 'todos') {
      resultado = resultado.filter(faq => faq.categoria.toLowerCase() === categoriaAtiva);
    }
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      resultado = resultado.filter(faq =>
        faq.pergunta.toLowerCase().includes(termo) ||
        faq.resposta.toLowerCase().includes(termo) ||
        faq.tags.some(tag => tag.toLowerCase().includes(termo))
      );
    }
    return resultado;
  }, [faqs, categoriaAtiva, searchTerm]);

  const faqsDestaque = useMemo(() => faqs.filter(faq => faq.destaque).slice(0, 5), [faqs]);

  const incrementarVisualizacao = useCallback(async (faqId: string) => {
    try { await supabase.rpc('incrementar_visualizacao_faq', { p_faq_id: faqId }); } catch (e) { console.error(e); }
  }, []);

  const registrarUtilidade = useCallback(async (faqId: string, util: boolean) => {
    try { await supabase.rpc('registrar_utilidade_faq', { p_faq_id: faqId, p_util: util }); refetch(); return { success: true }; } catch (e) { console.error(e); return { success: false }; }
  }, [refetch]);

  const getFAQById = useCallback((id: string) => faqs.find(faq => faq.id === id), [faqs]);

  const getFAQsRelacionadas = useCallback((faqId: string, limit = 3) => {
    const faq = faqs.find(f => f.id === faqId);
    if (!faq) return [];
    return faqs.filter(f => f.id !== faqId && (f.categoria === faq.categoria || f.tags.some(tag => faq.tags.includes(tag)))).slice(0, limit);
  }, [faqs]);

  return {
    faqs: faqsFiltradas, faqsDestaque, categorias, totalFaqs: faqs.length,
    isLoading, error: null, searchTerm, categoriaAtiva,
    setSearchTerm, setCategoriaAtiva, refetch,
    incrementarVisualizacao, registrarUtilidade, getFAQById, getFAQsRelacionadas,
  };
}
