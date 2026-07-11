import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, CalendarDays, Cake, Palmtree, PartyPopper, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type EventoCal = {
  data: string;
  titulo: string;
  tipo: "feriado" | "evento" | "aniversario" | "ferias";
  detalhe: string | null;
};

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["D","S","T","Q","Q","S","S"];

const TIPO_META: Record<EventoCal["tipo"], { color: string; icon: React.ReactNode; label: string }> = {
  feriado: { color: "bg-red-500/10 text-red-600 border-red-500/30", icon: <PartyPopper className="w-3 h-3" />, label: "Feriado" },
  evento: { color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: <GraduationCap className="w-3 h-3" />, label: "Evento" },
  aniversario: { color: "bg-pink-500/10 text-pink-600 border-pink-500/30", icon: <Cake className="w-3 h-3" />, label: "Aniversário" },
  ferias: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: <Palmtree className="w-3 h-3" />, label: "Férias" },
};

export default function Calendario() {
  const hoje = new Date();
  const [ref, setRef] = useState<{ ano: number; mes: number }>({
    ano: hoje.getFullYear(),
    mes: hoje.getMonth() + 1,
  });

  const { data: eventos, isLoading } = useQuery({
    queryKey: ["calendario", ref.ano, ref.mes],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_calendario_mes", {
        p_ano: ref.ano,
        p_mes: ref.mes,
      });
      if (error) throw error;
      return (data ?? []) as EventoCal[];
    },
  });

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, EventoCal[]>();
    (eventos ?? []).forEach((e) => {
      const key = e.data;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [eventos]);

  const dias = useMemo(() => {
    const primeiro = new Date(ref.ano, ref.mes - 1, 1);
    const ultimo = new Date(ref.ano, ref.mes, 0);
    const inicioSemana = primeiro.getDay();
    const totalDias = ultimo.getDate();
    const grid: (Date | null)[] = [];
    for (let i = 0; i < inicioSemana; i++) grid.push(null);
    for (let d = 1; d <= totalDias; d++) grid.push(new Date(ref.ano, ref.mes - 1, d));
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [ref]);

  const proximosEventos = useMemo(() => {
    return (eventos ?? [])
      .filter((e) => new Date(e.data + "T00:00:00") >= new Date(hoje.toDateString()))
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(0, 8);
  }, [eventos, hoje]);

  const mudarMes = (delta: number) => {
    setRef((r) => {
      let mes = r.mes + delta;
      let ano = r.ano;
      if (mes < 1) { mes = 12; ano--; }
      if (mes > 12) { mes = 1; ano++; }
      return { ano, mes };
    });
  };

  const keyDia = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-primary" /> Calendário Corporativo
          </h1>
          <p className="text-muted-foreground">Feriados, eventos, aniversariantes e férias em um só lugar.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => mudarMes(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="min-w-40 text-center font-medium">{MESES[ref.mes - 1]} {ref.ano}</div>
          <Button variant="outline" size="icon" onClick={() => mudarMes(1)}><ChevronRight className="w-4 h-4" /></Button>
          <Button variant="secondary" size="sm" onClick={() => setRef({ ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 })}>
            Hoje
          </Button>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DIAS_SEMANA.map((d, i) => (
                <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {isLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {dias.map((d, i) => {
                  if (!d) return <div key={i} className="aspect-square" />;
                  const key = keyDia(d);
                  const evs = eventosPorDia.get(key) ?? [];
                  const isHoje = key === keyDia(hoje);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "aspect-square rounded-md border border-border p-1 flex flex-col overflow-hidden text-[10px]",
                        isHoje && "ring-2 ring-primary"
                      )}
                    >
                      <div className={cn("text-xs font-medium mb-0.5", isHoje && "text-primary")}>{d.getDate()}</div>
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        {evs.slice(0, 2).map((e, idx) => (
                          <div
                            key={idx}
                            title={e.titulo}
                            className={cn("rounded px-1 py-0.5 border truncate", TIPO_META[e.tipo].color)}
                          >
                            {e.titulo}
                          </div>
                        ))}
                        {evs.length > 2 && <div className="text-muted-foreground">+{evs.length - 2}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && [1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            {!isLoading && proximosEventos.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum evento futuro neste mês.</p>
            )}
            {proximosEventos.map((e, i) => {
              const meta = TIPO_META[e.tipo];
              const d = new Date(e.data + "T00:00:00");
              return (
                <div key={i} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
                  <div className="text-center min-w-10">
                    <div className="text-xs text-muted-foreground uppercase">{MESES[d.getMonth()].slice(0,3)}</div>
                    <div className="text-lg font-bold">{d.getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{e.titulo}</div>
                    <Badge variant="outline" className={cn("text-xs mt-1 gap-1", meta.color)}>
                      {meta.icon}{meta.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TIPO_META) as EventoCal["tipo"][]).map((t) => (
          <Badge key={t} variant="outline" className={cn("gap-1", TIPO_META[t].color)}>
            {TIPO_META[t].icon}{TIPO_META[t].label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
