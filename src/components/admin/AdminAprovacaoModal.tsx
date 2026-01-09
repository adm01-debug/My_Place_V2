import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, X, User, Calendar, Clock, CreditCard, FileText, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const TIPO_REMUNERACAO_LABELS: Record<string, string> = {
  comissao: 'Comissão',
  bonificacao: 'Bonificação',
  plr: 'PLR',
  premio: 'Prêmio',
};

interface AdminAprovacaoModalProps {
  open: boolean;
  onClose: () => void;
  tipo?: 'solicitacao' | 'ferias' | 'emprestimo' | 'justificativa' | 'remuneracao';
  data?: any;
  onAprovar: (tipo: string, id: string) => Promise<void>;
  onRejeitar: (tipo: string, id: string, motivo: string) => Promise<void>;
}

export function AdminAprovacaoModal({ open, onClose, tipo, data, onAprovar, onRejeitar }: AdminAprovacaoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejeitar, setShowRejeitar] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  if (!tipo || !data) return null;

  const handleAprovar = async () => {
    setIsSubmitting(true);
    await onAprovar(tipo, data.id);
    setIsSubmitting(false);
    setShowRejeitar(false);
    setMotivoRejeicao('');
  };

  const handleRejeitar = async () => {
    if (!motivoRejeicao.trim()) return;
    setIsSubmitting(true);
    await onRejeitar(tipo, data.id, motivoRejeicao);
    setIsSubmitting(false);
    setShowRejeitar(false);
    setMotivoRejeicao('');
  };

  const renderDetalhes = () => {
    switch (tipo) {
      case 'solicitacao':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{data.profile?.nome || 'Colaborador'}</span>
              <span className="text-muted-foreground">({data.profile?.email})</span>
            </div>
            {data.profile?.departamento && (
              <Badge variant="secondary">{data.profile.departamento}</Badge>
            )}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-medium mb-1">{data.titulo}</p>
              <Badge variant="outline">{data.tipo}</Badge>
              <Badge variant={data.prioridade === 'alta' ? 'destructive' : 'secondary'} className="ml-2">
                {data.prioridade}
              </Badge>
            </div>
            {data.descricao && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.descricao}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Criado em {format(new Date(data.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        );

      case 'ferias':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{data.profile?.nome || 'Colaborador'}</span>
            </div>
            {data.profile?.departamento && (
              <Badge variant="secondary">{data.profile.departamento}</Badge>
            )}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-medium">{data.tipo}</span>
              </div>
              <p className="text-sm">
                {format(new Date(data.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} até {format(new Date(data.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
              <Badge>{data.dias_solicitados} dias</Badge>
            </div>
            {data.observacao && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">{data.observacao}</p>
              </div>
            )}
          </div>
        );

      case 'emprestimo':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{data.profile?.nome || 'Colaborador'}</span>
            </div>
            {data.profile?.departamento && (
              <Badge variant="secondary">{data.profile.departamento}</Badge>
            )}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-finance" />
                <span className="text-lg font-bold">R$ {data.valor_original.toLocaleString('pt-BR')}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {data.quantidade_parcelas}x de R$ {(data.valor_original / data.quantidade_parcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {data.motivo && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-1">Motivo:</p>
                <p className="text-sm text-muted-foreground">{data.motivo}</p>
              </div>
            )}
          </div>
        );

      case 'justificativa':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{data.profile?.nome || 'Colaborador'}</span>
            </div>
            {data.profile?.departamento && (
              <Badge variant="secondary">{data.profile.departamento}</Badge>
            )}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-hr" />
                <span className="font-medium">{data.tipo}</span>
              </div>
              <p className="text-sm">
                Data: {format(new Date(data.data), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-1">Motivo:</p>
              <p className="text-sm text-muted-foreground">{data.motivo}</p>
            </div>
          </div>
        );

      case 'remuneracao':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{data.profile?.nome || 'Colaborador'}</span>
            </div>
            {data.profile?.departamento && (
              <Badge variant="secondary">{data.profile.departamento}</Badge>
            )}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-500" />
                <span className="font-medium">{TIPO_REMUNERACAO_LABELS[data.tipo] || data.tipo}</span>
              </div>
              <p className="text-lg font-bold">R$ {Number(data.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-muted-foreground">
                Referência: {String(data.mes).padStart(2, '0')}/{data.ano}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-1">Descrição:</p>
              <p className="text-sm text-muted-foreground">{data.descricao}</p>
            </div>
            {data.referencia && (
              <p className="text-xs text-muted-foreground">
                Referência: {data.referencia}
              </p>
            )}
            {data.percentual && (
              <p className="text-xs text-muted-foreground">
                Percentual: {data.percentual}%
              </p>
            )}
          </div>
        );
    }
  };

  const getTitulo = () => {
    switch (tipo) {
      case 'solicitacao': return 'Aprovar Solicitação';
      case 'ferias': return 'Aprovar Férias';
      case 'emprestimo': return 'Aprovar Empréstimo';
      case 'justificativa': return 'Aprovar Justificativa';
      case 'remuneracao': return 'Aprovar Remuneração Variável';
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); setShowRejeitar(false); setMotivoRejeicao(''); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitulo()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {renderDetalhes()}

          {showRejeitar ? (
            <div className="space-y-3 pt-4 border-t">
              <Label htmlFor="motivo">Motivo da rejeição *</Label>
              <Textarea
                id="motivo"
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Informe o motivo da rejeição..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRejeitar(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleRejeitar} 
                  disabled={isSubmitting || !motivoRejeicao.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? 'Rejeitando...' : 'Confirmar Rejeição'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowRejeitar(true)} 
                className="flex-1 gap-2 border-destructive text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
                Rejeitar
              </Button>
              <Button 
                onClick={handleAprovar} 
                disabled={isSubmitting}
                className="flex-1 gap-2 bg-finance hover:bg-finance/90"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? 'Aprovando...' : 'Aprovar'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
