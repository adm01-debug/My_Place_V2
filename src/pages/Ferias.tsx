import { useState } from 'react';
import { Umbrella, Plus, Calendar, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { useFerias } from '@/hooks/useFerias';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pendente: { label: 'Pendente', icon: Clock, color: 'bg-projects-light text-projects' },
  aprovado: { label: 'Aprovado', icon: CheckCircle, color: 'bg-finance-light text-finance' },
  rejeitado: { label: 'Rejeitado', icon: XCircle, color: 'bg-destructive/10 text-destructive' },
  cancelado: { label: 'Cancelado', icon: XCircle, color: 'bg-muted text-muted-foreground' },
};

export default function Ferias() {
  const [showSolicitar, setShowSolicitar] = useState(false);
  const [formData, setFormData] = useState({
    data_inicio: '',
    data_fim: '',
    tipo: 'ferias' as 'ferias' | 'abono' | 'venda',
    observacao: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    ferias, 
    saldoTotal, 
    periodoAquisitivo,
    proximasFerias,
    isLoading,
    solicitarFerias,
    cancelarFerias,
    getFeriasPendentes,
    getHistorico,
    refetch 
  } = useFerias();
  
  const { toast } = useToast();

  const diasSolicitados = formData.data_inicio && formData.data_fim
    ? differenceInDays(new Date(formData.data_fim), new Date(formData.data_inicio)) + 1
    : 0;

  const handleSolicitar = async () => {
    if (!formData.data_inicio || !formData.data_fim) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha as datas de início e fim.',
        variant: 'destructive',
      });
      return;
    }

    if (diasSolicitados < 5 && formData.tipo === 'ferias') {
      toast({
        title: 'Período inválido',
        description: 'O período mínimo de férias é de 5 dias.',
        variant: 'destructive',
      });
      return;
    }

    if (diasSolicitados > saldoTotal) {
      toast({
        title: 'Saldo insuficiente',
        description: `Você tem apenas ${saldoTotal} dias disponíveis.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const result = await solicitarFerias(
      formData.data_inicio,
      formData.data_fim,
      diasSolicitados,
      formData.tipo,
      formData.observacao
    );

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Solicitação enviada!',
        description: 'Sua solicitação será analisada pelo gestor.',
      });
      setShowSolicitar(false);
      setFormData({ data_inicio: '', data_fim: '', tipo: 'ferias', observacao: '' });
    } else {
      toast({
        title: 'Erro ao solicitar',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleCancelar = async (id: string) => {
    const result = await cancelarFerias(id);
    
    if (result.success) {
      toast({
        title: 'Férias canceladas',
        description: 'Sua solicitação foi cancelada.',
      });
    } else {
      toast({
        title: 'Erro ao cancelar',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const pendentes = getFeriasPendentes();
  const historico = getHistorico();

  if (isLoading) {
    return (
      <PageLayout title="Minhas Férias" showBack>
        <div className="space-y-6">
          <StatCardSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Minhas Férias" showBack onRefresh={refetch}>
      <div className="space-y-6 animate-fade-in-up">
        {/* Saldo de Férias */}
        <Card className="p-5 bg-gradient-to-br from-projects-light via-card to-card">
          <div className="flex items-center gap-2 mb-4">
            <Umbrella className="w-5 h-5 text-projects" />
            <h3 className="font-semibold">Saldo de Férias</h3>
          </div>
          <div className="text-center mb-4">
            <p className="text-4xl font-bold text-foreground">{saldoTotal}</p>
            <p className="text-sm text-muted-foreground">dias disponíveis</p>
          </div>
          <Progress value={(saldoTotal / 30) * 100} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground text-center">
            Máximo: 30 dias por período aquisitivo
          </p>
        </Card>

        {/* Próximas Férias Aprovadas */}
        {proximasFerias && (
          <Card className="p-4 border-l-4 border-l-finance">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-finance" />
              <span className="font-medium text-finance">Próximas Férias</span>
            </div>
            <p className="text-sm">
              {format(new Date(proximasFerias.data_inicio), "dd 'de' MMMM", { locale: ptBR })}
              {' a '}
              {format(new Date(proximasFerias.data_fim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {proximasFerias.dias_solicitados} dias
            </p>
          </Card>
        )}

        {/* Botão Solicitar */}
        <Button className="w-full" onClick={() => setShowSolicitar(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Solicitar Férias
        </Button>

        {/* Solicitações Pendentes */}
        {pendentes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
              ⏳ Pendentes de Aprovação
            </h3>
            <div className="space-y-3">
              {pendentes.map((f) => {
                const config = statusConfig[f.status];
                const Icon = config.icon;
                
                return (
                  <Card key={f.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={config.color}>
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive h-auto p-1"
                        onClick={() => handleCancelar(f.id)}
                      >
                        Cancelar
                      </Button>
                    </div>
                    <p className="text-sm font-medium">
                      {format(new Date(f.data_inicio), 'dd/MM/yyyy')} a {format(new Date(f.data_fim), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {f.dias_solicitados} dias | Solicitado em {format(new Date(f.created_at), 'dd/MM/yyyy')}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Histórico */}
        {historico.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
              📋 Histórico
            </h3>
            <div className="space-y-2">
              {historico.slice(0, 5).map((f) => {
                const config = statusConfig[f.status];
                
                return (
                  <Card key={f.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">
                          {format(new Date(f.data_inicio), 'dd/MM/yy')} - {format(new Date(f.data_fim), 'dd/MM/yy')}
                        </p>
                        <p className="text-xs text-muted-foreground">{f.dias_solicitados} dias</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {config.label}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal Solicitar Férias */}
      <Dialog open={showSolicitar} onOpenChange={setShowSolicitar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Umbrella className="w-5 h-5" />
              Solicitar Férias
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  min={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  min={formData.data_inicio || format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                />
              </div>
            </div>

            {diasSolicitados > 0 && (
              <Card className="p-3 bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span>Dias solicitados:</span>
                  <span className="font-medium">{diasSolicitados} dias</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Saldo após aprovação:</span>
                  <span className={`font-medium ${saldoTotal - diasSolicitados < 0 ? 'text-destructive' : 'text-finance'}`}>
                    {saldoTotal - diasSolicitados} dias
                  </span>
                </div>
              </Card>
            )}

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(v) => setFormData({ ...formData, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ferias">Férias</SelectItem>
                  <SelectItem value="abono">Abono Pecuniário (vender 10 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea
                placeholder="Alguma observação sobre sua solicitação..."
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSolicitar(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSolicitar} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              {isSubmitting ? 'Enviando...' : 'Solicitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
