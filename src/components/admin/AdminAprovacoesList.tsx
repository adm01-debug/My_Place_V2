import React, { useMemo, useState } from 'react';
import {
  ClipboardList, Umbrella, CreditCard, Clock, DollarSign,
  ChevronRight, Check, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  remuneracoes: any[];
  pendentesTotal: number;
  onOpenAprovacao: (tipo: string, data: any) => void;
}

function ApprovalCard({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <Card className="p-4 border-0 shadow-card hover:bg-muted/30 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </Card>
  );
}

function ApprovalSection({ icon: Icon, title, count, children }: {
  icon: any; title: string; count: number; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Icon className="w-4 h-4" />{title} ({count})
      </h3>
      {children}
    </div>
  );
}

export function AdminAprovacoesList({
  solicitacoes, ferias, emprestimos, justificativas, remuneracoes,
  pendentesTotal, onOpenAprovacao,
}: AdminAprovacoesListProps) {
  const [filtroTipoRem, setFiltroTipoRem] = useState('todos');
  const [filtroPeriodoRem, setFiltroPeriodoRem] = useState('todos');

  const periodoOptions = useMemo(() => {
    const periodos = new Set<string>();
    remuneracoes.forEach((r: any) => periodos.add(`${r.mes}/${r.ano}`));
    return Array.from(periodos).sort((a, b) => {
      const [mA, aA] = a.split('/').map(Number);
      const [mB, aB] = b.split('/').map(Number);
      return aB - aA || mB - mA;
    });
  }, [remuneracoes]);

  const remFiltradas = useMemo(() => remuneracoes.filter((r: any) => {
    return (filtroTipoRem === 'todos' || r.tipo === filtroTipoRem) &&
           (filtroPeriodoRem === 'todos' || `${r.mes}/${r.ano}` === filtroPeriodoRem);
  }), [remuneracoes, filtroTipoRem, filtroPeriodoRem]);

  if (pendentesTotal === 0) {
    return (
      <Card className="p-8 text-center border-0 shadow-card">
        <Check className="w-12 h-12 mx-auto text-finance mb-3" />
        <p className="text-muted-foreground">Nenhuma pendência no momento</p>
      </Card>
    );
  }

  return (
    <>
      {solicitacoes.length > 0 && (
        <ApprovalSection icon={ClipboardList} title="Solicitações" count={solicitacoes.length}>
          {solicitacoes.map((s: any) => (
            <ApprovalCard key={s.id} onClick={() => onOpenAprovacao('solicitacao', s)} title={s.titulo} subtitle={`${s.profile?.nome} • ${s.tipo}`} />
          ))}
        </ApprovalSection>
      )}
      {ferias.length > 0 && (
        <ApprovalSection icon={Umbrella} title="Férias" count={ferias.length}>
          {ferias.map((f: any) => (
            <ApprovalCard key={f.id} onClick={() => onOpenAprovacao('ferias', f)} title={f.profile?.nome}
              subtitle={`${format(new Date(f.data_inicio), 'dd/MM', { locale: ptBR })} - ${format(new Date(f.data_fim), 'dd/MM/yyyy', { locale: ptBR })} • ${f.dias_solicitados} dias`} />
          ))}
        </ApprovalSection>
      )}
      {emprestimos.length > 0 && (
        <ApprovalSection icon={CreditCard} title="Empréstimos" count={emprestimos.length}>
          {emprestimos.map((e: any) => (
            <ApprovalCard key={e.id} onClick={() => onOpenAprovacao('emprestimo', e)} title={e.profile?.nome}
              subtitle={`R$ ${e.valor_original.toLocaleString('pt-BR')} em ${e.quantidade_parcelas}x`} />
          ))}
        </ApprovalSection>
      )}
      {justificativas.length > 0 && (
        <ApprovalSection icon={Clock} title="Justificativas de Ponto" count={justificativas.length}>
          {justificativas.map((j: any) => (
            <ApprovalCard key={j.id} onClick={() => onOpenAprovacao('justificativa', j)} title={j.profile?.nome}
              subtitle={`${format(new Date(j.data), 'dd/MM/yyyy', { locale: ptBR })} • ${j.tipo}`} />
          ))}
        </ApprovalSection>
      )}
      {remuneracoes.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />Remunerações Variáveis ({remFiltradas.length}/{remuneracoes.length})
            </h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filtroTipoRem} onValueChange={setFiltroTipoRem}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="comissao">Comissão</SelectItem>
                  <SelectItem value="bonificacao">Bonificação</SelectItem>
                  <SelectItem value="plr">PLR</SelectItem>
                  <SelectItem value="premio">Prêmio</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroPeriodoRem} onValueChange={setFiltroPeriodoRem}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {periodoOptions.map(p => <SelectItem key={p} value={p}>{p.split('/')[0].padStart(2,'0')}/{p.split('/')[1]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {remFiltradas.length === 0 ? (
            <Card className="p-4 text-center border-0 shadow-card"><p className="text-sm text-muted-foreground">Nenhuma remuneração com os filtros selecionados</p></Card>
          ) : (
            <div className="space-y-2">
              {remFiltradas.map((r: any) => (
                <ApprovalCard key={r.id} onClick={() => onOpenAprovacao('remuneracao', r)} title={r.profile?.nome}
                  subtitle={`${TIPO_REMUNERACAO_LABELS[r.tipo] || r.tipo} • R$ ${Number(r.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • ${String(r.mes).padStart(2,'0')}/${r.ano}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
