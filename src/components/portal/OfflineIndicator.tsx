import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Cloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOffline } from '@/hooks/useOffline';

interface OfflineIndicatorProps {
  showAlways?: boolean;
  className?: string;
}

export function OfflineIndicator({ showAlways = false, className = '' }: OfflineIndicatorProps) {
  const { isOnline, offlineCount, isSyncing, syncOfflineData } = useOffline();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    } else if (offlineCount > 0) {
      // Mostrar por 5 segundos após voltar online
      const timer = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [isOnline, offlineCount]);

  // Não mostrar se online e sem pendências (a menos que showAlways)
  if (isOnline && offlineCount === 0 && !showAlways) {
    return null;
  }

  return (
    <>
      {/* Indicador compacto para header */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 ${className}`}>
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              {offlineCount > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {offlineCount}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isOnline ? (
              offlineCount > 0 ? (
                <p>{offlineCount} registro(s) aguardando sincronização</p>
              ) : (
                <p>Conectado</p>
              )
            ) : (
              <p>Offline - registros serão salvos localmente</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Banner flutuante quando offline ou com pendências */}
      {showBanner && (
        <div 
          className={`fixed bottom-20 left-4 right-4 z-50 ${
            isOnline ? 'bg-yellow-500' : 'bg-red-500'
          } text-white rounded-lg shadow-lg p-3 animate-slide-up`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Cloud className="w-5 h-5" />
                  <div>
                    <p className="font-medium text-sm">Sincronizando...</p>
                    <p className="text-xs opacity-90">
                      {offlineCount} registro(s) pendente(s)
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5" />
                  <div>
                    <p className="font-medium text-sm">Você está offline</p>
                    <p className="text-xs opacity-90">
                      Registros serão salvos localmente
                    </p>
                  </div>
                </>
              )}
            </div>
            {isOnline && offlineCount > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={syncOfflineData}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  'Sincronizar'
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Componente para exibir status detalhado (para página de configurações)
export function OfflineStatus() {
  const { isOnline, offlineCount, isSyncing, syncOfflineData, updateServiceWorker } = useOffline();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-green-600" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <WifiOff className="w-5 h-5 text-red-600" />
            </div>
          )}
          <div>
            <p className="font-medium">
              {isOnline ? 'Conectado' : 'Offline'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isOnline 
                ? 'Todos os dados estão sincronizados'
                : 'Trabalhando no modo offline'
              }
            </p>
          </div>
        </div>
      </div>

      {offlineCount > 0 && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200">
          <div>
            <p className="font-medium text-yellow-800">
              {offlineCount} registro(s) pendente(s)
            </p>
            <p className="text-sm text-yellow-600">
              Aguardando sincronização com o servidor
            </p>
          </div>
          <Button
            onClick={syncOfflineData}
            disabled={!isOnline || isSyncing}
            variant="outline"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 mr-2" />
                Sincronizar agora
              </>
            )}
          </Button>
        </div>
      )}

      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Service Worker</p>
            <p className="text-sm text-muted-foreground">
              Gerencia cache e sincronização em background
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={updateServiceWorker}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
}
