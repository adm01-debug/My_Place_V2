import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ServerPaginationOptions {
  table: string;
  queryKey: string[];
  pageSize?: number;
  orderBy?: string;
  orderAscending?: boolean;
  filters?: Record<string, unknown>;
  select?: string;
  userScoped?: boolean;
}

export interface ServerPaginationResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  refetch: () => void;
}

export function useServerPagination<T extends Record<string, unknown>>(
  options: ServerPaginationOptions
): ServerPaginationResult<T> {
  const {
    table,
    queryKey,
    pageSize: initialPageSize = 20,
    orderBy = 'created_at',
    orderAscending = false,
    filters = {},
    select = '*',
    userScoped = true,
  } = options;

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Count query
  const { data: totalCount = 0 } = useQuery({
    queryKey: [...queryKey, 'count', filters],
    queryFn: async () => {
      let query = supabase
        .from(table as 'profiles')
        .select('*', { count: 'exact', head: true });

      if (userScoped && user) {
        query = query.eq('user_id', user.id);
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value as string);
        }
      });

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user || !userScoped,
  });

  // Data query with range
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data = [], isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...queryKey, page, pageSize, filters],
    queryFn: async () => {
      let query = supabase
        .from(table as 'profiles')
        .select(select)
        .order(orderBy, { ascending: orderAscending })
        .range(from, to);

      if (userScoped && user) {
        query = query.eq('user_id', user.id);
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value as string);
        }
      });

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
    enabled: !!user || !userScoped,
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize]);

  const nextPage = useCallback(() => {
    if (page < totalPages) setPage(p => p + 1);
  }, [page, totalPages]);

  const previousPage = useCallback(() => {
    if (page > 1) setPage(p => p - 1);
  }, [page]);

  return {
    data,
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    isLoading,
    isFetching,
    error: error as Error | null,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    refetch,
  };
}
