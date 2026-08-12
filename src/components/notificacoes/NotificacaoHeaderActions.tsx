import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownWideNarrow,
  Download,
  FileSpreadsheet,
  FileText,
  Flame,
  Focus,
  Keyboard,
  Layers,
  Rows2,
  Rows3,
  Volume2,
  VolumeX,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotificacaoHeaderActionsProps {
  modoFoco: boolean;
  onToggleFoco: () => void;
  densidade: 'compact' | 'comfortable';
  onToggleDensidade: () => void;
  rulesAtivas: number;
  onOpenRules: () => void;
  alertasAtivos: boolean;
  onToggleAlertas: () => void;
  agruparSimilares: boolean;
  onToggleAgrupar: () => void;
  ordenarPorRelevancia: boolean;
  onToggleOrdenacao: () => void;
  onOpenHelp: () => void;
  totalFiltradas: number;
  onExportarCSV: () => void;
  onExportarPDF: () => void;
}

function NotificacaoHeaderActionsImpl({
  modoFoco,
  onToggleFoco,
  densidade,
  onToggleDensidade,
  rulesAtivas,
  onOpenRules,
  alertasAtivos,
  onToggleAlertas,
  agruparSimilares,
  onToggleAgrupar,
  ordenarPorRelevancia,
  onToggleOrdenacao,
  onOpenHelp,
  totalFiltradas,
  onExportarCSV,
  onExportarPDF,
}: NotificacaoHeaderActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant={modoFoco ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleFoco}
        title={
          modoFoco
            ? 'Sair do modo Foco'
            : 'Modo Foco: mostrar apenas não-lidas prioritárias (erros, alertas e alta relevância)'
        }
        aria-pressed={modoFoco}
        className={modoFoco ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
      >
        <Focus className="w-4 h-4 mr-1" />
        {modoFoco ? 'Foco ativo' : 'Foco'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleDensidade}
        title={
          densidade === 'compact'
            ? 'Densidade compacta: mais itens visíveis. Clique para modo confortável.'
            : 'Densidade confortável. Clique para modo compacto (mais itens por tela).'
        }
        aria-pressed={densidade === 'compact'}
        aria-label={densidade === 'compact' ? 'Alternar para densidade confortável' : 'Alternar para densidade compacta'}
      >
        {densidade === 'compact' ? (
          <Rows3 className="w-4 h-4 mr-1" />
        ) : (
          <Rows2 className="w-4 h-4 mr-1" />
        )}
        {densidade === 'compact' ? 'Compacto' : 'Confortável'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenRules}
        title="Regras automáticas: aplicar ações a novas notificações que casem com um padrão"
        aria-label="Abrir regras automáticas"
      >
        <Wand2 className="w-4 h-4 mr-1" />
        Regras {rulesAtivas > 0 && (
          <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
            {rulesAtivas}
          </Badge>
        )}
      </Button>
      <Button
        variant={alertasAtivos ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleAlertas}
        title={
          alertasAtivos
            ? 'Silenciar alertas sonoros de novas notificações prioritárias'
            : 'Ativar alertas sonoros e vibração para novas notificações prioritárias'
        }
        aria-pressed={alertasAtivos}
        aria-label={alertasAtivos ? 'Silenciar alertas' : 'Ativar alertas'}
      >
        {alertasAtivos ? (
          <Volume2 className="w-4 h-4 mr-1" />
        ) : (
          <VolumeX className="w-4 h-4 mr-1" />
        )}
        {alertasAtivos ? 'Som' : 'Silenciado'}
      </Button>
      <Button
        variant={agruparSimilares ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleAgrupar}
        title={agruparSimilares ? 'Desagrupar similares' : 'Agrupar similares'}
        aria-pressed={agruparSimilares}
      >
        <Layers className="w-4 h-4 mr-1" />
        {agruparSimilares ? 'Agrupadas' : 'Individuais'}
      </Button>
      <Button
        variant={ordenarPorRelevancia ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleOrdenacao}
        title={
          ordenarPorRelevancia
            ? 'Ordenar cronologicamente'
            : 'Ordenar por relevância (urgência + não lidas + recência)'
        }
        aria-pressed={ordenarPorRelevancia}
      >
        {ordenarPorRelevancia ? (
          <Flame className="w-4 h-4 mr-1" />
        ) : (
          <ArrowDownWideNarrow className="w-4 h-4 mr-1" />
        )}
        {ordenarPorRelevancia ? 'Relevância' : 'Recente'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenHelp}
        title="Atalhos de teclado (?)"
        aria-label="Atalhos de teclado"
      >
        <Keyboard className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => navigate('/notificacoes/historico')}>
        Histórico
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            title="Exportar notificações filtradas"
            disabled={totalFiltradas === 0}
          >
            <Download className="w-4 h-4 mr-1" /> Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Exportar {totalFiltradas} registro(s)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onExportarCSV}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV (Excel)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportarPDF}>
            <FileText className="w-4 h-4 mr-2" /> PDF (imprimir)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/notificacoes/preferencias')}
      >
        Preferências
      </Button>
    </div>
  );
}

export const NotificacaoHeaderActions = memo(NotificacaoHeaderActionsImpl);
