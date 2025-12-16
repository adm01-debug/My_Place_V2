import { BookOpen, AlertTriangle, CheckCircle, Download, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { useLoadingState } from '@/hooks/useLoadingState';
import { mockTreinamentos } from '@/data/mockData';
import { format } from 'date-fns';

export default function Treinamentos() {
  const t = mockTreinamentos;
  const isLoading = useLoadingState(800);

  if (isLoading) {
    return (
      <PageLayout title="Meus Treinamentos" showBack>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <ListItemSkeleton key={i} />)}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Meus Treinamentos" showBack>
      <div className="space-y-6 animate-fade-in-up">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center"><p className="text-2xl font-bold text-finance">{t.totalRealizados}</p><p className="text-xs text-muted-foreground">Realizados</p></Card>
          <Card className="p-3 text-center"><p className="text-2xl font-bold text-projects">{t.totalPendentes}</p><p className="text-xs text-muted-foreground">Pendentes</p></Card>
          <Card className="p-3 text-center"><p className="text-2xl font-bold text-primary">{t.horasTotal}h</p><p className="text-xs text-muted-foreground">Total</p></Card>
        </div>

        {t.pendentes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">⚠️ Pendentes</h3>
            <div className="space-y-3">
              {t.pendentes.map((tr) => (
                <Card key={tr.id} className="p-4 border-l-4 border-l-projects">
                  <div className="flex justify-between mb-2">
                    <Badge variant={tr.tipo === 'obrigatorio' ? 'destructive' : 'secondary'}>{tr.tipo === 'obrigatorio' ? '🔴 Obrigatório' : '🟡 Recomendado'}</Badge>
                    <span className="text-xs text-muted-foreground">{tr.cargaHoraria}h</span>
                  </div>
                  <p className="font-semibold text-foreground">{tr.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-1">Prazo: {format(tr.prazo!, 'dd/MM/yyyy')}</p>
                  <Button size="sm" className="w-full mt-3"><Play className="w-4 h-4 mr-1" /> Iniciar</Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">✅ Realizados</h3>
          <div className="space-y-3">
            {t.realizados.map((tr) => (
              <Card key={tr.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div><p className="font-medium text-foreground">{tr.titulo}</p><p className="text-xs text-muted-foreground">{format(tr.dataRealizacao!, 'dd/MM/yyyy')} | {tr.cargaHoraria}h | Nota: {tr.nota}</p></div>
                  <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {t.trilha && (
          <Card className="p-4 bg-hr-light/30">
            <h3 className="font-semibold mb-2">📈 Trilha de Desenvolvimento</h3>
            <p className="text-sm mb-2">Nível: <span className="font-medium">{t.trilha.nivelAtual}</span> → {t.trilha.proximoNivel}</p>
            <Progress value={t.trilha.progressoPercentual} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">Faltam {t.trilha.treinamentosFaltantes} treinamentos</p>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
