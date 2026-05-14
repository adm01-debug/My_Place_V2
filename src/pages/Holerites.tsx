import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Download, TrendingUp, Calendar, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { PullToRefresh } from '@/components/portal/PullToRefresh';
import { EmptyState } from '@/components/portal/EmptyStateIllustration';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Holerite {
  id: string;
  competencia: string;
  salario_bruto: number;
  salario_liquido: number;
  inss: number;
  irrf: number;
  outros_descontos: number;
  arquivo_url: string | null;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatCompetencia = (comp: string) => {
  const [year, month] = comp.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(month, 10) - 1]}/${year}`;
};

const formatCompetenciaFull = (comp: string) => {
  const [year, month] = comp.split('-');
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
};

export default function Holerites() {
  const { user } = useAuth();
  const [holerites, setHolerites] = useState<Holerite[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHolerites = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('holerites')
        .select('id, competencia, salario_bruto, salario_liquido, inss, irrf, outros_descontos, arquivo_url')
        .eq('user_id', user.id)
        .order('competencia', { ascending: false });

      if (error) throw error;
      setHolerites((data as Holerite[]) || []);
    } catch (err) {
      console.error('Erro ao buscar holerites:', err);
      toast.error('Erro ao carregar holerites.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHolerites();
  }, [fetchHolerites]);

  const handleDownload = async (holerite: Holerite) => {
    if (!holerite.arquivo_url) {
      toast.info('Arquivo PDF não disponível para este mês.');
      return;
    }
    try {
      const { data, error } = await supabase.storage
        .from('documentos')
        .download(holerite.arquivo_url);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `holerite-${holerite.competencia}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download iniciado!');
    } catch (err) {
      console.error('Erro no download:', err);
      toast.error('Erro ao baixar o arquivo.');
    }
  };

  const latest = holerites[0];

  return (
    <PullToRefresh onRefresh={async () => { await fetchHolerites(); }}>
    <div className="w-full max-w-4xl mx-auto p-4 pt-6 pb-20 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Holerites</h1>
        <p className="text-sm text-muted-foreground">Consulte seus contracheques</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="p-4 rounded-lg border border-border/50 animate-pulse space-y-2">
              <div className="h-5 w-32 rounded bg-muted/60" />
              <div className="h-4 w-24 rounded bg-muted/40" />
              <div className="h-3 w-full rounded bg-muted/30" />
            </div>
          ))}
        </div>
      ) : holerites.length === 0 ? (
        <EmptyState icon={Receipt} title="Nenhum holerite cadastrado" description="Seus contracheques aparecerão aqui quando disponíveis." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/50 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Último Salário Líquido</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {latest ? formatCurrency(latest.salario_liquido) : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Referência Atual</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {latest ? formatCompetencia(latest.competencia) : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Holerites List */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Holerites Disponíveis ({holerites.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {holerites.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum holerite disponível.
                </p>
              ) : (
                holerites.map((h) => {
                  const isExpanded = expandedId === h.id;
                  return (
                    <div key={h.id} className="border-b border-border/30 last:border-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : h.id)}
                        className="flex items-center justify-between w-full py-3 text-left hover:bg-accent/30 rounded-lg px-2 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                            <Receipt className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {formatCompetenciaFull(h.competencia)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Líquido: {formatCurrency(h.salario_liquido)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-accent/20 rounded-lg p-2.5">
                              <p className="text-xs text-muted-foreground">Salário Bruto</p>
                              <p className="font-semibold text-foreground">{formatCurrency(h.salario_bruto)}</p>
                            </div>
                            <div className="bg-accent/20 rounded-lg p-2.5">
                              <p className="text-xs text-muted-foreground">Salário Líquido</p>
                              <p className="font-semibold text-emerald-500">{formatCurrency(h.salario_liquido)}</p>
                            </div>
                            <div className="bg-accent/20 rounded-lg p-2.5">
                              <p className="text-xs text-muted-foreground">INSS</p>
                              <p className="font-semibold text-red-400">-{formatCurrency(h.inss)}</p>
                            </div>
                            <div className="bg-accent/20 rounded-lg p-2.5">
                              <p className="text-xs text-muted-foreground">IRRF</p>
                              <p className="font-semibold text-red-400">-{formatCurrency(h.irrf)}</p>
                            </div>
                            {h.outros_descontos > 0 && (
                              <div className="bg-accent/20 rounded-lg p-2.5 col-span-2">
                                <p className="text-xs text-muted-foreground">Outros Descontos</p>
                                <p className="font-semibold text-amber-400">-{formatCurrency(h.outros_descontos)}</p>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(h);
                            }}
                          >
                            <Download className="w-4 h-4" />
                            Baixar PDF
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
    </PullToRefresh>
  );
}
