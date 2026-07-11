import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/portal/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, Search, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditRow {
  id: string;
  table_name: string;
  record_id: string | null;
  operation: "INSERT" | "UPDATE" | "DELETE";
  old_data: unknown;
  new_data: unknown;
  changed_by: string | null;
  changed_at: string;
  ip_address: string | null;
}

const opColor: Record<AuditRow["operation"], string> = {
  INSERT: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  UPDATE: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  DELETE: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

export default function AdminAuditoria() {
  const [busca, setBusca] = useState("");
  const [tabela, setTabela] = useState<string>("todas");
  const [operacao, setOperacao] = useState<string>("todas");
  const [detalhe, setDetalhe] = useState<AuditRow | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit_log", tabela, operacao],
    queryFn: async () => {
      let q = supabase
        .from("audit_log")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(500);
      if (tabela !== "todas") q = q.eq("table_name", tabela);
      if (operacao !== "todas") q = q.eq("operation", operacao);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });

  const tabelas = useMemo(() => {
    const s = new Set<string>();
    logs?.forEach((l) => s.add(l.table_name));
    return Array.from(s).sort();
  }, [logs]);

  const filtrados = useMemo(() => {
    if (!logs) return [];
    const t = busca.trim().toLowerCase();
    if (!t) return logs;
    return logs.filter(
      (l) =>
        l.table_name.toLowerCase().includes(t) ||
        (l.record_id ?? "").toLowerCase().includes(t) ||
        (l.changed_by ?? "").toLowerCase().includes(t),
    );
  }, [logs, busca]);

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={ShieldCheck}
        title="Trilha de Auditoria"
        description="Registro imutável de todas as alterações críticas do sistema."
      />

      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por tabela, registro ou usuário..."
            className="pl-10"
            aria-label="Buscar auditoria"
          />
        </div>
        <Select value={tabela} onValueChange={setTabela}>
          <SelectTrigger className="md:w-48" aria-label="Filtrar por tabela">
            <SelectValue placeholder="Tabela" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as tabelas</SelectItem>
            {tabelas.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={operacao} onValueChange={setOperacao}>
          <SelectTrigger className="md:w-40" aria-label="Filtrar por operação">
            <SelectValue placeholder="Operação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="INSERT">INSERT</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhum registro encontrado"
          description="Ajuste os filtros ou aguarde novas atividades."
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Data</th>
                  <th className="text-left px-4 py-3 font-medium">Op.</th>
                  <th className="text-left px-4 py-3 font-medium">Tabela</th>
                  <th className="text-left px-4 py-3 font-medium">Registro</th>
                  <th className="text-left px-4 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((l) => (
                  <tr key={l.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {format(new Date(l.changed_at), "dd/MM/yyyy HH:mm:ss", {
                        locale: ptBR,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={opColor[l.operation]}>
                        {l.operation}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{l.table_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[180px] truncate">
                      {l.record_id ?? "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[180px] truncate">
                      {l.changed_by ?? "sistema"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setDetalhe(l)}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        aria-label="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detalhe && (
                <Badge variant="outline" className={opColor[detalhe.operation]}>
                  {detalhe.operation}
                </Badge>
              )}
              <span className="font-mono text-sm">{detalhe?.table_name}</span>
            </DialogTitle>
          </DialogHeader>
          {detalhe && (
            <div className="grid gap-4 md:grid-cols-2 text-xs">
              <div>
                <div className="mb-1 font-semibold text-muted-foreground">Antes</div>
                <pre className="rounded-md bg-muted p-3 overflow-auto max-h-80">
                  {JSON.stringify(detalhe.old_data ?? {}, null, 2)}
                </pre>
              </div>
              <div>
                <div className="mb-1 font-semibold text-muted-foreground">Depois</div>
                <pre className="rounded-md bg-muted p-3 overflow-auto max-h-80">
                  {JSON.stringify(detalhe.new_data ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
