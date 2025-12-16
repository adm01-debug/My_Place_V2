import { useState } from 'react';
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/portal/PageLayout';
import { ListItemSkeleton } from '@/components/portal/Skeletons';
import { useSolicitacoes } from '@/hooks/useSolicitacoes';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pendente: { label: 'Pendente', color: 'bg-primary/10 text-primary', icon: Clock },
  em_analise: { label: 'Em análise', color: 'bg-projects-light text-projects', icon: Clock },
  aprovado: { label: 'Aprovado', color: 'bg-finance-light text-finance', icon: CheckCircle },
  rejeitado: { label: 'Rejeitado', color: 'bg-destructive/10 text-destructive', icon: AlertCircle },
  concluido: { label: 'Concluído', color: 'bg-muted text-muted-foreground', icon: CheckCircle },
};

const tiposConfig: Record<string, string> = {
  declaracao: 'Declaração',
  ferias: 'Férias',
  documentos: 'Documentos',
  beneficios: 'Benefícios',
  folha: 'Folha de Pagamento',
  outros: 'Outros',
};

export default function Solicitacoes() {
  const [showNova, setShowNova] = useState(false);
  const [tipo, setTipo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<'baixa' | 'normal' | 'alta' | 'urgente'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { solicitacoes, isLoading, criarSolicitacao, refetch } = useSolicitacoes();
  const { toast } = useToast();

  const abertas = solicitacoes.filter(s => !['concluido', 'rejeitado'].includes(s.status));
  const concluidas = solicitacoes.filter(s => ['concluido', 'rejeitado'].includes(s.status));

  const handleSubmit = async () => {
    if (!tipo || !titulo) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o tipo e título da solicitação.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await criarSolicitacao(tipo, titulo, descricao || undefined, prioridade);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Solicitação criada!',
        description: 'Sua solicitação foi enviada com sucesso.',
      });
      setShowNova(false);
      resetForm();
    } else {
      toast({
        title: 'Erro ao criar',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setTipo('');
    setTitulo('');
    setDescricao('');
    setPrioridade('normal');
  };

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
    <PageLayout title="Minhas Solicitações" showBack onRefresh={refetch}>
      <div className="space-y-6 animate-fade-in-up">
        <Button className="w-full" onClick={() => setShowNova(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nova Solicitação
        </Button>

        {abertas.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
              📋 Em Aberto ({abertas.length})
            </h3>
            <div className="space-y-3">
              {abertas.map((sol) => {
                const config = statusConfig[sol.status] || statusConfig.pendente;
                return (
                  <Card key={sol.id} className="p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {tiposConfig[sol.tipo] || sol.tipo}
                      </span>
                      <Badge className={config.color}>{config.label}</Badge>
                    </div>
                    <p className="font-medium text-foreground">{sol.titulo}</p>
                    {sol.descricao && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {sol.descricao}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Aberto: {format(new Date(sol.created_at), 'dd/MM/yyyy')}
                    </p>
                    {sol.resposta && (
                      <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                        <span className="font-medium">Resposta:</span> {sol.resposta}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {abertas.length === 0 && concluidas.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
            <p className="text-sm text-muted-foreground">Clique em "Nova Solicitação" para criar uma</p>
          </div>
        )}

        {concluidas.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
              ✅ Concluídas ({concluidas.length})
            </h3>
            <div className="space-y-3">
              {concluidas.map((sol) => {
                const config = statusConfig[sol.status] || statusConfig.concluido;
                return (
                  <Card key={sol.id} className="p-4 opacity-75">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {tiposConfig[sol.tipo] || sol.tipo}
                      </span>
                      <Badge className={config.color}>{config.label}</Badge>
                    </div>
                    <p className="font-medium text-foreground">{sol.titulo}</p>
                    {sol.resposta && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                        <span className="font-medium">Resposta:</span> {sol.resposta}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal Nova Solicitação */}
      <Dialog open={showNova} onOpenChange={setShowNova}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Solicitação</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tiposConfig).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Declaração de vínculo empregatício"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva sua solicitação..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNova(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
