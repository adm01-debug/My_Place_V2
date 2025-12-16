import { Bell, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/portal/PageLayout';
import { mockComunicados } from '@/data/mockData';
import { format } from 'date-fns';

export default function Comunicados() {
  return (
    <PageLayout title="Comunicados" showBack>
      <div className="space-y-3 animate-fade-in-up">
        {mockComunicados.map((com) => (
          <Card key={com.id} className="p-4">
            <div className="flex items-start gap-2 mb-2">
              {com.importante && !com.lido && (
                <Badge variant="destructive" className="text-xs">NOVO</Badge>
              )}
              <div className="flex-1">
                <p className="font-semibold text-foreground">{com.titulo}</p>
                <p className="text-xs text-muted-foreground">{format(com.dataPublicacao, 'dd/MM/yyyy')} | {com.categoria}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{com.resumo}</p>
            <div className="flex gap-2 mt-3">
              <Button variant="link" size="sm" className="p-0 h-auto">👁️ Ler completo</Button>
              {com.anexoUrl && <Button variant="link" size="sm" className="p-0 h-auto"><Download className="w-3 h-3 mr-1" /> Baixar</Button>}
            </div>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
