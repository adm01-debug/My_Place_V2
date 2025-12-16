import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/portal/PageLayout';
import { ListItemSkeleton } from '@/components/portal/Skeletons';
import { useLoadingState } from '@/hooks/useLoadingState';
import { mockSolicitacoes } from '@/data/mockData';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  aberta: { label: 'Aberta', color: 'bg-primary/10 text-primary', icon: Clock },
  em_analise: { label: 'Em análise', color: 'bg-projects-light text-projects', icon: Clock },
  aguardando_docs: { label: 'Aguardando docs', color: 'bg-projects-light text-projects', icon: AlertCircle },
  aprovada: { label: 'Aprovada', color: 'bg-finance-light text-finance', icon: CheckCircle },
  concluida: { label: 'Concluída', color: 'bg-muted text-muted-foreground', icon: CheckCircle },
  rejeitada: { label: 'Rejeitada', color: 'bg-destructive/10 text-destructive', icon: AlertCircle },
};

export default function Solicitacoes() {
  const abertas = mockSolicitacoes.filter(s => !['concluida', 'rejeitada'].includes(s.status));
  const concluidas = mockSolicitacoes.filter(s => ['concluida', 'rejeitada'].includes(s.status));
  const isLoading = useLoadingState(800);

  if (isLoading) {
    return (
      <PageLayout title="Minhas Solicitações" showBack>
        <div className="space-y-6">
          <div className="h-10 bg-muted rounded-md animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <ListItemSkeleton key={i} />)}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Minhas Solicitações" showBack>
      <div className="space-y-6 animate-fade-in-up">
        <Button className="w-full"><Plus className="w-4 h-4 mr-2" /> Nova Solicitação</Button>

        {abertas.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">📋 Em Aberto ({abertas.length})</h3>
            <div className="space-y-3">
              {abertas.map((sol) => {
                const config = statusConfig[sol.status];
                return (
                  <Card key={sol.id} className="p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-muted-foreground">#{sol.numero}</span>
                      <Badge className={config.color}>{config.label}</Badge>
                    </div>
                    <p className="font-medium text-foreground">{sol.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1">Aberto: {format(sol.criadaEm, 'dd/MM/yyyy')}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {concluidas.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">✅ Concluídas</h3>
            <div className="space-y-3">
              {concluidas.map((sol) => {
                const config = statusConfig[sol.status];
                return (
                  <Card key={sol.id} className="p-4 opacity-75">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-muted-foreground">#{sol.numero}</span>
                      <Badge className={config.color}>{config.label}</Badge>
                    </div>
                    <p className="font-medium text-foreground">{sol.titulo}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
