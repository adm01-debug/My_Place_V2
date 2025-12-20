import { useState, useMemo, useCallback } from 'react';

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

// FAQs estáticas para o portal
const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    pergunta: 'Como solicitar férias?',
    resposta: 'Acesse o menu Férias, verifique seu saldo de dias disponíveis e clique em "Solicitar Férias". Preencha o período desejado e aguarde a aprovação do seu gestor.',
    categoria: 'ferias',
    tags: ['férias', 'solicitação', 'descanso'],
    ordem: 1,
    destaque: true,
    visualizacoes: 150,
    utilidade_positiva: 45,
    utilidade_negativa: 2,
    created_at: '2025-01-01',
  },
  {
    id: '2',
    pergunta: 'Onde encontro meus holerites?',
    resposta: 'Seus holerites estão disponíveis no menu "Holerites". Você pode visualizar, baixar em PDF e consultar o histórico de todos os meses.',
    categoria: 'financeiro',
    tags: ['holerite', 'pagamento', 'salário'],
    ordem: 2,
    destaque: true,
    visualizacoes: 200,
    utilidade_positiva: 60,
    utilidade_negativa: 1,
    created_at: '2025-01-01',
  },
  {
    id: '3',
    pergunta: 'Como registrar o ponto pelo app?',
    resposta: 'No menu Ponto, clique no botão de registro. O sistema capturará sua localização automaticamente. Lembre-se de estar dentro da área permitida.',
    categoria: 'ponto',
    tags: ['ponto', 'registro', 'horário'],
    ordem: 3,
    destaque: true,
    visualizacoes: 180,
    utilidade_positiva: 55,
    utilidade_negativa: 3,
    created_at: '2025-01-01',
  },
  {
    id: '4',
    pergunta: 'Como consultar meus benefícios?',
    resposta: 'Acesse o menu Benefícios para ver seus planos de saúde, vale-refeição, vale-transporte e outros benefícios ativos, incluindo saldos e dependentes.',
    categoria: 'beneficios',
    tags: ['benefícios', 'plano saúde', 'vale'],
    ordem: 4,
    destaque: false,
    visualizacoes: 120,
    utilidade_positiva: 35,
    utilidade_negativa: 1,
    created_at: '2025-01-01',
  },
  {
    id: '5',
    pergunta: 'Como abrir uma solicitação para o RH?',
    resposta: 'No menu Solicitações, clique em "Nova Solicitação", escolha o tipo e descreva sua necessidade. Você pode anexar documentos e acompanhar o status.',
    categoria: 'rh',
    tags: ['solicitação', 'rh', 'atendimento'],
    ordem: 5,
    destaque: false,
    visualizacoes: 90,
    utilidade_positiva: 25,
    utilidade_negativa: 2,
    created_at: '2025-01-01',
  },
  {
    id: '6',
    pergunta: 'Como justificar uma falta ou atraso?',
    resposta: 'Na página de Ponto, localize o dia com pendência e clique em "Justificar". Preencha o motivo e anexe documentos comprobatórios se necessário.',
    categoria: 'ponto',
    tags: ['justificativa', 'falta', 'atraso'],
    ordem: 6,
    destaque: false,
    visualizacoes: 85,
    utilidade_positiva: 28,
    utilidade_negativa: 1,
    created_at: '2025-01-01',
  },
  {
    id: '7',
    pergunta: 'Onde baixo meu informe de rendimentos?',
    resposta: 'O informe de rendimentos está disponível no menu Documentos, geralmente a partir de fevereiro de cada ano, referente ao ano anterior.',
    categoria: 'documentos',
    tags: ['informe', 'rendimentos', 'IR'],
    ordem: 7,
    destaque: false,
    visualizacoes: 100,
    utilidade_positiva: 30,
    utilidade_negativa: 0,
    created_at: '2025-01-01',
  },
  {
    id: '8',
    pergunta: 'Como acessar meus treinamentos obrigatórios?',
    resposta: 'No menu Treinamentos você encontra todos os cursos atribuídos a você, com prazos e progresso. Treinamentos obrigatórios aparecem em destaque.',
    categoria: 'treinamentos',
    tags: ['treinamento', 'curso', 'capacitação'],
    ordem: 8,
    destaque: false,
    visualizacoes: 75,
    utilidade_positiva: 22,
    utilidade_negativa: 1,
    created_at: '2025-01-01',
  },
];

export function useFAQ() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos');
  const [faqs] = useState<FAQItem[]>(FAQ_DATA);

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

  // Incrementar visualização (no-op para dados estáticos)
  const incrementarVisualizacao = useCallback(async (_faqId: string) => {
    // No-op para dados estáticos
  }, []);

  // Registrar utilidade (no-op para dados estáticos)
  const registrarUtilidade = useCallback(async (_faqId: string, _util: boolean) => {
    return { success: true };
  }, []);

  // Buscar FAQ por ID
  const getFAQById = useCallback((id: string) => {
    return faqs.find(faq => faq.id === id);
  }, [faqs]);

  // Buscar FAQs relacionadas
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
    isLoading: false,
    error: null,
    searchTerm,
    categoriaAtiva,
    
    // Setters
    setSearchTerm,
    setCategoriaAtiva,
    
    // Actions
    refetch: async () => {},
    incrementarVisualizacao,
    registrarUtilidade,
    getFAQById,
    getFAQsRelacionadas,
  };
}