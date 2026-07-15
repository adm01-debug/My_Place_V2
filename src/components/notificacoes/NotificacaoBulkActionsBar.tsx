import { memo } from 'react';
import { CheckCheck, Clock, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotificacaoBulkActionsBarProps {
  totalVisiveis: number;
  totalSelecionadas: number;
  totalNaoLidas: number;
  todasSelecionadasVisiveis: boolean;
  onToggleSelecionarVisiveis: (checked: boolean) => void;
  onLimparSelecao: () => void;
  onMarcarSelecionadasLidas: () => void;
  onExcluirSelecionadas: () => void;
  onAdiarSelecionadas: (minutos: number) => void;
  onMarcarTodasLidas: () => void;
}

function NotificacaoBulkActionsBarImpl({
  totalVisiveis,
  totalSelecionadas,
  totalNaoLidas,
  todasSelecionadasVisiveis,
  onToggleSelecionarVisiveis,
  onLimparSelecao,
  onMarcarSelecionadasLidas,
  onExcluirSelecionadas,
  onAdiarSelecionadas,
  onMarcarTodasLidas,
}: NotificacaoBulkActionsBarProps) {
  if (totalNaoLidas === 0 && totalSelecionadas === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
      {totalVisiveis > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={todasSelecionadasVisiveis}
            onCheckedChange={(checked) => onToggleSelecionarVisiveis(Boolean(checked))}
            aria-label="Selecionar todas visíveis"
          />
          <span className="text-xs text-muted-foreground">
            {totalSelecionadas > 0
              ? `${totalSelecionadas} selecionada(s)`
              : 'Selecionar visíveis'}
          </span>
        </div>
      )}
      <div className="flex gap-2 ml-auto">
        {totalSelecionadas > 0 ? (
          <>
            <Button size="sm" variant="ghost" onClick={onMarcarSelecionadasLidas}>
              <CheckCheck className="w-4 h-4 mr-1" /> Marcar lidas
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Clock className="w-4 h-4 mr-1" /> Adiar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Adiar seleção por…</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAdiarSelecionadas(30)}>30 minutos</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdiarSelecionadas(60)}>1 hora</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdiarSelecionadas(60 * 4)}>4 horas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdiarSelecionadas(60 * 24)}>Amanhã</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdiarSelecionadas(60 * 24 * 7)}>Próxima semana</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={onExcluirSelecionadas}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Excluir
            </Button>
            <Button size="sm" variant="ghost" onClick={onLimparSelecao} aria-label="Limpar seleção">
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          totalNaoLidas > 0 && (
            <Button size="sm" variant="ghost" onClick={onMarcarTodasLidas}>
              <CheckCheck className="w-4 h-4 mr-1" /> Marcar todas como lidas
            </Button>
          )
        )}
      </div>
    </div>
  );
}

export const NotificacaoBulkActionsBar = memo(NotificacaoBulkActionsBarImpl);
