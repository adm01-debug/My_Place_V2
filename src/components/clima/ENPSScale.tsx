import React from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ENPSScaleProps {
  perguntaId: string;
  valor: number | undefined;
  onResponder: (perguntaId: string, valor: number) => void;
}

export const ENPSScale: React.FC<ENPSScaleProps> = ({ perguntaId, valor, onResponder }) => (
  <div className="py-4">
    <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1"><ThumbsDown className="h-3 w-3" /> Improvável</span>
      <span className="flex items-center gap-1">Muito Provável <ThumbsUp className="h-3 w-3" /></span>
    </div>
    <div className="flex gap-1">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
        const isSelected = valor === n;
        let bgColor = 'bg-red-500/80';
        if (n >= 7 && n <= 8) bgColor = 'bg-yellow-500/80';
        if (n >= 9) bgColor = 'bg-green-500/80';
        return (
          <button
            key={n}
            type="button"
            onClick={() => onResponder(perguntaId, n)}
            className={cn(
              'flex-1 py-2 md:py-3 rounded text-xs md:text-sm font-medium transition-all',
              isSelected
                ? `${bgColor} text-white scale-110 ring-2 ring-offset-2 ring-primary`
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
    <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
      <span>Detratores (0-6)</span>
      <span>Neutros (7-8)</span>
      <span>Promotores (9-10)</span>
    </div>
  </div>
);
