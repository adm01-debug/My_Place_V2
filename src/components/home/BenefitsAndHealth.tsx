import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  HeartPulse, 
  AlertTriangle, 
  Award, 
  Bus, 
  Wallet,
  Calendar,
  ChevronRight,
  Stethoscope,
  TrendingDown,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

import type { Database } from '@/integrations/supabase/types';

type Beneficio = Database['public']['Tables']['beneficios']['Row'];
type SaudeGasto = Database['public']['Tables']['plano_saude_gastos']['Row'];
type Ocorrencia = Database['public']['Tables']['ocorrencias']['Row'];
type Premio = Database['public']['Tables']['remuneracoes_variaveis']['Row'];
type Transporte = Database['public']['Tables']['vale_transportes']['Row'];
type DecimoTerceiro = Database['public']['Tables']['decimo_terceiro']['Row'];

interface BenefitsState {
  beneficios: Beneficio[];
  saudeGastos: SaudeGasto[];
  ocorrencias: Ocorrencia[];
  premios: Premio[];
  transporte: Transporte[];
  decimoTerceiro: DecimoTerceiro | null;
}

export function BenefitsAndHealth() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BenefitsState>({
    beneficios: [],
    saudeGastos: [],
    ocorrencias: [],
    premios: [],
    transporte: [],
    decimoTerceiro: null,
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [b, sg, o, r, vt, dt] = await Promise.all([
        supabase.from('beneficios').select('*').eq('user_id', user.id).eq('status', 'ativo'),
        supabase.from('plano_saude_gastos').select('*').eq('user_id', user.id).order('data_evento', { ascending: false }).limit(3),
        supabase.from('ocorrencias').select('*').eq('user_id', user.id).order('data_inicio', { ascending: false }).limit(3),
        supabase.from('remuneracoes_variaveis').select('*').eq('user_id', user.id).order('data_pagamento', { ascending: false }).limit(3),
        supabase.from('vale_transportes').select('*').eq('user_id', user.id).order('data_recarga', { ascending: false }).limit(1),
        supabase.from('decimo_terceiro').select('*').eq('user_id', user.id).eq('ano', new Date().getFullYear()).single()
      ]);

      setData({
        beneficios: b.data || [],
        saudeGastos: sg.data || [],
        ocorrencias: o.data || [],
        premios: r.data || [],
        transporte: vt.data || [],
        decimoTerceiro: dt.data
      });
    } catch (err) {
      console.error('Erro ao buscar dados de benefícios:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const totalGastosSaude = data.saudeGastos.reduce((acc, g) => acc + Number(g.valor_coparticipacao), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Plano de Saúde e Gastos */}
      <Card className="border-border/50 shadow-md overflow-hidden">
        <CardHeader className="pb-2 bg-emerald-500/5 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-500" />
              <CardTitle className="text-sm font-semibold">Saúde e Benefícios</CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] bg-background">Coparticipação</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total a Debitar (Mês)</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalGastosSaude)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Plano Ativo</p>
              <p className="text-xs font-medium text-emerald-500">Unimed Nacional</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Últimos Lançamentos</p>
            {data.saudeGastos.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum gasto registrado este mês.</p>
            ) : (
              data.saudeGastos.map((g) => (
                <div key={g.id} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate max-w-[150px]">{g.descricao}</span>
                  </div>
                  <span className="font-medium text-red-500">-{formatCurrency(Number(g.valor_coparticipacao))}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ocorrências e Vida Funcional */}
      <Card className="border-border/50 shadow-md overflow-hidden">
        <CardHeader className="pb-2 bg-amber-500/5 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold">Ocorrências</CardTitle>
            </div>
            <Badge variant="secondary" className="text-[10px]">Raio-X Funcional</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {data.ocorrencias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                < Award className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">Parabéns! Nenhuma ocorrência negativa registrada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.ocorrencias.map((o) => (
                <div key={o.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    o.tipo === 'falta' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {o.tipo === 'falta' ? <Calendar className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase">{o.tipo}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{o.motivo || 'Sem observação'}</p>
                  </div>
                  <p className="text-[10px] font-medium whitespace-nowrap">
                    {format(new Date(o.data_inicio + 'T12:00:00'), 'dd/MM/yy')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remuneração Variável e Premiações */}
      <Card className="border-border/50 shadow-md overflow-hidden">
        <CardHeader className="pb-2 bg-purple-500/5 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-500" />
            <CardTitle className="text-sm font-semibold">Premiações e Bônus</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Último Extra Recebido</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {data.premios.length > 0 ? formatCurrency(Number(data.premios[0].valor)) : 'R$ 0,00'}
              </p>
            </div>
            <Award className="w-8 h-8 text-purple-200 dark:text-purple-900" />
          </div>
          
          <div className="space-y-1.5">
            {data.premios.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{p.motivo || 'Premiação Extra'}</span>
                <span className="font-semibold text-emerald-500">+{formatCurrency(Number(p.valor))}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 13º e Vale Transporte */}
      <Card className="border-border/50 shadow-md overflow-hidden">
        <CardHeader className="pb-2 bg-blue-500/5 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-500" />
            <CardTitle className="text-sm font-semibold">Benefícios de Caixa</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-5">
          {/* Vale Transporte */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-blue-500" />
                <span className="font-bold uppercase tracking-tight">Vale Transporte</span>
              </div>
              <span className="text-muted-foreground text-[10px]">
                Última recarga: {data.transporte.length > 0 ? format(new Date(data.transporte[0].data_recarga + 'T12:00:00'), 'dd/MM/yy') : '--/--/--'}
              </span>
            </div>
            <div className="bg-blue-500/5 rounded-lg p-3 flex items-center justify-between border border-blue-500/10">
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase">Valor Recarregado</p>
                <p className="text-lg font-bold text-foreground">
                  {data.transporte.length > 0 ? formatCurrency(Number(data.transporte[0].valor_recarga)) : 'R$ 0,00'}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600">Disponível</Badge>
            </div>
          </div>

          {/* 13º Salário */}
          <div className="space-y-2 pt-1 border-t border-border/30">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-500" />
                <span className="font-bold uppercase tracking-tight">13º Salário {new Date().getFullYear()}</span>
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600">
                {data.decimoTerceiro?.status === 'pago' ? 'Pago' : 'Projetado'}
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Acúmulo proporcional</span>
                <span className="font-bold text-foreground">
                  {data.decimoTerceiro ? formatCurrency(Number(data.decimoTerceiro.valor_estimado)) : 'Calculando...'}
                </span>
              </div>
              <Progress value={Math.min((new Date().getMonth() + 1) * 8.33, 100)} className="h-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
