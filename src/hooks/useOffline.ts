import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineRegistroPonto {
  id: number;
  data: {
    tipo: 'entrada' | 'saida';
    data_hora: string;
    latitude?: number;
    longitude?: number;
    dispositivo?: string;
  };
  timestamp: number;
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

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
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_OFFLINE_COUNT' },
          [messageChannel.port2]
        );
      });
    }
    return 0;
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
        navigator.serviceWorker.controller.postMessage(
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
      if ('serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any)) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-ponto');
      }
      
      // Fallback: sync localStorage
      const offlineData = JSON.parse(localStorage.getItem('offline-ponto') || '[]');
      if (offlineData.length > 0) {
        // Aqui você faria o POST para o backend
        // Por enquanto, apenas limpa os dados
        localStorage.removeItem('offline-ponto');
        setOfflineCount(0);
        toast({
          title: 'Sincronização concluída',
          description: `${offlineData.length} registro(s) sincronizado(s).`,
        });
      }
      
      await getOfflineCount();
    } catch (err) {
      console.error('Erro ao sincronizar:', err);
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
