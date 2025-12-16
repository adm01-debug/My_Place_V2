import { useState } from 'react';
import { Eye, Download, FileText, FileWarning } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageLayout } from '@/components/portal/PageLayout';
import { ListItemSkeleton } from '@/components/portal/Skeletons';
import { useHolerites } from '@/hooks/useHolerites';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const mesesNome = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface HoleriteDetalhes {
  proventos?: { descricao: string; valor: number; referencia?: string }[];
  descontos?: { descricao: string; valor: number }[];
}

interface HoleriteWithDetails {
  id: string;
  mes: number;
  ano: number;
  salario_bruto: number;
  descontos: number;
  salario_liquido: number;
  detalhes: HoleriteDetalhes | null;
  pdf_url: string | null;
  created_at: string;
}

export default function Holerites() {
  const currentYear = new Date().getFullYear();
  const [ano, setAno] = useState(currentYear.toString());
  const [selectedHolerite, setSelectedHolerite] = useState<HoleriteWithDetails | null>(null);
  const { holerites, isLoading } = useHolerites();
  const { profile } = useAuth();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredHolerites = holerites.filter(h => h.ano.toString() === ano) as HoleriteWithDetails[];

  // Get unique years from holerites for filter
  const availableYears = [...new Set(holerites.map(h => h.ano))].sort((a, b) => b - a);
  if (!availableYears.includes(currentYear)) {
    availableYears.unshift(currentYear);
  }

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
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Holerites */}
        {filteredHolerites.length === 0 ? (
          <Card className="p-8 text-center">
            <FileWarning className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum holerite encontrado para {ano}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredHolerites.map((holerite) => (
              <Card key={holerite.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {mesesNome[holerite.mes].toUpperCase()}/{holerite.ano}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Competência: {String(holerite.mes).padStart(2, '0')}/{holerite.ano}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-finance-light text-finance border-finance/30">
                    Disponível
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Bruto</p>
                    <p className="font-medium text-foreground">{formatCurrency(holerite.salario_bruto)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Descontos</p>
                    <p className="font-medium text-destructive">{formatCurrency(holerite.descontos)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Líquido</p>
                    <p className="font-bold text-finance">{formatCurrency(holerite.salario_liquido)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedHolerite(holerite)}
                  >
                    <Eye className="w-4 h-4 mr-1" /> Ver Detalhes
                  </Button>
                  {holerite.pdf_url && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-1" /> Download
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

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
                </div>

                {/* Info Colaborador */}
                {profile && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="font-medium text-sm">{profile.nome}</p>
                    {profile.matricula && <p className="text-xs text-muted-foreground">Matrícula: {profile.matricula}</p>}
                    {profile.cargo && <p className="text-xs text-muted-foreground">Cargo: {profile.cargo}</p>}
                  </div>
                )}

                {/* Proventos */}
                {selectedHolerite.detalhes?.proventos && selectedHolerite.detalhes.proventos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-finance mb-2">➕ PROVENTOS</h4>
                    <div className="space-y-1">
                      {selectedHolerite.detalhes.proventos.map((item, i) => (
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
                      <span className="text-finance">{formatCurrency(selectedHolerite.salario_bruto)}</span>
                    </div>
                  </div>
                )}

                {/* Descontos */}
                {selectedHolerite.detalhes?.descontos && selectedHolerite.detalhes.descontos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-destructive mb-2">➖ DESCONTOS</h4>
                    <div className="space-y-1">
                      {selectedHolerite.detalhes.descontos.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.descricao}</span>
                          <span className="font-medium text-foreground">{formatCurrency(item.valor)}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold text-sm">
                      <span>TOTAL DESCONTOS</span>
                      <span className="text-destructive">{formatCurrency(selectedHolerite.descontos)}</span>
                    </div>
                  </div>
                )}

                {/* Fallback quando não há detalhes */}
                {(!selectedHolerite.detalhes?.proventos || selectedHolerite.detalhes.proventos.length === 0) && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Salário Bruto</span>
                      <span className="font-medium text-finance">{formatCurrency(selectedHolerite.salario_bruto)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Descontos</span>
                      <span className="font-medium text-destructive">{formatCurrency(selectedHolerite.descontos)}</span>
                    </div>
                  </div>
                )}

                {/* Líquido */}
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">💰 LÍQUIDO A RECEBER</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(selectedHolerite.salario_liquido)}</p>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button variant="default" className="flex-1" disabled={!selectedHolerite.pdf_url}>
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
