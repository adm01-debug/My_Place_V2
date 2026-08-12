import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  eventoId: string | null;
  onClose: () => void;
}

export function LogViewer({ eventoId, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["integracoes_logs", eventoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integracoes_logs")
        .select("*")
        .eq("evento_id", eventoId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!eventoId,
  });

  return (
    <Dialog open={!!eventoId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Logs do evento</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-3">
          {isLoading ? <Skeleton className="h-64" /> : (
            <div className="space-y-3">
              {(data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum log ainda.</p>
              )}
              {(data ?? []).map((log) => (
                <div key={log.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant={log.response_status && log.response_status >= 200 && log.response_status < 300 ? "default" : "destructive"}>
                      {log.response_status ?? "ERR"}
                    </Badge>
                    <span className="text-muted-foreground">Tentativa #{log.tentativa}</span>
                    <span className="text-muted-foreground">• {log.duracao_ms}ms</span>
                    <span className="text-muted-foreground ml-auto">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {log.erro && (
                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">{log.erro}</div>
                  )}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Request body</summary>
                    <pre className="mt-1 bg-muted p-2 rounded overflow-auto max-h-40">{log.request_body ?? "—"}</pre>
                  </details>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Response body</summary>
                    <pre className="mt-1 bg-muted p-2 rounded overflow-auto max-h-40">{log.response_body ?? "—"}</pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
