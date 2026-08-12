import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { PullToRefresh } from '@/components/portal/PullToRefresh';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  History, Smartphone, Mail, BellRing, MessageCircle,
  CheckCircle2, Ban, Moon, VolumeX, SlidersHorizontal, ChevronDown,
  AlertTriangle, RefreshCw, ArrowRightLeft, Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { NotificacaoSimulador } from '@/components/notificacoes/NotificacaoSimulador';

type Canal = 'in_app' | 'email' | 'push' | 'whatsapp';
type Status = 'enviado' | 'bloqueado' | 'falhou';

interface Entrega {
  id: string;
  notificacao_id: string | null;
  categoria: string;
  nivel: 'info' | 'aviso' | 'critico';
  canal: Canal;
  status: Status;
  motivo: string | null;
  erro: string | null;
  tentativas: number;
  integracao_id: string | null;
  fallback_de: string | null;
  fallback_para: string | null;
  titulo: string;
  mensagem: string;
  created_at: string;
}

interface Integracao { id: string; nome: string; }

interface Grupo {
  key: string;
  titulo: string;
  mensagem: string;
  categoria: string;
  nivel: Entrega['nivel'];
  created_at: string;
  canais: Record<Canal, Entrega | undefined>;
}

interface CanalStat { total: number; enviadas: number; bloqueadas: number; falhas: number; tentativas: number; }
interface CategoriaStat { total: number; enviadas: number; bloqueadas: number; falhas: number; }
interface Stats24h {
  totais: { total: number; enviadas: number; bloqueadas: number; falhas: number; tentativas: number; fallbacks: number };
  por_canal: Record<string, CanalStat>;
  por_categoria: Record<string, CategoriaStat>;
}

