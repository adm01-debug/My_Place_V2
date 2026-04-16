import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, CheckCircle2, XCircle } from 'lucide-react';
import { StatusBadge, type ProfileInfo } from './AprovacaoFeriasCard';
import { AttachmentPreview } from '@/components/portal/AttachmentPreview';

interface SolicitacaoRequest {
  id: string;
  user_id: string;
  tipo: string;
  descricao: string;
  status: string;
  prioridade: string;
  anexo_url: string | null;
  created_at: string;
  profile?: ProfileInfo;
}

const tipoSolicitacaoLabels: Record<string, string> = {
  declaracao_vinculo: 'Declaração de Vínculo',
  alteracao_dados: 'Alteração de Dados',
  adiantamento_salarial: 'Adiantamento Salarial',
  carta_recomendacao: 'Carta de Recomendação',
  outros: 'Outros',
};

const prioridadeColors: Record<string, string> = {
  baixa: 'bg-muted text-muted-foreground',
  normal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  alta: 'bg-red-500/20 text-red-400 border-red-500/30',
};

interface Props {
  solicitacao: SolicitacaoRequest;
  onAction: (action: { type: 'solicitacao'; id: string; action: 'aprovar' | 'recusar' }) => void;
}

export function AprovacaoSolicitacaoCard({ solicitacao: s, onAction }: Props) {
  return (
    <Card className={`border-border/50 shadow-md ${s.status === 'pendente' ? 'ring-1 ring-amber-500/30' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{s.profile?.nome || 'Colaborador'}</p>
              <p className="text-xs text-muted-foreground">{s.profile?.cargo} · {s.profile?.departamento}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={prioridadeColors[s.prioridade] || ''}>
              {s.prioridade}
            </Badge>
            <StatusBadge status={s.status} />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">{tipoSolicitacaoLabels[s.tipo] || s.tipo}</p>
          <p className="text-sm text-foreground line-clamp-2">{s.descricao}</p>
          {s.anexo_url && <AttachmentPreview url={s.anexo_url} className="mt-1" />}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString('pt-BR')}</span>
          {(s.status === 'pendente' || s.status === 'em_analise') && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-red-400 hover:text-red-300 border-red-500/30"
                onClick={() => onAction({ type: 'solicitacao', id: s.id, action: 'recusar' })}>
                <XCircle className="w-3.5 h-3.5" /> Recusar
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1"
                onClick={() => onAction({ type: 'solicitacao', id: s.id, action: 'aprovar' })}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export type { SolicitacaoRequest };
