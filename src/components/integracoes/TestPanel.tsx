import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface TestResult {
  ok?: boolean;
  status?: number;
  duracao_ms?: number;
  response_headers?: Record<string, string>;
  response_body?: string;
  error?: string;
}

interface Props {
  result: TestResult | null;
  onClose: () => void;
}

export function TestPanel({ result, onClose }: Props) {
  return (
    <Dialog open={!!result} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Resultado do teste</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-3">
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={result.ok ? "default" : "destructive"}>
                  {result.ok ? "Sucesso" : "Falha"}
                </Badge>
                {result.status && <Badge variant="outline">HTTP {result.status}</Badge>}
                {result.duracao_ms != null && (
                  <span className="text-xs text-muted-foreground">{result.duracao_ms}ms</span>
                )}
              </div>
              {result.error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{result.error}</div>
              )}
              {result.response_body && (
                <div>
                  <p className="text-xs font-medium mb-1">Response body</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">{result.response_body}</pre>
                </div>
              )}
              {result.response_headers && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Response headers</summary>
                  <pre className="mt-1 bg-muted p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(result.response_headers, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
