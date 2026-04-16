import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, CheckCircle2, XCircle } from 'lucide-react';

interface ProfileInfo {
  nome: string;
  cargo: string | null;
  departamento: string | null;
}

interface FeriasRequest {
  id: string;
  user_id: string;
  data_inicio: string;
  data_fim: string;
  dias: number;
  tipo: string;
  status: string;
  observacao: string | null;
  created_at: string;
  profile?: ProfileInfo;
}

const tipoFeriasLabels: Record<string, string> = {
  regular: 'Regular',
  abono_pecuniario: 'Abono Pecuniário',
  fracionada: 'Fracionada',
};

const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

interface Props {
  ferias: FeriasRequest;
  onAction: (action: { type: 'ferias'; id: string; action: 'aprovar' | 'recusar' }) => void;
}

export function AprovacaoFeriasCard({ ferias: f, onAction }: Props) {
  return (
    <Card className={`border-border/50 shadow-md ${f.status === 'pendente' ? 'ring-1 ring-amber-500/30' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{f.profile?.nome || 'Colaborador'}</p>
              <p className="text-xs text-muted-foreground">{f.profile?.cargo} · {f.profile?.departamento}</p>
            </div>
          </div>
          <StatusBadge status={f.status} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Início</p>
            <p className="text-sm font-semibold text-foreground">{formatDate(f.data_inicio)}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Fim</p>
            <p className="text-sm font-semibold text-foreground">{formatDate(f.data_fim)}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Dias</p>
            <p className="text-sm font-semibold text-foreground">{f.dias}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{tipoFeriasLabels[f.tipo] || f.tipo}</span>
          {f.status === 'pendente' && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-red-400 hover:text-red-300 border-red-500/30"
                onClick={() => onAction({ type: 'ferias', id: f.id, action: 'recusar' })}>
                <XCircle className="w-3.5 h-3.5" /> Recusar
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1"
                onClick={() => onAction({ type: 'ferias', id: f.id, action: 'aprovar' })}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pendente: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    em_analise: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    aprovada: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    recusada: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelada: 'bg-muted text-muted-foreground border-border',
  };
  const labels: Record<string, string> = {
    pendente: 'Pendente', em_analise: 'Em Análise', aprovada: 'Aprovada', recusada: 'Recusada', cancelada: 'Cancelada',
  };
  return <Badge variant="outline" className={colors[status] || ''}>{labels[status] || status}</Badge>;
}

export type { FeriasRequest, ProfileInfo };
