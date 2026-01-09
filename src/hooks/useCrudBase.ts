import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// =====================================================
// TYPES
// =====================================================

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export interface CrudHookOptions<T> {
  queryKey: string[];
  fetchFn: () => Promise<T[]>;
  createFn?: (item: Partial<T>) => Promise<T>;
  updateFn?: (id: string, changes: Partial<T>) => Promise<T>;
  deleteFn?: (id: string) => Promise<boolean>;
  pagination?: PaginationOptions;
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
    queryKey,
    fetchFn,
    createFn,
    updateFn,
    deleteFn,
    pagination = { enabled: false, page: 1, pageSize: 10 },
  } = options;

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Pagination state
  const [page, setPage] = useState(pagination.page || 1);
  const [pageSize, setPageSize] = useState(pagination.pageSize || 10);

  // Main query
  const {
    data: queryData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...queryKey, page, pageSize],
    queryFn: fetchFn,
    enabled: !!user,
  });

  const data = queryData || [];
  const totalCount = data.length;
  const totalPages = pagination.enabled ? Math.ceil(totalCount / pageSize) : 1;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (item: Partial<T>) => {
      if (!createFn) throw new Error('Create function not provided');
      return createFn(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<T> }) => {
      if (!updateFn) throw new Error('Update function not provided');
      return updateFn(id, changes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!deleteFn) throw new Error('Delete function not provided');
      return deleteFn(id);
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

export default useCrudBase;
