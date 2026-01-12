import { useState } from 'react';
import { DollarSign, Download, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { useHolerites } from '@/hooks/useHolerites';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const mesesNome = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Holerites() {
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const { 
    holerites, 
    estatisticasAno, 
    isLoading,
    getHoleritesAno,
    getAnosDisponiveis,
    calcularTotais,
    downloadPdf,
    refetch 
  } = useHolerites();
  
  const totalAno = estatisticasAno.total;
  const mediaAnual = estatisticasAno.media;
  
  const { toast } = useToast();

  const handleDownload = async (holerite: any) => {
    setDownloadingId(holerite.id);
    const result = await downloadPdf(holerite);
    setDownloadingId(null);
    
    if (!result.success) {
      toast({
        title: 'Erro ao baixar',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const holeritesFiltrados = getHoleritesAno(anoSelecionado);
  const anos = getAnosDisponiveis();

  if (isLoading) {
    return (
      <PageLayout title="Meus Holerites" showBack>
        <div className="space-y-6">
          <StatCardSkeleton />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <ListItemSkeleton key={i} />)}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Meus Holerites" showBack onRefresh={refetch}>
      <div className="space-y-6 animate-fade-in-up">
        {/* Resumo do Ano */}
        <Card className="p-4 bg-gradient-to-r from-finance-light via-card to-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Resumo {anoSelecionado}</h3>
            <Select 
              value={String(anoSelecionado)} 
              onValueChange={(v) => setAnoSelecionado(Number(v))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anos.map(ano => (
                  <SelectItem key={ano} value={String(ano)}>{ano}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalAno)}</p>
              <p className="text-xs text-muted-foreground">Total Recebido</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(mediaAnual)}</p>
              <p className="text-xs text-muted-foreground">Média Mensal</p>
            </div>
          </div>
        </Card>

        {/* Lista de Holerites */}
        <div className="space-y-3">
          {holeritesFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum holerite encontrado para {anoSelecionado}</p>
            </div>
          ) : (
            holeritesFiltrados.map((holerite) => {
              const isExpanded = expandedId === holerite.id;
              const isDownloading = downloadingId === holerite.id;
              const totais = calcularTotais(holerite);

              return (
                <Collapsible
                  key={holerite.id}
                  open={isExpanded}
                  onOpenChange={() => setExpandedId(isExpanded ? null : holerite.id)}
                >
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-finance/10 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-finance" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-foreground">
                            {mesesNome[holerite.mes]} {holerite.ano}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Líquido: {formatCurrency(holerite.salario_liquido)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(holerite);
                          }}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t border-border pt-4">
                        {/* Proventos */}
                        {holerite.detalhes?.proventos && holerite.detalhes.proventos.length > 0 ? (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                              Proventos
                            </h4>
                            <div className="space-y-1">
                              {holerite.detalhes.proventos.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{item.descricao}</span>
                                  <span className="text-finance">{formatCurrency(item.valor)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Salário Bruto</span>
                            <span className="text-finance">{formatCurrency(holerite.salario_bruto)}</span>
                          </div>
                        )}

                        {/* Descontos */}
                        {holerite.detalhes?.descontos && holerite.detalhes.descontos.length > 0 ? (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                              Descontos
                            </h4>
                            <div className="space-y-1">
                              {holerite.detalhes.descontos.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{item.descricao}</span>
                                  <span className="text-destructive">-{formatCurrency(item.valor)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Descontos</span>
                            <span className="text-destructive">-{formatCurrency(holerite.descontos)}</span>
                          </div>
                        )}

                        {/* Total */}
                        <div className="flex justify-between font-bold pt-2 border-t border-border">
                          <span>Líquido</span>
                          <span className="text-finance">{formatCurrency(holerite.salario_liquido)}</span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })
          )}
        </div>

        {/* Ação: Informe de Rendimentos */}
        <Button variant="outline" className="w-full" onClick={() => {
          toast({
            title: 'Em breve',
            description: 'O informe de rendimentos será disponibilizado em fevereiro.',
          });
        }}>
          <FileText className="w-4 h-4 mr-2" />
          Solicitar Informe de Rendimentos
        </Button>
      </div>
    </PageLayout>
  );
}
