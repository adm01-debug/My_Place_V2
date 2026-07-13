import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileSignature, ShieldCheck, Clock, XCircle, CheckCircle2, Plus, ExternalLink, Users } from "lucide-react";
import { format } from "date-fns";
import { getErrorMessage } from "@/lib/errors";

type Documento = {
  id: string; codigo: string; titulo: string; descricao: string | null;
  categoria: string; arquivo_url: string; arquivo_hash: string; status: string;
  data_limite: string | null; created_at: string;
  total_signatarios?: number; total_assinados?: number; total_pendentes?: number;
};

type Assinatura = {
  id: string; documento_id: string; user_id: string; ordem: number; papel: string; status: string;
  assinado_em: string | null; motivo_recusa: string | null;
};

const CATEGORIAS = [
  { v: "contrato", l: "Contrato" }, { v: "aditivo", l: "Aditivo" },
  { v: "acordo", l: "Acordo" }, { v: "termo", l: "Termo" },
  { v: "nda", l: "NDA" }, { v: "procuracao", l: "Procuração" },
  { v: "outros", l: "Outros" },
];

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  aguardando: { label: "Aguardando", icon: <Clock className="h-3 w-3" />, variant: "secondary" },
  parcial: { label: "Parcial", icon: <Clock className="h-3 w-3" />, variant: "outline" },
  concluido: { label: "Concluído", icon: <CheckCircle2 className="h-3 w-3" />, variant: "default" },
  cancelado: { label: "Cancelado", icon: <XCircle className="h-3 w-3" />, variant: "destructive" },
  expirado: { label: "Expirado", icon: <XCircle className="h-3 w-3" />, variant: "destructive" },
};

