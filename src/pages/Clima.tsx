import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Smile, TrendingUp, Users, Heart, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Enquete = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: "enps" | "pulse" | "custom";
  anonima: boolean;
  data_fim: string | null;
};

type Resultado = {
  enquete_id: string;
  titulo: string;
  tipo: string;
  total_respostas: number;
  media_score: number | null;
  promotores: number;
  neutros: number;
  detratores: number;
  enps_score: number;
};

const PULSE_EMOJIS = [
  { v: 1, e: "😞", l: "Muito ruim" },
  { v: 2, e: "😕", l: "Ruim" },
  { v: 3, e: "😐", l: "Neutro" },
  { v: 4, e: "🙂", l: "Bom" },
  { v: 5, e: "😄", l: "Excelente" },
];

export default function Clima() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: enquetes, isLoading } = useQuery({
    queryKey: ["clima-enquetes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clima_enquetes")
        .select("*")
        .eq("ativa", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Enquete[];
    },
  });

  const { data: minhasRespostas } = useQuery({
    queryKey: ["clima-minhas-respostas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clima_respostas")
        .select("enquete_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.enquete_id));
    },
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="w-7 h-7 text-primary" /> Clima Organizacional
        </h1>
        <p className="text-muted-foreground">
          Sua opinião molda nosso ambiente. Respostas anônimas quando indicado.
        </p>
      </header>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      )}

      {!isLoading && enquetes?.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Smile className="w-12 h-12 mx-auto mb-3 opacity-50" />
            Nenhuma enquete ativa no momento.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {enquetes?.map((e) => (
          <EnqueteCard
            key={e.id}
            enquete={e}
            respondida={minhasRespostas?.has(e.id) ?? false}
            onSubmitted={() => {
              qc.invalidateQueries({ queryKey: ["clima-minhas-respostas"] });
              qc.invalidateQueries({ queryKey: ["clima-resultado", e.id] });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function EnqueteCard({
  enquete,
  respondida,
  onSubmitted,
}: {
  enquete: Enquete;
  respondida: boolean;
  onSubmitted: () => void;
}) {
  const { user } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (score === null) throw new Error("Selecione uma nota");
      const { error } = await supabase.from("clima_respostas").insert({
        enquete_id: enquete.id,
        user_id: user!.id,
        score,
        comentario: comentario.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resposta registrada. Obrigado! 💚");
      setScore(null);
      setComentario("");
      onSubmitted();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: resultado } = useQuery({
    queryKey: ["clima-resultado", enquete.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_clima_resultados", {
        p_enquete_id: enquete.id,
      });
      if (error) throw error;
      return (data?.[0] as Resultado | undefined) ?? null;
    },
    enabled: respondida,
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              {enquete.titulo}
              {enquete.anonima && (
                <Badge variant="secondary" className="text-xs">Anônima</Badge>
              )}
            </CardTitle>
            {enquete.descricao && (
              <CardDescription className="mt-1">{enquete.descricao}</CardDescription>
            )}
          </div>
          <Badge variant={enquete.tipo === "enps" ? "default" : "outline"}>
            {enquete.tipo === "enps" ? "eNPS" : enquete.tipo === "pulse" ? "Pulse" : "Custom"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {respondida ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="w-4 h-4" /> Você já respondeu esta enquete.
            </div>
            {resultado && resultado.total_respostas >= 3 && (
              <ResultadoAgg r={resultado} />
            )}
            {resultado && resultado.total_respostas < 3 && (
              <p className="text-xs text-muted-foreground">
                Resultados serão exibidos com no mínimo 3 respostas (anonimato).
              </p>
            )}
          </div>
        ) : enquete.tipo === "enps" ? (
          <ENPSScale value={score} onChange={setScore} />
        ) : (
          <PulseScale value={score} onChange={setScore} />
        )}

        {!respondida && (
          <>
            <Textarea
              placeholder="Comentário (opcional)"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={score === null || submitMutation.isPending}
              className="w-full"
            >
              {submitMutation.isPending ? "Enviando..." : "Enviar resposta"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ENPSScale({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="text-sm mb-2">
        De 0 a 10, quanto você recomendaria a empresa como um lugar para trabalhar?
      </p>
      <div className="grid grid-cols-11 gap-1">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "aspect-square rounded-md border text-sm font-medium transition-colors",
              value === n
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border",
              n <= 6 && value === n && "bg-destructive border-destructive",
              n >= 9 && value === n && "bg-emerald-600 border-emerald-600 text-white"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Nada provável</span>
        <span>Muito provável</span>
      </div>
    </div>
  );
}

function PulseScale({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="text-sm mb-2">Como você está se sentindo esta semana?</p>
      <div className="grid grid-cols-5 gap-2">
        {PULSE_EMOJIS.map((p) => (
          <button
            key={p.v}
            type="button"
            onClick={() => onChange(p.v)}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all",
              value === p.v
                ? "bg-primary/10 border-primary scale-105"
                : "hover:bg-muted border-border"
            )}
          >
            <span className="text-3xl">{p.e}</span>
            <span className="text-xs text-muted-foreground">{p.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultadoAgg({ r }: { r: Resultado }) {
  const isENPS = r.tipo === "enps";
  return (
    <div className="rounded-lg bg-muted/40 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <TrendingUp className="w-4 h-4" /> Resultado agregado
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <Metric icon={<Users className="w-4 h-4" />} label="Respostas" value={r.total_respostas} />
        {isENPS ? (
          <>
            <Metric label="Promotores" value={r.promotores} tone="success" />
            <Metric label="Neutros" value={r.neutros} />
            <Metric label="Detratores" value={r.detratores} tone="danger" />
          </>
        ) : (
          <Metric label="Média" value={r.media_score?.toFixed(1) ?? "-"} tone="success" />
        )}
      </div>
      {isENPS && (
        <div className="text-center pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">Score eNPS</div>
          <div
            className={cn(
              "text-3xl font-bold",
              r.enps_score >= 50 ? "text-emerald-600" :
              r.enps_score >= 0 ? "text-amber-600" : "text-destructive"
            )}
          >
            {r.enps_score > 0 ? "+" : ""}{r.enps_score}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon?: React.ReactNode;
  label: string;
  value: number | string;
  tone?: "success" | "danger";
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
        {icon}{label}
      </div>
      <div
        className={cn(
          "text-xl font-semibold",
          tone === "success" && "text-emerald-600",
          tone === "danger" && "text-destructive"
        )}
      >
        {value}
      </div>
    </div>
  );
}
