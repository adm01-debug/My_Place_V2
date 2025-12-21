import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export interface TrilhaEtapaData {
  id: string;
  ordem: number;
  titulo: string;
  tipo: string;
  duracao_minutos: number;
  concluida?: boolean;
}

interface TrilhaProgressProps {
  nome: string;
  descricao?: string | null;
  nivel: string;
  etapas: TrilhaEtapaData[];
  etapasConcluidas: number;
  progressoPercentual: number;
  cargaHorariaTotal?: number;
  status?: 'nao_iniciada' | 'em_andamento' | 'concluida' | 'pausada';
  showEtapas?: boolean;
  compact?: boolean;
  className?: string;
}

const getNivelColor = (nivel: string) => {
  const colors: Record<string, string> = {
    iniciante: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    intermediario: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    avancado: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    especialista: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  };
  return colors[nivel] || 'bg-gray-100 text-gray-800';
};

const getNivelIcon = (nivel: string) => {
  const icons: Record<string, string> = {
    iniciante: '🌱',
    intermediario: '🌿',
    avancado: '🌳',
    especialista: '🏆',
  };
  return icons[nivel] || '📚';
};

const getStatusBadge = (status: string) => {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    nao_iniciada: { label: 'Não Iniciada', variant: 'outline' },
    em_andamento: { label: 'Em Andamento', variant: 'default' },
    concluida: { label: 'Concluída', variant: 'secondary' },
    pausada: { label: 'Pausada', variant: 'outline' },
  };
  return config[status] || { label: status, variant: 'outline' };
};

export const TrilhaProgress: React.FC<TrilhaProgressProps> = ({
  nome,
  descricao,
  nivel,
  etapas,
  etapasConcluidas,
  progressoPercentual,
  cargaHorariaTotal,
  status = 'nao_iniciada',
  showEtapas = false,
  compact = false,
  className,
}) => {
  const statusConfig = getStatusBadge(status);

  if (compact) {
    return (
      <div className={cn('p-4 rounded-lg border', className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getNivelIcon(nivel)}</span>
            <h4 className="font-medium text-sm">{nome}</h4>
          </div>
          <Badge variant={statusConfig.variant} className="text-xs">
            {statusConfig.label}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>{etapasConcluidas}/{etapas.length} etapas</span>
          <span>{Math.round(progressoPercentual)}%</span>
        </div>
        <Progress value={progressoPercentual} className="h-2" />
      </div>
    );
  }

  return (
    <div className={cn('p-6 rounded-lg border', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getNivelIcon(nivel)}</span>
          <div>
            <h3 className="font-semibold text-lg">{nome}</h3>
            {descricao && (
              <p className="text-sm text-muted-foreground mt-1">{descricao}</p>
            )}
          </div>
        </div>
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <BookOpen className="h-4 w-4" />
          {etapas.length} etapas
        </div>
        {cargaHorariaTotal && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {cargaHorariaTotal}h
          </div>
        )}
        <Badge variant="outline" className={getNivelColor(nivel)}>
          {nivel}
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span>Progresso</span>
          <span className="font-medium">
            {etapasConcluidas}/{etapas.length} ({Math.round(progressoPercentual)}%)
          </span>
        </div>
        <Progress value={progressoPercentual} className="h-3" />
      </div>

      {/* Etapas Timeline */}
      {showEtapas && etapas.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Etapas</h4>
          <div className="space-y-3">
            {etapas.map((etapa, index) => (
              <motion.div
                key={etapa.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg transition-colors',
                  etapa.concluida ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'
                )}
              >
                {etapa.concluida ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm truncate',
                    etapa.concluida && 'line-through text-muted-foreground'
                  )}>
                    {etapa.titulo}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {etapa.duracao_minutos} min
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrilhaProgress;