async function sha256(text: string) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Assinaturas() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [openNovo, setOpenNovo] = useState(false);
  const [docAssinar, setDocAssinar] = useState<Documento | null>(null);

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ["assinaturas_docs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_documentos_assinatura")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Documento[];
    },
  });

  const kpis = {
    total: documentos.length,
    concluidos: documentos.filter((d) => d.status === "concluido").length,
    aguardando: documentos.filter((d) => d.status === "aguardando" || d.status === "parcial").length,
    cancelados: documentos.filter((d) => d.status === "cancelado").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <FileSignature className="h-7 w-7 text-primary" />
            Assinatura Digital de Documentos
          </h1>
          <p className="text-muted-foreground text-sm">Contratos e acordos assinados eletronicamente com trilha jurídica.</p>
        </div>
        {isAdmin && (
          <Dialog open={openNovo} onOpenChange={setOpenNovo}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Novo documento</Button>
            </DialogTrigger>
            <NovoDocDialog onClose={() => setOpenNovo(false)} />
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-bold">{kpis.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />Concluídos</div><div className="text-2xl font-bold">{kpis.concluidos}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3 text-amber-500" />Aguardando</div><div className="text-2xl font-bold">{kpis.aguardando}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" />Cancelados</div><div className="text-2xl font-bold">{kpis.cancelados}</div></CardContent></Card>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : documentos.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum documento cadastrado.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {documentos.map((d) => {
            const s = STATUS_MAP[d.status] ?? STATUS_MAP.aguardando;
            const progresso = d.total_signatarios ? ((d.total_assinados ?? 0) / d.total_signatarios) * 100 : 0;
            return (
              <Card key={d.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{d.codigo}</span>
                        <Badge variant={s.variant} className="gap-1">{s.icon} {s.label}</Badge>
                        <Badge variant="outline" className="capitalize">{d.categoria}</Badge>
                      </div>
                      <h3 className="font-semibold mt-1">{d.titulo}</h3>
                      {d.descricao && <p className="text-sm text-muted-foreground line-clamp-2">{d.descricao}</p>}
                    </div>
                    <a href={d.arquivo_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Abrir arquivo
                    </a>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {d.total_assinados ?? 0} de {d.total_signatarios ?? 0} assinaturas</span>
                    {d.data_limite && <span>Prazo: {format(new Date(d.data_limite), "dd/MM/yyyy")}</span>}
                    <span className="font-mono truncate max-w-[240px]" title={d.arquivo_hash}>SHA-256: {d.arquivo_hash.slice(0, 12)}…</span>
                  </div>

                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progresso}%` }} />
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDocAssinar(d)}>Ver signatários</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AssinarDialog doc={docAssinar} onClose={() => setDocAssinar(null)} onDone={() => qc.invalidateQueries({ queryKey: ["assinaturas_docs"] })} />
    </div>
  );
}

function NovoDocDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ titulo: "", descricao: "", categoria: "contrato", arquivo_url: "", data_limite: "" });
  const [signatarios, setSignatarios] = useState<string[]>([]);

  const { data: usuarios = [] } = useQuery({
    queryKey: ["profiles_min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, nome").order("nome");
      if (error) throw error;
      return data as { id: string; nome: string }[];
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      const hash = await sha256(`${f.arquivo_url}|${f.titulo}|${Date.now()}`);
      const { data: doc, error } = await supabase.from("documentos_assinatura").insert({
        titulo: f.titulo, descricao: f.descricao, categoria: f.categoria,
        arquivo_url: f.arquivo_url, arquivo_hash: hash, criado_por: user!.id,
        data_limite: f.data_limite || null,
      }).select("id").single();
      if (error) throw error;
      if (signatarios.length > 0) {
        const { error: e2 } = await supabase.from("documentos_assinaturas").insert(
          signatarios.map((uid, i) => ({ documento_id: doc.id, user_id: uid, ordem: i + 1, papel: "signatario" }))
        );
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      toast.success("Documento criado e enviado para assinatura.");
      qc.invalidateQueries({ queryKey: ["assinaturas_docs"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Novo documento</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div><Label>Título</Label><Input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></div>
        <div><Label>Descrição</Label><Textarea rows={2} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Categoria</Label>
            <Select value={f.categoria} onValueChange={(v) => setF({ ...f, categoria: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Prazo</Label><Input type="date" value={f.data_limite} onChange={(e) => setF({ ...f, data_limite: e.target.value })} /></div>
        </div>
        <div><Label>URL do arquivo (PDF)</Label><Input value={f.arquivo_url} onChange={(e) => setF({ ...f, arquivo_url: e.target.value })} placeholder="https://..." /></div>

        <div>
          <Label>Signatários</Label>
          <div className="border rounded-md max-h-52 overflow-y-auto p-2 space-y-1">
            {usuarios.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                <Checkbox
                  checked={signatarios.includes(u.id)}
                  onCheckedChange={(c) => setSignatarios((prev) => c ? [...prev, u.id] : prev.filter((x) => x !== u.id))}
                />
                {u.nome}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{signatarios.length} selecionado(s)</p>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={criar.isPending || !f.titulo || !f.arquivo_url || signatarios.length === 0}
          onClick={() => criar.mutate()}
        >
          Criar e enviar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function AssinarDialog({ doc, onClose, onDone }: { doc: Documento | null; onClose: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [aceite, setAceite] = useState(false);

  const { data: assinaturas = [], refetch } = useQuery({
    queryKey: ["assinaturas_doc", doc?.id],
    enabled: !!doc,
    queryFn: async () => {
      const { data, error } = await supabase.from("documentos_assinaturas").select("*").eq("documento_id", doc!.id).order("ordem");
      if (error) throw error;
      return (data as Assinatura[]) || [];
    },
  });

  const { data: perfis = {} } = useQuery({
    queryKey: ["assinaturas_perfis", assinaturas.map((a) => a.user_id).join(",")],
    enabled: assinaturas.length > 0,
    queryFn: async () => {
      const ids = Array.from(new Set(assinaturas.map((a) => a.user_id)));
      const { data } = await supabase.from("profiles").select("id, nome").in("id", ids);
      return Object.fromEntries((data ?? []).map((p) => [p.id, p.nome])) as Record<string, string>;
    },
  });

  const minhaAssinatura = assinaturas.find((a) => a.user_id === user?.id);

  const assinar = useMutation({
    mutationFn: async () => {
      const carimbo = `${user!.id}|${doc!.id}|${new Date().toISOString()}`;
      const assinaturaHash = await sha256(carimbo);
      const arquivoHashAssinado = await sha256(`${doc!.arquivo_hash}|${assinaturaHash}`);
      const ua = navigator.userAgent;
      const { error } = await supabase.from("documentos_assinaturas").update({
        status: "assinado",
        assinatura_hash: assinaturaHash,
        arquivo_hash_assinado: arquivoHashAssinado,
        user_agent: ua,
        assinado_em: new Date().toISOString(),
      }).eq("id", minhaAssinatura!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento assinado com sucesso.");
      refetch(); onDone(); onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const recusar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("documentos_assinaturas").update({
        status: "recusado", motivo_recusa: motivoRecusa,
      }).eq("id", minhaAssinatura!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recusa registrada.");
      refetch(); onDone(); onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!doc) return null;
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{doc.titulo}</DialogTitle></DialogHeader>

        <div className="space-y-2">
          <div className="text-xs bg-muted/40 rounded-md p-2">
            <div className="flex items-center gap-1 mb-1"><ShieldCheck className="h-3 w-3 text-primary" /> Hash do documento (SHA-256)</div>
            <div className="font-mono break-all">{doc.arquivo_hash}</div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Signatários</Label>
            {assinaturas.map((a) => (
              <div key={a.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{perfis[a.user_id] ?? a.user_id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground capitalize">{a.papel} • ordem {a.ordem}</div>
                </div>
                <div className="text-right">
                  <Badge variant={a.status === "assinado" ? "default" : a.status === "recusado" ? "destructive" : "outline"}>
                    {a.status}
                  </Badge>
                  {a.assinado_em && <div className="text-[10px] text-muted-foreground mt-1">{format(new Date(a.assinado_em), "dd/MM HH:mm")}</div>}
                </div>
              </div>
            ))}
          </div>

          {minhaAssinatura && minhaAssinatura.status === "pendente" && (
            <div className="border rounded-md p-3 space-y-3 bg-primary/5">
              <p className="text-sm">
                Ao assinar, você declara ter lido e concordado com o conteúdo do documento. A assinatura eletrônica gera um
                hash SHA-256 combinando sua identidade, o documento e o momento, e é registrada de forma imutável.
              </p>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <Checkbox checked={aceite} onCheckedChange={(c) => setAceite(c === true)} />
                <span>Li, entendi e aceito os termos deste documento.</span>
              </label>
              <div className="flex gap-2">
                <Button disabled={!aceite || assinar.isPending} onClick={() => assinar.mutate()}>
                  <ShieldCheck className="h-4 w-4 mr-1" /> Assinar
                </Button>
              </div>
              <div className="pt-2 border-t space-y-2">
                <Label className="text-xs">Recusar (opcional)</Label>
                <Textarea rows={2} placeholder="Motivo da recusa" value={motivoRecusa} onChange={(e) => setMotivoRecusa(e.target.value)} />
                <Button variant="destructive" size="sm" disabled={!motivoRecusa || recusar.isPending} onClick={() => recusar.mutate()}>
                  Recusar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
