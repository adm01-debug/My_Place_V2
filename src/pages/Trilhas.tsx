import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/portal/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  PlayCircle,
  FileText,
  HelpCircle,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";

interface Trilha {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  nivel: "iniciante" | "intermediario" | "avancado";
  duracao_estimada_min: number | null;
  imagem_url: string | null;
}
interface Etapa {
  id: string;
  trilha_id: string;
  titulo: string;
  descricao: string | null;
  tipo: "video" | "artigo" | "quiz" | "tarefa";
  conteudo_url: string | null;
  duracao_min: number | null;
  ordem: number;
  obrigatoria: boolean;
}

const tipoIcon = {
  video: PlayCircle,
  artigo: FileText,
  quiz: HelpCircle,
  tarefa: CheckCircle2,
};

const nivelColor: Record<Trilha["nivel"], string> = {
  iniciante: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  intermediario: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  avancado: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

export default function Trilhas() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [aberta, setAberta] = useState<Trilha | null>(null);

  const { data: trilhas, isLoading } = useQuery({
    queryKey: ["trilhas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trilhas_desenvolvimento")
        .select("*")
        .eq("ativo", true)
        .order("titulo");
      if (error) throw error;
      return (data ?? []) as Trilha[];
    },
  });

  const { data: etapas } = useQuery({
    queryKey: ["trilhas_etapas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trilhas_etapas")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as Etapa[];
    },
  });

  const { data: concluidas } = useQuery({
    queryKey: ["trilhas_concluidas", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trilhas_etapas_concluidas")
        .select("etapa_id, trilha_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as { etapa_id: string; trilha_id: string }[];
    },
  });

  const concluir = useMutation({
    mutationFn: async ({ etapa_id, trilha_id }: { etapa_id: string; trilha_id: string }) => {
      const { error } = await supabase
        .from("trilhas_etapas_concluidas")
        .insert({ etapa_id, trilha_id, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trilhas_concluidas"] });
      toast({ title: "Etapa concluída ✅", description: "Continue aprendendo!" });
    },
    onError: (e: unknown) =>
      toast({ title: "Erro", description: getErrorMessage(e), variant: "destructive" }),
  });

  const desmarcar = useMutation({
    mutationFn: async (etapa_id: string) => {
      const { error } = await supabase
        .from("trilhas_etapas_concluidas")
        .delete()
        .eq("etapa_id", etapa_id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trilhas_concluidas"] }),
  });

  const progressoPorTrilha = useMemo(() => {
    const map = new Map<string, { total: number; feitas: number }>();
    etapas?.forEach((e) => {
      const cur = map.get(e.trilha_id) ?? { total: 0, feitas: 0 };
      cur.total += 1;
      map.set(e.trilha_id, cur);
    });
    concluidas?.forEach((c) => {
      const cur = map.get(c.trilha_id);
      if (cur) cur.feitas += 1;
    });
    return map;
  }, [etapas, concluidas]);

  const etapasDaAberta = useMemo(
    () => (aberta ? etapas?.filter((e) => e.trilha_id === aberta.id) ?? [] : []),
    [aberta, etapas],
  );
  const setConcluidas = useMemo(
    () => new Set(concluidas?.map((c) => c.etapa_id) ?? []),
    [concluidas],
  );

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={GraduationCap}
        title="Trilhas de Desenvolvimento"
        description="Aprenda no seu ritmo e evolua na carreira com trilhas curadas."
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))}
        </div>
      ) : !trilhas || trilhas.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Nenhuma trilha disponível"
          description="Novas trilhas serão publicadas em breve."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trilhas.map((t) => {
            const p = progressoPorTrilha.get(t.id) ?? { total: 0, feitas: 0 };
            const pct = p.total ? Math.round((p.feitas / p.total) * 100) : 0;
            return (
              <Card
                key={t.id}
                className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => setAberta(t)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {t.titulo}
                    </CardTitle>
                    <Badge variant="outline" className={nivelColor[t.nivel]}>
                      {t.nivel}
                    </Badge>
                  </div>
                  {t.categoria && (
                    <Badge variant="secondary" className="w-fit">
                      {t.categoria}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {t.descricao}
                  </p>
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t.duracao_estimada_min ?? 0} min
                      </span>
                      <span>
                        {p.feitas}/{p.total} etapas
                      </span>
                    </div>
                    <Progress value={pct} aria-label={`Progresso ${pct}%`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!aberta} onOpenChange={(o) => !o && setAberta(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              {aberta?.titulo}
            </DialogTitle>
            {aberta?.descricao && (
              <DialogDescription>{aberta.descricao}</DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {etapasDaAberta.map((e) => {
              const Icon = tipoIcon[e.tipo];
              const feita = setConcluidas.has(e.id);
              return (
                <div
                  key={e.id}
                  className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() =>
                      feita
                        ? desmarcar.mutate(e.id)
                        : concluir.mutate({ etapa_id: e.id, trilha_id: e.trilha_id })
                    }
                    aria-label={feita ? "Desmarcar etapa" : "Concluir etapa"}
                    className="mt-0.5"
                  >
                    {feita ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon className="h-4 w-4 text-primary" />
                      <span
                        className={`font-medium ${feita ? "line-through text-muted-foreground" : ""}`}
                      >
                        {e.ordem}. {e.titulo}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {e.tipo}
                      </Badge>
                      {e.obrigatoria && (
                        <Badge variant="secondary" className="text-xs">
                          Obrigatória
                        </Badge>
                      )}
                    </div>
                    {e.descricao && (
                      <p className="text-xs text-muted-foreground mt-1">{e.descricao}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {e.duracao_min ?? 0} min
                      </span>
                      {e.conteudo_url && (
                        <a
                          href={e.conteudo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Acessar conteúdo <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {etapasDaAberta.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma etapa cadastrada.
              </p>
            )}
          </div>
          {aberta && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                Progresso:{" "}
                {(() => {
                  const p = progressoPorTrilha.get(aberta.id) ?? { total: 0, feitas: 0 };
                  return `${p.feitas}/${p.total}`;
                })()}
              </span>
              <Button variant="outline" onClick={() => setAberta(null)}>
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
