import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Pin, PinOff, Check, Trash2, Search, X, PanelRightOpen, PanelRightClose, ExternalLink, Clock, AlarmClockOff, Focus, Keyboard, Download, FileJson, FileSpreadsheet, Wand2, Plus, Volume2, VolumeX, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const UNDO_MS = 5000;

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'sucesso' | 'alerta' | 'erro';
  lida: boolean;
  link: string | null;
  created_at: string;
  fixada_em: string | null;
  adiada_ate: string | null;
}

// Opções de adiamento (snooze). "at" é uma função que recebe "agora" e devolve o alvo.
type SnoozeOption = { id: string; label: string; at: (now: Date) => Date };
const SNOOZE_OPTIONS: SnoozeOption[] = [
  { id: '1h', label: 'Em 1 hora', at: (n) => new Date(n.getTime() + 60 * 60 * 1000) },
  { id: '3h', label: 'Em 3 horas', at: (n) => new Date(n.getTime() + 3 * 60 * 60 * 1000) },
  {
    id: 'tomorrow',
    label: 'Amanhã, 9h',
    at: (n) => {
      const d = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 9, 0, 0, 0);
      return d;
    },
  },
  {
    id: 'nextweek',
    label: 'Próxima semana',
    at: (n) => {
      // Próxima segunda-feira às 9h
      const d = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 9, 0, 0, 0);
      const dow = d.getDay(); // 0=dom
      const daysUntilMon = ((8 - dow) % 7) || 7;
      d.setDate(d.getDate() + daysUntilMon);
      return d;
    },
  },
];

const tipoIcons = {
  info: Info,
  sucesso: CheckCircle2,
  alerta: AlertTriangle,
  erro: XCircle,
};

const tipoColors = {
  info: 'text-blue-400',
  sucesso: 'text-emerald-400',
  alerta: 'text-amber-400',
  erro: 'text-red-400',
};

const MAX_ITEMS = 30;
const DESKTOP_KEY = 'bell_desktop_v1';

type BellFilter = 'todas' | 'nao_lidas' | 'fixadas' | 'adiadas';
const FILTER_KEY = 'bell_filter_v2';
const TIPOS_KEY = 'bell_tipos_v1';
const PREVIEW_KEY = 'bell_preview_v1';
const AUTO_READ_KEY = 'bell_auto_read_v1';
const AUTO_READ_DELAY_MS = 1500;
const FOCUS_KEY = 'bell_focus_mode_v1';
const RULES_KEY = 'bell_rules_v1';

// ===== Item 96: Regras de Automação =====
type RuleAction = 'silent' | 'auto_read' | 'auto_snooze_1h' | 'auto_pin';
interface BellRule {
  id: string;
  name: string;
  enabled: boolean;
  tipos: TipoNotif[]; // vazio = qualquer tipo
  contains: string;   // substring case/acento-insensível em titulo+mensagem; vazio = qualquer
  action: RuleAction;
}
const RULE_ACTION_LABELS: Record<RuleAction, string> = {
  silent: 'Silenciar (sem desktop)',
  auto_read: 'Marcar como lida',
  auto_snooze_1h: 'Adiar por 1 hora',
  auto_pin: 'Fixar automaticamente',
};
const isRuleAction = (v: unknown): v is RuleAction =>
  v === 'silent' || v === 'auto_read' || v === 'auto_snooze_1h' || v === 'auto_pin';

type TipoNotif = 'info' | 'sucesso' | 'alerta' | 'erro';
const TIPOS_ALL: TipoNotif[] = ['info', 'sucesso', 'alerta', 'erro'];
const isTipoNotif = (v: unknown): v is TipoNotif =>
  v === 'info' || v === 'sucesso' || v === 'alerta' || v === 'erro';

const tipoLabels: Record<TipoNotif, string> = {
  info: 'Info',
  sucesso: 'Sucesso',
  alerta: 'Alerta',
  erro: 'Erro',
};

const isBellFilter = (v: unknown): v is BellFilter =>
  v === 'todas' || v === 'nao_lidas' || v === 'fixadas' || v === 'adiadas';

const canUseDesktop = () =>
  typeof window !== 'undefined' && 'Notification' in window;


