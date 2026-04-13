import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Play, ChevronRight, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { TrilhaComProgresso } from '@/hooks/useTrilhas';

interface TrilhaCardProps {
  trilha: TrilhaComProgresso;
  onIniciar: () => void;
  onContinuar: () => void;
  onVerDetalhes: () => void;
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
  const icons: Record<string, string> = { iniciante: '🌱', intermediario: '🌿', avancado: '🌳', especialista: '🏆' };
  return icons[nivel] || '📚';
};

export const TrilhaCard: React.FC<TrilhaCardProps> = ({ trilha, onIniciar, onContinuar, onVerDetalhes }) => {
  const getStatusBadge = () => {
    if (!trilha.progresso) return null;
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      em_andamento: { label: 'Em Andamento', variant: 'default' },
      concluida: { label: 'Concluída', variant: 'secondary' },
      pausada: { label: 'Pausada', variant: 'outline' },
    };
    const config = statusConfig[trilha.progresso.status];
    return config ? <Badge variant={config.variant}>{config.label}</Badge> : null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getNivelIcon(trilha.nivel)}</span>
              <div>
                <CardTitle className="text-lg">{trilha.nome}</CardTitle>
                {trilha.departamento && <p className="text-xs text-muted-foreground">{trilha.departamento}</p>}
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{trilha.descricao}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{trilha.carga_horaria_total}h</div>
            <div className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{trilha.total_etapas} etapas</div>
            <Badge variant="outline" className={getNivelColor(trilha.nivel)}>{trilha.nivel}</Badge>
          </div>
          {trilha.progresso && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>{trilha.etapas_concluidas}/{trilha.total_etapas} etapas</span>
                <span>{Math.round(trilha.progresso.progresso_percentual)}%</span>
              </div>
              <Progress value={trilha.progresso.progresso_percentual} className="h-2" />
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          {!trilha.progresso ? (
            <Button className="w-full" onClick={onIniciar}><Play className="h-4 w-4 mr-2" />Iniciar Trilha</Button>
          ) : trilha.progresso.status === 'concluida' ? (
            <Button variant="outline" className="w-full" onClick={onVerDetalhes}><Award className="h-4 w-4 mr-2" />Ver Certificado</Button>
          ) : (
            <Button className="w-full" onClick={onContinuar}><ChevronRight className="h-4 w-4 mr-2" />Continuar</Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};
