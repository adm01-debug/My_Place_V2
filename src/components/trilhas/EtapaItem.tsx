import React from 'react';
import { BookOpen, CheckCircle2, Clock, ClipboardList, FileText, GraduationCap, HelpCircle, Users, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TrilhaEtapa } from '@/hooks/useTrilhas';

interface EtapaItemProps {
  etapa: TrilhaEtapa;
  onConcluir: () => void;
  disabled?: boolean;
}

const getTipoIcon = (tipo: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    video: <Video className="h-4 w-4" />,
    documento: <FileText className="h-4 w-4" />,
    quiz: <HelpCircle className="h-4 w-4" />,
    tarefa: <ClipboardList className="h-4 w-4" />,
    treinamento: <GraduationCap className="h-4 w-4" />,
    mentoria: <Users className="h-4 w-4" />,
  };
  return icons[tipo] || <BookOpen className="h-4 w-4" />;
};

export const EtapaItem: React.FC<EtapaItemProps> = ({ etapa, onConcluir, disabled }) => (
  <div className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
    etapa.concluida
      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      : 'hover:bg-muted/50'
  }`}>
    <div className={`p-2 rounded-full ${
      etapa.concluida
        ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200'
        : 'bg-muted text-muted-foreground'
    }`}>
      {etapa.concluida ? <CheckCircle2 className="h-5 w-5" /> : getTipoIcon(etapa.tipo)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-sm truncate">{etapa.titulo}</h4>
        {etapa.obrigatoria && <Badge variant="outline" className="text-xs">Obrigatória</Badge>}
      </div>
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">{getTipoIcon(etapa.tipo)}{etapa.tipo.charAt(0).toUpperCase() + etapa.tipo.slice(1)}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{etapa.duracao_minutos} min</span>
      </div>
      {etapa.concluida && etapa.data_conclusao && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          ✓ Concluído em {format(new Date(etapa.data_conclusao), "dd/MM/yyyy", { locale: ptBR })}
        </p>
      )}
    </div>
    {!etapa.concluida && <Button size="sm" onClick={onConcluir} disabled={disabled}>Concluir</Button>}
  </div>
);