export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState<BellFilter>(() => {
    if (typeof window === 'undefined') return 'todas';
    const raw = localStorage.getItem(FILTER_KEY);
    return isBellFilter(raw) ? raw : 'todas';
  });

  useEffect(() => {
    try {
      localStorage.setItem(FILTER_KEY, filtro);
    } catch {
      /* quota — ignore */
    }
  }, [filtro]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const buscaRef = useRef<HTMLInputElement>(null);

  // Undo: itens marcados como "pending delete" ficam ocultos por UNDO_MS antes do commit real no backend.
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(() => new Set());
  const undoTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Painel lateral de preview (md+): mostra a notificação ativa em detalhe.
  const [showPreview, setShowPreview] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(PREVIEW_KEY) === '1';
  });
  useEffect(() => {
    try {
      localStorage.setItem(PREVIEW_KEY, showPreview ? '1' : '0');
    } catch {
      /* quota — ignore */
    }
  }, [showPreview]);

  // Auto-marcar como lida ao visualizar no painel de preview (opt-in, default ON).
  const [autoRead, setAutoRead] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const raw = localStorage.getItem(AUTO_READ_KEY);
    return raw === null ? true : raw === '1';
  });
  useEffect(() => {
    try {
      localStorage.setItem(AUTO_READ_KEY, autoRead ? '1' : '0');
    } catch {
      /* quota — ignore */
    }
  }, [autoRead]);

  // Modo Foco (Zen): filtra apenas alerta+erro; badge fica discreto (ponto) e
  // ignora as demais notificações no popover — ideal para reduzir ruído.
  const [focusMode, setFocusMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(FOCUS_KEY) === '1';
  });
  useEffect(() => {
    try { localStorage.setItem(FOCUS_KEY, focusMode ? '1' : '0'); } catch { /* quota */ }
  }, [focusMode]);
  const focusModeRef = useRef(focusMode);
  useEffect(() => { focusModeRef.current = focusMode; }, [focusMode]);

  // Central de Atalhos (help modal).
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Item 96: Regras de Automação
  const [showRules, setShowRules] = useState<boolean>(false);

  // Item 97: Snooze Personalizado (data/hora customizada)
  const [customSnoozeFor, setCustomSnoozeFor] = useState<string | null>(null);
  const [customSnoozeValue, setCustomSnoozeValue] = useState<string>('');

  // Item 98: Sons de notificação (Web Audio, síntese — sem asset externo)
  const SOUND_KEY = 'notif_sound_enabled';
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const raw = localStorage.getItem(SOUND_KEY);
    return raw === null ? true : raw === '1';
  });
  useEffect(() => {
    try { localStorage.setItem(SOUND_KEY, soundEnabled ? '1' : '0'); } catch { /* quota */ }
  }, [soundEnabled]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playSound = useCallback((tipo: Notificacao['tipo']) => {
    if (!soundEnabled) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AC();
      const ctx = audioCtxRef.current;
      // Frequência distinta por tipo para reconhecimento auditivo.
      const freqMap: Record<Notificacao['tipo'], number> = {
        info: 660,      // Mi
        sucesso: 880,   // Lá agudo
        alerta: 520,    // Dó grave
        erro: 300,      // grave/urgente
      };
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqMap[tipo] ?? 660, now);
      // Envelope curto: attack 10ms, decay 250ms — não invasivo.
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch { /* som é opcional */ }
  }, [soundEnabled]);
  const playSoundRef = useRef(playSound);
  useEffect(() => { playSoundRef.current = playSound; }, [playSound]);

  // Item 99: Quiet Hours — janela silenciosa configurável (som + desktop mute).
  // Itens continuam chegando na lista; apenas alertas audíveis/visuais são suprimidos.
  // Suporta janelas atravessando meia-noite (ex.: 22:00 → 07:00).
  const QUIET_KEY = 'notif_quiet_hours';
  type QuietCfg = { enabled: boolean; start: string; end: string };
  const [quiet, setQuiet] = useState<QuietCfg>(() => {
    if (typeof window === 'undefined') return { enabled: false, start: '22:00', end: '07:00' };
    try {
      const raw = localStorage.getItem(QUIET_KEY);
      if (!raw) return { enabled: false, start: '22:00', end: '07:00' };
      const p = JSON.parse(raw) as Partial<QuietCfg>;
      return {
        enabled: !!p.enabled,
        start: /^\d{2}:\d{2}$/.test(p.start || '') ? p.start! : '22:00',
        end: /^\d{2}:\d{2}$/.test(p.end || '') ? p.end! : '07:00',
      };
    } catch { return { enabled: false, start: '22:00', end: '07:00' }; }
  });
  useEffect(() => {
    try { localStorage.setItem(QUIET_KEY, JSON.stringify(quiet)); } catch { /* quota */ }
  }, [quiet]);
  const isQuietNow = useCallback((cfg: QuietCfg = quiet): boolean => {
    if (!cfg.enabled) return false;
    const [sh, sm] = cfg.start.split(':').map(Number);
    const [eh, em] = cfg.end.split(':').map(Number);
    if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const s = sh * 60 + sm;
    const e = eh * 60 + em;
    if (s === e) return false; // janela vazia
    return s < e ? cur >= s && cur < e : cur >= s || cur < e; // overnight
  }, [quiet]);
  const quietRef = useRef(isQuietNow);
  useEffect(() => { quietRef.current = isQuietNow; }, [isQuietNow]);
  const [regras, setRegras] = useState<BellRule[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = JSON.parse(localStorage.getItem(RULES_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((r): r is BellRule =>
          !!r && typeof r === 'object'
          && typeof r.id === 'string'
          && typeof r.name === 'string'
          && typeof r.enabled === 'boolean'
          && Array.isArray(r.tipos) && r.tipos.every(isTipoNotif)
          && typeof r.contains === 'string'
          && isRuleAction(r.action)
        );
    } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(RULES_KEY, JSON.stringify(regras)); } catch { /* quota */ }
  }, [regras]);
  // Ref sempre atualizada para uso dentro do handler realtime (evita re-subscribe).
  const regrasRef = useRef<BellRule[]>(regras);
  useEffect(() => { regrasRef.current = regras; }, [regras]);


  useEffect(() => {
    const timers = undoTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // Normaliza texto (case + acentos) para busca amigável em PT-BR.
  const normalize = useCallback(
    (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
    []
  );
  const buscaNorm = useMemo(() => normalize(busca.trim()), [busca, normalize]);

  // Filtro por tipo (multi-seleção). Set vazio = todos os tipos visíveis.
  const [tiposAtivos, setTiposAtivos] = useState<Set<TipoNotif>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = JSON.parse(localStorage.getItem(TIPOS_KEY) || '[]');
      if (Array.isArray(raw)) return new Set(raw.filter(isTipoNotif));
    } catch { /* ignore */ }
    return new Set();
  });

  useEffect(() => {
    try {
      localStorage.setItem(TIPOS_KEY, JSON.stringify([...tiposAtivos]));
    } catch { /* quota — ignore */ }
  }, [tiposAtivos]);

  const toggleTipo = useCallback((t: TipoNotif) => {
    setTiposAtivos((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }, []);

  // Tick "agora" a cada 30s para reavaliar snoozes expirados sem depender de refetch.
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const isSnoozed = useCallback(
    (n: Notificacao) => !!n.adiada_ate && new Date(n.adiada_ate).getTime() > nowTs,
    [nowTs]
  );

  const unreadCount = useMemo(
    // Snoozed não contam no badge — voltam automaticamente quando expira.
    // Em modo foco, somente alerta+erro entram na contagem visível.
    () => notificacoes.filter((n) => !n.lida && !isSnoozed(n) && (!focusMode || n.tipo === 'alerta' || n.tipo === 'erro')).length,
    [notificacoes, isSnoozed, focusMode]
  );

  const fixadasCount = useMemo(
    () => notificacoes.filter((n) => !!n.fixada_em).length,
    [notificacoes]
  );

  const snoozedCount = useMemo(
    () => notificacoes.filter(isSnoozed).length,
    [notificacoes, isSnoozed]
  );

  // Fixadas primeiro (por fixada_em desc), depois por created_at desc.
  const ordenadas = useMemo(() => {
    return [...notificacoes].sort((a, b) => {
      if (!!a.fixada_em !== !!b.fixada_em) return a.fixada_em ? -1 : 1;
      if (a.fixada_em && b.fixada_em) {
        return new Date(b.fixada_em).getTime() - new Date(a.fixada_em).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [notificacoes]);

  const filtradas = useMemo(() => {
    let base = ordenadas;
    if (pendingDeleteIds.size > 0) base = base.filter((n) => !pendingDeleteIds.has(n.id));
    // Regra global: snoozed são ocultos em todas as abas exceto "adiadas".
    if (filtro === 'adiadas') {
      base = base.filter(isSnoozed);
    } else {
      base = base.filter((n) => !isSnoozed(n));
      if (filtro === 'nao_lidas') base = base.filter((n) => !n.lida);
      else if (filtro === 'fixadas') base = base.filter((n) => !!n.fixada_em);
    }
    if (tiposAtivos.size > 0) {
      base = base.filter((n) => tiposAtivos.has(n.tipo as TipoNotif));
    }
    // Modo foco: restringe a alerta+erro (fixadas urgentes seguem visíveis).
    if (focusMode) {
      base = base.filter((n) => n.tipo === 'alerta' || n.tipo === 'erro');
    }
    if (buscaNorm) {
      base = base.filter(
        (n) => normalize(n.titulo).includes(buscaNorm) || normalize(n.mensagem).includes(buscaNorm)
      );
    }
    return base;
  }, [ordenadas, filtro, tiposAtivos, buscaNorm, normalize, pendingDeleteIds, isSnoozed, focusMode]);

  // Agrupamento temporal: Fixadas | Hoje | Ontem | Esta semana | Anteriores
  const grupos = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startYesterday = startToday - 86400000;
    const startWeek = startToday - 6 * 86400000;

    // Na aba "adiadas", agrupamos por horizonte do próprio adiamento.
    if (filtro === 'adiadas') {
      const startTomorrow = startToday + 86400000;
      const startNextWeek = startToday + 7 * 86400000;
      const b: Record<string, Notificacao[]> = {
        'Ainda hoje': [],
        Amanhã: [],
        'Esta semana': [],
        'Mais tarde': [],
      };
      for (const n of filtradas) {
        if (!n.adiada_ate) continue;
        const t = new Date(n.adiada_ate).getTime();
        if (t < startTomorrow) b['Ainda hoje'].push(n);
        else if (t < startTomorrow + 86400000) b.Amanhã.push(n);
        else if (t < startNextWeek) b['Esta semana'].push(n);
        else b['Mais tarde'].push(n);
      }
      // Ordena cada bucket por adiada_ate asc (mais próximo primeiro).
      for (const k of Object.keys(b)) {
        b[k].sort(
          (a, x) => new Date(a.adiada_ate!).getTime() - new Date(x.adiada_ate!).getTime()
        );
      }
      return (Object.entries(b) as [string, Notificacao[]][]).filter(
        ([, items]) => items.length > 0
      );
    }

    const buckets: Record<string, Notificacao[]> = {
      Fixadas: [],
      Hoje: [],
      Ontem: [],
      'Esta semana': [],
      Anteriores: [],
    };

    for (const n of filtradas) {
      if (n.fixada_em && filtro !== 'fixadas') {
        buckets.Fixadas.push(n);
        continue;
      }
      const t = new Date(n.created_at).getTime();
      if (t >= startToday) buckets.Hoje.push(n);
      else if (t >= startYesterday) buckets.Ontem.push(n);
      else if (t >= startWeek) buckets['Esta semana'].push(n);
      else buckets.Anteriores.push(n);
    }

    return (Object.entries(buckets) as [string, Notificacao[]][]).filter(
      ([, items]) => items.length > 0
    );
  }, [filtradas, filtro]);

  // Lista plana na ordem visual — base para navegação por teclado (j/k).
  const flatList = useMemo(() => grupos.flatMap(([, items]) => items), [grupos]);

  // Reseta o item ativo quando popover abre/fecha ou a lista muda.
  useEffect(() => {
    if (!open) {
      setActiveId(null);
      setBusca('');
      return;
    }
    setActiveId((prev) => {
      if (prev && flatList.some((n) => n.id === prev)) return prev;
      return flatList[0]?.id ?? null;
    });
  }, [open, flatList]);

  // Rola o item ativo para dentro da viewport do ScrollArea.
  useEffect(() => {
    if (!activeId) return;
    const el = document.querySelector<HTMLElement>(`[data-notif-id="${activeId}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);


  const fetchNotificacoes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notificacoes')
      .select('id, titulo, mensagem, tipo, lida, link, created_at, fixada_em, adiada_ate')
      .eq('user_id', user.id)
      .order('fixada_em', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(MAX_ITEMS);

    if (data) setNotificacoes(data as Notificacao[]);
  }, [user]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  // Preferência de notificações desktop persistida
  const [desktopOn, setDesktopOn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DESKTOP_KEY) === '1';
  });

  const toggleDesktop = useCallback(async () => {
    if (!canUseDesktop()) return;
    if (!desktopOn) {
      const perm =
        Notification.permission === 'granted'
          ? 'granted'
          : await Notification.requestPermission();
      if (perm === 'granted') {
        setDesktopOn(true);
        localStorage.setItem(DESKTOP_KEY, '1');
      }
    } else {
      setDesktopOn(false);
      localStorage.setItem(DESKTOP_KEY, '0');
    }
  }, [desktopOn]);

  const showDesktop = useCallback(
    (n: Notificacao) => {
      if (!desktopOn || !canUseDesktop() || Notification.permission !== 'granted') return;
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') return;
      try {
        const notif = new Notification(n.titulo, {
          body: n.mensagem,
          icon: '/favicon.ico',
          tag: n.id,
          silent: false,
        });
        notif.onclick = () => {
          window.focus();
          navigate(n.link || `/notificacoes?focus=${n.id}`);
          notif.close();
        };
      } catch {
        /* alguns browsers exigem SW — ignora silenciosamente */
      }
    },
    [desktopOn, navigate]
  );

  const showDesktopRef = useRef(showDesktop);
  useEffect(() => {
    showDesktopRef.current = showDesktop;
  }, [showDesktop]);


  // Realtime: INSERT, UPDATE e DELETE — mantém o sino sincronizado
  // mesmo quando alterações acontecem na página /notificacoes ou em outro tab.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notificacoes-bell')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const nova = payload.new as Notificacao;
          // Aplica regras de automação sobre a nova notificação.
          const rules = regrasRef.current.filter((r) => r.enabled);
          const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          const haystack = norm(`${nova.titulo} ${nova.mensagem}`);
          const matched = rules.filter((r) => {
            if (r.tipos.length > 0 && !r.tipos.includes(nova.tipo)) return false;
            if (r.contains.trim() && !haystack.includes(norm(r.contains.trim()))) return false;
            return true;
          });
          const actions = new Set<RuleAction>(matched.map((r) => r.action));

          setNotificacoes((prev) => {
            if (prev.some((n) => n.id === nova.id)) return prev;
            const patched: Notificacao = {
              ...nova,
              lida: actions.has('auto_read') ? true : nova.lida,
              fixada_em: actions.has('auto_pin') && !nova.fixada_em ? new Date().toISOString() : nova.fixada_em,
              adiada_ate: actions.has('auto_snooze_1h')
                ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
                : nova.adiada_ate,
            };
            return [patched, ...prev].slice(0, MAX_ITEMS);
          });

          // Persistência das ações no backend (fire-and-forget).
          if (actions.has('auto_read')) {
            supabase.from('notificacoes').update({ lida: true }).eq('id', nova.id).then(() => {});
          }
          if (actions.has('auto_pin') && !nova.fixada_em) {
            supabase.from('notificacoes').update({ fixada_em: new Date().toISOString() }).eq('id', nova.id).then(() => {});
          }
          if (actions.has('auto_snooze_1h')) {
            const until = new Date(Date.now() + 60 * 60 * 1000).toISOString();
            supabase.from('notificacoes').update({ adiada_ate: until }).eq('id', nova.id).then(() => {});
          }
          // Só dispara desktop e som se nenhuma regra pediu silenciamento
          // e não estamos em Quiet Hours (janela silenciosa configurável).
          const quietNow = quietRef.current();
          if (!actions.has('silent') && !quietNow) {
            showDesktopRef.current(nova);
            // Modo foco: só toca em alerta/erro (reduz ruído).
            if (!focusModeRef.current || nova.tipo === 'alerta' || nova.tipo === 'erro') {
              playSoundRef.current(nova.tipo);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const upd = payload.new as Notificacao;
          setNotificacoes((prev) => prev.map((n) => (n.id === upd.id ? { ...n, ...upd } : n)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const old = payload.old as { id: string };
          setNotificacoes((prev) => prev.filter((n) => n.id !== old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);


  const markAsRead = async (id: string) => {
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadIds = notificacoes.filter((n) => !n.lida).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    await supabase.from('notificacoes').update({ lida: true }).in('id', unreadIds);
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    const novoFixadaEm = isPinned ? null : new Date().toISOString();
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, fixada_em: novoFixadaEm } : n))
    );
    await supabase.from('notificacoes').update({ fixada_em: novoFixadaEm }).eq('id', id);
  };

  // Adia (snooze) uma notificação até uma data futura. Optimista + Undo (5s).
  const snoozeNotif = async (id: string, until: Date) => {
    const n = notificacoes.find((x) => x.id === id);
    if (!n) return;
    const prevValue = n.adiada_ate;
    const iso = until.toISOString();
    // Optimista: atualiza estado local imediatamente.
    setNotificacoes((prev) => prev.map((x) => (x.id === id ? { ...x, adiada_ate: iso } : x)));
    const { error } = await supabase
      .from('notificacoes')
      .update({ adiada_ate: iso })
      .eq('id', id);
    if (error) {
      // Rollback em falha.
      setNotificacoes((prev) =>
        prev.map((x) => (x.id === id ? { ...x, adiada_ate: prevValue } : x))
      );
      toast.error('Não foi possível adiar');
      return;
    }
    const quando = until.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    toast(`Adiada até ${quando}`, {
      duration: UNDO_MS,
      action: {
        label: 'Desfazer',
        onClick: async () => {
          setNotificacoes((prev) =>
            prev.map((x) => (x.id === id ? { ...x, adiada_ate: prevValue } : x))
          );
          await supabase
            .from('notificacoes')
            .update({ adiada_ate: prevValue })
            .eq('id', id);
        },
      },
    });
  };

  const unsnoozeNotif = async (id: string) => {
    const n = notificacoes.find((x) => x.id === id);
    if (!n) return;
    const prevValue = n.adiada_ate;
    setNotificacoes((prev) => prev.map((x) => (x.id === id ? { ...x, adiada_ate: null } : x)));
    const { error } = await supabase
      .from('notificacoes')
      .update({ adiada_ate: null })
      .eq('id', id);
    if (error) {
      setNotificacoes((prev) =>
        prev.map((x) => (x.id === id ? { ...x, adiada_ate: prevValue } : x))
      );
      toast.error('Não foi possível cancelar o adiamento');
    }
  };



  // Agenda o DELETE real no backend após UNDO_MS. Se o usuário desfizer,
  // o timer é cancelado e o item volta a aparecer instantaneamente.
  const scheduleDelete = useCallback((ids: string[], label: string) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setPendingDeleteIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });

    const toastId = toast(`${label} excluída${ids.length > 1 ? 's' : ''}`, {
      duration: UNDO_MS,
      action: {
        label: 'Desfazer',
        onClick: () => {
          ids.forEach((id) => {
            const t = undoTimers.current.get(id);
            if (t) clearTimeout(t);
            undoTimers.current.delete(id);
          });
          setPendingDeleteIds((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.delete(id));
            return next;
          });
        },
      },
    });

    ids.forEach((id) => {
      const t = setTimeout(async () => {
        undoTimers.current.delete(id);
        // commit: remove do estado local + backend
        setNotificacoes((prev) => prev.filter((n) => n.id !== id));
        setPendingDeleteIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        await supabase.from('notificacoes').delete().eq('id', id);
      }, UNDO_MS);
      undoTimers.current.set(id, t);
    });

    // Se a aba/janela for fechada, o cleanup do useEffect cancela os timers —
    // as notificações "reaparecerão" na próxima carga (fonte da verdade = backend).
    void toastId;
    void idSet;
  }, []);

  const deleteNotif = (id: string) => {
    const n = notificacoes.find((x) => x.id === id);
    scheduleDelete([id], n ? `"${n.titulo.slice(0, 40)}"` : 'Notificação');
  };

  // Marca como lidas apenas as notificações atualmente visíveis (aba + busca + tipos),
  // com Undo: guarda o snapshot dos ids alterados e reverte no backend se solicitado.
  const markVisibleAsRead = async () => {
    const ids = filtradas.filter((n) => !n.lida).map((n) => n.id);
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setNotificacoes((prev) => prev.map((n) => (idSet.has(n.id) ? { ...n, lida: true } : n)));
    await supabase.from('notificacoes').update({ lida: true }).in('id', ids);
    toast(`${ids.length} marcada${ids.length > 1 ? 's' : ''} como lida${ids.length > 1 ? 's' : ''}`, {
      duration: UNDO_MS,
      action: {
        label: 'Desfazer',
        onClick: async () => {
          setNotificacoes((prev) => prev.map((n) => (idSet.has(n.id) ? { ...n, lida: false } : n)));
          await supabase.from('notificacoes').update({ lida: false }).in('id', ids);
        },
      },
    });
  };

  // Exclui em lote todas as notificações visíveis (respeita filtros ativos),
  // sempre com Undo — fixadas são preservadas por segurança.
  const deleteVisible = () => {
    const alvos = filtradas.filter((n) => !n.fixada_em);
    if (alvos.length === 0) return;
    const ids = alvos.map((n) => n.id);
    scheduleDelete(ids, `${ids.length} notificaç${ids.length > 1 ? 'ões' : 'ão'}`);
  };

  const handleClick = (n: Notificacao) => {
    if (!n.lida) markAsRead(n.id);
    setOpen(false);
    if (n.link) {
      navigate(n.link);
    } else {
      navigate(`/notificacoes?focus=${n.id}`);
    }
  };

  // Navegação por teclado dentro do popover — j/k (ou setas) percorrem,
  // Enter abre, e = marcar lida, p = fixar/desafixar, Delete/Backspace/x = excluir.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Dentro do campo de busca: Escape limpa/desfoca; ↑↓/Enter navegam a lista.
      if (inField) {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (busca) setBusca('');
          else buscaRef.current?.blur();
          return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
          // deixa cair no switch abaixo tratando navegação
        } else {
          return;
        }
      }

      // "/" foca a busca (fora de campo).
      if (!inField && e.key === '/') {
        e.preventDefault();
        buscaRef.current?.focus();
        buscaRef.current?.select();
        return;
      }

      // "?" abre a Central de Atalhos.
      if (!inField && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }

      if (flatList.length === 0) return;

      const idx = activeId ? flatList.findIndex((n) => n.id === activeId) : -1;
      const current = idx >= 0 ? flatList[idx] : null;

      const move = (delta: number) => {
        e.preventDefault();
        const next = flatList[Math.max(0, Math.min(flatList.length - 1, (idx < 0 ? 0 : idx + delta)))];
        if (next) setActiveId(next.id);
      };

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          move(1);
          break;
        case 'k':
        case 'ArrowUp':
          move(-1);
          break;
        case 'Home':
          e.preventDefault();
          setActiveId(flatList[0].id);
          break;
        case 'End':
          e.preventDefault();
          setActiveId(flatList[flatList.length - 1].id);
          break;
        case 'Enter':
          if (current) {
            e.preventDefault();
            handleClick(current);
          }
          break;
        case 'e':
          if (current && !current.lida) {
            e.preventDefault();
            markAsRead(current.id);
          }
          break;
        case 'p':
          if (current) {
            e.preventDefault();
            togglePin(current.id, !!current.fixada_em);
          }
          break;
        case 's':
          // Snooze rápido: 1h (padrão). Se já estiver adiada, cancela o adiamento.
          if (current) {
            e.preventDefault();
            if (isSnoozed(current)) {
              unsnoozeNotif(current.id);
            } else {
              snoozeNotif(current.id, SNOOZE_OPTIONS[0].at(new Date()));
            }
          }
          break;
        case 'v':
          // Alterna painel lateral de preview (só faz sentido em md+, mas o estado persiste).
          e.preventDefault();
          setShowPreview((v) => !v);
          break;
        case 'z':
          // Alterna Modo Foco (Zen): apenas alerta+erro visíveis, badge discreto.
          e.preventDefault();
          setFocusMode((v) => !v);
          break;
        case 'x':
        case 'Delete':
        case 'Backspace': {
          if (current) {
            e.preventDefault();
            const nextIdx = Math.min(idx + 1, flatList.length - 1);
            const fallback = flatList[nextIdx]?.id !== current.id ? flatList[nextIdx]?.id : flatList[idx - 1]?.id ?? null;
            setActiveId(fallback);
            deleteNotif(current.id);
          }
          break;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeId, flatList, busca]);






  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  // Realça o termo buscado no texto (respeitando acentos e case originais).
  const highlight = useCallback(
    (text: string) => {
      if (!buscaNorm) return text;
      const normText = normalize(text);
      const start = normText.indexOf(buscaNorm);
      if (start < 0) return text;
      const end = start + buscaNorm.length;
      return (
        <>
          {text.slice(0, start)}
          <mark className="bg-primary/25 text-foreground rounded px-0.5">
            {text.slice(start, end)}
          </mark>
          {text.slice(end)}
        </>
      );
    },
    [buscaNorm, normalize]
  );
  // Item ativo para o painel lateral: preferencialmente o "activeId"; senão o primeiro visível.
  const activeItem = useMemo(
    () => filtradas.find((n) => n.id === activeId) ?? filtradas[0] ?? null,
    [filtradas, activeId]
  );

  // Auto-read: quando o preview lateral está visível, o popover está aberto,
  // o usuário optou por auto-marcar e o item ativo ainda está não lido,
  // agenda uma marcação como lida após AUTO_READ_DELAY_MS. Cancela em troca.
  useEffect(() => {
    if (!open || !showPreview || !autoRead || !activeItem || activeItem.lida) return;
    const targetId = activeItem.id;
    const t = setTimeout(() => {
      markAsRead(targetId);
    }, AUTO_READ_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showPreview, autoRead, activeItem?.id, activeItem?.lida]);



  const formatAbsolute = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // ===== Item 95: Exportar notificações (CSV/JSON) =====
  // Exporta a coleção atualmente visível (respeitando busca/filtros/aba/foco).
  // Fallback: se a lista visível estiver vazia, exporta todas as carregadas.
  const buildExportPayload = useCallback(() => {
    const source = filtradas.length > 0 ? filtradas : notificacoes;
    return source.map((n) => ({
      id: n.id,
      titulo: n.titulo,
      mensagem: n.mensagem,
      tipo: n.tipo,
      lida: n.lida,
      fixada: !!n.fixada_em,
      adiada_ate: n.adiada_ate,
      link: n.link,
      created_at: n.created_at,
      created_at_local: (() => {
        try { return new Date(n.created_at).toLocaleString('pt-BR'); } catch { return ''; }
      })(),
    }));
  }, [filtradas, notificacoes]);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoga em seguida para liberar memória.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const timestamp = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  };

  const exportarJSON = () => {
    const payload = buildExportPayload();
    if (payload.length === 0) {
      toast.info('Nada para exportar');
      return;
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    triggerDownload(blob, `notificacoes_${timestamp()}.json`);
    toast.success(`${payload.length} notificação(ões) exportadas (JSON)`);
  };

  const exportarCSV = () => {
    const payload = buildExportPayload();
    if (payload.length === 0) {
      toast.info('Nada para exportar');
      return;
    }
    const headers = ['id','titulo','mensagem','tipo','lida','fixada','adiada_ate','link','created_at','created_at_local'];
    const escape = (v: unknown) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return `"${s}"`;
    };
    const rows = payload.map((r) => headers.map((h) => escape((r as Record<string, unknown>)[h])).join(','));
    // BOM para compatibilidade com Excel PT-BR.
    const csv = '\ufeff' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, `notificacoes_${timestamp()}.csv`);
    toast.success(`${payload.length} notificação(ões) exportadas (CSV)`);
  };


  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={`Notificações (${unreadCount} não lidas)`}
        >
          <Bell
            className={`w-5 h-5 transition-transform ${
              unreadCount > 0 ? 'animate-[wiggle_0.5s_ease-in-out]' : ''
            }`}
          />
          {unreadCount > 0 && !focusMode && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground animate-in zoom-in-50 duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {focusMode && unreadCount > 0 && (
            <span
              className="absolute top-0 right-0 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-background animate-in zoom-in-50 duration-200"
              aria-label={`${unreadCount} urgentes (modo foco)`}
            />
          )}
          {focusMode && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary/80 ring-2 ring-background"
              aria-hidden
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className={`p-0 ${showPreview ? 'w-[min(94vw,720px)]' : 'w-80'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setFocusMode((v) => !v)}
              aria-pressed={focusMode}
              aria-label={focusMode ? 'Desativar Modo Foco' : 'Ativar Modo Foco (só urgentes)'}
              title={focusMode ? 'Modo Foco ativo: só alertas/erros (z)' : 'Modo Foco: exibir só urgentes (z)'}
            >
              <Focus className={`w-3.5 h-3.5 ${focusMode ? 'text-primary' : 'text-muted-foreground'}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) {
                  // Toca um preview curto ao ativar para feedback imediato.
                  playSound('sucesso');
                }
              }}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'Desativar sons de notificação' : 'Ativar sons de notificação'}
              title={soundEnabled ? 'Sons: ativados (clique para silenciar)' : 'Sons: desativados (clique para ativar)'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-primary" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </Button>
            {/* Item 99: Quiet Hours — Popover configurável (janela silenciosa) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 relative"
                  aria-label={quiet.enabled ? `Quiet Hours ativo (${quiet.start}–${quiet.end})` : 'Configurar Quiet Hours'}
                  title={quiet.enabled ? `Silêncio: ${quiet.start} → ${quiet.end}` : 'Quiet Hours (silêncio programado)'}
                >
                  {quiet.enabled ? (
                    <Moon className={`w-3.5 h-3.5 ${isQuietNow() ? 'text-primary' : 'text-foreground/70'}`} />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  {quiet.enabled && isQuietNow() && (
                    <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">Quiet Hours</div>
                    <div className="text-xs text-muted-foreground">Silencia som e desktop na janela</div>
                  </div>
                  <Switch
                    checked={quiet.enabled}
                    onCheckedChange={(v) => setQuiet((q) => ({ ...q, enabled: !!v }))}
                    aria-label="Ativar Quiet Hours"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-muted-foreground space-y-1">
                    <span>Início</span>
                    <input
                      type="time"
                      value={quiet.start}
                      onChange={(e) => setQuiet((q) => ({ ...q, start: e.target.value || q.start }))}
                      disabled={!quiet.enabled}
                      className="w-full h-8 px-2 rounded-md border border-input bg-background text-sm disabled:opacity-50"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground space-y-1">
                    <span>Fim</span>
                    <input
                      type="time"
                      value={quiet.end}
                      onChange={(e) => setQuiet((q) => ({ ...q, end: e.target.value || q.end }))}
                      disabled={!quiet.enabled}
                      className="w-full h-8 px-2 rounded-md border border-input bg-background text-sm disabled:opacity-50"
                    />
                  </label>
                </div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  {quiet.enabled ? (
                    isQuietNow()
                      ? <>🌙 <strong>Silêncio ativo agora.</strong> Notificações continuam chegando na lista — sem som/desktop.</>
                      : <>Programado: <strong>{quiet.start} → {quiet.end}</strong>{quiet.start > quiet.end ? ' (atravessa meia-noite)' : ''}.</>
                  ) : (
                    <>Ative para pausar sons e pop-ups desktop em horários específicos (ex.: madrugada).</>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowHelp(true)}
              aria-label="Ver atalhos de teclado"
              title="Atalhos de teclado (?)"
            >
              <Keyboard className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Exportar notificações"
                  title="Exportar notificações"
                >
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">
                  Exportar {filtradas.length > 0 ? `${filtradas.length} visível(is)` : `${notificacoes.length} total`}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportarCSV} className="gap-2 text-xs">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  Baixar como CSV (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportarJSON} className="gap-2 text-xs">
                  <FileJson className="w-3.5 h-3.5 text-primary" />
                  Baixar como JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 relative"
              onClick={() => setShowRules(true)}
              aria-label="Regras de automação"
              title="Regras de automação"
            >
              <Wand2 className={`w-3.5 h-3.5 ${regras.some((r) => r.enabled) ? 'text-primary' : 'text-muted-foreground'}`} />
              {regras.some((r) => r.enabled) && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex h-7 w-7"
              onClick={() => setShowPreview((v) => !v)}
              aria-pressed={showPreview}
              aria-label={showPreview ? 'Ocultar painel de preview' : 'Mostrar painel de preview'}
              title={showPreview ? 'Ocultar preview (v)' : 'Mostrar preview (v)'}
            >
              {showPreview ? (
                <PanelRightClose className="w-3.5 h-3.5 text-primary" />
              ) : (
                <PanelRightOpen className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </Button>
            {showPreview && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex h-7 w-7"
                onClick={() => setAutoRead((v) => !v)}
                aria-pressed={autoRead}
                aria-label={autoRead ? 'Desativar auto-marcar como lida' : 'Ativar auto-marcar como lida'}
                title={autoRead ? 'Auto-marcar lida: ativa (1.5s no preview)' : 'Auto-marcar lida: desativada'}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${autoRead ? 'text-emerald-500' : 'text-muted-foreground'}`}
                />
              </Button>
            )}
            {canUseDesktop() && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleDesktop}
                aria-label={desktopOn ? 'Desativar notificações desktop' : 'Ativar notificações desktop'}
                title={desktopOn ? 'Notificações desktop ativas' : 'Ativar notificações desktop'}
              >
                {desktopOn ? (
                  <Bell className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </Button>
            )}
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={markAllAsRead}>
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>

        {/* Busca inline */}
        <div className="relative px-2 py-1.5 border-b border-border/50">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            ref={buscaRef}
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar notificações…  ( / )"
            aria-label="Buscar notificações"
            className="w-full h-8 pl-7 pr-7 text-xs rounded-md bg-muted/40 border border-transparent focus:border-primary/40 focus:bg-background focus:outline-none placeholder:text-muted-foreground/70 transition-colors"
          />
          {busca && (
            <button
              type="button"
              onClick={() => {
                setBusca('');
                buscaRef.current?.focus();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded hover:bg-muted transition-colors"
              aria-label="Limpar busca"
              title="Limpar busca (Esc)"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>



        <div
          role="tablist"
          aria-label="Filtro de notificações"
          className="flex items-center gap-1 px-2 py-1.5 border-b border-border/50 bg-muted/20"
        >
          {(
            [
              { id: 'todas', label: 'Todas', count: notificacoes.filter((n) => !isSnoozed(n)).length },
              { id: 'nao_lidas', label: 'Não lidas', count: unreadCount },
              { id: 'fixadas', label: 'Fixadas', count: fixadasCount },
              { id: 'adiadas', label: 'Adiadas', count: snoozedCount },
            ] as { id: BellFilter; label: string; count: number }[]
          ).map((tab) => {
            const ativo = filtro === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={ativo}
                onClick={() => setFiltro(tab.id)}
                className={`flex-1 text-[11px] font-medium py-1.5 px-2 rounded-md transition-colors flex items-center justify-center gap-1 ${
                  ativo
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1 rounded ${
                      ativo ? 'bg-primary/15 text-primary' : 'bg-muted-foreground/15'
                    }`}
                  >
                    {tab.count > 99 ? '99+' : tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Chips de filtro por tipo (multi-seleção) */}
        <div
          role="group"
          aria-label="Filtrar por tipo"
          className="flex items-center gap-1 px-2 py-1.5 border-b border-border/50 overflow-x-auto"
        >
          {tiposAtivos.size > 0 && (
            <button
              type="button"
              onClick={() => setTiposAtivos(new Set())}
              className="shrink-0 text-[10px] px-2 py-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Limpar filtros de tipo"
              title="Limpar filtros de tipo"
            >
              Limpar
            </button>
          )}
          {TIPOS_ALL.map((t) => {
            const Icon = tipoIcons[t];
            const ativo = tiposAtivos.has(t);
            const count = notificacoes.filter((n) => n.tipo === t).length;
            const disabled = count === 0;
            return (
              <button
                key={t}
                type="button"
                onClick={() => !disabled && toggleTipo(t)}
                disabled={disabled}
                aria-pressed={ativo}
                title={`${tipoLabels[t]} (${count})`}
                className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border transition-colors ${
                  disabled
                    ? 'opacity-40 cursor-not-allowed border-transparent text-muted-foreground'
                    : ativo
                      ? `border-primary/40 bg-primary/10 ${tipoColors[t]}`
                      : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Icon className={`w-3 h-3 ${ativo ? tipoColors[t] : ''}`} />
                {tipoLabels[t]}
                {count > 0 && (
                  <span className="text-[9px] opacity-70">{count > 99 ? '99+' : count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Barra de ações em massa para o recorte visível */}
        {filtradas.length > 0 && (
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-muted/10">
            <span className="text-[10px] text-muted-foreground">
              {filtradas.length === notificacoes.length
                ? `${filtradas.length} ${filtradas.length === 1 ? 'notificação' : 'notificações'}`
                : `${filtradas.length} de ${notificacoes.length} visíveis`}
            </span>
            <div className="flex items-center gap-1">
              {filtradas.some((n) => !n.lida) && (
                <button
                  type="button"
                  onClick={markVisibleAsRead}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                  title="Marcar visíveis como lidas"
                >
                  <Check className="w-3 h-3" />
                  Marcar visíveis
                </button>
              )}
              {filtradas.some((n) => !n.fixada_em) && (
                <button
                  type="button"
                  onClick={deleteVisible}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Excluir visíveis (preserva fixadas)"
                >
                  <Trash2 className="w-3 h-3" />
                  Excluir visíveis
                </button>
              )}
            </div>
          </div>
        )}

        <div className={showPreview ? 'flex' : 'block'}>
        <ScrollArea className={`max-h-80 ${showPreview ? 'flex-1 border-r border-border/50' : ''}`}>
          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">
                {buscaNorm
                  ? `Nenhum resultado para "${busca.trim()}"`
                  : tiposAtivos.size > 0
                    ? 'Nenhuma notificação nos tipos selecionados'
                    : filtro === 'nao_lidas'
                      ? 'Nenhuma notificação não lida'
                      : filtro === 'fixadas'
                        ? 'Nenhuma notificação fixada'
                        : filtro === 'adiadas'
                          ? 'Nenhuma notificação adiada'
                          : 'Nenhuma notificação'}
              </p>
              {tiposAtivos.size > 0 && (
                <button
                  type="button"
                  onClick={() => setTiposAtivos(new Set())}
                  className="mt-2 text-[11px] text-primary hover:underline"
                >
                  Limpar filtros de tipo
                </button>
              )}
            </div>
          ) : (
            grupos.map(([grupo, itens]) => (
              <div key={grupo}>
                <div className="sticky top-0 z-10 px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-background/95 backdrop-blur border-b border-border/30">
                  {grupo}
                  <span className="ml-1.5 text-muted-foreground/60 normal-case tracking-normal">
                    ({itens.length})
                  </span>
                </div>
                {itens.map((n) => {
                  const Icon = tipoIcons[n.tipo] || Info;
                  const fixada = !!n.fixada_em;
                  const snoozed = isSnoozed(n);
                  const isActive = activeId === n.id;
                  return (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      data-notif-id={n.id}
                      onMouseEnter={() => setActiveId(n.id)}
                      onClick={() => handleClick(n)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleClick(n);
                        }
                      }}
                      className={`group relative w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-muted/50 border-b border-border/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                        !n.lida ? 'bg-primary/5' : ''
                      } ${fixada ? 'border-l-2 border-l-primary/60' : ''} ${
                        isActive ? 'bg-muted/40 ring-1 ring-inset ring-primary/30' : ''
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${tipoColors[n.tipo]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-xs font-medium truncate flex items-center gap-1 ${
                              !n.lida ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {fixada && (
                              <Pin
                                className="w-3 h-3 text-primary shrink-0 fill-primary/20"
                                aria-label="Fixada"
                              />
                            )}
                            {snoozed && (
                              <Clock
                                className="w-3 h-3 text-amber-500 shrink-0"
                                aria-label="Adiada"
                              />
                            )}
                            <span className="truncate">{highlight(n.titulo)}</span>
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0 group-hover:opacity-0 transition-opacity">
                            {formatTime(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {highlight(n.mensagem)}
                        </p>
                        {snoozed && n.adiada_ate && (
                          <p className="text-[10px] text-amber-500/90 mt-1 inline-flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Volta em {formatAbsolute(n.adiada_ate)}
                          </p>
                        )}
                      </div>
                      {!n.lida && (
                        <span className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0 group-hover:opacity-0 transition-opacity" />
                      )}

                      {/* Quick actions on hover */}
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-background/95 backdrop-blur border border-border/50 rounded-md shadow-sm p-0.5">
                        {!n.lida && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                            aria-label="Marcar como lida"
                            title="Marcar como lida"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          </button>
                        )}
                        {snoozed ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              unsnoozeNotif(n.id);
                            }}
                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                            aria-label="Cancelar adiamento"
                            title="Cancelar adiamento"
                          >
                            <AlarmClockOff className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                                aria-label="Adiar"
                                title="Adiar (snooze)"
                              >
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-44"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Adiar por
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {SNOOZE_OPTIONS.map((opt) => (
                                <DropdownMenuItem
                                  key={opt.id}
                                  onSelect={() => snoozeNotif(n.id, opt.at(new Date()))}
                                  className="text-xs"
                                >
                                  <Clock className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                  {opt.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => {
                                  // Default: daqui a 2h arredondado ao próximo quarto de hora
                                  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
                                  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
                                  const pad = (v: number) => String(v).padStart(2, '0');
                                  const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                  setCustomSnoozeValue(local);
                                  setCustomSnoozeFor(n.id);
                                }}
                                className="text-xs"
                              >
                                <Clock className="w-3.5 h-3.5 mr-2 text-primary" />
                                Personalizado…
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(n.id, fixada);
                          }}
                          className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                          aria-label={fixada ? 'Desafixar' : 'Fixar'}
                          title={fixada ? 'Desafixar' : 'Fixar'}
                        >
                          {fixada ? (
                            <PinOff className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <Pin className="w-3.5 h-3.5 text-primary" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotif(n.id);
                          }}
                          className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors"
                          aria-label="Excluir"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </ScrollArea>

        {showPreview && (
          <aside
            className="w-[320px] shrink-0 hidden md:flex flex-col max-h-80 overflow-hidden"
            aria-label="Preview da notificação"
          >
            {activeItem ? (
              (() => {
                const Icon = tipoIcons[activeItem.tipo] || Info;
                const fixada = !!activeItem.fixada_em;
                const snoozed = isSnoozed(activeItem);
                return (
                  <>
                    <div className="flex items-start gap-2 px-4 py-3 border-b border-border/40">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${tipoColors[activeItem.tipo]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${tipoColors[activeItem.tipo]}`}>
                            {tipoLabels[activeItem.tipo]}
                          </span>
                          {!activeItem.lida && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                              Não lida
                            </span>
                          )}
                          {fixada && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary inline-flex items-center gap-0.5">
                              <Pin className="w-2.5 h-2.5" /> Fixada
                            </span>
                          )}
                          {snoozed && activeItem.adiada_ate && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 inline-flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> Adiada até {formatAbsolute(activeItem.adiada_ate)}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-foreground mt-1 leading-snug break-words">
                          {activeItem.titulo}
                        </h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatAbsolute(activeItem.created_at)}
                        </p>
                      </div>
                    </div>
                    <ScrollArea className="flex-1">
                      <p className="px-4 py-3 text-xs text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                        {activeItem.mensagem}
                      </p>
                    </ScrollArea>
                    <div className="flex items-center gap-1 px-2 py-2 border-t border-border/40 bg-muted/10">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 h-7 text-[11px] gap-1"
                        onClick={() => handleClick(activeItem)}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Abrir
                      </Button>
                      {!activeItem.lida && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => markAsRead(activeItem.id)}
                          aria-label="Marcar como lida"
                          title="Marcar como lida (e)"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => togglePin(activeItem.id, fixada)}
                        aria-label={fixada ? 'Desafixar' : 'Fixar'}
                        title={fixada ? 'Desafixar (p)' : 'Fixar (p)'}
                      >
                        {fixada ? (
                          <PinOff className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <Pin className="w-3.5 h-3.5 text-primary" />
                        )}
                      </Button>
                      {snoozed ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => unsnoozeNotif(activeItem.id)}
                          aria-label="Cancelar adiamento"
                          title="Cancelar adiamento"
                        >
                          <AlarmClockOff className="w-3.5 h-3.5 text-amber-500" />
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              aria-label="Adiar"
                              title="Adiar (s)"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Adiar por
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {SNOOZE_OPTIONS.map((opt) => (
                              <DropdownMenuItem
                                key={opt.id}
                                onSelect={() => snoozeNotif(activeItem.id, opt.at(new Date()))}
                                className="text-xs"
                              >
                                <Clock className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                {opt.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-destructive/10"
                        onClick={() => deleteNotif(activeItem.id)}
                        aria-label="Excluir"
                        title="Excluir (x)"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">Selecione uma notificação para visualizar</p>
              </div>
            )}
          </aside>
        )}
        </div>

        <div className="p-2 border-t border-border/50 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs font-medium text-primary hover:text-primary hover:bg-primary/5"
            onClick={() => {
              setOpen(false);
              navigate('/notificacoes');
            }}
          >
            Ver todas as notificações
          </Button>
          <p className="text-[10px] text-muted-foreground/70 text-center px-2 leading-tight">
            <kbd className="px-1 rounded bg-muted/60">/</kbd> buscar ·
            <kbd className="ml-1 px-1 rounded bg-muted/60">j</kbd>/<kbd className="px-1 rounded bg-muted/60">k</kbd> navegar ·
            <kbd className="ml-1 px-1 rounded bg-muted/60">↵</kbd> abrir ·
            <kbd className="ml-1 px-1 rounded bg-muted/60">e</kbd> lida ·
            <kbd className="ml-1 px-1 rounded bg-muted/60">p</kbd> fixar ·
            <kbd className="ml-1 px-1 rounded bg-muted/60">x</kbd> excluir ·
            <kbd className="ml-1 px-1 rounded bg-muted/60">s</kbd> adiar ·
            <kbd className="ml-1 px-1 rounded bg-muted/60">v</kbd> preview
          </p>
        </div>
      </PopoverContent>
    </Popover>
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-primary" />
            Atalhos do sino
          </DialogTitle>
          <DialogDescription>
            Navegue e gerencie notificações sem tirar as mãos do teclado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {[
            {
              titulo: 'Navegação',
              itens: [
                ['↑ ↓', 'Mover entre notificações'],
                ['Home / End', 'Ir para o primeiro / último item'],
                ['Enter', 'Abrir notificação'],
                ['/', 'Focar campo de busca'],
                ['Esc', 'Limpar busca ou fechar'],
              ],
            },
            {
              titulo: 'Ações rápidas',
              itens: [
                ['E', 'Marcar como lida'],
                ['P', 'Fixar / desafixar'],
                ['S', 'Adiar (snooze) 1h — repete para cancelar'],
                ['X · Del · ⌫', 'Excluir (com undo de 5s)'],
              ],
            },
            {
              titulo: 'Modos',
              itens: [
                ['V', 'Alternar painel lateral de preview'],
                ['Z', 'Alternar Modo Foco (só urgentes)'],
                ['?', 'Abrir/fechar esta ajuda'],
              ],
            },
          ].map((secao) => (
            <div key={secao.titulo}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {secao.titulo}
              </h4>
              <ul className="space-y-1.5">
                {secao.itens.map(([tecla, desc]) => (
                  <li key={tecla} className="flex items-center justify-between gap-3">
                    <span className="text-foreground/90">{desc}</span>
                    <kbd className="px-2 py-0.5 rounded border border-border bg-muted text-[11px] font-mono text-muted-foreground shrink-0">
                      {tecla}
                    </kbd>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>

    {/* Item 96: Dialog de Regras de Automação */}
    <Dialog open={showRules} onOpenChange={setShowRules}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wand2 className="w-4 h-4 text-primary" />
            Regras de Automação
          </DialogTitle>
          <DialogDescription className="text-xs">
            Aplicadas automaticamente a cada nova notificação recebida. Combine filtros por tipo e conteúdo para silenciar, marcar como lida, adiar ou fixar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {regras.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border/50 rounded-lg">
              Nenhuma regra ainda. Clique em <span className="font-semibold text-foreground">Nova regra</span> para começar.
            </div>
          )}
          {regras.map((r, idx) => (
            <div key={r.id} className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={r.name}
                  onChange={(e) =>
                    setRegras((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                  }
                  placeholder="Nome da regra"
                  className="h-8 text-xs flex-1"
                />
                <Switch
                  checked={r.enabled}
                  onCheckedChange={(v) =>
                    setRegras((prev) => prev.map((x, i) => (i === idx ? { ...x, enabled: !!v } : x)))
                  }
                  aria-label="Ativar regra"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => setRegras((prev) => prev.filter((_, i) => i !== idx))}
                  aria-label="Remover regra"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Tipos</Label>
                  <div className="flex flex-wrap gap-1">
                    {TIPOS_ALL.map((t) => {
                      const active = r.tipos.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            setRegras((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      tipos: active ? x.tipos.filter((y) => y !== t) : [...x.tipos, t],
                                    }
                                  : x
                              )
                            )
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                            active
                              ? 'bg-primary/15 border-primary/40 text-primary'
                              : 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {tipoLabels[t]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Ação</Label>
                  <Select
                    value={r.action}
                    onValueChange={(v) => {
                      if (!isRuleAction(v)) return;
                      setRegras((prev) => prev.map((x, i) => (i === idx ? { ...x, action: v } : x)));
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(RULE_ACTION_LABELS) as RuleAction[]).map((a) => (
                        <SelectItem key={a} value={a} className="text-xs">
                          {RULE_ACTION_LABELS[a]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Contém (título ou mensagem)</Label>
                <Input
                  value={r.contains}
                  onChange={(e) =>
                    setRegras((prev) => prev.map((x, i) => (i === idx ? { ...x, contains: e.target.value } : x)))
                  }
                  placeholder="ex.: aprovação, férias..."
                  className="h-8 text-xs"
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() =>
              setRegras((prev) => [
                ...prev,
                {
                  id: (crypto?.randomUUID?.() ?? String(Date.now())),
                  name: `Regra ${prev.length + 1}`,
                  enabled: true,
                  tipos: [],
                  contains: '',
                  action: 'auto_read',
                },
              ])
            }
          >
            <Plus className="w-3.5 h-3.5" />
            Nova regra
          </Button>
          <Button size="sm" onClick={() => setShowRules(false)}>Concluído</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Item 97: Dialog de Snooze Personalizado */}
    <Dialog
      open={customSnoozeFor !== null}
      onOpenChange={(v) => { if (!v) setCustomSnoozeFor(null); }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-primary" />
            Adiar até…
          </DialogTitle>
          <DialogDescription className="text-xs">
            Escolha a data e hora exata em que a notificação deve voltar. Máximo de 30 dias no futuro.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <input
            type="datetime-local"
            value={customSnoozeValue}
            min={(() => {
              const d = new Date(Date.now() + 60000);
              const pad = (v: number) => String(v).padStart(2, '0');
              return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            })()}
            max={(() => {
              const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              const pad = (v: number) => String(v).padStart(2, '0');
              return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            })()}
            onChange={(e) => setCustomSnoozeValue(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {customSnoozeValue && (() => {
            const target = new Date(customSnoozeValue);
            const now = new Date();
            const invalid = isNaN(target.getTime()) || target.getTime() <= now.getTime();
            const tooFar = target.getTime() - now.getTime() > 30 * 24 * 60 * 60 * 1000;
            if (invalid) return <p className="text-[11px] text-destructive">Escolha uma data/hora no futuro.</p>;
            if (tooFar) return <p className="text-[11px] text-destructive">Máximo permitido: 30 dias.</p>;
            const diffMin = Math.round((target.getTime() - now.getTime()) / 60000);
            const rel =
              diffMin < 60 ? `${diffMin} min` :
              diffMin < 60 * 24 ? `${Math.round(diffMin / 60)} h` :
              `${Math.round(diffMin / (60 * 24))} d`;
            return <p className="text-[11px] text-muted-foreground">Volta em <span className="font-medium text-foreground">{rel}</span> ({formatAbsolute(target.toISOString())}).</p>;
          })()}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCustomSnoozeFor(null)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={(() => {
              if (!customSnoozeValue) return true;
              const t = new Date(customSnoozeValue).getTime();
              const now = Date.now();
              return isNaN(t) || t <= now || t - now > 30 * 24 * 60 * 60 * 1000;
            })()}
            onClick={() => {
              if (!customSnoozeFor) return;
              const target = new Date(customSnoozeValue);
              snoozeNotif(customSnoozeFor, target);
              setCustomSnoozeFor(null);
            }}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Adiar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>

  );
}
