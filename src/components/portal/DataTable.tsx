import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// =====================================================
// TYPES
// =====================================================

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  
  // Pagination
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  
  // Sorting
  sortable?: boolean;
  defaultSortKey?: string;
  defaultSortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  
  // Selection
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selected: T[]) => void;
  getRowId?: (row: T) => string;
  
  // Row actions
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  
  // Empty state
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  
  // Styling
  className?: string;
  compact?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

// =====================================================
// COMPONENT
// =====================================================

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  
  pagination = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  
  searchable = true,
  searchPlaceholder = 'Buscar...',
  onSearch,
  
  sortable = true,
  defaultSortKey,
  defaultSortDirection = 'asc',
  onSort,
  
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  getRowId = (row) => JSON.stringify(row),
  
  onRowClick,
  rowClassName,
  
  emptyMessage = 'Nenhum registro encontrado',
  emptyIcon,
  
  className = '',
  compact = false,
  striped = true,
  hoverable = true,
}: DataTableProps<T>) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSortKey ? defaultSortDirection : null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());

  // Get value from nested key (e.g., "user.name")
  const getValue = useCallback((row: T, key: string): any => {
    return key.split('.').reduce((obj, k) => obj?.[k], row);
  }, []);

  // Filtered data
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    const searchLower = searchQuery.toLowerCase();
    const searchableColumns = columns.filter(c => c.searchable !== false);

    return data.filter(row =>
      searchableColumns.some(col => {
        const value = getValue(row, col.key as string);
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [data, searchQuery, columns, getValue]);

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = getValue(a, sortKey);
      const bVal = getValue(b, sortKey);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const comparison = aStr.localeCompare(bStr, 'pt-BR');
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection, getValue]);

  // Paginated data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handlers
  const handleSort = useCallback((key: string) => {
    if (!sortable) return;

    let newDirection: SortDirection;
    if (sortKey === key) {
      newDirection = sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc';
    } else {
      newDirection = 'asc';
    }

    setSortKey(newDirection ? key : null);
    setSortDirection(newDirection);
    onSort?.(key, newDirection || 'asc');
  }, [sortable, sortKey, sortDirection, onSort]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    onSearch?.(value);
  }, [onSearch]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const handleSelectAll = useCallback(() => {
    if (internalSelected.size === paginatedData.length) {
      setInternalSelected(new Set());
      onSelectionChange?.([]);
    } else {
      const allIds = new Set(paginatedData.map(row => getRowId(row)));
      setInternalSelected(allIds);
      onSelectionChange?.(paginatedData);
    }
  }, [paginatedData, internalSelected.size, getRowId, onSelectionChange]);

  const handleSelectRow = useCallback((row: T) => {
    const id = getRowId(row);
    const newSelected = new Set(internalSelected);
    
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    
    setInternalSelected(newSelected);
    onSelectionChange?.(paginatedData.filter(r => newSelected.has(getRowId(r))));
  }, [internalSelected, getRowId, paginatedData, onSelectionChange]);

  // Render sort icon
  const renderSortIcon = (key: string) => {
    if (!sortable) return null;
    
    if (sortKey !== key) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 ml-1" />
      : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="border rounded-lg">
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-9"
            aria-label="Buscar na tabela"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && internalSelected.size === paginatedData.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                    aria-label="Selecionar todos"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={`
                    ${column.width ? `w-[${column.width}]` : ''}
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                    ${column.sortable !== false && sortable ? 'cursor-pointer select-none' : ''}
                    ${column.className || ''}
                  `}
                  onClick={() => column.sortable !== false && handleSort(String(column.key))}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable !== false && renderSortIcon(String(column.key))}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    {emptyIcon}
                    <span className="mt-2">{emptyMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={getRowId(row)}
                  className={`
                    ${striped && index % 2 === 1 ? 'bg-muted/50' : ''}
                    ${hoverable ? 'hover:bg-muted' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${rowClassName?.(row, index) || ''}
                  `}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {selectable && (
                    <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={internalSelected.has(getRowId(row))}
                        onChange={() => handleSelectRow(row)}
                        className="rounded border-gray-300"
                        aria-label="Selecionar linha"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => {
                    const value = getValue(row, String(column.key));
                    return (
                      <TableCell
                        key={String(column.key)}
                        className={`
                          ${compact ? 'py-2' : ''}
                          ${column.align === 'center' ? 'text-center' : ''}
                          ${column.align === 'right' ? 'text-right' : ''}
                          ${column.className || ''}
                        `}
                      >
                        {column.render ? column.render(value, row, index) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && sortedData.length > 0 && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Exibindo</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              de {sortedData.length} {sortedData.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              aria-label="Primeira página"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="px-3 text-sm text-muted-foreground">
              Página {currentPage} de {totalPages || 1}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Próxima página"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages}
              aria-label="Última página"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
