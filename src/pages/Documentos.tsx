import { FileText, Download, FolderOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/portal/PageLayout';
import { mockDocumentos } from '@/data/mockData';

export default function Documentos() {
  return (
    <PageLayout title="Meus Documentos" showBack>
      <div className="space-y-3 animate-fade-in-up">
        {mockDocumentos.map((doc) => (
          <Card key={doc.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{doc.titulo}</p>
                  <p className="text-xs text-muted-foreground">{doc.descricao}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                {doc.tipo === 'holerites' || doc.tipo === 'ferias' || doc.tipo === 'certificados' 
                  ? <FolderOpen className="w-4 h-4" /> 
                  : <Download className="w-4 h-4" />}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
