import React from 'react';
import { Frown, Meh, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EscalaEmojiProps {
  perguntaId: string;
  valor: number | undefined;
  onResponder: (perguntaId: string, valor: number) => void;
}

export const EscalaEmoji: React.FC<EscalaEmojiProps> = ({ perguntaId, valor, onResponder }) => {
  const opcoes = [
    { value: 1, icon: Frown, label: 'Muito Insatisfeito', color: 'text-red-500 hover:text-red-600' },
    { value: 2, icon: Frown, label: 'Insatisfeito', color: 'text-orange-500 hover:text-orange-600' },
    { value: 3, icon: Meh, label: 'Neutro', color: 'text-yellow-500 hover:text-yellow-600' },
    { value: 4, icon: Smile, label: 'Satisfeito', color: 'text-lime-500 hover:text-lime-600' },
    { value: 5, icon: Smile, label: 'Muito Satisfeito', color: 'text-green-500 hover:text-green-600' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 py-4">
      {opcoes.map((opcao) => {
        const Icon = opcao.icon;
        const isSelected = valor === opcao.value;
        return (
          <button
            key={opcao.value}
            type="button"
            onClick={() => onResponder(perguntaId, opcao.value)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl transition-all duration-200',
              isSelected ? 'bg-primary/10 scale-110 ring-2 ring-primary' : 'hover:bg-muted/50 hover:scale-105',
              opcao.color
            )}
            title={opcao.label}
          >
            <Icon className={cn('h-8 w-8 md:h-10 md:w-10', isSelected && 'fill-current')} />
            <span className="text-[10px] md:text-xs text-muted-foreground">{opcao.value}</span>
          </button>
        );
      })}
    </div>
  );
};
