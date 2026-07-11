import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Fingerprint, Loader2, Trash2, ShieldCheck, Smartphone } from "lucide-react";
import { b64urlToBuf, bufToB64url, isPlatformAuthenticatorAvailable, isWebAuthnSupported } from "@/lib/webauthn";

type Cred = { id: string; device_name: string; created_at: string; last_used_at: string | null };

export function BiometricSetup() {
  const [supported, setSupported] = useState<boolean>(false);
  const [creds, setCreds] = useState<Cred[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const ok = isWebAuthnSupported() && (await isPlatformAuthenticatorAvailable());
      setSupported(ok);
      if (ok) await refresh();
    })();
  }, []);

  async function call(action: string, body: Record<string, unknown> = {}) {
    const { data, error } = await supabase.functions.invoke("webauthn", { body: { action, ...body } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function refresh() {
    try {
      const data = await call("list");
      setCreds(data.credentials ?? []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRegister() {
    if (!supported) return toast.error("Dispositivo não suporta biometria");
    setLoading(true);
    try {
      const opts = await call("register-begin");

      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: b64urlToBuf(opts.challenge),
        rp: { name: opts.rp.name, id: window.location.hostname },
        user: {
          id: b64urlToBuf(opts.user.id),
          name: opts.user.name,
          displayName: opts.user.displayName,
        },
        pubKeyCredParams: opts.pubKeyCredParams,
        authenticatorSelection: {
          ...opts.authenticatorSelection,
          authenticatorAttachment: "platform",
        },
        timeout: opts.timeout,
        attestation: "none",
        excludeCredentials: (opts.excludeCredentials ?? []).map((c: { id: string; type: string; transports?: string[] }) => ({
          id: b64urlToBuf(c.id),
          type: "public-key" as const,
          transports: c.transports as AuthenticatorTransport[] | undefined,
        })),
      };

      const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
      if (!cred) throw new Error("Registro cancelado");

      const response = cred.response as AuthenticatorAttestationResponse;
      const publicKeyBuf = response.getPublicKey?.();
      if (!publicKeyBuf) throw new Error("Chave pública indisponível neste navegador");

      const deviceName = detectDeviceName();
      await call("register-finish", {
        credentialId: bufToB64url(cred.rawId),
        publicKey: bufToB64url(publicKeyBuf),
        deviceName,
        transports: response.getTransports?.() ?? [],
        challenge: opts.challenge,
      });

      toast.success(`Biometria registrada em ${deviceName}!`);
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao registrar";
      if (msg.toLowerCase().includes("cancel") || msg.includes("NotAllowed")) {
        toast.info("Registro cancelado");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este dispositivo biométrico?")) return;
    try {
      await call("delete", { id });
      toast.success("Dispositivo removido");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao remover");
    }
  }

  return (
    <Card className="p-4 border-border/50 shadow-md backdrop-blur-sm bg-card/80 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Login Biométrico (Face ID / Touch ID)</h3>
            <p className="text-[11px] text-muted-foreground">
              Entre no portal com sua digital, rosto ou Windows Hello
            </p>
          </div>
        </div>
        {supported
          ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Suportado</Badge>
          : <Badge variant="outline">Indisponível</Badge>}
      </div>

      {!supported && (
        <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-xs text-muted-foreground">
          Este dispositivo/navegador não possui autenticador biométrico compatível. Use um celular moderno ou um notebook com Windows Hello / Touch ID.
        </div>
      )}

      {supported && (
        <>
          <Button onClick={handleRegister} disabled={loading} size="sm" className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Fingerprint className="w-4 h-4 mr-2" />}
            Registrar este dispositivo
          </Button>

          {creds.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Dispositivos registrados ({creds.length})
              </p>
              {creds.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/50 border border-border/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <Smartphone className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.device_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Registrado em {new Date(c.created_at).toLocaleDateString("pt-BR")}
                        {c.last_used_at && ` · Último uso ${new Date(c.last_used_at).toLocaleDateString("pt-BR")}`}
                      </p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <span>Sua biometria nunca sai do dispositivo — armazenamos apenas a chave pública criptográfica.</span>
          </div>
        </>
      )}
    </Card>
  );
}

function detectDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone (Face ID / Touch ID)";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android (Biometria)";
  if (/Mac/.test(ua)) return "Mac (Touch ID)";
  if (/Windows/.test(ua)) return "Windows Hello";
  return "Navegador";
}
