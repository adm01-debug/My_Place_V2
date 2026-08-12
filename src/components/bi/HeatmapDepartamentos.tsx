import { cn } from "@/lib/utils";

interface HeatmapDepartamentosProps {
  data: Array<{ departamento: string; valor: number; label?: string }>;
  metricLabel: string;
  format?: (n: number) => string;
  invertScale?: boolean; // se true, valores altos são "ruins" (ex.: absenteísmo)
}

export function HeatmapDepartamentos({
  data,
  metricLabel,
  format = (n) => n.toFixed(1),
  invertScale = false,
}: HeatmapDepartamentosProps) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Sem dados para exibir.
      </div>
    );
  }

  const values = data.map((d) => d.valor);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{metricLabel}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {data.map((d) => {
          const ratio = (d.valor - min) / range;
          const intensity = invertScale ? ratio : 1 - ratio;
          const tone =
            intensity < 0.33
              ? "bg-destructive/15 border-destructive/30 text-destructive"
              : intensity < 0.66
              ? "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400"
              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400";

          return (
            <div
              key={d.departamento}
              className={cn(
                "rounded-lg border px-3 py-2 flex items-center justify-between gap-2 transition-colors",
                tone,
              )}
            >
              <span className="text-xs font-medium truncate">{d.departamento}</span>
              <span className="text-sm font-bold tabular-nums shrink-0">
                {format(d.valor)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
