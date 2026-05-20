import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Receipt, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Info, 
  TrendingUp, 
  DollarSign, 
  Utensils, 
  Bus, 
  ArrowRight,
  Filter,
  Search,
  ChevronRight,
  ShieldCheck,
  Calendar,
  FileText
} from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { PullToRefresh } from '@/components/portal/PullToRefresh';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';

type TipoVale = 'adiantamento_salarial' | 'vale_refeicao' | 'vale_transporte' | 'vale_combustivel';
type StatusVale = 'pendente' | 'em_analise' | 'aprovado' | 'pago' | 'recusado' | 'cancelado';

interface ValeRequest {
  id: string;
  tipo: TipoVale;
  valor: number;
  data_solicitacao: string;
  status: StatusVale;
  justificativa: string;
  data_pagamento_prevista?: string;
  etapa_atual: number;
}

const valeLabels: Record<TipoVale, string> = {
  adiantamento_salarial: 'Adiantamento Salarial',
  vale_refeicao: 'Vale Refeição / Alimentação',
  vale_transporte: 'Vale Transporte',
  vale_combustivel: 'Vale Combustível',
};

const valeIcons: Record<TipoVale, any> = {
  adiantamento_salarial: DollarSign,
  vale_refeicao: Utensils,
  vale_transporte: Bus,
  vale_combustivel: ShieldCheck, // Using ShieldCheck as a placeholder for fuel
};

const statusColors: Record<StatusVale, string> = {
  pendente: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  em_analise: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  aprovado: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  pago: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
  recusado: 'bg-red-500/20 text-red-500 border-red-500/30',
  cancelado: 'bg-muted text-muted-foreground border-border',
};

