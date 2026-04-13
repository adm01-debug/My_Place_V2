import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format, isSameMonth, isToday } from 'date-fns';
import type { EventoCalendario } from '@/hooks/useCalendarioCorporativo';

interface DiaCalendarioProps {
  data: Date;
  mesAtual: Date;
  eventos: EventoCalendario[];
  isSelected: boolean;
  onSelect: () => void;
}

export function DiaCalendario({ data, mesAtual, eventos, isSelected, onSelect }: DiaCalendarioProps) {
  const isMesAtual = isSameMonth(data, mesAtual);
  const isHoje = isToday(data);
  const temEventos = eventos.length > 0;
  const tiposUnicos = [...new Set(eventos.map(e => e.tipo))];

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center justify-center p-1 min-h-[48px] rounded-lg transition-all',
        isMesAtual ? 'text-foreground' : 'text-muted-foreground/40',
        isHoje && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
        isSelected && 'bg-primary text-primary-foreground',
        !isSelected && temEventos && 'bg-muted/50',
        !isSelected && !temEventos && 'hover:bg-muted/30'
      )}
    >
      <span className={cn('text-sm font-medium', isHoje && !isSelected && 'text-primary font-bold')}>
        {format(data, 'd')}
      </span>
      {temEventos && (
        <div className="flex gap-0.5 mt-0.5">
          {tiposUnicos.slice(0, 3).map((tipo, i) => (
            <span
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                tipo === 'feriado' && 'bg-red-500',
                tipo === 'aniversario' && 'bg-pink-500',
                tipo === 'ferias' && 'bg-teal-500',
                tipo === 'evento' && 'bg-blue-500',
                tipo === 'confraternizacao' && 'bg-orange-500',
                tipo === 'treinamento' && 'bg-purple-500',
                isSelected && 'bg-primary-foreground'
              )}
            />
          ))}
        </div>
      )}
    </motion.button>
  );
}
