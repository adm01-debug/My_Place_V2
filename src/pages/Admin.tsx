import { useState } from 'react';
import { 
  Megaphone, GraduationCap, ClipboardList, 
  Umbrella, CreditCard, Clock, Plus, Pencil, Trash2, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageLayout } from '@/components/portal/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminData } from '@/hooks/useAdminData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AdminComunicadoModal } from '@/components/admin/AdminComunicadoModal';
import { AdminTreinamentoModal } from '@/components/admin/AdminTreinamentoModal';
import { AdminAprovacaoModal } from '@/components/admin/AdminAprovacaoModal';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminAprovacoesList } from '@/components/admin/AdminAprovacoesList';

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    comunicados, treinamentos, solicitacoes, ferias, emprestimos,
    justificativas, remuneracoes, stats, isLoading, refetch,
    criarComunicado, atualizarComunicado, excluirComunicado,
    criarTreinamento, atualizarTreinamento, excluirTreinamento,
    aprovarSolicitacao, rejeitarSolicitacao,
    aprovarFerias, rejeitarFerias,
    aprovarEmprestimo, rejeitarEmprestimo,
    aprovarJustificativa, rejeitarJustificativa,
    aprovarRemuneracao, rejeitarRemuneracao,
  } = useAdminData();

  const [comunicadoModal, setComunicadoModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [treinamentoModal, setTreinamentoModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [aprovacaoModal, setAprovacaoModal] = useState<{ 
    open: boolean; 
    tipo?: 'solicitacao' | 'ferias' | 'emprestimo' | 'justificativa' | 'remuneracao';
    data?: any;
  }>({ open: false });

  const handleSaveComunicado = async (data: any) => {
    const result = comunicadoModal.data
      ? await atualizarComunicado(comunicadoModal.data.id, data)
      : await criarComunicado(data);
    if (result.success) {
      toast({ title: comunicadoModal.data ? 'Comunicado atualizado' : 'Comunicado criado' });
      setComunicadoModal({ open: false });
    } else {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    }
  };

  const handleDeleteComunicado = async (id: string) => {
    const result = await excluirComunicado(id);
    if (result.success) toast({ title: 'Comunicado excluído' });
    else toast({ title: 'Erro', description: result.error, variant: 'destructive' });
  };

  const handleSaveTreinamento = async (data: any) => {
    const result = treinamentoModal.data
      ? await atualizarTreinamento(treinamentoModal.data.id, data)
      : await criarTreinamento(data);
    if (result.success) {
      toast({ title: treinamentoModal.data ? 'Treinamento atualizado' : 'Treinamento criado' });
      setTreinamentoModal({ open: false });
    } else {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    }
  };

  const handleDeleteTreinamento = async (id: string) => {
    const result = await excluirTreinamento(id);
    if (result.success) toast({ title: 'Treinamento excluído' });
    else toast({ title: 'Erro', description: result.error, variant: 'destructive' });
  };

  const handleAprovar = async (tipo: string, id: string) => {
    let result;
    switch (tipo) {
      case 'solicitacao': result = await aprovarSolicitacao(id); break;
      case 'ferias': result = await aprovarFerias(id, user?.id || ''); break;
      case 'emprestimo': result = await aprovarEmprestimo(id); break;
      case 'justificativa': result = await aprovarJustificativa(id); break;
      case 'remuneracao': result = await aprovarRemuneracao(id, user?.id || ''); break;
    }
    if (result?.success) {
      toast({ title: 'Aprovado com sucesso' });
      setAprovacaoModal({ open: false });
    } else {
      toast({ title: 'Erro', description: result?.error, variant: 'destructive' });
    }
  };

  const handleRejeitar = async (tipo: string, id: string, motivo: string) => {
    let result;
    switch (tipo) {
      case 'solicitacao': result = await rejeitarSolicitacao(id, motivo); break;
      case 'ferias': result = await rejeitarFerias(id, motivo); break;
      case 'emprestimo': result = await rejeitarEmprestimo(id, motivo); break;
      case 'justificativa': result = await rejeitarJustificativa(id, motivo); break;
      case 'remuneracao': result = await rejeitarRemuneracao(id, motivo); break;
    }
    if (result?.success) {
      toast({ title: 'Rejeitado' });
      setAprovacaoModal({ open: false });
    } else {
      toast({ title: 'Erro', description: result?.error, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Painel Admin">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Painel Admin" onRefresh={refetch}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <AdminStatCard icon={ClipboardList} label="Solicitações" value={stats.solicitacoesPendentes} color="bg-primary" />
          <AdminStatCard icon={Umbrella} label="Férias" value={stats.feriasPendentes} color="bg-projects" />
          <AdminStatCard icon={CreditCard} label="Empréstimos" value={stats.emprestimosPendentes} color="bg-finance" />
          <AdminStatCard icon={Clock} label="Justificativas" value={stats.justificativasPendentes} color="bg-hr" />
          <AdminStatCard icon={DollarSign} label="Remunerações" value={stats.remuneracoesPendentes} color="bg-amber-500" />
        </div>

        <Tabs defaultValue="aprovacoes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="aprovacoes" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Aprovações</span>
              {stats.pendentesTotal > 0 && <Badge variant="destructive" className="ml-1">{stats.pendentesTotal}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="comunicados" className="gap-2">
              <Megaphone className="w-4 h-4" /><span className="hidden sm:inline">Comunicados</span>
            </TabsTrigger>
            <TabsTrigger value="treinamentos" className="gap-2">
              <GraduationCap className="w-4 h-4" /><span className="hidden sm:inline">Treinamentos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aprovacoes" className="space-y-4">
            <AdminAprovacoesList
              solicitacoes={solicitacoes} ferias={ferias} emprestimos={emprestimos}
              justificativas={justificativas} remuneracoes={remuneracoes}
              pendentesTotal={stats.pendentesTotal}
              onOpenAprovacao={(tipo, data) => setAprovacaoModal({ open: true, tipo: tipo as 'solicitacao' | 'ferias' | 'emprestimo' | 'justificativa' | 'remuneracao', data })}
            />
          </TabsContent>

          <TabsContent value="comunicados" className="space-y-4">
            <Button onClick={() => setComunicadoModal({ open: true })} className="w-full gap-2">
              <Plus className="w-4 h-4" />Novo Comunicado
            </Button>
            {comunicados.length === 0 ? (
              <Card className="p-8 text-center border-0 shadow-card">
                <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum comunicado cadastrado</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {comunicados.map((c: any) => (
                  <Card key={c.id} className="p-4 border-0 shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{c.titulo}</p>
                          {c.importante && <Badge variant="destructive" className="text-xs">Importante</Badge>}
                          {c.fixado && <Badge variant="secondary" className="text-xs">Fixado</Badge>}
                          {!c.ativo && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {c.categoria} • {format(new Date(c.data_publicacao), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setComunicadoModal({ open: true, data: c })}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteComunicado(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="treinamentos" className="space-y-4">
            <Button onClick={() => setTreinamentoModal({ open: true })} className="w-full gap-2">
              <Plus className="w-4 h-4" />Novo Treinamento
            </Button>
            {treinamentos.length === 0 ? (
              <Card className="p-8 text-center border-0 shadow-card">
                <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum treinamento cadastrado</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {treinamentos.map((t: any) => (
                  <Card key={t.id} className="p-4 border-0 shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{t.titulo}</p>
                          {t.obrigatorio && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
                          {!t.ativo && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t.categoria} • {t.carga_horaria}h {t.instrutor && `• ${t.instrutor}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setTreinamentoModal({ open: true, data: t })}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTreinamento(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AdminComunicadoModal open={comunicadoModal.open} onClose={() => setComunicadoModal({ open: false })} data={comunicadoModal.data} onSave={handleSaveComunicado} />
      <AdminTreinamentoModal open={treinamentoModal.open} onClose={() => setTreinamentoModal({ open: false })} data={treinamentoModal.data} onSave={handleSaveTreinamento} />
      <AdminAprovacaoModal open={aprovacaoModal.open} onClose={() => setAprovacaoModal({ open: false })} tipo={aprovacaoModal.tipo} data={aprovacaoModal.data} onAprovar={handleAprovar} onRejeitar={handleRejeitar} />
    </PageLayout>
  );
}
