import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FAQItem {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
  tags: string[];
  ordem: number;
  destaque: boolean;
  visualizacoes: number;
  utilidade_positiva: number;
  utilidade_negativa: number;
  created_at: string;
}

export interface FAQCategoria {
  id: string;
  label: string;
  count: number;
}

export function useFAQ() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos');

  // Fetch all FAQs
  const fetchFAQs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('faq')
        .select('*')
        .eq('ativo', true)
        .order('destaque', { ascending: false })
        .order('ordem', { ascending: true })
        .order('visualizacoes', { ascending: false });

      if (fetchError) throw fetchError;

      setFaqs(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar FAQs:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  // Categorias disponíveis
  const categorias = useMemo<FAQCategoria[]>(() => {
    const categoriasMap: Record<string, { label: string; count: number }> = {
      todos: { label: 'Todos', count: faqs.length },
      rh: { label: 'RH', count: 0 },
      financeiro: { label: 'Financeiro', count: 0 },
      ferias: { label: 'Férias', count: 0 },
      ponto: { label: 'Ponto', count: 0 },
      beneficios: { label: 'Benefícios', count: 0 },
      documentos: { label: 'Documentos', count: 0 },
      seguranca: { label: 'Segurança', count: 0 },
      treinamentos: { label: 'Treinamentos', count: 0 },
      geral: { label: 'Geral', count: 0 },
    };

    faqs.forEach(faq => {
      if (categoriasMap[faq.categoria]) {
        categoriasMap[faq.categoria].count++;
      }
    });

    return Object.entries(categoriasMap)
      .filter(([key, val]) => key === 'todos' || val.count > 0)
      .map(([id, data]) => ({
        id,
        label: data.label,
        count: data.count,
      }));
  }, [faqs]);

  // FAQs filtradas
  const faqsFiltradas = useMemo(() => {
    let resultado = faqs;

    // Filtrar por categoria
    if (categoriaAtiva !== 'todos') {
      resultado = resultado.filter(faq => faq.categoria === categoriaAtiva);
    }

    // Filtrar por termo de busca
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

  // FAQs em destaque
  const faqsDestaque = useMemo(() => {
    return faqs.filter(faq => faq.destaque).slice(0, 5);
  }, [faqs]);

  // Incrementar visualização
  const incrementarVisualizacao = useCallback(async (faqId: string) => {
    try {
      await supabase.rpc('fn_faq_incrementar_view', { p_faq_id: faqId });
      
      // Atualizar localmente
      setFaqs(prev => prev.map(faq =>
        faq.id === faqId
          ? { ...faq, visualizacoes: faq.visualizacoes + 1 }
          : faq
      ));
    } catch (err) {
      console.error('Erro ao incrementar visualização:', err);
    }
  }, []);

  // Registrar utilidade (foi útil ou não)
  const registrarUtilidade = useCallback(async (faqId: string, util: boolean) => {
    try {
      await supabase.rpc('fn_faq_registrar_utilidade', {
        p_faq_id: faqId,
        p_util: util,
      });

      // Atualizar localmente
      setFaqs(prev => prev.map(faq =>
        faq.id === faqId
          ? {
              ...faq,
              utilidade_positiva: util ? faq.utilidade_positiva + 1 : faq.utilidade_positiva,
              utilidade_negativa: !util ? faq.utilidade_negativa + 1 : faq.utilidade_negativa,
            }
          : faq
      ));

      return { success: true };
    } catch (err: any) {
      console.error('Erro ao registrar utilidade:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Buscar FAQ por ID
  const getFAQById = useCallback((id: string) => {
    return faqs.find(faq => faq.id === id);
  }, [faqs]);

  // Buscar FAQs relacionadas (mesma categoria ou tags em comum)
  const getFAQsRelacionadas = useCallback((faqId: string, limit = 3) => {
    const faq = faqs.find(f => f.id === faqId);
    if (!faq) return [];

    return faqs
      .filter(f => 
        f.id !== faqId && (
          f.categoria === faq.categoria ||
          f.tags.some(tag => faq.tags.includes(tag))
        )
      )
      .slice(0, limit);
  }, [faqs]);

  return {
    // Data
    faqs: faqsFiltradas,
    faqsDestaque,
    categorias,
    totalFaqs: faqs.length,
    
    // Estado
    isLoading,
    error,
    searchTerm,
    categoriaAtiva,
    
    // Setters
    setSearchTerm,
    setCategoriaAtiva,
    
    // Actions
    refetch: fetchFAQs,
    incrementarVisualizacao,
    registrarUtilidade,
    getFAQById,
    getFAQsRelacionadas,
  };
}
