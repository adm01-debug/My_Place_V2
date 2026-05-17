import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  FileBadge,
  FileCheck,
  FileQuestion,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { PullToRefresh } from '@/components/portal/PullToRefresh';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Documento {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  url: string;
  extensao: string | null;
  tamanho_kb: number | null;
  created_at: string;
}

const CATEGORIES = [
  { label: 'Todos', value: 'all' },
  { label: 'Contratos', value: 'Contrato' },
  { label: 'Identificação', value: 'Identificação' },
  { label: 'Políticas', value: 'Políticas' },
  { label: 'Outros', value: 'Outros' },
];

export default function Documentos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchDocumentos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocumentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      toast.error('Não foi possível carregar os documentos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  const filteredDocumentos = documentos.filter(doc => {
    const matchesSearch = doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCategory = selectedCategory === 'all' || doc.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (categoria: string) => {
    switch (categoria) {
      case 'Contrato': return <FileBadge className="w-8 h-8 text-primary" />;
      case 'Identificação': return <FileCheck className="w-8 h-8 text-emerald-500" />;
      case 'Políticas': return <FileText className="w-8 h-8 text-blue-500" />;
      default: return <FileQuestion className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const handleDownload = (url: string, nome: string) => {
    window.open(url, '_blank');
  };

  return (
    <PullToRefresh onRefresh={fetchDocumentos}>
      <div className="w-full max-w-4xl mx-auto p-4 space-y-6 pb-24">
        <ModuleHeader 
          title="Meus Documentos"
          description="Acesse seus contratos, termos e documentos pessoais"
          icon={FileText}
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou descrição..." 
              className="pl-9 bg-background/50 border-border/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.value)}
                className="whitespace-nowrap"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse h-32 border-border/50" />
            ))
          ) : filteredDocumentos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground opacity-20" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-foreground">Nenhum documento encontrado</p>
                <p className="text-sm text-muted-foreground">Tente ajustar sua busca ou filtro.</p>
              </div>
            </div>
          ) : (
            filteredDocumentos.map((doc) => (
              <Card key={doc.id} className="border-border/50 hover:shadow-lg transition-all group overflow-hidden">
                <CardContent className="p-4 flex gap-4">
                  <div className="shrink-0 flex items-center justify-center w-16 h-16 rounded-xl bg-accent/50 group-hover:bg-accent transition-colors">
                    {getFileIcon(doc.categoria)}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                          {doc.nome}
                        </h3>
                        <Badge variant="outline" className="text-[10px] h-4">
                          {doc.extensao?.toUpperCase() || 'PDF'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {doc.descricao || 'Nenhuma descrição disponível'}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(doc.created_at), "dd/MM/yyyy")}
                        </span>
                        {doc.tamanho_kb && (
                          <span>{doc.tamanho_kb} KB</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                          onClick={() => handleDownload(doc.url, doc.nome)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-primary">Precisa anexar um documento?</h4>
              <p className="text-xs text-muted-foreground">Se você precisa enviar um documento para o RH, abra uma nova solicitação.</p>
            </div>
            <Button size="sm" onClick={() => navigate('/solicitacoes')}>
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      </div>
    </PullToRefresh>
  );
}
