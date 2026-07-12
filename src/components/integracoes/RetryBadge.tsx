import { Badge } from "@/components/ui/badge";

const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  processando: { label: "Processando", variant: "outline" },
  enviado: { label: "Enviado", variant: "default" },
  falhou: { label: "Falhou", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "outline" },
};

export function RetryBadge({ status }: { status: string }) {
  const c = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}
