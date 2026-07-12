import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, BellOff, RotateCcw, Moon, Save } from "lucide-react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";

type Categoria =
  | "ponto" | "ferias" | "holerite" | "solicitacao" | "vale" | "emprestimo"
  | "treinamento" | "feedback" | "kudos" | "comunicado" | "chamado" | "politica"
  | "aniversario" | "sistema" | "seguranca";

type Nivel = "info" | "aviso" | "critico";

type DigestFreq = "imediato" | "horario" | "diario" | "semanal";

interface Pref {
  categoria: Categoria;
  canal_in_app: boolean;
  canal_email: boolean;
  canal_push: boolean;
  canal_whatsapp: boolean;
  nivel_minimo: Nivel;
  silenciar_ate: string | null;
  digest_frequencia: DigestFreq;
}

interface Quiet {
  ativo: boolean;
  inicio: string;
  fim: string;
  timezone: string;
  dias_semana: number[];
  permitir_criticos: boolean;
}

const CATEGORIAS: { id: Categoria; label: string; desc: string }[] = [
  { id: "ponto", label: "Ponto Eletrônico", desc: "Lembretes e ajustes de marcação" },
  { id: "ferias", label: "Férias", desc: "Aprovações e vencimentos" },
  { id: "holerite", label: "Holerites", desc: "Novos contracheques disponíveis" },
  { id: "solicitacao", label: "Solicitações", desc: "Status de solicitações internas" },
  { id: "vale", label: "Vales & Adiantamentos", desc: "Aprovações e liberações" },
  { id: "emprestimo", label: "Empréstimos", desc: "Parcelas e status" },
  { id: "treinamento", label: "Treinamentos", desc: "Novos cursos e certificações" },
  { id: "feedback", label: "Feedback 360º", desc: "Ciclos e convites" },
  { id: "kudos", label: "Kudos", desc: "Reconhecimentos recebidos" },
  { id: "comunicado", label: "Comunicados", desc: "Anúncios corporativos" },
  { id: "chamado", label: "Chamados", desc: "Atualizações de tickets" },
  { id: "politica", label: "Políticas", desc: "Novas versões para aceite" },
  { id: "aniversario", label: "Aniversários", desc: "Colegas e datas comemorativas" },
  { id: "sistema", label: "Sistema", desc: "Manutenções e status" },
  { id: "seguranca", label: "Segurança", desc: "Alertas de acesso e 2FA" },
];

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function NotificacaoPreferencias() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<Record<Categoria, Pref>>({} as Record<Categoria, Pref>);
  const [quiet, setQuiet] = useState<Quiet>({
    ativo: false, inicio: "22:00", fim: "07:00",
    timezone: "America/Sao_Paulo", dias_semana: [0,1,2,3,4,5,6], permitir_criticos: true,
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: p }, { data: q }] = await Promise.all([
      supabase.from("notificacao_preferencias").select("*").eq("user_id", user.id),
      supabase.from("notificacao_quiet_hours").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    const map = {} as Record<Categoria, Pref>;
    for (const cat of CATEGORIAS) {
      const found = p?.find((x) => x.categoria === cat.id);
      map[cat.id] = found ?? {
        categoria: cat.id,
        canal_in_app: true, canal_email: true, canal_push: true, canal_whatsapp: false,
        nivel_minimo: "info", silenciar_ate: null,
      };
    }
    setPrefs(map);
    if (q) setQuiet({
      ativo: q.ativo, inicio: q.inicio.slice(0,5), fim: q.fim.slice(0,5),
      timezone: q.timezone, dias_semana: q.dias_semana, permitir_criticos: q.permitir_criticos,
    });
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const updatePref = (cat: Categoria, patch: Partial<Pref>) => {
    setPrefs((s) => ({ ...s, [cat]: { ...s[cat], ...patch } }));
  };

  const salvar = async () => {
    if (!user) return;
    setSaving(true);
    const rows = Object.values(prefs).map((p) => ({ ...p, user_id: user.id }));
    const { error: e1 } = await supabase
      .from("notificacao_preferencias")
      .upsert(rows, { onConflict: "user_id,categoria" });
    const { error: e2 } = await supabase
      .from("notificacao_quiet_hours")
      .upsert({ ...quiet, user_id: user.id }, { onConflict: "user_id" });
    setSaving(false);
    if (e1 || e2) { toast.error("Erro ao salvar preferências"); return; }
    toast.success("Preferências salvas");
  };

  const resetar = async () => {
    if (!user) return;
    const { error } = await supabase.rpc("fn_notif_prefs_reset", { _user_id: user.id });
    if (error) { toast.error("Erro ao restaurar"); return; }
    toast.success("Preferências restauradas ao padrão");
    load();
  };

  const silenciarTodas = (horas: number) => {
    const ate = new Date(Date.now() + horas * 3600_000).toISOString();
    setPrefs((s) => Object.fromEntries(
      Object.entries(s).map(([k, v]) => [k, { ...v, silenciar_ate: ate }])
    ) as Record<Categoria, Pref>);
    toast.info(`Todas as categorias silenciadas por ${horas}h — clique em Salvar`);
  };

  const toggleDia = (d: number) => {
    setQuiet((q) => ({
      ...q,
      dias_semana: q.dias_semana.includes(d)
        ? q.dias_semana.filter((x) => x !== d)
        : [...q.dias_semana, d].sort(),
    }));
  };

  const silenciadasCount = useMemo(
    () => Object.values(prefs).filter((p) => p.silenciar_ate && new Date(p.silenciar_ate) > new Date()).length,
    [prefs]
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Preferências de Notificação"
        description="Escolha como e quando você quer ser notificado"
        icon={BellOff}
      />

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações rápidas</CardTitle>
          <CardDescription>
            {silenciadasCount > 0 ? `${silenciadasCount} categorias silenciadas` : "Nenhuma categoria silenciada"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => silenciarTodas(1)}>Silenciar 1h</Button>
          <Button variant="outline" size="sm" onClick={() => silenciarTodas(4)}>Silenciar 4h</Button>
          <Button variant="outline" size="sm" onClick={() => silenciarTodas(24)}>Silenciar 24h</Button>
          <Button variant="outline" size="sm" onClick={resetar}>
            <RotateCcw className="w-4 h-4 mr-1" /> Restaurar padrão
          </Button>
        </CardContent>
      </Card>

      {/* Quiet hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="w-4 h-4" /> Horário de silêncio
          </CardTitle>
          <CardDescription>Não receba notificações durante períodos específicos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar horário de silêncio</Label>
            <Switch checked={quiet.ativo} onCheckedChange={(v) => setQuiet({ ...quiet, ativo: v })} />
          </div>
          {quiet.ativo && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Início</Label>
                  <Input type="time" value={quiet.inicio} onChange={(e) => setQuiet({ ...quiet, inicio: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Fim</Label>
                  <Input type="time" value={quiet.fim} onChange={(e) => setQuiet({ ...quiet, fim: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Dias da semana</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DIAS.map((d, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={quiet.dias_semana.includes(i) ? "default" : "outline"}
                      onClick={() => toggleDia(i)}
                      type="button"
                    >
                      {d}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Permitir alertas críticos</Label>
                  <p className="text-xs text-muted-foreground">Segurança e emergências ignoram o silêncio</p>
                </div>
                <Switch
                  checked={quiet.permitir_criticos}
                  onCheckedChange={(v) => setQuiet({ ...quiet, permitir_criticos: v })}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preferências por categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorias</CardTitle>
          <CardDescription>Configure canais e nível mínimo para cada tipo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CATEGORIAS.map((cat) => {
            const p = prefs[cat.id];
            if (!p) return null;
            const silenciada = p.silenciar_ate && new Date(p.silenciar_ate) > new Date();
            return (
              <div key={cat.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.desc}</p>
                    {silenciada && (
                      <p className="text-xs text-warning mt-1">
                        Silenciada até {new Date(p.silenciar_ate!).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <Select
                    value={p.nivel_minimo}
                    onValueChange={(v) => updatePref(cat.id, { nivel_minimo: v as Nivel })}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info+</SelectItem>
                      <SelectItem value="aviso">Aviso+</SelectItem>
                      <SelectItem value="critico">Só críticos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={p.canal_in_app} onCheckedChange={(v) => updatePref(cat.id, { canal_in_app: v })} />
                    No portal
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={p.canal_email} onCheckedChange={(v) => updatePref(cat.id, { canal_email: v })} />
                    E-mail
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={p.canal_push} onCheckedChange={(v) => updatePref(cat.id, { canal_push: v })} />
                    Push
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={p.canal_whatsapp} onCheckedChange={(v) => updatePref(cat.id, { canal_whatsapp: v })} />
                    WhatsApp
                  </label>
                </div>
                {silenciada && (
                  <Button size="sm" variant="ghost" onClick={() => updatePref(cat.id, { silenciar_ate: null })}>
                    Remover silêncio
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Salvar sticky */}
      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" onClick={salvar} disabled={saving} className="shadow-lg">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar preferências
        </Button>
      </div>
    </div>
  );
}
