import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  FlaskConical, Send, Loader2, CheckCircle2, Ban, Moon, VolumeX, SlidersHorizontal,
  Smartphone, Mail, BellRing, MessageCircle, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

type Canal = 'in_app' | 'email' | 'push' | 'whatsapp';
type Nivel = 'info' | 'aviso' | 'critico';
type Tipo = 'info' | 'sucesso' | 'alerta' | 'erro';

const CATEGORIAS = [
  'ponto', 'ferias', 'holerite', 'solicitacao', 'vale', 'emprestimo',
  'treinamento', 'feedback', 'kudos', 'comunicado', 'chamado', 'politica',
  'aniversario', 'sistema', 'seguranca',
] as const;
type Categoria = typeof CATEGORIAS[number];

const CANAIS: { id: Canal; label: string; icon: typeof Mail }[] = [
  { id: 'in_app', label: 'In-app', icon: Smartphone },
  { id: 'email', label: 'E-mail', icon: Mail },
  { id: 'push', label: 'Push', icon: BellRing },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

const MOTIVOS: Record<string, { label: string; hint: string; icon: typeof Ban; tone: string }> = {
  canal_desativado: {
    label: 'Canal desativado',
    hint: 'Preferências desta categoria não permitem este canal.',
    icon: Ban, tone: 'text-muted-foreground',
  },
  silenciado_temporariamente: {
    label: 'Silenciado',
    hint: 'Categoria em silêncio até o horário definido.',
    icon: VolumeX, tone: 'text-amber-500',
  },
  quiet_hours: {
    label: 'Quiet hours',
    hint: 'Fora do horário permitido de recebimento.',
    icon: Moon, tone: 'text-indigo-500',
  },
  nivel_abaixo_minimo: {
    label: 'Nível abaixo do mínimo',
    hint: 'Nível desta notificação é inferior ao mínimo configurado.',
    icon: SlidersHorizontal, tone: 'text-muted-foreground',
  },
};

interface CanalResultado {
  canal: Canal;
  permitido: boolean;
  motivo: string | null;
}

interface Props {
  onDispatched?: () => void;
}

export function NotificacaoSimulador({ onDispatched }: Props) {
  const { user } = useAuth();
  const [categoria, setCategoria] = useState<Categoria>('sistema');
  const [nivel, setNivel] = useState<Nivel>('info');
  const [tipo, setTipo] = useState<Tipo>('info');
  const [titulo, setTitulo] = useState('Notificação de teste');
  const [mensagem, setMensagem] = useState('Este é um envio simulado para validar suas preferências atuais.');
  const [resultados, setResultados] = useState<CanalResultado[] | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const simular = async () => {
    if (!user) return;
    setSimulando(true);
    setResultados(null);
    try {
      const outcomes = await Promise.all(
        CANAIS.map(async ({ id }) => {
          const { data, error } = await supabase.rpc('fn_motivo_bloqueio', {
            _user_id: user.id,
            _categoria: categoria,
            _canal: id,
            _nivel: nivel,
          });
          if (error) throw error;
          const motivo = (data as string | null) ?? null;
          return { canal: id, permitido: motivo === null, motivo };
        })
      );
      setResultados(outcomes);
    } catch (err) {
      toast.error('Falha na simulação: ' + (err instanceof Error ? err.message : 'erro desconhecido'));
    } finally {
      setSimulando(false);
    }
  };

  const enviarReal = async () => {
    if (!user) return;
    setEnviando(true);
    try {
      const { error } = await supabase.rpc('fn_notificar', {
        _user_id: user.id,
        _titulo: titulo,
        _mensagem: mensagem,
        _tipo: tipo,
        _categoria: categoria,
        _link: '/notificacoes',
        _nivel: nivel,
      });
      if (error) throw error;
      toast.success('Notificação de teste disparada. Confira o histórico.');
      onDispatched?.();
      await simular();
    } catch (err) {
      toast.error('Falha ao disparar: ' + (err instanceof Error ? err.message : 'erro desconhecido'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FlaskConical className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base">Simular envio</CardTitle>
            <CardDescription className="text-xs">
              Veja quais canais seriam acionados agora, com suas preferências atuais. Opcionalmente dispare uma notificação real.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Categoria</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
              <SelectTrigger className="h-9 text-sm capitalize"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nível</Label>
            <Select value={nivel} onValueChange={(v) => setNivel(v as Nivel)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="aviso">Aviso</SelectItem>
                <SelectItem value="critico">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo visual</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="sucesso">Sucesso</SelectItem>
                <SelectItem value="alerta">Alerta</SelectItem>
                <SelectItem value="erro">Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Título</Label>
          <Input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={120} className="h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Mensagem</Label>
          <Textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={2} className="text-sm resize-none" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={simular} disabled={simulando}>
            {simulando ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Simular
          </Button>
          <Button size="sm" onClick={enviarReal} disabled={enviando || !titulo.trim() || !mensagem.trim()}>
            {enviando ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
            Disparar teste real
          </Button>
        </div>

        {resultados && (
          <div className="space-y-2 pt-2 border-t border-border/40">
            <p className="text-xs font-medium text-muted-foreground">Resultado por canal</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {resultados.map(r => {
                const meta = CANAIS.find(c => c.id === r.canal)!;
                const Icon = meta.icon;
                const motivo = r.motivo ? MOTIVOS[r.motivo] : null;
                const MotivoIcon = motivo?.icon ?? Ban;
                return (
                  <div
                    key={r.canal}
                    className={`rounded-md border p-3 space-y-1 ${
                      r.permitido
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-amber-500/20 bg-amber-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{meta.label}</span>
                      <Badge
                        variant="outline"
                        className={`ml-auto text-[10px] ${
                          r.permitido
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}
                      >
                        {r.permitido ? 'Seria entregue' : 'Bloqueado'}
                      </Badge>
                    </div>
                    {r.permitido ? (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Preferências permitem o envio agora.
                      </p>
                    ) : (
                      <div className="space-y-0.5">
                        <p className={`text-[11px] font-medium flex items-center gap-1 ${motivo?.tone ?? 'text-amber-600'}`}>
                          <MotivoIcon className="w-3 h-3" /> {motivo?.label ?? 'Bloqueado'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{motivo?.hint}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
