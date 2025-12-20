import { useState, useMemo, useCallback } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  type?: 'select' | 'date' | 'dateRange' | 'search';
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface FilterState {
  [key: string]: string | DateRange | null;
}

export function useFilters<T extends Record<string, any>>(
  items: T[],
  filterConfigs: FilterConfig[]
) {
  const [filters, setFilters] = useState<FilterState>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const setFilter = useCallback((key: string, value: string | DateRange | null) => {
    setFilters(prev => {
      if (value === null || value === '' || value === 'all') {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  const clearFilter = useCallback((key: string) => {
    setFilters(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const toggleSort = useCallback((key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  }, [sortKey]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Apply search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => {
        return Object.values(item).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowerSearch);
          }
          if (typeof value === 'number') {
            return value.toString().includes(lowerSearch);
          }
          return false;
        });
      });
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;

      if (typeof value === 'object' && 'from' in value) {
        // Date range filter
        const { from, to } = value as DateRange;
        result = result.filter(item => {
          const itemDate = new Date(item[key]);
          if (from && itemDate < from) return false;
          if (to && itemDate > to) return false;
          return true;
        });
      } else if (typeof value === 'string') {
        // String filter
        result = result.filter(item => {
          const itemValue = item[key];
          if (typeof itemValue === 'string') {
            return itemValue.toLowerCase() === value.toLowerCase();
          }
          return itemValue === value;
        });
      }
    });

    // Apply sorting
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal, 'pt-BR');
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          // Handle dates and other objects
          const aDate = new Date(aVal);
          const bDate = new Date(bVal);
          if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
            comparison = aDate.getTime() - bDate.getTime();
          } else {
            comparison = String(aVal).localeCompare(String(bVal));
          }
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [items, filters, searchTerm, sortKey, sortDirection]);

  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).length + (searchTerm ? 1 : 0);
  }, [filters, searchTerm]);

  return {
    filters,
    searchTerm,
    sortKey,
    sortDirection,
    filteredItems,
    activeFilterCount,
    setFilter,
    setSearchTerm,
    clearFilters,
    clearFilter,
    toggleSort,
  };
}

// Common filter configurations
export const statusFilterOptions: FilterOption[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'rejeitado', label: 'Rejeitado' },
  { value: 'concluido', label: 'Concluído' },
];

export const tipoSolicitacaoOptions: FilterOption[] = [
  { value: 'all', label: 'Todos' },
  { value: 'ferias', label: 'Férias' },
  { value: 'atestado', label: 'Atestado' },
  { value: 'cadastro', label: 'Cadastro' },
  { value: 'folha', label: 'Folha' },
  { value: 'outros', label: 'Outros' },
];

export const periodoOptions: FilterOption[] = [
  { value: 'all', label: 'Todo período' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '365', label: 'Último ano' },
];
