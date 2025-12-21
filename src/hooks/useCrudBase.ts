import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

// =====================================================
// TYPES
// =====================================================

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export interface RealtimeOptions {
  enabled?: boolean;
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[];
  filter?: string;
}

export interface CrudHookOptions<T> {
  table: string;
  queryKey: string[];
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filter?: Record<string, any>;
  pagination?: PaginationOptions;
  realtime?: RealtimeOptions;
  transform?: (data: any[]) => T[];
}

export interface CrudHookResult<T> {
  // Data
  data: T[];
  totalCount: number;
  
  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  
  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  
  // CRUD Operations
  create: (item: Partial<T>) => Promise<T | null>;
  update: (id: string, changes: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  
  // Mutations state
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Utilities
  refetch: () => void;
  invalidate: () => void;
}

// =====================================================
// HOOK: useCrudBase
// =====================================================

export function useCrudBase<T extends { id: string }>(
  options: CrudHookOptions<T>
): CrudHookResult<T> {
  const {
    table,
    queryKey,
    select = '*',
    orderBy = { column: 'created_at', ascending: false },
    filter = {},
    pagination = { enabled: false, page: 1, pageSize: 10 },
    realtime = { enabled: false, events: ['INSERT', 'UPDATE', 'DELETE'] },
    transform,
  } = options;

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Pagination state
  const [page, setPage] = useState(pagination.page || 1);
  const [pageSize, setPageSize] = useState(pagination.pageSize || 10);
  const [totalCount, setTotalCount] = useState(0);

  // Build query
  const buildQuery = useCallback(() => {
    let query = supabase.from(table).select(select, { count: 'exact' });

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply user filter if needed
    if (filter.user_id === undefined && user?.id) {
      query = query.eq('user_id', user.id);
    }

    // Apply ordering
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });

    // Apply pagination
    if (pagination.enabled) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    return query;
  }, [table, select, filter, user?.id, orderBy, pagination.enabled, page, pageSize]);

  // Main query
  const {
    data: queryData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...queryKey, page, pageSize, filter],
    queryFn: async () => {
      const query = buildQuery();
      const { data, error, count } = await query;

      if (error) throw error;

      setTotalCount(count || 0);
      return transform ? transform(data || []) : (data as T[]) || [];
    },
    enabled: !!user,
  });

  const data = queryData || [];
  const totalPages = Math.ceil(totalCount / pageSize);

  // Realtime subscription
  useEffect(() => {
    if (!realtime.enabled || !user?.id) return;

    let channel: RealtimeChannel;

    const setupRealtime = () => {
      const channelName = `${table}_changes_${user.id}`;
      
      channel = supabase.channel(channelName);

      realtime.events?.forEach((event) => {
        channel = channel.on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table,
            filter: realtime.filter || `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log(`[Realtime] ${event} on ${table}:`, payload);
            queryClient.invalidateQueries({ queryKey });
          }
        );
      });

      channel.subscribe((status) => {
        console.log(`[Realtime] ${table} subscription status:`, status);
      });
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [realtime.enabled, realtime.events, realtime.filter, user?.id, table, queryKey, queryClient]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (item: Partial<T>) => {
      const { data, error } = await supabase
        .from(table)
        .insert({ ...item, user_id: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data as T;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<T> }) => {
      const { data, error } = await supabase
        .from(table)
        .update(changes)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as T;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // CRUD functions
  const create = useCallback(async (item: Partial<T>): Promise<T | null> => {
    try {
      return await createMutation.mutateAsync(item);
    } catch (err) {
      console.error('Create error:', err);
      return null;
    }
  }, [createMutation]);

  const update = useCallback(async (id: string, changes: Partial<T>): Promise<T | null> => {
    try {
      return await updateMutation.mutateAsync({ id, changes });
    } catch (err) {
      console.error('Update error:', err);
      return null;
    }
  }, [updateMutation]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      return await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error('Delete error:', err);
      return false;
    }
  }, [deleteMutation]);

  // Pagination functions
  const nextPage = useCallback(() => {
    if (page < totalPages) setPage(page + 1);
  }, [page, totalPages]);

  const previousPage = useCallback(() => {
    if (page > 1) setPage(page - 1);
  }, [page]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    // Data
    data,
    totalCount,
    
    // Loading states
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    
    // Pagination
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    
    // CRUD Operations
    create,
    update,
    remove,
    
    // Mutations state
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Utilities
    refetch,
    invalidate,
  };
}

// =====================================================
// HOOK: useFeriasEnhanced (Example usage)
// =====================================================

export interface Ferias {
  id: string;
  user_id: string;
  data_inicio: string;
  data_fim: string;
  dias_solicitados: number;
  tipo: string;
  status: string;
  observacao?: string;
  created_at: string;
}

export function useFeriasEnhanced() {
  return useCrudBase<Ferias>({
    table: 'ferias',
    queryKey: ['ferias'],
    orderBy: { column: 'created_at', ascending: false },
    pagination: { enabled: true, pageSize: 10 },
    realtime: { enabled: true, events: ['INSERT', 'UPDATE', 'DELETE'] },
  });
}

// =====================================================
// HOOK: useHoleritesEnhanced
// =====================================================

export interface Holerite {
  id: string;
  user_id: string;
  ano: number;
  mes: number;
  salario_bruto: number;
  salario_liquido: number;
  created_at: string;
}

export function useHoleritesEnhanced() {
  return useCrudBase<Holerite>({
    table: 'holerites',
    queryKey: ['holerites'],
    orderBy: { column: 'created_at', ascending: false },
    pagination: { enabled: true, pageSize: 12 },
    realtime: { enabled: true, events: ['INSERT', 'UPDATE'] },
  });
}

// =====================================================
// HOOK: useTreinamentosEnhanced
// =====================================================

export interface Treinamento {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: string;
  duracao_horas: number;
  obrigatorio: boolean;
  created_at: string;
}

export function useTreinamentosEnhanced() {
  return useCrudBase<Treinamento>({
    table: 'treinamentos',
    queryKey: ['treinamentos'],
    orderBy: { column: 'titulo', ascending: true },
    filter: {}, // No user filter for treinamentos
    pagination: { enabled: true, pageSize: 10 },
    realtime: { enabled: true },
  });
}

export default useCrudBase;
