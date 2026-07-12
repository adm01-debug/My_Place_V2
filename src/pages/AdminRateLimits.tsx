import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Shield, Save } from "lucide-react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";

interface RateLimit {
  categoria: string;
  janela_minutos: number;
  max_por_janela: number;
  descricao: string | null;
}

export default function AdminRateLimits() {
  const [rows, setRows] = useState<RateLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notificacao_rate_limits" as any)
      .select("*")
      .order("categoria");
    if (error) toast.error("Erro ao carregar limites");
    else setRows((data as unknown as RateLimit[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (categoria: string, patch: Partial<RateLimit>) => {
    setRows((s) => s.map((r) => (r.categoria === categoria ? { ...r, ...patch } : r)));
  };

  const salvar = async (r: RateLimit) => {
    setSaving(r.categoria);
    const { error } = await supabase
      .from("notificacao_rate_limits" as any)
      .update({
        janela_minutos: r.janela_minutos,
        max_por_janela: r.max_por_janela,
        updated_at: new Date().toISOString(),
      })
      .eq("categoria", r.categoria);
    setSaving(null);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success(`Limite de "${r.categoria}" atualizado`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Rate Limits de Notificação"
        description="Controle anti-spam por categoria — notificações críticas sempre passam"
        icon={Shield}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração por categoria</CardTitle>
          <CardDescription>
            Máximo de notificações por janela de tempo. Excedeu? Registra bloqueio com motivo{" "}
            <code className="text-xs bg-muted px-1 rounded">rate_limited</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((r) => (
            <div key={r.categoria} className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-[1fr_120px_120px_auto] gap-3 items-end">
              <div>
                <p className="font-medium capitalize">{r.categoria}</p>
                {r.descricao && <p className="text-xs text-muted-foreground">{r.descricao}</p>}
              </div>
              <div>
                <Label className="text-xs">Janela (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={r.janela_minutos}
                  onChange={(e) => update(r.categoria, { janela_minutos: parseInt(e.target.value || "1", 10) })}
                />
              </div>
              <div>
                <Label className="text-xs">Máx/janela</Label>
                <Input
                  type="number"
                  min={1}
                  value={r.max_por_janela}
                  onChange={(e) => update(r.categoria, { max_por_janela: parseInt(e.target.value || "1", 10) })}
                />
              </div>
              <Button size="sm" onClick={() => salvar(r)} disabled={saving === r.categoria}>
                {saving === r.categoria ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Save className="w-4 h-4 mr-1" /> Salvar</>
                )}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
