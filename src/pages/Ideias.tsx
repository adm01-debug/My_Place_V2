import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Lightbulb, ChevronUp, Plus, MessageCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Ideia = {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string;
  categoria: string | null;
  impacto: "baixo" | "medio" | "alto";
  status: "nova" | "em_analise" | "aprovada" | "implementada" | "recusada";
  status_observacao: string | null;
  created_at: string;
};

const STATUS_META: Record<Ideia["status"], { label: string; color: string }> = {
  nova: { label: "Nova", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  em_analise: { label: "Em análise", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  aprovada: { label: "Aprovada", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  implementada: { label: "Implementada", color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  recusada: { label: "Recusada", color: "bg-red-500/10 text-red-600 border-red-500/30" },
};

const IMPACTO_META: Record<Ideia["impacto"], string> = {
  baixo: "🌱 Baixo",
  medio: "⚡ Médio",
  alto: "🚀 Alto",
};

export default function Ideias() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [open, setOpen] = useState(false);
  const [novo, setNovo] = useState({ titulo: "", descricao: "", categoria: "", impacto: "medio" as Ideia["impacto"] });

  const { data: ideias, isLoading } = useQuery({
    queryKey: ["ideias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideias")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ideia[];
    },
  });

  const { data: votos } = useQuery({
    queryKey: ["ideias-votos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ideias_votos").select("ideia_id, user_id");
      if (error) throw error;
      return data as { ideia_id: string; user_id: string }[];
    },
  });

  const votosMap = useMemo(() => {
    const total = new Map<string, number>();
    const mine = new Set<string>();
    (votos ?? []).forEach((v) => {
      total.set(v.ideia_id, (total.get(v.ideia_id) ?? 0) + 1);
      if (v.user_id === user?.id) mine.add(v.ideia_id);
    });
    return { total, mine };
  }, [votos, user?.id]);

  const filtradas = useMemo(() => {
    const list = (ideias ?? []).filter((i) => filtroStatus === "todos" || i.status === filtroStatus);
    return list.sort((a, b) => (votosMap.total.get(b.id) ?? 0) - (votosMap.total.get(a.id) ?? 0));
  }, [ideias, filtroStatus, votosMap]);

  const criarMutation = useMutation({
    mutationFn: async () => {
      if (!novo.titulo.trim() || !novo.descricao.trim()) throw new Error("Preencha título e descrição");
      const { error } = await supabase.from("ideias").insert({
        user_id: user!.id,
        titulo: novo.titulo.trim(),
        descricao: novo.descricao.trim(),
        categoria: novo.categoria.trim() || null,
        impacto: novo.impacto,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ideia cadastrada! 💡");
      setOpen(false);
      setNovo({ titulo: "", descricao: "", categoria: "", impacto: "medio" });
      qc.invalidateQueries({ queryKey: ["ideias"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const votarMutation = useMutation({
    mutationFn: async ({ ideiaId, jaVotou }: { ideiaId: string; jaVotou: boolean }) => {
      if (jaVotou) {
        const { error } = await supabase.from("ideias_votos").delete()
          .eq("ideia_id", ideiaId).eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ideias_votos").insert({
          ideia_id: ideiaId, user_id: user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ideias-votos"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ideias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ideia removida");
      qc.invalidateQueries({ queryKey: ["ideias"] });
    },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-primary" /> Central de Ideias
          </h1>
          <p className="text-muted-foreground">Sugira melhorias, vote nas ideias e acompanhe o andamento.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Nova ideia</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Sugerir nova ideia</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Título"
                value={novo.titulo}
                onChange={(e) => setNovo({ ...novo, titulo: e.target.value })}
                maxLength={120}
              />
              <Textarea
                placeholder="Descreva sua ideia, o problema que resolve e o benefício esperado"
                value={novo.descricao}
                onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
                rows={5}
                maxLength={1000}
              />
              <Input
                placeholder="Categoria (opcional): Processos, TI, Bem-estar..."
                value={novo.categoria}
                onChange={(e) => setNovo({ ...novo, categoria: e.target.value })}
                maxLength={40}
              />
              <Select value={novo.impacto} onValueChange={(v: Ideia["impacto"]) => setNovo({ ...novo, impacto: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">🌱 Impacto baixo</SelectItem>
                  <SelectItem value="medio">⚡ Impacto médio</SelectItem>
                  <SelectItem value="alto">🚀 Impacto alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={() => criarMutation.mutate()} disabled={criarMutation.isPending}>
                {criarMutation.isPending ? "Enviando..." : "Publicar ideia"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex gap-2 flex-wrap">
        {(["todos", ...Object.keys(STATUS_META)] as string[]).map((s) => (
          <Badge
            key={s}
            variant={filtroStatus === s ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFiltroStatus(s)}
          >
            {s === "todos" ? "Todas" : STATUS_META[s as Ideia["status"]].label}
          </Badge>
        ))}
      </div>

      {isLoading && <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>}

      {!isLoading && filtradas.length === 0 && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          Seja o primeiro a compartilhar uma ideia.
        </CardContent></Card>
      )}

      <div className="space-y-3">
        {filtradas.map((i) => (
          <IdeiaCard
            key={i.id}
            ideia={i}
            votos={votosMap.total.get(i.id) ?? 0}
            jaVotou={votosMap.mine.has(i.id)}
            isDono={i.user_id === user?.id}
            onVote={() => votarMutation.mutate({ ideiaId: i.id, jaVotou: votosMap.mine.has(i.id) })}
            onDelete={() => excluirMutation.mutate(i.id)}
          />
        ))}
      </div>
    </div>
  );
}

function IdeiaCard({
  ideia, votos, jaVotou, isDono, onVote, onDelete,
}: {
  ideia: Ideia; votos: number; jaVotou: boolean; isDono: boolean;
  onVote: () => void; onDelete: () => void;
}) {
  const [showComents, setShowComents] = useState(false);
  const meta = STATUS_META[ideia.status];

  return (
    <Card>
      <CardContent className="p-4 flex gap-4">
        <button
          onClick={onVote}
          className={cn(
            "flex flex-col items-center justify-center gap-1 min-w-16 rounded-lg border transition-all",
            jaVotou ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted border-border"
          )}
        >
          <ChevronUp className="w-5 h-5" />
          <span className="text-lg font-bold">{votos}</span>
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">{ideia.titulo}</h3>
            <Badge variant="outline" className={cn("shrink-0", meta.color)}>{meta.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{ideia.descricao}</p>
          <div className="flex flex-wrap gap-2 items-center text-xs">
            <Badge variant="secondary">{IMPACTO_META[ideia.impacto]}</Badge>
            {ideia.categoria && <Badge variant="outline">{ideia.categoria}</Badge>}
            <span className="text-muted-foreground">
              {new Date(ideia.created_at).toLocaleDateString("pt-BR")}
            </span>
          </div>
          {ideia.status_observacao && (
            <div className="text-xs bg-muted/50 rounded p-2 italic">
              <strong>Retorno:</strong> {ideia.status_observacao}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowComents((v) => !v)}>
              <MessageCircle className="w-4 h-4 mr-1" /> Comentários
            </Button>
            {isDono && (
              <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          {showComents && <Comentarios ideiaId={ideia.id} />}
        </div>
      </CardContent>
    </Card>
  );
}

function Comentarios({ ideiaId }: { ideiaId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");

  const { data: comentarios } = useQuery({
    queryKey: ["ideia-comentarios", ideiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideias_comentarios")
        .select("id, user_id, comentario, created_at, profiles:user_id(nome)")
        .eq("ideia_id", ideiaId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      type CommentRow = {
        id: string;
        user_id: string;
        comentario: string;
        created_at: string;
        profiles: { nome: string | null } | null;
      };
      return (data ?? []) as unknown as CommentRow[];
    },
  });

  const enviar = useMutation({
    mutationFn: async () => {
      if (!texto.trim()) return;
      const { error } = await supabase.from("ideias_comentarios").insert({
        ideia_id: ideiaId, user_id: user!.id, comentario: texto.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTexto("");
      qc.invalidateQueries({ queryKey: ["ideia-comentarios", ideiaId] });
    },
  });

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      {comentarios?.map((c) => (
        <div key={c.id} className="text-xs bg-muted/30 rounded p-2">
          <div className="font-medium">{c.profiles?.nome ?? "Colaborador"}</div>
          <div>{c.comentario}</div>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          placeholder="Adicionar comentário..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar.mutate()}
          maxLength={300}
        />
        <Button size="sm" onClick={() => enviar.mutate()} disabled={enviar.isPending}>Enviar</Button>
      </div>
    </div>
  );
}
