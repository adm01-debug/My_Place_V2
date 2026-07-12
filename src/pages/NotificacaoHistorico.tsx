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
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type Canal = 'in_app' | 'email' | 'push' | 'whatsapp';
type Status = 'enviado' | 'bloqueado';

interface Entrega {
  id: string;
  notificacao_id: string | null;
  categoria: string;
  nivel: 'info' | 'aviso' | 'critico';
  canal: Canal;
  status: Status;
  motivo: string | null;
  titulo: string;
  mensagem: string;
  created_at: string;
}

interface Grupo {
  key: string;
  titulo: string;
  mensagem: string;
  categoria: string;
  nivel: Entrega['nivel'];
  created_at: string;
  canais: Record<Canal, Entrega | undefined>;
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
  const [loading, setLoading] = useState(true);
  const [filtroCanal, setFiltroCanal] = useState<'todos' | Canal>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | Status>('todos');
  const [expandido, setExpandido] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notificacao_entregas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      toast.error('Falha ao carregar histórico');
    } else {
      setEntregas((data ?? []) as Entrega[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const grupos = useMemo<Grupo[]>(() => {
    const map = new Map<string, Grupo>();
    for (const e of entregas) {
      if (filtroCanal !== 'todos' && e.canal !== filtroCanal) continue;
      if (filtroStatus !== 'todos' && e.status !== filtroStatus) continue;
      const key = e.notificacao_id ?? `${e.titulo}-${e.created_at}`;
      const g = map.get(key);
      if (g) {
        g.canais[e.canal] = e;
      } else {
        map.set(key, {
          key,
          titulo: e.titulo,
          mensagem: e.mensagem,
          categoria: e.categoria,
          nivel: e.nivel,
          created_at: e.created_at,
          canais: { in_app: undefined, email: undefined, push: undefined, whatsapp: undefined, [e.canal]: e } as Grupo['canais'],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [entregas, filtroCanal, filtroStatus]);

  const stats = useMemo(() => {
    const total = entregas.length;
    const enviadas = entregas.filter(e => e.status === 'enviado').length;
    return { total, enviadas, bloqueadas: total - enviadas };
  }, [entregas]);

  return (
    <PullToRefresh onRefresh={fetch}>
      <div className="w-full max-w-5xl mx-auto p-4 pb-24 space-y-6">
        <ModuleHeader
          title="Histórico de Notificações"
          description="Auditoria completa por canal, com timestamps e motivo de bloqueio"
          icon={History}
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate('/notificacoes/preferencias')}>
              Preferências
            </Button>
          }
        />

        <NotificacaoSimulador onDispatched={fetch} />

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total" value={stats.total} tone="bg-muted/50" />
          <StatCard label="Enviadas" value={stats.enviadas} tone="bg-emerald-500/10 text-emerald-600" />
          <StatCard label="Bloqueadas" value={stats.bloqueadas} tone="bg-amber-500/10 text-amber-600" />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Select value={filtroCanal} onValueChange={(v) => setFiltroCanal(v as typeof filtroCanal)}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Canal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os canais</SelectItem>
              {CANAIS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as typeof filtroStatus)}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="enviado">Enviadas</SelectItem>
              <SelectItem value="bloqueado">Bloqueadas</SelectItem>
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
                      const motivo = e.motivo ? MOTIVOS[e.motivo] : null;
                      const MotivoIcon = motivo?.icon ?? Ban;
                      return (
                        <div
                          key={id}
                          className={`rounded-md border p-2 space-y-1 ${
                            enviado
                              ? 'border-emerald-500/20 bg-emerald-500/5'
                              : 'border-amber-500/20 bg-amber-500/5'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-medium">{label}</span>
                            {enviado ? (
                              <CheckCircle2 className="w-3 h-3 ml-auto text-emerald-500" />
                            ) : (
                              <MotivoIcon className={`w-3 h-3 ml-auto ${motivo?.tone ?? 'text-amber-500'}`} />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {enviado ? 'Enviado' : motivo?.label ?? 'Bloqueado'}
                          </p>
                          {expandido === g.key && (
                            <p className="text-[9px] text-muted-foreground/70">
                              {format(new Date(e.created_at), 'HH:mm:ss', { locale: ptBR })}
                            </p>
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

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-lg p-3 ${tone}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
