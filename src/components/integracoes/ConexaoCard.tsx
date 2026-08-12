import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Zap, Trash2, Play, Pencil } from "lucide-react";

interface Integracao {
  id: string;
  nome: string;
  tipo: string;
  endpoint: string;
  ativo: boolean;
  descricao?: string | null;
}

interface Props {
  integracao: Integracao;
  onToggle: (id: string, ativo: boolean) => void;
  onTest: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  testing?: boolean;
}

export function ConexaoCard({ integracao, onToggle, onTest, onEdit, onDelete, testing }: Props) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-primary shrink-0" />
            <CardTitle className="text-base truncate">{integracao.nome}</CardTitle>
          </div>
          <Switch checked={integracao.ativo} onCheckedChange={(v) => onToggle(integracao.id, v)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{integracao.tipo}</Badge>
          <Badge variant={integracao.ativo ? "default" : "secondary"}>
            {integracao.ativo ? "Ativa" : "Inativa"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {integracao.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2">{integracao.descricao}</p>
        )}
        <p className="text-xs font-mono bg-muted rounded px-2 py-1 truncate">{integracao.endpoint}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onTest(integracao.id)} disabled={testing} className="flex-1 gap-1">
            <Play className="w-3 h-3" /> Testar
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(integracao.id)}>
            <Pencil className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(integracao.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
