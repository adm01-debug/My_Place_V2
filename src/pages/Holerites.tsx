import { useState } from 'react';
import { Eye, Download, Calculator, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageLayout } from '@/components/portal/PageLayout';
import { ListItemSkeleton } from '@/components/portal/Skeletons';
import { useLoadingState } from '@/hooks/useLoadingState';
import { mockHolerites, mockColaborador } from '@/data/mockData';
import { Holerite } from '@/types/portal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const mesesNome = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const tipoLabels: Record<string, string> = {
  mensal: 'Mensal',
  '13_primeira': '13º Salário (1ª parcela)',
  '13_segunda': '13º Salário (2ª parcela)',
  ferias: 'Férias',
  rescisao: 'Rescisão',
};

export default function Holerites() {
  const [ano, setAno] = useState('2025');
  const [selectedHolerite, setSelectedHolerite] = useState<Holerite | null>(null);
  const isLoading = useLoadingState(800);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const holerites = mockHolerites.filter(h => h.ano.toString() === ano);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-projects-light text-projects border-projects/30">Pendente</Badge>;
      case 'processado':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Processado</Badge>;
      case 'pago':
        return <Badge variant="outline" className="bg-finance-light text-finance border-finance/30">Pago</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Meus Holerites" showBack>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ano:</span>
            <div className="w-24 h-10 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Meus Holerites" showBack>
      <div className="space-y-4 animate-fade-in-up">
        {/* Filtro de Ano */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ano:</span>
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Holerites */}
        <div className="space-y-3">
          {holerites.map((holerite) => (
            <Card key={holerite.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {holerite.tipo === 'mensal' 
                        ? `${mesesNome[holerite.mes].toUpperCase()}/${holerite.ano}`
                        : tipoLabels[holerite.tipo]
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {holerite.status === 'pago' 
                        ? `Pago em: ${format(holerite.dataPagamento!, 'dd/MM/yyyy')}`
                        : `Pagamento: ${format(holerite.dataPagamento!, 'dd/MM/yyyy')}`
                      }
                    </p>
                  </div>
                </div>
                {getStatusBadge(holerite.status)}
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">
                  {holerite.status === 'pendente' ? 'Previsão:' : 'Líquido:'}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(holerite.liquido)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setSelectedHolerite(holerite)}
                >
                  <Eye className="w-4 h-4 mr-1" /> Ver
                </Button>
                {holerite.status !== 'pendente' && (
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                )}
                {holerite.status === 'pendente' && (
                  <Button variant="outline" size="sm" className="flex-1 text-primary">
                    <Calculator className="w-4 h-4 mr-1" /> Simular
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Botão Informe de Rendimentos */}
        <Button variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Baixar Informe de Rendimentos
        </Button>
      </div>

      {/* Modal de Detalhe do Holerite */}
      <Dialog open={!!selectedHolerite} onOpenChange={() => setSelectedHolerite(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedHolerite && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">
                  Holerite {mesesNome[selectedHolerite.mes]}/{selectedHolerite.ano}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Cabeçalho */}
                <div className="text-center border-b border-border pb-4">
                  <p className="font-bold text-foreground">PROMO BRINDES LTDA</p>
                  <p className="text-sm text-muted-foreground">
                    Competência: {mesesNome[selectedHolerite.mes].toUpperCase()}/{selectedHolerite.ano}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pagamento: {format(selectedHolerite.dataPagamento!, 'dd/MM/yyyy')}
                  </p>
                </div>

                {/* Info Colaborador */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium text-sm">{mockColaborador.nome}</p>
                  <p className="text-xs text-muted-foreground">Matrícula: {mockColaborador.matricula}</p>
                  <p className="text-xs text-muted-foreground">Cargo: {mockColaborador.cargo}</p>
                </div>

                {/* Proventos */}
                <div>
                  <h4 className="font-semibold text-sm text-finance mb-2">➕ PROVENTOS</h4>
                  <div className="space-y-1">
                    {selectedHolerite.proventos.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.descricao}
                          {item.referencia && <span className="text-xs ml-1">({item.referencia})</span>}
                        </span>
                        <span className="font-medium text-foreground">{formatCurrency(item.valor)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold text-sm">
                    <span>TOTAL PROVENTOS</span>
                    <span className="text-finance">{formatCurrency(selectedHolerite.totalProventos)}</span>
                  </div>
                </div>

                {/* Descontos */}
                {selectedHolerite.descontos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-destructive mb-2">➖ DESCONTOS</h4>
                    <div className="space-y-1">
                      {selectedHolerite.descontos.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.descricao}</span>
                          <span className="font-medium text-foreground">{formatCurrency(item.valor)}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold text-sm">
                      <span>TOTAL DESCONTOS</span>
                      <span className="text-destructive">{formatCurrency(selectedHolerite.totalDescontos)}</span>
                    </div>
                  </div>
                )}

                {/* Líquido */}
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">💰 LÍQUIDO A RECEBER</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(selectedHolerite.liquido)}</p>
                </div>

                {/* Informações Adicionais */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>ℹ️ Informações:</p>
                  <p>Base INSS: {formatCurrency(selectedHolerite.baseInss)}</p>
                  <p>Base IRRF: {formatCurrency(selectedHolerite.baseIrrf)}</p>
                  <p>FGTS do mês: {formatCurrency(selectedHolerite.fgtsMes)}</p>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button variant="default" className="flex-1">
                    <Download className="w-4 h-4 mr-2" /> Baixar PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