const CANAIS: { id: Canal; label: string; icon: typeof Mail }[] = [
  { id: 'in_app', label: 'In-app', icon: Smartphone },
  { id: 'email', label: 'E-mail', icon: Mail },
  { id: 'push', label: 'Push', icon: BellRing },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

const MOTIVOS: Record<string, { label: string; icon: typeof Ban; tone: string }> = {
  canal_desativado: { label: 'Canal desativado', icon: Ban, tone: 'text-muted-foreground' },
  silenciado_temporariamente: { label: 'Silenciado', icon: VolumeX, tone: 'text-amber-500' },
  quiet_hours: { label: 'Quiet hours', icon: Moon, tone: 'text-indigo-500' },
  nivel_abaixo_minimo: { label: 'Nível abaixo do mínimo', icon: SlidersHorizontal, tone: 'text-muted-foreground' },
};

function nivelBadge(nivel: Entrega['nivel']) {
  const map: Record<Entrega['nivel'], string> = {
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    aviso: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    critico: 'bg-red-500/10 text-red-600 border-red-500/20',
  };
  return map[nivel];
}

export default function NotificacaoHistorico() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [integracoes, setIntegracoes] = useState<Integracao[]>([]);
  const [stats24h, setStats24h] = useState<Stats24h | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroCanal, setFiltroCanal] = useState<'todos' | Canal>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | Status>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<'todos' | string>('todos');
  const [filtroIntegracao, setFiltroIntegracao] = useState<'todos' | 'sem' | string>('todos');
  const [expandido, setExpandido] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [entregasRes, statsRes, integracoesRes] = await Promise.all([
      supabase.from('notificacao_entregas').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(500),
      supabase.rpc('fn_notif_stats_24h', { _user_id: user.id }),
      supabase.from('integracoes').select('id, nome').order('nome'),
    ]);
    if (entregasRes.error) toast.error('Falha ao carregar histórico');
    else setEntregas((entregasRes.data ?? []) as unknown as Entrega[]);
    if (!statsRes.error && statsRes.data) setStats24h(statsRes.data as unknown as Stats24h);
    if (!integracoesRes.error) setIntegracoes((integracoesRes.data ?? []) as Integracao[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const categoriasDisponiveis = useMemo(() => {
    const s = new Set<string>();
    entregas.forEach(e => s.add(e.categoria));
    return Array.from(s).sort();
  }, [entregas]);

  const filtradas = useMemo(() => entregas.filter(e =>
    (filtroCanal === 'todos' || e.canal === filtroCanal) &&
    (filtroStatus === 'todos' || e.status === filtroStatus) &&
    (filtroCategoria === 'todos' || e.categoria === filtroCategoria) &&
    (filtroIntegracao === 'todos'
      || (filtroIntegracao === 'sem' && !e.integracao_id)
      || e.integracao_id === filtroIntegracao)
  ), [entregas, filtroCanal, filtroStatus, filtroCategoria, filtroIntegracao]);

  const grupos = useMemo<Grupo[]>(() => {
    const map = new Map<string, Grupo>();
    for (const e of filtradas) {
      const key = e.notificacao_id ?? `${e.titulo}-${e.created_at}`;
      const g = map.get(key);
      if (g) g.canais[e.canal] = e;
      else map.set(key, {
        key, titulo: e.titulo, mensagem: e.mensagem, categoria: e.categoria,
        nivel: e.nivel, created_at: e.created_at,
        canais: { in_app: undefined, email: undefined, push: undefined, whatsapp: undefined, [e.canal]: e } as Grupo['canais'],
      });
    }
    return Array.from(map.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [filtradas]);

  const kpis = stats24h?.totais ?? { total: 0, enviadas: 0, bloqueadas: 0, falhas: 0, tentativas: 0, fallbacks: 0 };

  return (
    <PullToRefresh onRefresh={fetch}>
      <div className="w-full max-w-5xl mx-auto p-4 pb-24 space-y-6">
        <ModuleHeader
          title="Histórico de Notificações"
          description="KPIs 24h, breakdown por canal e categoria, com tentativas, falhas e fallback"
          icon={History}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetch}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/notificacoes/preferencias')}>
                Preferências
              </Button>
            </div>
          }
        />

        <NotificacaoSimulador onDispatched={fetch} />

        {/* KPIs últimas 24h */}
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Últimas 24 horas</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <Kpi label="Eventos" value={kpis.total} tone="bg-muted/40" />
              <Kpi label="Enviadas" value={kpis.enviadas} tone="bg-emerald-500/10 text-emerald-600" />
              <Kpi label="Bloqueadas" value={kpis.bloqueadas} tone="bg-amber-500/10 text-amber-600" />
              <Kpi label="Falhas" value={kpis.falhas} tone="bg-red-500/10 text-red-600" icon={AlertTriangle} />
              <Kpi label="Tentativas" value={kpis.tentativas} tone="bg-indigo-500/10 text-indigo-600" icon={RefreshCw} />
              <Kpi label="Fallbacks" value={kpis.fallbacks} tone="bg-sky-500/10 text-sky-600" icon={ArrowRightLeft} />
            </div>
          </CardContent>
        </Card>

        {/* Breakdown por canal */}
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Breakdown por canal (24h)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {CANAIS.map(({ id, label, icon: Icon }) => {
                const s = stats24h?.por_canal?.[id] ?? { total: 0, enviadas: 0, bloqueadas: 0, falhas: 0, tentativas: 0 };
                const taxa = s.total > 0 ? Math.round((s.enviadas / s.total) * 100) : 0;
                return (
                  <div key={id} className="rounded-md border border-border/50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium">{label}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{taxa}% ok</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <BreakItem label="Total" value={s.total} />
                      <BreakItem label="Tent." value={s.tentativas} />
                      <BreakItem label="Env." value={s.enviadas} tone="text-emerald-600" />
                      <BreakItem label="Blq." value={s.bloqueadas} tone="text-amber-600" />
                      <BreakItem label="Falha" value={s.falhas} tone="text-red-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Breakdown por categoria */}
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Breakdown por categoria (24h)</h3>
            <div className="space-y-1.5">
              {Object.entries(stats24h?.por_categoria ?? {}).length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem eventos nas últimas 24h.</p>
              ) : Object.entries(stats24h?.por_categoria ?? {})
                .sort((a, b) => b[1].total - a[1].total)
                .map(([cat, s]) => {
                  const pct = s.total > 0 ? (s.enviadas / s.total) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs capitalize w-32 truncate">{cat}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex gap-2 text-[10px] text-muted-foreground w-40 justify-end">
                        <span className="text-emerald-600">{s.enviadas}</span>
                        <span className="text-amber-600">{s.bloqueadas}</span>
                        <span className="text-red-600">{s.falhas}</span>
                        <span>/ {s.total}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={filtroCanal} onValueChange={(v) => setFiltroCanal(v as typeof filtroCanal)}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Canal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os canais</SelectItem>
              {CANAIS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as typeof filtroStatus)}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="enviado">Enviadas</SelectItem>
              <SelectItem value="bloqueado">Bloqueadas</SelectItem>
              <SelectItem value="falhou">Falhas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas categorias</SelectItem>
              {categoriasDisponiveis.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroIntegracao} onValueChange={setFiltroIntegracao}>
            <SelectTrigger className="w-44 h-9 text-xs"><SelectValue placeholder="Integração" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas integrações</SelectItem>
              <SelectItem value="sem">Sem integração</SelectItem>
              {integracoes.map(i => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">{grupos.length} evento(s)</span>
        </div>

        <div className="space-y-3">
          {loading ? (
            Array(4).fill(0).map((_, i) => <Card key={i} className="h-28 animate-pulse border-border/50" />)
          ) : grupos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum registro encontrado com os filtros atuais.</p>
            </div>
          ) : (
            grupos.map(g => (
              <Card key={g.key} className="border-border/50 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <button
                    onClick={() => setExpandido(expandido === g.key ? null : g.key)}
                    className="w-full flex items-start gap-3 text-left"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground truncate">{g.titulo}</h3>
                        <Badge variant="outline" className={`text-[10px] ${nivelBadge(g.nivel)}`}>{g.nivel}</Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{g.categoria}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{g.mensagem}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(g.created_at), "dd MMM yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expandido === g.key ? 'rotate-180' : ''}`} />
                  </button>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                    {CANAIS.map(({ id, label, icon: Icon }) => {
                      const e = g.canais[id];
                      if (!e) {
                        return (
                          <div key={id} className="rounded-md border border-dashed border-border/50 p-2 flex items-center gap-2 opacity-40">
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-[10px]">{label}</span>
                          </div>
                        );
                      }
                      const enviado = e.status === 'enviado';
                      const falhou = e.status === 'falhou';
                      const motivo = e.motivo ? MOTIVOS[e.motivo] : null;
                      const MotivoIcon = falhou ? AlertTriangle : (motivo?.icon ?? Ban);
                      const bg = enviado
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : falhou
                          ? 'border-red-500/20 bg-red-500/5'
                          : 'border-amber-500/20 bg-amber-500/5';
                      const integ = integracoes.find(i => i.id === e.integracao_id);
                      return (
                        <div key={id} className={`rounded-md border p-2 space-y-1 ${bg}`}>
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-medium">{label}</span>
                            {enviado ? (
                              <CheckCircle2 className="w-3 h-3 ml-auto text-emerald-500" />
                            ) : (
                              <MotivoIcon className={`w-3 h-3 ml-auto ${falhou ? 'text-red-500' : motivo?.tone ?? 'text-amber-500'}`} />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {enviado ? 'Enviado' : falhou ? 'Falhou' : motivo?.label ?? 'Bloqueado'}
                          </p>
                          <div className="flex items-center gap-1 flex-wrap">
                            {e.tentativas > 1 && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1">
                                <RefreshCw className="w-2.5 h-2.5 mr-0.5" />{e.tentativas}
                              </Badge>
                            )}
                            {e.fallback_para && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1 text-sky-600 border-sky-500/30">
                                <ArrowRightLeft className="w-2.5 h-2.5 mr-0.5" />{e.fallback_para}
                              </Badge>
                            )}
                            {e.fallback_de && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1 text-sky-600 border-sky-500/30">
                                fallback
                              </Badge>
                            )}
                          </div>
                          {expandido === g.key && (
                            <div className="space-y-0.5">
                              <p className="text-[9px] text-muted-foreground/70">
                                {format(new Date(e.created_at), 'HH:mm:ss', { locale: ptBR })}
                              </p>
                              {integ && <p className="text-[9px] text-muted-foreground/70 truncate">via {integ.nome}</p>}
                              {e.erro && <p className="text-[9px] text-red-500/80 line-clamp-2">{e.erro}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {expandido === g.key && (
                    <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">{g.mensagem}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}

function Kpi({ label, value, tone, icon: Icon }: { label: string; value: number; tone: string; icon?: typeof Activity }) {
  return (
    <div className={`rounded-lg p-3 ${tone}`}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide opacity-70">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function BreakItem({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${tone ?? ''}`}>{value}</span>
    </div>
  );
}
