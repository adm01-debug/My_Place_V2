import { memo, RefObject } from 'react';
import { format } from 'date-fns';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Filtro } from './types';

interface NotificacaoFiltrosProps {
  searchInputRef: RefObject<HTMLInputElement>;
  busca: string;
  onBuscaChange: (v: string) => void;
  dataInicio: string;
  dataFim: string;
  onDataInicioChange: (v: string) => void;
  onDataFimChange: (v: string) => void;
  filtro: Filtro;
  onFiltroChange: (f: Filtro) => void;
  modoFoco: boolean;
  onResetar: () => void;
  totais: {
    todas: number;
    naoLidas: number;
    erro: number;
    alerta: number;
    sucesso: number;
    info: number;
  };
}

const PRESETS: { label: string; dias: number }[] = [
  { label: 'Hoje', dias: 0 },
  { label: '7 dias', dias: 6 },
  { label: '30 dias', dias: 29 },
  { label: '90 dias', dias: 89 },
];

export const NotificacaoFiltros = memo(function NotificacaoFiltros({
  searchInputRef,
  busca,
  onBuscaChange,
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
  filtro,
  onFiltroChange,
  modoFoco,
  onResetar,
  totais,
}: NotificacaoFiltrosProps) {
  const temFiltrosAtivos = Boolean(busca || filtro !== 'todas' || dataInicio || dataFim || modoFoco);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          placeholder="Buscar por título ou mensagem... ( / )"
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col">
          <label htmlFor="notif-data-inicio" className="text-xs text-muted-foreground mb-1">De</label>
          <Input
            id="notif-data-inicio"
            type="date"
            value={dataInicio}
            max={dataFim || undefined}
            onChange={(e) => onDataInicioChange(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="notif-data-fim" className="text-xs text-muted-foreground mb-1">Até</label>
          <Input
            id="notif-data-fim"
            type="date"
            value={dataFim}
            min={dataInicio || undefined}
            onChange={(e) => onDataFimChange(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              variant="outline"
              size="sm"
              onClick={() => {
                const hoje = new Date();
                const ini = new Date();
                ini.setDate(hoje.getDate() - p.dias);
                onDataInicioChange(format(ini, 'yyyy-MM-dd'));
                onDataFimChange(format(hoje, 'yyyy-MM-dd'));
              }}
            >
              {p.label}
            </Button>
          ))}
          {(dataInicio || dataFim) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onDataInicioChange(''); onDataFimChange(''); }}
              title="Limpar intervalo de datas"
            >
              Limpar
            </Button>
          )}
          {temFiltrosAtivos && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetar}
              title="Restaurar todos os filtros"
              className="ml-auto"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Resetar filtros
            </Button>
          )}
        </div>
      </div>

      <Tabs value={filtro} onValueChange={(v) => onFiltroChange(v as Filtro)}>
        <TabsList className="w-full flex-wrap h-auto">
          <TabsTrigger value="todas" className="flex-1 min-w-[80px]">
            Todas <Badge variant="secondary" className="ml-2">{totais.todas}</Badge>
          </TabsTrigger>
          <TabsTrigger value="nao_lidas" className="flex-1 min-w-[80px]">
            Não lidas <Badge variant="secondary" className="ml-2">{totais.naoLidas}</Badge>
          </TabsTrigger>
          <TabsTrigger value="erro" className="flex-1 min-w-[80px]">
            Erros {totais.erro > 0 && <Badge variant="destructive" className="ml-2">{totais.erro}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="alerta" className="flex-1 min-w-[80px]">
            Alertas {totais.alerta > 0 && <Badge variant="secondary" className="ml-2">{totais.alerta}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sucesso" className="flex-1 min-w-[80px]">
            Sucessos {totais.sucesso > 0 && <Badge variant="secondary" className="ml-2">{totais.sucesso}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="info" className="flex-1 min-w-[80px]">
            Info {totais.info > 0 && <Badge variant="secondary" className="ml-2">{totais.info}</Badge>}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
});
