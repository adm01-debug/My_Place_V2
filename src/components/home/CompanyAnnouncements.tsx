import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  imagem_url: string | null;
  created_at: string;
}

export function CompanyAnnouncements() {
  const [announcements, setAnnouncements] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      const { data, error } = await supabase
        .from('comunicados')
        .select('*')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && data) {
        setAnnouncements(data as Comunicado[]);
      }
      setLoading(false);
    }

    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <Card className="border-border/50 animate-pulse">
        <div className="h-40 bg-muted/50 rounded-xl" />
      </Card>
    );
  }

  if (announcements.length === 0) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'alta': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'media': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Comunicados da Empresa
          </h2>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
          Ver todos <ChevronRight className="w-3 h-3" />
        </Button>
      </div>

      <div className="grid gap-4">
        {announcements.map((ann) => (
          <Card key={ann.id} className="border-border/50 hover:shadow-md transition-all overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                {ann.imagem_url && (
                  <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0">
                    <img 
                      src={ann.imagem_url} 
                      alt={ann.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold px-1.5 h-5 ${getPriorityColor(ann.prioridade)}`}>
                      {ann.prioridade === 'critica' && <AlertCircle className="w-2.5 h-2.5 mr-1" />}
                      {ann.prioridade}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(ann.created_at), "dd 'de' MMM", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground leading-tight">
                      {ann.titulo}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {ann.conteudo}
                    </p>
                  </div>

                  <Button variant="link" className="p-0 h-auto text-xs text-primary font-semibold">
                    Ler comunicado completo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
