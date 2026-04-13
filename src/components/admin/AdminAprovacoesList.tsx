import { Check, ChevronRight, ClipboardList, Umbrella, CreditCard, Clock, DollarSign, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TIPO_REMUNERACAO_LABELS: Record<string, string> = {
  comissao: 'Comissão',
  bonificacao: 'Bonificação',
  plr: 'PLR',
  premio: 'Prêmio',
};

interface AdminAprovacoesListProps {
  solicitacoes: any[];
  ferias: any[];
  emprestimos: any[];
  justificativas: any[];
  remuneracoesFiltradas: any[];
  remuneracoes: any[];
  filtroTipoRemuneracao: string;
  setFiltroTipoRemuneracao: (v: string) => void;
  filtroPeriodoRemuneracao: string;
  setFiltroPeriodoRemuneracao: (v: string) => void;
  periodoOptions: string[];
  pendentesTotal: number;
  onOpenAprovacao: (tipo: string, data: any) => void;
}

export const AdminAprovacoesList = ({
  solicitacoes, ferias, emprestimos, justificativas,
  remuneracoesFiltradas, remuneracoes,
  filtroTipoRemuneracao, setFiltroTipoRemuneracao,
  filtroPeriodoRemuneracao, setFiltroPeriodoRemuneracao,
  periodoOptions, pendentesTotal, onOpenAprovacao,
}: AdminAprovacoesListProps) => {
  if (pendentesTotal === 0) {
    return (
      <Card className="p-8 text-center border-0 shadow-card">
        <Check className="w-12 h-12 mx-auto text-finance mb-3" />
        <p className="text-muted-foreground">Nenhuma pendência no momento</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {solicitacoes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Solicitações ({solicitacoes.length})
          </h3>
          {solicitacoes.map(s => (
            <Card key={s.id} className="p-4 border-0 shadow-card hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => onOpenAprovacao('solicitacao', s)}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{s.titulo}</p>
                  <p className="text-sm text-muted-foreground">{s.profile?.nome} • {s.tipo}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {ferias.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Umbrella className="w-4 h-4" /> Férias ({ferias.length})
          </h3>
          {ferias.map(f => (
            <Card key={f.id} className="p-4 border-0 shadow-card hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => onOpenAprovacao('ferias', f)}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{f.profile?.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(f.data_inicio), 'dd/MM', { locale: ptBR })} - {format(new Date(f.data_fim), 'dd/MM/yyyy', { locale: ptBR })} • {f.dias_solicitados} dias
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {emprestimos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Empréstimos ({emprestimos.length})
          </h3>
          {emprestimos.map(e => (
            <Card key={e.id} className="p-4 border-0 shadow-card hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => onOpenAprovacao('emprestimo', e)}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{e.profile?.nome}</p>
                  <p className="text-sm text-muted-foreground">R$ {e.valor_original.toLocaleString('pt-BR')} em {e.quantidade_parcelas}x</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {justificativas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" /> Justificativas de Ponto ({justificativas.length})
          </h3>
          {justificativas.map(j => (
            <Card key={j.id} className="p-4 border-0 shadow-card hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => onOpenAprovacao('justificativa', j)}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{j.profile?.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(j.data), 'dd/MM/yyyy', { locale: ptBR })} • {j.tipo}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {remuneracoes.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Remunerações Variáveis ({remuneracoesFiltradas.length} de {remuneracoes.length})
            </h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filtroTipoRemuneracao} onValueChange={setFiltroTipoRemuneracao}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="comissao">Comissão</SelectItem>
                  <SelectItem value="bonificacao">Bonificação</SelectItem>
                  <SelectItem value="plr">PLR</SelectItem>
                  <SelectItem value="premio">Prêmio</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroPeriodoRemuneracao} onValueChange={setFiltroPeriodoRemuneracao}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Período" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os períodos</SelectItem>
                  {periodoOptions.map(periodo => (
                    <SelectItem key={periodo} value={periodo}>
                      {periodo.split('/')[0].padStart(2, '0')}/{periodo.split('/')[1]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {remuneracoesFiltradas.length === 0 ? (
            <Card className="p-4 text-center border-0 shadow-card">
              <p className="text-sm text-muted-foreground">Nenhuma remuneração encontrada com os filtros selecionados</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {remuneracoesFiltradas.map((r: any) => (
                <Card key={r.id} className="p-4 border-0 shadow-card hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onOpenAprovacao('remuneracao', r)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{r.profile?.nome}</p>
                        <Badge variant="outline" className="text-xs">
                          {TIPO_REMUNERACAO_LABELS[r.tipo] || r.tipo}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.descricao} • R$ {Number(r.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