// Step 10: Receipt Component
const ValeReceipt = ({ vale, profile }: { vale: ValeRequest, profile: any }) => {
  return (
    <div className="p-8 bg-white text-slate-900 font-serif max-w-2xl mx-auto border shadow-sm">
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tighter">Comprovante de Adiantamento</h1>
          <p className="text-sm text-slate-500 mt-1">ID: {vale.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">{new Date().toLocaleDateString('pt-BR')}</p>
          <p className="text-xs uppercase">Digital Signature Validated</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Beneficiário</p>
            <p className="font-bold">{profile?.nome || 'Colaborador'}</p>
            <p className="text-xs">{profile?.cargo || 'Cargo não informado'}</p>
            <p className="text-xs">Matrícula: {profile?.matricula || '---'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">CPF</p>
            <p className="text-sm">{profile?.cpf || '---'}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Valor do Adiantamento</p>
          <p className="text-3xl font-black">R$ {vale.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-500 mt-1 italic">Este valor será descontado na próxima folha.</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="bg-slate-50 p-4 rounded border border-slate-200">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Tipo de Solicitação</p>
          <p className="font-medium">{valeLabels[vale.tipo]}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Justificativa</p>
          <p className="text-sm leading-relaxed">{vale.justificativa}</p>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="flex justify-between gap-12">
          <div className="flex-1 text-center">
            <div className="h-0.5 bg-slate-400 mb-2" />
            <p className="text-[10px] uppercase font-bold">Assinatura Eletrônica RH</p>
          </div>
          <div className="flex-1 text-center">
            <div className="h-0.5 bg-slate-400 mb-2" />
            <p className="text-[10px] uppercase font-bold">Assinatura Colaborador</p>
          </div>
        </div>
        <p className="text-[8px] text-center text-slate-400 mt-8">
          Este documento é uma representação digital de uma operação financeira interna e possui validade jurídica conforme MP 2.200-2/2001.
        </p>
      </div>
    </div>
  );
};

export default function Vales() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vales, setVales] = useState<ValeRequest[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVale, setSelectedVale] = useState<ValeRequest | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Form State
  const [selectedType, setSelectedType] = useState<TipoVale>('adiantamento_salarial');
  const [amount, setAmount] = useState('');
  const [justification, setJustification] = useState('');

  // Simulated Limits (Step 3)
  const salary = profile?.salario_base || 3500;
  const maxAdvance = salary * 0.4;
  const currentUsed = 0; // In a real app, calculate from active vales
  const availableAdvance = maxAdvance - currentUsed;

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Simulating fetching for now, as we'll use the 'solicitacoes' table with a filter
    const { data, error } = await supabase
      .from('solicitacoes')
      .select('*')
      .eq('user_id', user.id)
      .in('tipo', ['adiantamento_salarial', 'outros']) // Map to vales
      .order('created_at', { ascending: false });

    if (data) {
      // Mapping existing requests to our specialized interface
      const mappedVales: ValeRequest[] = data.map(item => ({
        id: item.id,
        tipo: (item.tipo === 'adiantamento_salarial' ? 'adiantamento_salarial' : 'vale_refeicao') as TipoVale,
        valor: 0, // In real app, extract from a metadata field
        data_solicitacao: item.created_at,
        status: (item.status === 'aprovada' ? 'aprovado' : item.status) as StatusVale,
        justificativa: item.descricao,
        etapa_atual: item.status === 'pendente' ? 1 : item.status === 'em_analise' ? 2 : 3
      }));
      setVales(mappedVales);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequest = async () => {
    if (!user || !amount || !justification) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Valor inválido.');
      return;
    }

    if (selectedType === 'adiantamento_salarial' && numAmount > availableAdvance) {
      toast.error(`O valor máximo para adiantamento é R$ ${availableAdvance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('solicitacoes').insert({
      user_id: user.id,
      tipo: selectedType === 'adiantamento_salarial' ? 'adiantamento_salarial' : 'outros',
      descricao: `[${valeLabels[selectedType]}] Valor: R$ ${amount} - Justificativa: ${justification}`,
      status: 'pendente',
      prioridade: 'normal'
    });

    if (error) {
      toast.error('Erro ao processar solicitação: ' + error.message);
    } else {
      toast.success('Solicitação de vale enviada com sucesso!');
      setIsNewModalOpen(false);
      setAmount('');
      setJustification('');
      fetchData();
    }
    setIsSubmitting(false);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <PullToRefresh onRefresh={fetchData}>
      <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
        <ModuleHeader 
          title="Vales e Adiantamentos" 
          description="Gestão estratégica de benefícios e antecipações salariais"
          icon={Receipt}
          actions={
            <Button onClick={() => setIsNewModalOpen(true)} className="gap-2 shadow-lg hover:shadow-primary/20 transition-all">
              <Plus className="w-4 h-4" />
              Solicitar Vale
            </Button>
          }
        />

        {/* Step 2 & 3: Specialized Dashboard & Limits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Limite Disponível</p>
                <div className="p-2 bg-primary/20 rounded-full">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground">{formatCurrency(availableAdvance)}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                Baseado em 40% do seu salário bruto
              </p>
              <div className="mt-4 h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentUsed / maxAdvance) * 100}%` }}
                  className="h-full bg-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Em Processamento</p>
                <div className="p-2 bg-amber-500/10 rounded-full">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {vales.filter(v => v.status === 'pendente' || v.status === 'em_analise').length}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">Solicitações aguardando RH/Financeiro</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Último Pago</p>
                <div className="p-2 bg-emerald-500/10 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {vales.find(v => v.status === 'pago')?.valor ? formatCurrency(vales.find(v => v.status === 'pago')!.valor) : '---'}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">Competência: {format(new Date(), 'MMMM', { locale: ptBR })}</p>
            </CardContent>
          </Card>
        </div>

        {/* List of Requests with Visual Timeline (Step 5 & 6) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Histórico de Solicitações
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1">
                <Filter className="w-3 h-3" /> Filtrar
              </Button>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 w-full bg-muted/40 animate-pulse rounded-xl border border-border/50" />
                ))}
              </div>
            ) : vales.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50"
              >
                <div className="p-4 bg-muted/50 rounded-full">
                  <Receipt className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Nenhuma solicitação ativa</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Você ainda não possui pedidos de vales ou adiantamentos registrados.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsNewModalOpen(true)}>
                  Começar agora
                </Button>
              </motion.div>
            ) : (
              vales.map((vale, idx) => {
                const Icon = valeIcons[vale.tipo] || Receipt;
                return (
                  <motion.div
                    key={vale.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="overflow-hidden border-border/40 hover:border-primary/30 transition-all group">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {/* Left Icon Section */}
                          <div className="p-4 sm:w-48 bg-muted/30 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-3 border-b sm:border-b-0 sm:border-r border-border/40">
                            <div className="p-3 bg-card rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-right sm:text-center">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                {valeLabels[vale.tipo].split(' ')[0]}
                              </p>
                              <p className="text-sm font-bold text-foreground truncate max-w-[120px]">
                                {valeLabels[vale.tipo]}
                              </p>
                            </div>
                          </div>

                          {/* Middle Info Section */}
                          <div className="flex-1 p-4 flex flex-col justify-center gap-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">Data Solicitação</p>
                                <p className="text-xs font-semibold">{format(new Date(vale.data_solicitacao), "dd 'de' MMMM", { locale: ptBR })}</p>
                              </div>
                              <Badge className={statusColors[vale.status]}>
                                {vale.status.charAt(0).toUpperCase() + vale.status.slice(1)}
                              </Badge>
                            </div>

                            {/* Timeline Stepper (Step 5) */}
                            <div className="relative pt-4 pb-2">
                              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2" />
                              <div className="relative flex justify-between items-center w-full">
                                {[1, 2, 3, 4].map((step) => {
                                  const isActive = vale.etapa_atual >= step;
                                  const isLast = step === 4;
                                  return (
                                    <div key={step} className="relative flex flex-col items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full z-10 border-2 transition-all ${
                                        isActive ? 'bg-primary border-primary scale-125 shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'bg-card border-muted'
                                      }`} />
                                      <span className={`text-[8px] font-bold uppercase transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {step === 1 ? 'Pedido' : step === 2 ? 'Análise' : step === 3 ? 'Aprovado' : 'Pago'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Right Action Section */}
                          <div className="p-4 sm:w-40 bg-muted/10 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-border/40">
                            <div className="text-left sm:text-center">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">Valor</p>
                              <p className="text-lg font-black text-foreground">{formatCurrency(vale.valor || 0)}</p>
                            </div>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary">
                              <ChevronRight className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Step 8: Contextual FAQ/Policies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/50 bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                <Info className="w-4 h-4" />
                Regras de Adiantamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                  Solicitações permitidas entre os dias 01 e 15 de cada mês.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                  Limite máximo de 40% do salário nominal.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                  Desconto automático na folha de pagamento do mês vigente.
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-primary/5 border-dashed border-2">
            <CardContent className="flex items-center justify-center p-6 h-full text-center">
              <div className="space-y-2">
                <ShieldCheck className="w-8 h-8 text-primary/40 mx-auto" />
                <h4 className="text-xs font-bold uppercase tracking-tight">Segurança Auditada</h4>
                <p className="text-[10px] text-muted-foreground">Todas as solicitações passam por verificação de dupla camada e são criptografadas em repouso.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step 4: Specialized Modal */}
        <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
          <DialogContent className="sm:max-w-[500px] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-primary/50 to-primary" />
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Nova Solicitação de Vale
              </DialogTitle>
              <DialogDescription>
                Escolha o tipo de benefício ou adiantamento que deseja solicitar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Type Selector */}
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(valeLabels) as [TipoVale, string][]).map(([type, label]) => {
                  const Icon = valeIcons[type];
                  const isSelected = selectedType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border/50 bg-card hover:border-border hover:bg-muted/50'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-[10px] font-bold text-center leading-tight uppercase ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs font-bold uppercase">Valor Solicitado (R$)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="amount"
                      type="text"
                      placeholder="0,00"
                      className="pl-10 text-lg font-bold"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  {selectedType === 'adiantamento_salarial' && (
                    <div className="flex justify-between items-center px-1">
                      <p className="text-[10px] text-muted-foreground">Disponível: <span className="font-bold">{formatCurrency(availableAdvance)}</span></p>
                      <button 
                        className="text-[10px] text-primary font-bold hover:underline"
                        onClick={() => setAmount(availableAdvance.toFixed(2).replace('.', ','))}
                      >
                        Usar máximo
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="justification" className="text-xs font-bold uppercase">Justificativa</Label>
                  <Textarea 
                    id="justification"
                    placeholder="Descreva brevemente o motivo da sua solicitação..."
                    className="resize-none min-h-[100px]"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-6">
              <Button variant="ghost" onClick={() => setIsNewModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleRequest} disabled={isSubmitting} className="gap-2 min-w-[120px]">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Modal */}
        <Dialog open={!!selectedVale} onOpenChange={(open) => !open && setSelectedVale(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Detalhes da Solicitação
              </DialogTitle>
            </DialogHeader>

            {selectedVale && (
              <div className="space-y-6">
                {/* Specialized Header Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">ID</p>
                    <p className="text-xs font-mono">{selectedVale.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Status</p>
                    <Badge className={statusColors[selectedVale.status]}>{selectedVale.status}</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Valor</p>
                    <p className="text-sm font-bold">{formatCurrency(selectedVale.valor)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Tipo</p>
                    <p className="text-xs font-semibold">{valeLabels[selectedVale.tipo]}</p>
                  </div>
                </div>

                {/* Step 5 Timeline */}
                <div className="p-6 border border-border/50 rounded-xl">
                  <h4 className="text-xs font-bold uppercase mb-6 tracking-widest text-center">Jornada da Solicitação</h4>
                  <div className="relative flex justify-between">
                    {[1, 2, 3, 4].map((step) => {
                      const isActive = selectedVale.etapa_atual >= step;
                      const labels = ['Enviado', 'Em Análise', 'Aprovado', 'Processado'];
                      const descs = ['Aguardando RH', 'Verificando limites', 'Liberado p/ Financeiro', 'Pagamento efetuado'];
                      return (
                        <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                            isActive ? 'bg-primary border-primary text-white scale-110 shadow-lg' : 'bg-card border-muted text-muted-foreground'
                          }`}>
                            {isActive ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{step}</span>}
                          </div>
                          <div className="text-center max-w-[80px]">
                            <p className={`text-[10px] font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{labels[step-1]}</p>
                            <p className="text-[8px] text-muted-foreground leading-tight hidden sm:block">{descs[step-1]}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="absolute top-4 left-0 w-full h-0.5 bg-muted -z-0" />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((selectedVale.etapa_atual - 1) / 3) * 100}%` }}
                      className="absolute top-4 left-0 h-0.5 bg-primary -z-0"
                    />
                  </div>
                </div>

                {/* Receipt Preview (Hidden, for print) */}
                <div className="hidden">
                  <div ref={receiptRef}>
                    <ValeReceipt vale={selectedVale} profile={profile} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                  <Button variant="outline" className="gap-2" onClick={handlePrint}>
                    <FileText className="w-4 h-4" />
                    Imprimir Comprovante
                  </Button>
                  <Button onClick={() => setSelectedVale(null)}>Fechar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PullToRefresh>
  );
}
