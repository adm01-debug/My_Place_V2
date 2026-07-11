import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Trophy, Heart, Users, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORIAS = [
  { value: "colaboracao", label: "Colaboração", icone: "🤝", cor: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "inovacao", label: "Inovação", icone: "💡", cor: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  { value: "excelencia", label: "Excelência", icone: "🏆", cor: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { value: "lideranca", label: "Liderança", icone: "🚀", cor: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { value: "proatividade", label: "Proatividade", icone: "⚡", cor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { value: "gratidao", label: "Gratidão", icone: "💖", cor: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
] as const;

type CategoriaKudos = typeof CATEGORIAS[number]["value"];

interface KudosRow {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  categoria: CategoriaKudos;
  mensagem: string;
  icone: string;
  created_at: string;
  remetente: { nome: string | null } | null;
  destinatario: { nome: string | null } | null;
}

interface ProfileLite { id: string; nome: string | null }

const iniciais = (nome?: string | null) =>
  (nome ?? "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();

export default function Kudos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [destinatario, setDestinatario] = useState<string>("");
  const [categoria, setCategoria] = useState<CategoriaKudos>("gratidao");
  const [mensagem, setMensagem] = useState("");

  const { data: kudos = [], isLoading } = useQuery({
    queryKey: ["kudos-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kudos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const rows = (data ?? []) as Array<Omit<KudosRow, "remetente" | "destinatario">>;
      const ids = Array.from(new Set(rows.flatMap(r => [r.remetente_id, r.destinatario_id])));
      if (ids.length === 0) return [] as KudosRow[];
      const { data: profs } = await supabase.from("profiles").select("id, nome").in("id", ids);
      const map = new Map((profs ?? []).map(p => [p.id, p.nome as string | null]));
      return rows.map(r => ({
        ...r,
        remetente: { nome: map.get(r.remetente_id) ?? null },
        destinatario: { nome: map.get(r.destinatario_id) ?? null },
      })) as KudosRow[];
    },
  });

  const { data: colegas = [] } = useQuery({
    queryKey: ["kudos-colegas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome")
        .neq("id", user!.id)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as ProfileLite[];
    },
    enabled: !!user?.id,
  });

  const ranking = useMemo(() => {
    const map = new Map<string, { nome: string; total: number }>();
    kudos.forEach(k => {
      const nome = k.destinatario?.nome ?? "Colaborador";
      const cur = map.get(k.destinatario_id);
      map.set(k.destinatario_id, { nome, total: (cur?.total ?? 0) + 1 });
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [kudos]);

  const enviar = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sem sessão");
      if (!destinatario) throw new Error("Escolha um colega");
      if (mensagem.trim().length < 3) throw new Error("Mensagem muito curta");
      const cat = CATEGORIAS.find(c => c.value === categoria)!;
      const { error } = await supabase.from("kudos").insert({
        remetente_id: user.id,
        destinatario_id: destinatario,
        categoria,
        mensagem: mensagem.trim(),
        icone: cat.icone,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kudos enviado! 🎉");
      setOpen(false);
      setMensagem("");
      setDestinatario("");
      qc.invalidateQueries({ queryKey: ["kudos-feed"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kudos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kudos removido");
      qc.invalidateQueries({ queryKey: ["kudos-feed"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const meusEnviados = kudos.filter(k => k.remetente_id === user?.id);
  const meusRecebidos = kudos.filter(k => k.destinatario_id === user?.id);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            Mural de Kudos
          </h1>
          <p className="text-muted-foreground">Reconheça publicamente colegas que fizeram a diferença.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2"><Send className="h-4 w-4" /> Enviar Kudos</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Reconhecer um colega</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Para</label>
                <Select value={destinatario} onValueChange={setDestinatario}>
                  <SelectTrigger><SelectValue placeholder="Selecione um colega" /></SelectTrigger>
                  <SelectContent>
                    {colegas.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome ?? "Colaborador"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIAS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategoria(c.value)}
                      className={`p-3 rounded-lg border text-sm transition ${categoria === c.value ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`}
                    >
                      <div className="text-2xl">{c.icone}</div>
                      <div className="text-xs mt-1">{c.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mensagem</label>
                <Textarea
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  placeholder="Descreva o que essa pessoa fez de incrível..."
                  maxLength={500}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">{mensagem.length}/500</p>
              </div>
              <Button onClick={() => enviar.mutate()} disabled={enviar.isPending} className="w-full">
                {enviar.isPending ? "Enviando..." : "Publicar reconhecimento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Heart className="h-8 w-8 text-pink-500" />
          <div><p className="text-2xl font-bold">{kudos.length}</p><p className="text-xs text-muted-foreground">Reconhecimentos totais</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-500" />
          <div><p className="text-2xl font-bold">{new Set(kudos.map(k => k.destinatario_id)).size}</p><p className="text-xs text-muted-foreground">Colaboradores reconhecidos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Send className="h-8 w-8 text-emerald-500" />
          <div><p className="text-2xl font-bold">{meusEnviados.length}</p><p className="text-xs text-muted-foreground">Enviados por mim</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <div><p className="text-2xl font-bold">{meusRecebidos.length}</p><p className="text-xs text-muted-foreground">Recebidos por mim</p></div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="mural">
            <TabsList>
              <TabsTrigger value="mural">Mural</TabsTrigger>
              <TabsTrigger value="recebidos">Meus Recebidos</TabsTrigger>
              <TabsTrigger value="enviados">Meus Enviados</TabsTrigger>
            </TabsList>
            {(["mural", "recebidos", "enviados"] as const).map(tab => {
              const lista = tab === "mural" ? kudos : tab === "recebidos" ? meusRecebidos : meusEnviados;
              return (
                <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)
                  ) : lista.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-muted-foreground">
                      Nenhum kudos por aqui ainda. Seja o primeiro! ✨
                    </CardContent></Card>
                  ) : lista.map(k => {
                    const cat = CATEGORIAS.find(c => c.value === k.categoria)!;
                    return (
                      <Card key={k.id} className="hover:shadow-md transition">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar><AvatarFallback>{iniciais(k.remetente?.nome)}</AvatarFallback></Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-semibold">{k.remetente?.nome ?? "Colaborador"}</span>
                                <span className="text-muted-foreground text-sm">→</span>
                                <span className="font-semibold text-primary">{k.destinatario?.nome ?? "Colaborador"}</span>
                                <Badge variant="outline" className={cat.cor}>{cat.icone} {cat.label}</Badge>
                              </div>
                              <p className="text-sm">{k.mensagem}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDistanceToNow(new Date(k.created_at), { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                            {k.remetente_id === user?.id && (
                              <Button size="icon" variant="ghost" onClick={() => excluir.mutate(k.id)} aria-label="Excluir">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /> Top Reconhecidos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : ranking.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? "bg-yellow-500 text-white" : i === 1 ? "bg-gray-300 text-gray-800" : i === 2 ? "bg-orange-500 text-white" : "bg-muted"}`}>
                  {i + 1}
                </div>
                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{iniciais(r.nome)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.nome}</p>
                </div>
                <Badge variant="secondary">{r.total}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
