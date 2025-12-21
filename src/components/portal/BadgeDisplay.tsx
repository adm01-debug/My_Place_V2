import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface BadgeData {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  criterio?: string;
  pontos_necessarios?: number | null;
}

export interface BadgeConquistado extends BadgeData {
  conquistado_em: string;
}

interface BadgeDisplayProps {
  badge: BadgeData;
  conquistado?: boolean;
  dataConquista?: string;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  showDate?: boolean;
  onClick?: () => void;
  className?: string;
}

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  conquistado = false,
  dataConquista,
  size = 'md',
  showDescription = true,
  showDate = true,
  onClick,
  className,
}) => {
  const sizeClasses = {
    sm: 'p-2 text-2xl',
    md: 'p-4 text-4xl',
    lg: 'p-6 text-6xl',
  };

  const textSizes = {
    sm: { title: 'text-xs', desc: 'text-xs', date: 'text-xs' },
    md: { title: 'text-sm', desc: 'text-xs', date: 'text-xs' },
    lg: { title: 'text-base', desc: 'text-sm', date: 'text-xs' },
  };

  return (
    <motion.div
      whileHover={{ scale: conquistado ? 1.05 : 1 }}
      whileTap={{ scale: conquistado ? 0.95 : 1 }}
      onClick={onClick}
      className={cn(
        'rounded-lg border text-center transition-all cursor-pointer',
        conquistado 
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800' 
          : 'bg-muted/50 opacity-60 grayscale',
        sizeClasses[size],
        className
      )}
    >
      <div 
        className="mb-2"
        style={{ filter: conquistado ? 'none' : 'grayscale(1)' }}
      >
        {badge.icone}
      </div>
      <h4 className={cn('font-semibold', textSizes[size].title)}>
        {badge.nome}
      </h4>
      {showDescription && (
        <p className={cn('text-muted-foreground mt-1', textSizes[size].desc)}>
          {badge.descricao}
        </p>
      )}
      {conquistado && showDate && dataConquista && (
        <p className={cn('text-primary mt-2', textSizes[size].date)}>
          ✓ {format(new Date(dataConquista), "dd/MM/yyyy", { locale: ptBR })}
        </p>
      )}
      {!conquistado && badge.pontos_necessarios && (
        <p className={cn('text-muted-foreground mt-2', textSizes[size].date)}>
          🔒 {badge.pontos_necessarios} pts
        </p>
      )}
    </motion.div>
  );
};

// Grid component for displaying multiple badges
interface BadgeGridProps {
  badges: BadgeData[];
  conquistados?: string[]; // IDs dos badges conquistados
  datasConquista?: Record<string, string>;
  columns?: 2 | 3 | 4;
  size?: 'sm' | 'md' | 'lg';
  onBadgeClick?: (badge: BadgeData) => void;
  className?: string;
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  badges,
  conquistados = [],
  datasConquista = {},
  columns = 4,
  size = 'md',
  onBadgeClick,
  className,
}) => {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {badges.map(badge => (
        <BadgeDisplay
          key={badge.id}
          badge={badge}
          conquistado={conquistados.includes(badge.id)}
          dataConquista={datasConquista[badge.id]}
          size={size}
          onClick={() => onBadgeClick?.(badge)}
        />
      ))}
    </div>
  );
};

export default BadgeDisplay;
