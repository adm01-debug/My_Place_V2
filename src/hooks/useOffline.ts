import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OfflineRegistroPonto {
  id: number;
  data: {
    tipo: 'entrada' | 'saida';
    data_hora: string;
    latitude?: number;
    longitude?: number;
    endereco?: string;
    observacao?: string;
  };
  timestamp: number;
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Listener para o Service Worker solicitar token
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GET_AUTH_TOKEN') {
        const { data: { session } } = await supabase.auth.getSession();
        event.ports[0]?.postMessage({ token: session?.access_token || null });
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Atualizar estado online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Conexão restaurada',
        description: 'Sincronizando dados offline...',
      });
      // Trigger sync
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Você está offline',
        description: 'Seus registros serão salvos localmente.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Verificar contagem de registros offline
  useEffect(() => {
    getOfflineCount();
  }, []);

  const getOfflineCount = useCallback(async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return new Promise<number>((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          const count = event.data.count || 0;
          setOfflineCount(count);
          resolve(count);
        };
        navigator.serviceWorker.controller!.postMessage(
          { type: 'GET_OFFLINE_COUNT' },
          [messageChannel.port2]
        );
      });
    }
    
    // Fallback: check localStorage
    try {
      const offlineData = JSON.parse(localStorage.getItem('offline-ponto') || '[]');
      setOfflineCount(offlineData.length);
      return offlineData.length;
    } catch {
      return 0;
    }
  }, []);

  // Salvar registro de ponto offline
  const saveRegistroPontoOffline = useCallback(async (data: OfflineRegistroPonto['data']) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            setOfflineCount(prev => prev + 1);
            toast({
              title: 'Ponto salvo offline',
              description: 'Será sincronizado quando a conexão for restaurada.',
            });
          }
          resolve(event.data);
        };
        navigator.serviceWorker.controller!.postMessage(
          { type: 'SAVE_PONTO_OFFLINE', payload: data },
          [messageChannel.port2]
        );
      });
    }
    
    // Fallback: salvar no localStorage
    try {
      const offlineData = JSON.parse(localStorage.getItem('offline-ponto') || '[]');
      offlineData.push({
        id: Date.now(),
        data,
        timestamp: Date.now()
      });
      localStorage.setItem('offline-ponto', JSON.stringify(offlineData));
      setOfflineCount(prev => prev + 1);
      toast({
        title: 'Ponto salvo localmente',
        description: 'Será sincronizado quando a conexão for restaurada.',
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [toast]);

  // Sincronizar dados offline
  const syncOfflineData = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      // Trigger background sync via Service Worker
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-ponto');
      }
      
      // Fallback: sync localStorage data via edge function
      const offlineData: OfflineRegistroPonto[] = JSON.parse(localStorage.getItem('offline-ponto') || '[]');
      if (offlineData.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          const { data, error } = await supabase.functions.invoke('sync-ponto-offline', {
            body: offlineData.map(item => ({
              ...item.data,
              offline_id: String(item.id),
            })),
          });
          
          if (!error && data) {
            // Remover registros sincronizados com sucesso
            const successIds = new Set(data.details?.success || []);
            const remaining = offlineData.filter(item => !successIds.has(String(item.id)));
            
            if (remaining.length === 0) {
              localStorage.removeItem('offline-ponto');
            } else {
              localStorage.setItem('offline-ponto', JSON.stringify(remaining));
            }
            
            setOfflineCount(remaining.length);
            
            if (data.success > 0) {
              toast({
                title: 'Sincronização concluída',
                description: `${data.success} registro(s) sincronizado(s).`,
              });
            }
            
            if (data.failed > 0) {
              toast({
                title: 'Alguns registros falharam',
                description: `${data.failed} registro(s) não puderam ser sincronizados.`,
                variant: 'destructive',
              });
            }
          }
        }
      }
      
      await getOfflineCount();
    } catch (err) {
      console.error('Erro ao sincronizar:', err);
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar os dados offline.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, getOfflineCount, toast]);

  // Forçar atualização do Service Worker
  const updateServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    offlineCount,
    isSyncing,
    saveRegistroPontoOffline,
    syncOfflineData,
    updateServiceWorker,
    getOfflineCount,
  };
}
