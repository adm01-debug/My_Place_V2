import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilterConfig, FilterOption } from '@/hooks/useFilters';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: Record<string, string | null>;
  filterConfigs: FilterConfig[];
  onFilterChange: (key: string, value: string | null) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  placeholder?: string;
  sortOptions?: { key: string; label: string }[];
  sortKey?: string | null;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (key: string) => void;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  filters,
  filterConfigs,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
  placeholder = 'Buscar...',
  sortOptions,
  sortKey,
  sortDirection,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Search and Filter Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {filterConfigs.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filtros</h4>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground"
                      onClick={onClearFilters}
                    >
                      Limpar todos
                    </Button>
                  )}
                </div>

                {filterConfigs.map((config) => (
                  <div key={config.key} className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      {config.label}
                    </label>
                    <Select
                      value={(filters[config.key] as string) || 'all'}
                      onValueChange={(value) => 
                        onFilterChange(config.key, value === 'all' ? null : value)
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                {sortOptions && sortOptions.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t">
                    <label className="text-xs font-medium text-muted-foreground">
                      Ordenar por
                    </label>
                    <div className="flex gap-2">
                      <Select
                        value={sortKey || ''}
                        onValueChange={(value) => onSortChange?.(value)}
                      >
                        <SelectTrigger className="h-8 text-sm flex-1">
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sortOptions.map((option) => (
                            <SelectItem key={option.key} value={option.key}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {sortKey && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onSortChange?.(sortKey)}
                        >
                          <ArrowUpDown className={`h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{searchTerm}"
              <button onClick={() => onSearchChange('')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            const config = filterConfigs.find(c => c.key === key);
            const option = config?.options.find(o => o.value === value);
            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {config?.label}: {option?.label || value}
                <button onClick={() => onFilterChange(key, null)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Compact inline filter for simpler use cases
interface InlineFilterProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function InlineFilter({ options, value, onChange, label }: InlineFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {label && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">{label}:</span>
      )}
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs whitespace-nowrap"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
