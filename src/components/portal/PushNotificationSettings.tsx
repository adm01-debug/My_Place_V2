import { Bell, BellOff, BellRing, Loader2, TestTube } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    testNotification,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
          <BellOff className="w-4 h-4" /> Notificações Push
        </h3>
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <BellOff className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Não suportado</p>
            <p className="text-xs text-muted-foreground">
              Seu navegador não suporta notificações push.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">Permitido</Badge>;
      case 'denied':
        return <Badge variant="destructive" className="bg-destructive/10">Bloqueado</Badge>;
      default:
        return <Badge variant="secondary">Não solicitado</Badge>;
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
        <Bell className="w-4 h-4" /> Notificações Push
      </h3>
      
      <div className="space-y-4">
        {/* Status e Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BellRing className="w-5 h-5 text-primary" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <BellOff className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {isSubscribed ? 'Ativadas' : 'Desativadas'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isSubscribed 
                  ? 'Você receberá alertas importantes'
                  : 'Ative para receber alertas em tempo real'
                }
              </p>
            </div>
          </div>
          
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <Switch 
              checked={isSubscribed} 
              onCheckedChange={handleToggle}
              disabled={permission === 'denied'}
            />
          )}
        </div>

        {/* Permissão do navegador */}
        <div className="flex items-center justify-between py-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Permissão do navegador</span>
          {getPermissionBadge()}
        </div>

        {/* Aviso se bloqueado */}
        {permission === 'denied' && (
          <div className="p-3 bg-destructive/10 rounded-lg">
            <p className="text-xs text-destructive">
              Notificações bloqueadas. Para reativar, clique no ícone de cadeado 
              na barra de endereço e permita notificações.
            </p>
          </div>
        )}

        {/* Tipos de notificação */}
        {isSubscribed && (
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Você será notificado sobre:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Novos comunicados importantes
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Aprovações de solicitações
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Lembretes de registro de ponto
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Vencimentos de documentos
              </li>
            </ul>
          </div>
        )}

        {/* Botão de teste */}
        {isSubscribed && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testNotification}
            className="w-full mt-2"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Testar Notificação
          </Button>
        )}
      </div>
    </Card>
  );
}
