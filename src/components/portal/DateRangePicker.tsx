import * as React from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PresetKey = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom';

interface DatePreset {
  key: PresetKey;
  label: string;
  getValue: () => DateRange;
}

const presets: DatePreset[] = [
  {
    key: 'today',
    label: 'Hoje',
    getValue: () => ({ from: new Date(), to: new Date() }),
  },
  {
    key: 'yesterday',
    label: 'Ontem',
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: yesterday, to: yesterday };
    },
  },
  {
    key: 'last7',
    label: 'Últimos 7 dias',
    getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }),
  },
  {
    key: 'last30',
    label: 'Últimos 30 dias',
    getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }),
  },
  {
    key: 'thisMonth',
    label: 'Este mês',
    getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  },
  {
    key: 'lastMonth',
    label: 'Mês passado',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    },
  },
  {
    key: 'thisYear',
    label: 'Este ano',
    getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }),
  },
  {
    key: 'lastYear',
    label: 'Ano passado',
    getValue: () => {
      const lastYear = subYears(new Date(), 1);
      return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
    },
  },
];

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  showPresets?: boolean;
  presetPosition?: 'left' | 'top';
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  numberOfMonths?: 1 | 2;
  align?: 'start' | 'center' | 'end';
}

export default function DateRangePicker({
  value,
  onChange,
  placeholder = 'Selecione um período',
  className,
  showPresets = true,
  presetPosition = 'left',
  disabled = false,
  minDate,
  maxDate,
  numberOfMonths = 2,
  align = 'start',
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<PresetKey | null>(null);

  const handlePresetSelect = (presetKey: PresetKey) => {
    if (presetKey === 'custom') {
      setSelectedPreset('custom');
      return;
    }
    
    const preset = presets.find(p => p.key === presetKey);
    if (preset) {
      const range = preset.getValue();
      onChange?.(range);
      setSelectedPreset(presetKey);
      setOpen(false);
    }
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    onChange?.(range);
    setSelectedPreset('custom');
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  const formatDateRange = () => {
    if (!value?.from) return placeholder;
    
    if (!value.to || value.from.toDateString() === value.to.toDateString()) {
      return format(value.from, "dd 'de' MMMM, yyyy", { locale: ptBR });
    }
    
    return `${format(value.from, 'dd/MM/yyyy')} - ${format(value.to, 'dd/MM/yyyy')}`;
  };

  const PresetsList = () => (
    <div className="flex flex-col gap-1 p-2">
      {presets.map((preset) => (
        <Button
          key={preset.key}
          variant={selectedPreset === preset.key ? 'secondary' : 'ghost'}
          size="sm"
          className="justify-start"
          onClick={() => handlePresetSelect(preset.key)}
        >
          {preset.label}
        </Button>
      ))}
      <Button
        variant={selectedPreset === 'custom' ? 'secondary' : 'ghost'}
        size="sm"
        className="justify-start"
        onClick={() => handlePresetSelect('custom')}
      >
        Personalizado
      </Button>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className={cn(
          'flex',
          presetPosition === 'top' ? 'flex-col' : 'flex-row'
        )}>
          {showPresets && (
            <div className={cn(
              'border-r',
              presetPosition === 'top' && 'border-r-0 border-b'
            )}>
              <PresetsList />
            </div>
          )}
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={handleCalendarSelect}
            numberOfMonths={numberOfMonths}
            locale={ptBR}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Versão simplificada para seleção de data única
export function DatePicker({
  value,
  onChange,
  placeholder = 'Selecione uma data',
  className,
  disabled = false,
  minDate,
  maxDate,
}: {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd 'de' MMMM, yyyy", { locale: ptBR }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          locale={ptBR}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// Hook para gerenciar estado de período
export function useDateRange(defaultRange?: DateRange) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(defaultRange);

  const setPreset = React.useCallback((presetKey: PresetKey) => {
    const preset = presets.find(p => p.key === presetKey);
    if (preset) {
      setDateRange(preset.getValue());
    }
  }, []);

  const clear = React.useCallback(() => {
    setDateRange(undefined);
  }, []);

  const isInRange = React.useCallback((date: Date) => {
    if (!dateRange?.from) return false;
    if (!dateRange.to) return date >= dateRange.from;
    return date >= dateRange.from && date <= dateRange.to;
  }, [dateRange]);

  return {
    dateRange,
    setDateRange,
    setPreset,
    clear,
    isInRange,
    from: dateRange?.from,
    to: dateRange?.to,
  };
}
