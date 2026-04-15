import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ColaboradorOrganograma {
  id: string;
  nome: string;
  cargo: string | null;
  departamento: string | null;
  avatar_url: string | null;
  gestor_id: string | null;
  nivel: number;
  subordinados?: ColaboradorOrganograma[];
}

export function useOrganograma() {
  const [colaboradores, setColaboradores] = useState<ColaboradorOrganograma[]>([]);
  const [arvore, setArvore] = useState<ColaboradorOrganograma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildTree = useCallback((items: ColaboradorOrganograma[]): ColaboradorOrganograma[] => {
    const itemMap = new Map<string, ColaboradorOrganograma>();
    const roots: ColaboradorOrganograma[] = [];

    // Primeiro, criar um mapa de todos os itens
    items.forEach(item => {
      itemMap.set(item.id, { ...item, subordinados: [] });
    });

    // Depois, construir a árvore
    items.forEach(item => {
      const node = itemMap.get(item.id)!;
      if (item.gestor_id && itemMap.has(item.gestor_id)) {
        const parent = itemMap.get(item.gestor_id)!;
        parent.subordinados = parent.subordinados || [];
        parent.subordinados.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, []);

  const fetchOrganograma = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the security definer RPC that returns only safe fields (no PII)
      const { data, error: fetchError } = await supabase
        .rpc('get_organograma');

      if (fetchError) throw fetchError;

      const colaboradoresComNivel = (data || []).map(c => ({
        id: c.id,
        nome: c.nome,
        cargo: c.cargo,
        departamento: c.departamento,
        avatar_url: c.avatar_url,
        gestor_id: c.gestor_id,
        nivel: c.nivel ?? 0,
      }));

      setColaboradores(colaboradoresComNivel);
      setArvore(buildTree(colaboradoresComNivel));
    } catch (err) {
      console.error('Erro ao buscar organograma:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar organograma');
    } finally {
      setIsLoading(false);
    }
  }, [buildTree]);

  const getSubordinados = useCallback((gestorId: string): ColaboradorOrganograma[] => {
    return colaboradores.filter(c => c.gestor_id === gestorId);
  }, [colaboradores]);

  const getGestor = useCallback((gestorId: string | null): ColaboradorOrganograma | undefined => {
    if (!gestorId) return undefined;
    return colaboradores.find(c => c.id === gestorId);
  }, [colaboradores]);

  const searchColaboradores = useCallback((term: string): ColaboradorOrganograma[] => {
    if (!term.trim()) return [];
    const lowerTerm = term.toLowerCase();
    return colaboradores.filter(c => 
      c.nome?.toLowerCase().includes(lowerTerm) ||
      c.cargo?.toLowerCase().includes(lowerTerm) ||
      c.departamento?.toLowerCase().includes(lowerTerm)
    );
  }, [colaboradores]);

  useEffect(() => {
    fetchOrganograma();
  }, [fetchOrganograma]);

  return {
    colaboradores,
    arvore,
    isLoading,
    error,
    refetch: fetchOrganograma,
    getSubordinados,
    getGestor,
    searchColaboradores,
  };
}
