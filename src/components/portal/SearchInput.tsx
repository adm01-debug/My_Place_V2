import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, History, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  debounceMs?: number;
  isLoading?: boolean;
  showClearButton?: boolean;
  showSearchButton?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  suggestions?: string[];
  recentSearches?: string[];
  onSelectSuggestion?: (value: string) => void;
  onClearRecentSearches?: () => void;
  minChars?: number;
  maxLength?: number;
  size?: 'sm' | 'default' | 'lg';
}

export default function SearchInput({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = 'Buscar...',
  className,
  inputClassName,
  debounceMs = 300,
  isLoading = false,
  showClearButton = true,
  showSearchButton = false,
  autoFocus = false,
  disabled = false,
  suggestions = [],
  recentSearches = [],
  onSelectSuggestion,
  onClearRecentSearches,
  minChars = 1,
  maxLength,
  size = 'default',
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const allSuggestions = [
    ...suggestions.map(s => ({ text: s, type: 'suggestion' as const })),
    ...recentSearches.map(s => ({ text: s, type: 'recent' as const })),
  ];

  const filteredSuggestions = value.length >= minChars
    ? allSuggestions.filter(s => 
        s.text.toLowerCase().includes(value.toLowerCase())
      )
    : allSuggestions.filter(s => s.type === 'recent');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (newValue.length >= minChars) {
      debounceRef.current = setTimeout(() => {
        onSearch?.(newValue);
      }, debounceMs);
    }

    setShowSuggestions(true);
    setSelectedIndex(-1);
  }, [controlledValue, onChange, onSearch, debounceMs, minChars]);

  const handleClear = useCallback(() => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    onChange?.('');
    onSearch?.('');
    inputRef.current?.focus();
    setShowSuggestions(false);
  }, [controlledValue, onChange, onSearch]);

  const handleSelectSuggestion = useCallback((text: string) => {
    if (controlledValue === undefined) {
      setInternalValue(text);
    }
    onChange?.(text);
    onSearch?.(text);
    onSelectSuggestion?.(text);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [controlledValue, onChange, onSearch, onSelectSuggestion]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearch?.(value);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(filteredSuggestions[selectedIndex].text);
        } else {
          onSearch?.(value);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, filteredSuggestions, selectedIndex, handleSelectSuggestion, onSearch, value]);

  const handleSubmit = useCallback(() => {
    onSearch?.(value);
    setShowSuggestions(false);
  }, [onSearch, value]);

  const sizeClasses = {
    sm: 'h-8 text-sm',
    default: 'h-10',
    lg: 'h-12 text-lg',
  };

  const iconSizeClasses = {
    sm: 'h-3.5 w-3.5',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative flex items-center">
        <Search className={cn(
          'absolute left-3 text-muted-foreground',
          iconSizeClasses[size]
        )} />
        
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          maxLength={maxLength}
          className={cn(
            'pl-10',
            showClearButton && value && 'pr-10',
            showSearchButton && 'pr-20',
            sizeClasses[size],
            inputClassName
          )}
        />

        {isLoading && (
          <Loader2 className={cn(
            'absolute right-3 animate-spin text-muted-foreground',
            iconSizeClasses[size],
            showSearchButton && 'right-14'
          )} />
        )}

        {showClearButton && value && !isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'absolute h-6 w-6',
              showSearchButton ? 'right-12' : 'right-2'
            )}
            onClick={handleClear}
          >
            <X className={iconSizeClasses[size]} />
          </Button>
        )}

        {showSearchButton && (
          <Button
            type="button"
            size="sm"
            className="absolute right-1"
            onClick={handleSubmit}
            disabled={disabled || value.length < minChars}
          >
            Buscar
          </Button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {filteredSuggestions.map((item, index) => (
              <li
                key={`${item.type}-${item.text}`}
                className={cn(
                  'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm',
                  index === selectedIndex && 'bg-accent',
                  'hover:bg-accent'
                )}
                onClick={() => handleSelectSuggestion(item.text)}
              >
                {item.type === 'recent' ? (
                  <History className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
          
          {recentSearches.length > 0 && onClearRecentSearches && (
            <div className="border-t px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onClearRecentSearches();
                  setShowSuggestions(false);
                }}
              >
                Limpar histórico
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook para gerenciar histórico de buscas
export function useSearchHistory(key: string, maxItems: number = 10) {
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(`search-history-${key}`);
    return saved ? JSON.parse(saved) : [];
  });

  const addToHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    
    setHistory(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
      const updated = [term, ...filtered].slice(0, maxItems);
      localStorage.setItem(`search-history-${key}`, JSON.stringify(updated));
      return updated;
    });
  }, [key, maxItems]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(`search-history-${key}`);
  }, [key]);

  const removeFromHistory = useCallback((term: string) => {
    setHistory(prev => {
      const updated = prev.filter(t => t !== term);
      localStorage.setItem(`search-history-${key}`, JSON.stringify(updated));
      return updated;
    });
  }, [key]);

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}

// Hook para busca com debounce
export function useDebouncedSearch(delay: number = 300) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setIsSearching(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  return {
    searchTerm,
    setSearchTerm,
    debouncedTerm,
    isSearching,
    clear: () => {
      setSearchTerm('');
      setDebouncedTerm('');
    },
  };
}
