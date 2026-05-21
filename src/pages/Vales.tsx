import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { PullToRefresh } from '@/components/portal/PullToRefresh';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ValeReceipt } from '@/components/vales/ValeReceipt';
import { RequestStepper } from '@/components/vales/RequestStepper';
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
  anexo_url?: string | null;
}

export const valeLabels: Record<TipoVale, string> = {
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


export default function Vales() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vales, setVales] = useState<ValeRequest[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVale, setSelectedVale] = useState<ValeRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusVale | 'todos'>('todos');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Form State
  const [selectedType, setSelectedType] = useState<TipoVale>('adiantamento_salarial');
  const [amount, setAmount] = useState('');
  const [justification, setJustification] = useState('');

  // Simulated Limits
  const salary = profile?.salario_base || 3500;
  const maxAdvance = salary * 0.4;
  
  const currentUsed = useMemo(() => {
    return vales
      .filter(v => v.status !== 'recusado' && v.status !== 'cancelado' && v.tipo === 'adiantamento_salarial')
      .reduce((acc, curr) => acc + curr.valor, 0);
  }, [vales]);

  const availableAdvance = maxAdvance - currentUsed;

  const chartData = useMemo(() => {
    const months = [5, 4, 3, 2, 1, 0].map(m => subMonths(new Date(), m));
    return months.map(date => {
      const monthLabel = format(date, 'MMM', { locale: ptBR });
      const monthVales = vales.filter(v => 
        format(new Date(v.data_solicitacao), 'MM/yyyy') === format(date, 'MM/yyyy') &&
        (v.status === 'aprovado' || v.status === 'pago')
      );
      return {
        name: monthLabel,
        valor: monthVales.reduce((acc, curr) => acc + curr.valor, 0)
      };
    });
  }, [vales]);

  const filteredVales = useMemo(() => {
    return vales.filter(v => {
      const matchesSearch = v.justificativa.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           valeLabels[v.tipo].toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'todos' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vales, searchTerm, statusFilter]);


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
      .in('tipo', ['adiantamento_salarial', 'vale_refeicao', 'vale_transporte', 'vale_combustivel', 'outros'])
      .order('created_at', { ascending: false });

    if (data) {
      const mappedVales: ValeRequest[] = data.map(item => {
        // Use real column 'valor' if available, otherwise try to parse (for legacy data)
        let valor = item.valor ? Number(item.valor) : 0;
        
        if (valor === 0 && item.descricao) {
          const valorMatch = item.descricao.match(/Valor: R\$ ([\d,.]+)/);
          valor = valorMatch ? parseFloat(valorMatch[1].replace(/\./g, '').replace(',', '.')) : 0;
        }
        
        // Map the status from DB enum to our local UI status type
        let status: StatusVale = 'pendente';
        if (item.status === 'aprovada') status = 'aprovado';
        else if (item.status === 'recusada') status = 'recusado';
        else if (item.status === 'cancelada') status = 'cancelado';
        else if (item.status === 'em_analise') status = 'em_analise';
        else if (item.status === 'pendente') status = 'pendente';

        const tipoMapped = item.tipo as TipoVale;
        
        return {
          id: item.id,
          tipo: tipoMapped,
          valor: valor,
          data_solicitacao: item.created_at,
          status: status,
          anexo_url: item.anexo_url,
          justificativa: item.descricao?.split('Justificativa: ')[1] || item.descricao || '',
          etapa_atual: item.status === 'pendente' ? 1 : item.status === 'em_analise' ? 2 : item.status === 'aprovada' ? 3 : 4
        };
      });
      setVales(mappedVales);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsNewModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {

    fetchData();

    // Etapa 3: Sincronização em Tempo Real (Realtime Sync)
    const channel = supabase
      .channel('vales_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitacoes',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, user?.id]);

  const handleRequest = async (data: { type: TipoVale; amount: string; justification: string; attachmentUrl?: string }) => {
    if (!user) return;

    const numAmount = parseFloat(data.amount.replace(/\./g, '').replace(',', '.'));
    
    setIsSubmitting(true);
    const loadingToast = toast.loading('Processando sua solicitação...');

    try {
      const { error } = await supabase.from('solicitacoes').insert({
        user_id: user.id,
        tipo: data.type,
        valor: numAmount,
        descricao: `[${valeLabels[data.type]}] Valor: R$ ${numAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - Justificativa: ${data.justification}`,
        status: 'pendente',
        prioridade: 'normal',
        anexo_url: data.attachmentUrl
      });

      if (error) throw error;

      toast.success('Solicitação enviada!', {
        id: loadingToast,
        description: 'Sua jornada de aprovação começou. Acompanhe pelo histórico.',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      });
      
      // Modal handles its own success state now
      setAmount('');
      setJustification('');
      fetchData();
    } catch (error: any) {
      toast.error('Falha no processamento', {
        id: loadingToast,
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!user) return;
    
    const confirmToast = toast.promise(
      (async () => {
        const { error } = await supabase.from('solicitacoes').update({ status: 'cancelada' }).eq('id', id);
        if (error) throw error;
        return true;
      })(),
      {

        loading: 'Cancelando solicitação...',
        success: 'Solicitação cancelada com sucesso.',
        error: 'Erro ao cancelar. Tente novamente.'
      }
    );
    
    setSelectedVale(null);
    fetchData();
  };


  const handleShareWhatsApp = (vale: ValeRequest) => {
    const text = `*Solicitação de Vale - Portal do Colaborador*\n\n` +
      `*Tipo:* ${valeLabels[vale.tipo]}\n` +
      `*Valor:* ${formatCurrency(vale.valor)}\n` +
      `*Data:* ${new Date(vale.data_solicitacao).toLocaleDateString('pt-BR')}\n` +
      `*Status:* ${vale.status.toUpperCase()}\n` +
      `*Justificativa:* ${vale.justificativa}\n\n` +
      `ID da Operação: ${vale.id.toUpperCase()}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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

        {/* Floating Action Button for Mobile Accessibility */}
        <div className="fixed bottom-24 right-6 z-50 md:hidden">
          <Button 
            onClick={() => setIsNewModalOpen(true)} 
            className="w-14 h-14 rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center p-0"
          >
            <Plus className="w-8 h-8" />
          </Button>
        </div>


        {/* Strategic Dashboard: Financial Wellness & Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          <Card className="lg:col-span-4 border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Performance Financeira
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">Visão holística de gastos e tendências</p>
              </div>
            </CardHeader>
            <CardContent className="px-0 pt-4 flex gap-4">
              <div className="h-[200px] w-full lg:w-2/3">
                {loading ? (
                  <div className="h-full w-full px-6 flex flex-col justify-end gap-2 pb-4">
                    <div className="flex items-end gap-2 h-full">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="flex-1" style={{ height: `${20 + Math.random() * 60}%` }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} 
                      />
                      <YAxis hide />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border p-2 rounded-lg shadow-xl backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">{payload[0].payload.name}</p>
                                <p className="text-xs font-black text-primary">{formatCurrency(payload[0].value as number)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="valor" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorValor)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              {/* Distribution Stats */}
              <div className="hidden lg:flex flex-col justify-center gap-4 pr-6">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-2 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))
                ) : (
                  (['adiantamento_salarial', 'vale_refeicao', 'vale_transporte'] as const).map(tipo => (
                    <div key={tipo} className="space-y-1">
                      <p className="text-[9px] uppercase font-black text-muted-foreground">{valeLabels[tipo]}</p>
                      <p className="text-sm font-black">{formatCurrency(vales.filter(v => v.tipo === tipo).reduce((acc, curr) => acc + curr.valor, 0))}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <Skeleton className="w-full h-full min-h-[250px] rounded-2xl" />
            ) : (
              <Card className="bg-gradient-to-br from-primary via-primary/90 to-indigo-700 text-white shadow-xl border-0 overflow-hidden relative group h-full">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
                <CardContent className="pt-8 relative flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <p className="text-primary-foreground/70 text-[10px] font-bold uppercase tracking-[0.2em]">Disponível para Antecipação</p>
                        <h3 className="text-4xl font-black tracking-tighter">{formatCurrency(availableAdvance)}</h3>
                      </div>
                      <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-end text-xs font-bold">
                        <span className="text-primary-foreground/80 uppercase text-[9px]">Utilização</span>
                        <span className="text-lg font-black">{((currentUsed / maxAdvance) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 p-[1px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(currentUsed / maxAdvance) * 100}%` }}
                          transition={{ duration: 1.5, ease: "circOut" }}
                          className="h-full bg-gradient-to-r from-emerald-400 to-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 mt-6 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-[9px] text-primary-foreground/60 uppercase font-black">Limite Total</p>
                      <p className="text-sm font-bold">{formatCurrency(maxAdvance)}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-0 text-[10px] uppercase font-black h-8">
                      Detalhes <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>


        {/* Etapa 8: Insights Preditivos e Alertas */}
        <AnimatePresence>
          {availableAdvance < (salary * 0.1) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4"
            >
              <div className="p-2 bg-amber-500 rounded-full text-white">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase text-amber-700 tracking-wider">Atenção ao Limite</p>
                <p className="text-[11px] text-amber-600 font-medium">Você já utilizou a maior parte do seu limite de adiantamento. Novas solicitações passarão por análise criteriosa.</p>
              </div>
              <Button variant="outline" size="sm" className="bg-white/50 border-amber-200 text-amber-700 font-bold text-[10px] uppercase">
                Ver Regras
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 p-4 rounded-2xl border border-border/50 shadow-sm backdrop-blur-sm">
           <div className="relative w-full md:w-96 group">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
             <Input 
               placeholder="Buscar por justificativa ou tipo..." 
               className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           
           <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50 w-full md:w-auto">
               {(['todos', 'pendente', 'aprovado', 'pago'] as const).map((status) => (
                 <button
                   key={status}
                   onClick={() => setStatusFilter(status)}
                   className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                     statusFilter === status 
                       ? 'bg-background text-primary shadow-sm ring-1 ring-border/50' 
                       : 'text-muted-foreground hover:text-foreground'
                   }`}
                 >
                   {status === 'todos' ? 'Todos' : status}
                 </button>
               ))}
             </div>
             <Button variant="outline" className="h-11 px-4 rounded-xl border-border/50 hidden md:flex">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
             </Button>
           </div>
        </div>

        {/* List of Requests with Visual Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Histórico Estratégico
              <Badge variant="secondary" className="text-[10px] font-black">{filteredVales.length}</Badge>
            </h2>
          </div>

          <AnimatePresence mode="popLayout">
            {loading ? (

              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 w-full bg-muted/40 animate-pulse rounded-xl border border-border/50" />
                ))}
              </div>
            ) : filteredVales.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50"
              >
                <div className="p-6 bg-background rounded-full shadow-inner ring-8 ring-muted/20">
                  <Search className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground tracking-tight">Nenhum resultado encontrado</h3>
                  <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">
                    Não encontramos solicitações para os filtros aplicados. Tente ajustar sua busca.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('todos'); }} className="text-primary font-black uppercase tracking-widest text-[10px]">
                  Limpar Filtros
                </Button>
              </motion.div>
            ) : (
              filteredVales.map((vale, idx) => {

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
                <HelpCircle className="w-4 h-4 text-primary" />
                Dúvidas e Políticas Estratégicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-border/50">
                  <AccordionTrigger className="text-[11px] font-bold uppercase tracking-tight py-3 hover:no-underline">
                    Período de Solicitação
                  </AccordionTrigger>
                  <AccordionContent className="text-[11px] text-muted-foreground leading-relaxed">
                    As solicitações são processadas prioritariamente entre os dias 01 e 15 de cada mês. Pedidos fora deste prazo podem sofrer atrasos na análise.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-border/50">
                  <AccordionTrigger className="text-[11px] font-bold uppercase tracking-tight py-3 hover:no-underline">
                    Limite de 40%
                  </AccordionTrigger>
                  <AccordionContent className="text-[11px] text-muted-foreground leading-relaxed">
                    O sistema bloqueia automaticamente valores que excedam 40% do seu salário base bruto para garantir sua saúde financeira.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border-border/50">
                  <AccordionTrigger className="text-[11px] font-bold uppercase tracking-tight py-3 hover:no-underline">
                    Canais de Aprovação
                  </AccordionTrigger>
                  <AccordionContent className="text-[11px] text-muted-foreground leading-relaxed">
                    A jornada passa pelo RH (Análise), Financeiro (Aprovação) e Bancário (Pagamento). O tempo médio é de 48h úteis.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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

        {/* Request Modal - Strategic Transformation (Etapa 1 & 2) */}
        <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
          <DialogContent className="sm:max-w-[550px] overflow-hidden p-6 border-0 shadow-2xl">
            <RequestStepper 
              onClose={() => setIsNewModalOpen(false)} 
              onSubmit={handleRequest}
              isSubmitting={isSubmitting}
              availableAdvance={availableAdvance}
            />
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

                <div className="p-6 border border-border/50 rounded-xl relative overflow-hidden">
                   {/* Etapa 4: Visualização de Timeline de Aprovação */}
                  <h4 className="text-xs font-bold uppercase mb-8 tracking-widest text-center relative z-10">Jornada da Solicitação</h4>
                  
                  <div className="relative flex justify-between items-start">
                    {/* Progress Bar Background */}
                    <div className="absolute top-4 left-0 w-full h-1 bg-muted rounded-full" />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((selectedVale.etapa_atual - 1) / 3) * 100}%` }}
                      className="absolute top-4 left-0 h-1 bg-primary rounded-full z-0"
                    />

                    {[1, 2, 3, 4].map((step) => {
                      const isActive = selectedVale.etapa_atual >= step;
                      const isCompleted = selectedVale.etapa_atual > step;
                      const labels = ['Enviado', 'Análise', 'Aprovado', 'Concluído'];
                      const icons = [FileText, Clock, ShieldCheck, CheckCircle2];
                      const Icon = icons[step - 1];
                      
                      return (
                        <div key={step} className="flex flex-col items-center gap-3 relative z-10 w-1/4">
                          <motion.div 
                            initial={false}
                            animate={{ 
                              scale: isActive ? 1.1 : 1,
                              backgroundColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                              borderColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${
                              isActive ? 'text-white' : 'text-muted-foreground'
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                          </motion.div>
                          <div className="text-center">
                            <p className={`text-[10px] font-black uppercase tracking-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                              {labels[step - 1]}
                            </p>
                            <p className="text-[8px] text-muted-foreground font-medium hidden sm:block">
                              {step === 1 ? 'Via App' : step === 2 ? 'Fila do RH' : step === 3 ? 'Financeiro' : 'Liberado'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Etapa 5: Gestão de Documentos e Anexos (Placeholder UI) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Documentação Vinculada</h4>
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] uppercase font-bold gap-1.5">
                      <Plus className="w-3 h-3" /> Adicionar Anexo
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedVale.anexo_url ? (
                      <a 
                        href={selectedVale.anexo_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-all cursor-pointer group"
                      >
                        <div className="p-2 bg-background rounded-lg border border-border/50 group-hover:border-primary/30 transition-all">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">Comprovante Anexado</p>
                          <p className="text-[9px] text-muted-foreground uppercase">Clique para visualizar</p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-muted/10 border border-dashed border-border rounded-xl col-span-2 justify-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Nenhum anexo disponível</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-border/20 flex flex-col sm:flex-row gap-3">
                  {/* Etapa 7: Exportação e Compartilhamento Premium */}
                  <Button 
                    className="flex-1 h-12 rounded-xl gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                    onClick={handlePrint}
                  >
                    <FileText className="w-4 h-4" />
                    Gerar Comprovante PDF
                  </Button>
                  {selectedVale.status === 'pendente' && (
                    <Button 
                      variant="ghost" 
                      className="flex-1 h-12 rounded-xl gap-2 font-black uppercase tracking-widest text-[10px] text-red-500 hover:bg-red-500/10 hover:text-red-600"
                      onClick={() => handleCancel(selectedVale.id)}
                    >
                      <XCircle className="w-4 h-4" />
                      Cancelar Solicitação
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl gap-2 font-black uppercase tracking-widest text-[10px] border-border/50"
                    onClick={() => handleShareWhatsApp(selectedVale)}
                  >
                    <ArrowRight className="w-4 h-4" />
                    Compartilhar via WhatsApp
                  </Button>
                </div>
                
                {/* Hidden Receipt for Printing */}
                <div className="hidden">
                  <div ref={receiptRef}>
                    <ValeReceipt vale={selectedVale} profile={profile} />
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PullToRefresh>
  );
}
