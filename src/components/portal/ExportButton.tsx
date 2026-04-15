import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, File, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';

interface ExportOption {
  format: ExportFormat;
  label: string;
  icon: React.ElementType;
  mimeType: string;
  extension: string;
}

const exportOptions: ExportOption[] = [
  { format: 'csv', label: 'CSV', icon: FileText, mimeType: 'text/csv', extension: '.csv' },
  { format: 'xlsx', label: 'Excel', icon: FileSpreadsheet, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: '.xlsx' },
  { format: 'pdf', label: 'PDF', icon: File, mimeType: 'application/pdf', extension: '.pdf' },
  { format: 'json', label: 'JSON', icon: FileText, mimeType: 'application/json', extension: '.json' },
];

interface ExportButtonProps<T> {
  data: T[];
  filename?: string;
  formats?: ExportFormat[];
  onExport?: (format: ExportFormat, data: T[]) => Promise<Blob | string | void>;
  columns?: { key: keyof T; label: string }[];
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export default function ExportButton<T extends Record<string, any>>({
  data,
  filename = 'export',
  formats = ['csv', 'xlsx'],
  onExport,
  columns,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className,
  children,
}: ExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExported, setLastExported] = useState<ExportFormat | null>(null);
  const { toast } = useToast();

  const availableOptions = exportOptions.filter(opt => formats.includes(opt.format));

  const convertToCSV = (data: T[]): string => {
    if (data.length === 0) return '';
    
    const headers = columns 
      ? columns.map(c => c.label)
      : Object.keys(data[0]);
    
    const keys = columns 
      ? columns.map(c => c.key)
      : Object.keys(data[0]) as (keyof T)[];
    
    const rows = data.map(row => 
      keys.map(key => {
        const value = row[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };

  const convertToJSON = (data: T[]): string => {
    if (columns) {
      return JSON.stringify(
        data.map(row => {
          const filtered: Record<string, any> = {};
          columns.forEach(col => {
            filtered[col.label] = row[col.key];
          });
          return filtered;
        }),
        null,
        2
      );
    }
    return JSON.stringify(data, null, 2);
  };

  const handleExport = async (format: ExportFormat) => {
    if (data.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'A lista está vazia.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    
    try {
      let blob: Blob;
      const option = exportOptions.find(o => o.format === format)!;
      
      if (onExport) {
        const result = await onExport(format, data);
        if (result instanceof Blob) {
          blob = result;
        } else if (typeof result === 'string') {
          blob = new Blob([result], { type: option.mimeType });
        } else {
          // Se onExport não retornar nada, usar conversão padrão
          if (format === 'csv') {
            blob = new Blob([convertToCSV(data)], { type: option.mimeType });
          } else if (format === 'json') {
            blob = new Blob([convertToJSON(data)], { type: option.mimeType });
          } else {
            throw new Error(`Formato ${format} requer implementação customizada via onExport`);
          }
        }
      } else {
        // Conversão padrão
        if (format === 'csv') {
          blob = new Blob([convertToCSV(data)], { type: option.mimeType });
        } else if (format === 'json') {
          blob = new Blob([convertToJSON(data)], { type: option.mimeType });
        } else {
          throw new Error(`Formato ${format} requer implementação customizada via onExport`);
        }
      }

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}${option.extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setLastExported(format);
      setTimeout(() => setLastExported(null), 2000);

      toast({
        title: 'Exportação concluída',
        description: `${data.length} registros exportados em ${option.label}.`,
      });
    } catch (error) {
      import('@/lib/logger').then(({ createLogger }) => createLogger('Export').error('Erro na exportação:', error));
      toast({
        title: 'Erro na exportação',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Se só tem um formato, mostrar botão simples
  if (availableOptions.length === 1) {
    const option = availableOptions[0];
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled || isExporting || data.length === 0}
        onClick={() => handleExport(option.format)}
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : lastExported === option.format ? (
          <Check className="mr-2 h-4 w-4 text-green-500" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {children || `Exportar ${option.label}`}
      </Button>
    );
  }

  // Múltiplos formatos - dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={disabled || isExporting || data.length === 0}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {children || 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableOptions.map((option, index) => (
          <React.Fragment key={option.format}>
            <DropdownMenuItem onClick={() => handleExport(option.format)}>
              <option.icon className="mr-2 h-4 w-4" />
              {option.label}
              {lastExported === option.format && (
                <Check className="ml-auto h-4 w-4 text-green-500" />
              )}
            </DropdownMenuItem>
            {index < availableOptions.length - 1 && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook para exportação programática
export function useExport<T extends Record<string, any>>() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportData = async (
    data: T[],
    format: ExportFormat,
    filename: string,
    options?: {
      columns?: { key: keyof T; label: string }[];
      customExport?: (format: ExportFormat, data: T[]) => Promise<Blob | string>;
    }
  ) => {
    setIsExporting(true);
    try {
      let content: string | Blob;
      
      if (options?.customExport) {
        content = await options.customExport(format, data);
      } else if (format === 'csv') {
        const headers = options?.columns 
          ? options.columns.map(c => c.label)
          : Object.keys(data[0] || {});
        const keys = options?.columns 
          ? options.columns.map(c => c.key)
          : Object.keys(data[0] || {}) as (keyof T)[];
        
        const rows = data.map(row => 
          keys.map(key => String(row[key] ?? '')).join(',')
        );
        content = [headers.join(','), ...rows].join('\n');
      } else if (format === 'json') {
        content = JSON.stringify(data, null, 2);
      } else {
        throw new Error(`Formato ${format} requer customExport`);
      }

      const blob = content instanceof Blob 
        ? content 
        : new Blob([content], { type: 'text/plain' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${format}`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportação concluída',
        description: `${data.length} registros exportados.`,
      });

      return true;
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportData, isExporting };
}
