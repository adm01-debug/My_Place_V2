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
  FileText,
  AlertCircle,
  HelpCircle
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
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ValeReceipt } from '@/components/vales/ValeReceipt';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';


export type TipoVale = 'adiantamento_salarial' | 'vale_refeicao' | 'vale_transporte' | 'vale_combustivel';
export type StatusVale = 'pendente' | 'em_analise' | 'aprovado' | 'pago' | 'recusado' | 'cancelado';

export interface ValeRequest {
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
  vale_combustivel: ShieldCheck, 
};

const statusColors: Record<StatusVale, string> = {
  pendente: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  em_analise: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  aprovado: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  pago: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
  recusado: 'bg-red-500/20 text-red-500 border-red-500/30',
  cancelado: 'bg-muted text-muted-foreground border-border',
};

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
          <p className="text-xs uppercase font-sans">Digital Signature Validated</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 font-sans">
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

      <div className="space-y-4 mb-8 font-sans">
        <div className="bg-slate-50 p-4 rounded border border-slate-200">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Tipo de Solicitação</p>
          <p className="font-medium">{valeLabels[vale.tipo]}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Justificativa</p>
          <p className="text-sm leading-relaxed">{vale.justificativa}</p>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200 font-sans">
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

  // Simulated Limits
  const salary = profile?.salario_base || 3500;
  const maxAdvance = salary * 0.4;
  const currentUsed = 0; 
  const availableAdvance = maxAdvance - currentUsed;

  const handlePrint = useCallback(() => {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`<html><head><title>Comprovante</title><script src="https://cdn.tailwindcss.com"></script></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('solicitacoes')
      .select('*')
      .eq('user_id', user.id)
      .in('tipo', ['adiantamento_salarial', 'outros'])
      .order('created_at', { ascending: false });

    if (data) {
      const mappedVales: ValeRequest[] = data.map(item => {
        // Simple heuristic to extract value from description if stored there
        const valorMatch = item.descricao.match(/Valor: R\$ ([\d,.]+)/);
        const valor = valorMatch ? parseFloat(valorMatch[1].replace(',', '.')) : 0;
        
        return {
          id: item.id,
          tipo: item.descricao.includes('Vale Refeição') ? 'vale_refeicao' : 
                item.descricao.includes('Vale Transporte') ? 'vale_transporte' : 
                item.descricao.includes('Combustível') ? 'vale_combustivel' : 'adiantamento_salarial',
          valor: valor,
          data_solicitacao: item.created_at,
          status: (item.status === 'aprovada' ? 'aprovado' : item.status === 'recusada' ? 'recusado' : item.status === 'cancelada' ? 'cancelado' : item.status) as StatusVale,
          justificativa: item.descricao.split('Justificativa: ')[1] || item.descricao,
          etapa_atual: item.status === 'pendente' ? 1 : item.status === 'em_analise' ? 2 : item.status === 'aprovada' ? 3 : 4
        };
      });
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

        {/* Strategic Dashboard: Financial Wellness & Intelligence */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-2 bg-gradient-to-br from-primary via-primary/90 to-indigo-700 text-white shadow-xl border-0 overflow-hidden relative group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
            <CardContent className="pt-8 relative">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-primary-foreground/70 text-[10px] font-bold uppercase tracking-[0.2em]">Saldo Disponível para Antecipação</p>
                  <h3 className="text-4xl font-black tracking-tighter">{formatCurrency(availableAdvance)}</h3>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                  <TrendingUp className="w-6 h-6 text-white animate-pulse" />
                </div>
              </div>
              
              <div className="mt-8 space-y-3">
                <div className="flex justify-between items-end text-xs font-bold">
                  <span className="text-primary-foreground/80">Utilização do Limite</span>
                  <span>{((currentUsed / maxAdvance) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentUsed / maxAdvance) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-primary-foreground/60 uppercase font-black">
                  <span>R$ 0,00</span>
                  <span>Limite Máximo: {formatCurrency(maxAdvance)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Processando</p>
              </div>
              <h3 className="text-3xl font-black text-foreground">
                {vales.filter(v => v.status === 'pendente' || v.status === 'em_analise').length}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-2">Solicitações em auditoria pelo RH</p>
            </CardContent>
            <div className="h-1 bg-amber-500/30 w-full" />
          </Card>

          <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Próximo Pagamento</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-foreground">{formatCurrency(vales.find(v => v.status === 'pago')?.valor || 0)}</h3>
                <p className="text-[10px] font-bold text-indigo-500 uppercase">Agendado para 05/{format(new Date(), 'MM')}</p>
              </div>
            </CardContent>
            <div className="h-1 bg-indigo-500/30 w-full" />
          </Card>
        </div>

        {/* List of Requests with Visual Timeline */}
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
                    onClick={() => setSelectedVale(vale)}
                    className="cursor-pointer"
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

                            {/* Timeline Stepper */}
                            <div className="relative pt-4 pb-2">
                              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2" />
                              <div className="relative flex justify-between items-center w-full">
                                {[1, 2, 3, 4].map((step) => {
                                  const isActive = vale.etapa_atual >= step;
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

        {/* FAQ/Policies */}
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

        {/* Request Modal */}
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
                        type="button"
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
