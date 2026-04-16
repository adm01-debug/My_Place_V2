import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const requestTypes = [
  'Declaração de Vínculo',
  'Alteração de Dados',
  'Adiantamento Salarial',
  'Carta de Recomendação',
];

export default function Solicitacoes() {
  return (
    <div className="w-full max-w-lg mx-auto p-4 pt-6 pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitações</h1>
          <p className="text-sm text-muted-foreground">Abra e acompanhe seus pedidos</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Nova
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center py-3 gap-1">
            <Clock className="w-5 h-5 text-amber-500" />
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center py-3 gap-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Aprovadas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center py-3 gap-1">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Recusadas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Tipos de Solicitação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {requestTypes.map((type) => (
            <Button
              key={type}
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
            >
              <FileText className="w-4 h-4 text-primary" />
              {type}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Minhas Solicitações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma solicitação registrada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
