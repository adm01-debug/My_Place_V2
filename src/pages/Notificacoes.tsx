import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Trash2,
  ChevronLeft,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { PullToRefresh } from '@/components/portal/PullToRefresh';
import { toast } from 'sonner';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'sucesso' | 'erro' | 'info' | 'alerta';
  lida: boolean;
  link: string | null;
  created_at: string;
}

export default function Notificacoes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificacoes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotificacoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      toast.error('Não foi possível carregar as notificações');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  const marcarComoLida = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);

      if (error) throw error;
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const marcarTodasComoLidas = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('user_id', user.id)
        .eq('lida', false);

      if (error) throw error;
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao atualizar notificações');
    }
  };

  const excluirNotificacao = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotificacoes(prev => prev.filter(n => n.id !== id));
      toast.success('Notificação removida');
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      toast.error('Erro ao excluir notificação');
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'sucesso': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'erro': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'alerta': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleAction = (n: Notificacao) => {
    if (!n.lida) marcarComoLida(n.id);
    if (n.link) {
      if (n.link.startsWith('/')) {
        navigate(n.link);
      } else {
        window.open(n.link, '_blank');
      }
    }
  };

  return (
    <PullToRefresh onRefresh={fetchNotificacoes}>
      <div className="w-full max-w-4xl mx-auto p-4 space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <ModuleHeader 
            title="Notificações"
            description="Fique por dentro das novidades e atualizações"
            icon={Bell}
            actions={
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/notificacoes/historico')}>
                  Histórico
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/notificacoes/preferencias')}>
                  Preferências
                </Button>
              </div>
            }
          />
        </div>

        <div className="flex justify-between items-center px-1">
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-background">
              {notificacoes.length} total
            </Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {notificacoes.filter(n => !n.lida).length} não lidas
            </Badge>
          </div>
          {notificacoes.some(n => !n.lida) && (
            <Button variant="ghost" size="sm" onClick={marcarTodasComoLidas} className="text-xs text-muted-foreground hover:text-primary">
              Limpar tudo
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse h-24 border-border/50" />
            ))
          ) : notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Bell className="w-8 h-8 text-muted-foreground opacity-20" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-foreground">Tudo em dia!</p>
                <p className="text-sm text-muted-foreground">Você não tem novas notificações no momento.</p>
              </div>
            </div>
          ) : (
            notificacoes.map((n) => (
              <Card 
                key={n.id} 
                className={`group border-border/50 transition-all hover:shadow-md cursor-pointer ${!n.lida ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                onClick={() => handleAction(n)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      {getIcon(n.tipo)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm font-semibold truncate ${!n.lida ? 'text-primary' : 'text-foreground'}`}>
                          {n.titulo}
                        </h3>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(n.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {n.mensagem}
                      </p>
                      
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          {n.link && (
                            <span className="text-[10px] font-medium text-primary flex items-center gap-1">
                              Acessar <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            excluirNotificacao(n.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}
