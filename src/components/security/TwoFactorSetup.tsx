import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Copy, Loader2, KeyRound, QrCode } from "lucide-react";

type SetupData = { secret: string; otpauthUrl: string; backupCodes: string[] };

export function TwoFactorSetup() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("user_2fa").select("enabled").eq("user_id", user.id).maybeSingle();
    setEnabled(!!data?.enabled);
  }

  async function call(action: string, body: Record<string, unknown> = {}) {
    const { data, error } = await supabase.functions.invoke("totp-2fa", {
      body: { action, ...body },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function handleSetup() {
    setLoading(true);
    try {
      const data = await call("setup");
      setSetup({ secret: data.secret, otpauthUrl: data.otpauthUrl, backupCodes: data.backupCodes });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao iniciar 2FA");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySetup() {
    if (code.length !== 6) return toast.error("Informe o código de 6 dígitos");
    setLoading(true);
    try {
      await call("verify-setup", { code });
      toast.success("2FA ativado com sucesso!");
      setSetup(null);
      setCode("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    if (!confirm("Desativar autenticação de dois fatores? Sua conta ficará menos protegida.")) return;
    setLoading(true);
    try {
      await call("disable", { code });
      toast.success("2FA desativado");
      setCode("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao desativar");
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado`));
  }

  const qrUrl = setup
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setup.otpauthUrl)}`
    : null;

  return (
    <Card className="p-4 border-border/50 shadow-md backdrop-blur-sm bg-card/80 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Autenticação de Dois Fatores (2FA)</h3>
            <p className="text-[11px] text-muted-foreground">
              Adicione uma camada extra de segurança usando um app autenticador
            </p>
          </div>
        </div>
        {enabled === true && <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Ativo</Badge>}
        {enabled === false && <Badge variant="outline">Inativo</Badge>}
      </div>

      {enabled === false && !setup && (
        <Button onClick={handleSetup} disabled={loading} size="sm" className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
          Configurar 2FA
        </Button>
      )}

      {setup && (
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <QrCode className="w-3 h-3" /> Escaneie no Google Authenticator / Authy / 1Password
            </div>
            {qrUrl && <img src={qrUrl} alt="QR Code 2FA" className="rounded-lg border bg-white p-2" width={200} height={200} />}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ou digite manualmente:</Label>
            <div className="flex gap-2">
              <Input readOnly value={setup.secret} className="font-mono text-xs" />
              <Button size="icon" variant="outline" onClick={() => copy(setup.secret, "Segredo")}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              ⚠️ Guarde os códigos de recuperação (use uma vez cada):
            </p>
            <div className="grid grid-cols-2 gap-1 font-mono text-xs">
              {setup.backupCodes.map((c) => (
                <div key={c} className="p-1.5 bg-background/60 rounded text-center">{c}</div>
              ))}
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={() => copy(setup.backupCodes.join("\n"), "Códigos")}>
              <Copy className="w-3 h-3 mr-1" /> Copiar todos
            </Button>
          </div>
          <div className="space-y-1">
            <Label htmlFor="verify-code" className="text-xs">Confirme com o código do app (6 dígitos):</Label>
            <div className="flex gap-2">
              <Input
                id="verify-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="font-mono text-center tracking-widest"
              />
              <Button onClick={handleVerifySetup} disabled={loading || code.length !== 6}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ativar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {enabled === true && (
        <div className="space-y-2 pt-2 border-t border-border/40">
          <Label htmlFor="disable-code" className="text-xs">Para desativar, insira um código atual do app:</Label>
          <div className="flex gap-2">
            <Input
              id="disable-code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="font-mono text-center tracking-widest"
            />
            <Button variant="destructive" onClick={handleDisable} disabled={loading || code.length !== 6}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldOff className="w-4 h-4 mr-1" /> Desativar</>}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
