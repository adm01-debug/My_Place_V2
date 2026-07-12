import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Eye } from "lucide-react";
import { RetryBadge } from "./RetryBadge";

interface Props {
  evento: {
    id: string;
    evento_tipo: string;
    status: string;
    tentativas: number;
    max_tentativas: number;
    proxima_tentativa: string;
    created_at: string;
    ultimo_erro: string | null;
    integracoes?: { nome: string } | null;
  };
  onReenviar: (id: string) => void;
  onVer: (id: string) => void;
}

export function EventoRow({ evento, onReenviar, onVer }: Props) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{evento.id.slice(0, 8)}…</TableCell>
      <TableCell className="text-sm">{evento.integracoes?.nome ?? "—"}</TableCell>
      <TableCell className="text-sm">{evento.evento_tipo}</TableCell>
      <TableCell><RetryBadge status={evento.status} /></TableCell>
      <TableCell className="text-xs">{evento.tentativas}/{evento.max_tentativas}</TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(evento.created_at).toLocaleString("pt-BR")}
      </TableCell>
      <TableCell className="text-xs text-destructive max-w-[200px] truncate">
        {evento.ultimo_erro ?? "—"}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => onVer(evento.id)}>
            <Eye className="w-3 h-3" />
          </Button>
          {(evento.status === "falhou" || evento.status === "pendente") && (
            <Button size="sm" variant="ghost" onClick={() => onReenviar(evento.id)}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
