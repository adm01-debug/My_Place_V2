import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, CheckCircle2, AlertCircle, Calendar, FileText, Receipt } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
  id: string;
  type: 'ponto' | 'ferias' | 'solicitacao' | 'holerite';
  title: string;
  description: string;
  date: string;
  status?: string;
}

export function RecentActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      if (!user) return;
      
      const [p, f, s, h] = await Promise.all([
        supabase.from('registros_ponto').select('id, tipo, data_hora').eq('user_id', user.id).order('data_hora', { ascending: false }).limit(3),
        supabase.from('solicitacoes_ferias').select('id, status, created_at, tipo').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
        supabase.from('solicitacoes').select('id, status, created_at, tipo').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
        supabase.from('holerites').select('id, competencia, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      ]);

      const all: Activity[] = [];

      p.data?.forEach(item => all.push({
        id: item.id,
        type: 'ponto',
        title: 'Registro de Ponto',
        description: `Bateu ponto: ${item.tipo.replace('_', ' ')}`,
        date: item.data_hora
      }));

      f.data?.forEach(item => all.push({
        id: item.id,
        type: 'ferias',
        title: 'Solicitação de Férias',
        description: `Status: ${item.status}`,
        date: item.created_at,
        status: item.status
      }));

      s.data?.forEach(item => all.push({
        id: item.id,
        type: 'solicitacao',
        title: 'Solicitação RH',
        description: `${item.tipo.replace('_', ' ')} - ${item.status}`,
        date: item.created_at,
        status: item.status
      }));

      h.data?.forEach(item => all.push({
        id: item.id,
        type: 'holerite',
        title: 'Novo Holerite',
        description: `Competência: ${item.competencia}`,
        date: item.created_at
      }));

      setActivities(all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
      setLoading(false);
    }

    fetchActivities();
  }, [user]);

  const icons = {
    ponto: Clock,
    ferias: Calendar,
    solicitacao: FileText,
    holerite: Receipt
  };

  const colors = {
    ponto: 'text-blue-500 bg-blue-500/10',
    ferias: 'text-emerald-500 bg-emerald-500/10',
    solicitacao: 'text-purple-500 bg-purple-500/10',
    holerite: 'text-amber-500 bg-amber-500/10'
  };

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded bg-muted/60" />
                  <div className="h-3 w-1/3 rounded bg-muted/40" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sem atividades recentes.</p>
        ) : (
          <div className="space-y-4 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/30">
            {activities.map((activity, idx) => {
              const Icon = icons[activity.type];
              return (
                <div key={activity.id} className="flex gap-4 relative">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full z-10 ${colors[activity.type]} shrink-0 shadow-sm border border-background`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-semibold text-foreground truncate">{activity.title}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(activity.date), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{activity.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
