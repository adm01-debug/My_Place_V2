import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Registrar o service worker de push
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null;
    
    try {
      const registration = await navigator.serviceWorker.register('/sw-push.js', {
        scope: '/'
      });
      console.log('[Push] Service Worker registrado:', registration);
      setSwRegistration(registration);
      return registration;
    } catch (error) {
      console.error('[Push] Erro ao registrar SW:', error);
      return null;
    }
  }, []);

  // Verificar suporte e estado atual
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'Notification' in window && 
                       'serviceWorker' in navigator && 
                       'PushManager' in window;
      
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        
        // Registrar service worker
        const registration = await registerServiceWorker();
        
        if (registration) {
          // Verificar subscription existente
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      }
    };

    checkSupport();
  }, [registerServiceWorker]);

  // Solicitar permissão
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: 'Não suportado',
        description: 'Seu navegador não suporta notificações push.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        return true;
      } else if (result === 'denied') {
        toast({
          title: 'Permissão negada',
          description: 'Para receber notificações, altere as configurações do navegador.',
          variant: 'destructive',
        });
      }
      return false;
    } catch (error) {
      console.error('[Push] Erro ao solicitar permissão:', error);
      return false;
    }
  }, [isSupported, toast]);

  // Inscrever para push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user || !isSupported) return false;

    setIsLoading(true);

    try {
      // Solicitar permissão se necessário
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setIsLoading(false);
          return false;
        }
      }

      // Garantir que temos um SW registrado
      let registration = swRegistration;
      if (!registration) {
        registration = await registerServiceWorker();
        if (!registration) {
          throw new Error('Falha ao registrar service worker');
        }
      }

      await registration.update();

      // Criar subscription
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      // Preparar dados para salvar
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth')),
        },
      };

      // Salvar no localStorage
      localStorage.setItem('push_subscription', JSON.stringify(subscriptionData));
      localStorage.setItem('push_user_id', user.id);
      
      setIsSubscribed(true);
      
      toast({
        title: 'Notificações ativadas!',
        description: 'Você receberá alertas importantes em tempo real.',
      });
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('[Push] Erro ao inscrever:', error);
      
      let message = 'Tente novamente mais tarde.';
      if (error.name === 'NotAllowedError') {
        message = 'Permissão negada. Verifique as configurações do navegador.';
      } else if (error.name === 'AbortError') {
        message = 'Operação cancelada.';
      }
      
      toast({
        title: 'Erro ao ativar notificações',
        description: message,
        variant: 'destructive',
      });
      
      setIsLoading(false);
      return false;
    }
  }, [user, isSupported, permission, swRegistration, requestPermission, registerServiceWorker, toast]);

  // Cancelar inscrição
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      if (swRegistration) {
        const subscription = await swRegistration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      localStorage.removeItem('push_subscription');
      localStorage.removeItem('push_user_id');
      setIsSubscribed(false);
      
      toast({
        title: 'Notificações desativadas',
        description: 'Você não receberá mais alertas push.',
      });

      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('[Push] Erro ao cancelar inscrição:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
  }, [swRegistration, toast]);

  // Mostrar notificação local (para testes ou fallback)
  const showLocalNotification = useCallback(async (
    title: string, 
    options?: NotificationOptions & { url?: string }
  ) => {
    if (!isSupported || permission !== 'granted') {
      toast({
        title,
        description: options?.body,
      });
      return;
    }

    try {
      if (swRegistration) {
        await swRegistration.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'local',
          ...options,
          data: { url: options?.url || '/' }
        });
      } else if ('Notification' in window) {
        new Notification(title, options);
      }
    } catch (error) {
      console.error('[Push] Erro ao mostrar notificação:', error);
      toast({
        title,
        description: options?.body,
      });
    }
  }, [isSupported, permission, swRegistration, toast]);

  // Testar notificação
  const testNotification = useCallback(async () => {
    await showLocalNotification('Teste de Notificação', {
      body: 'Se você está vendo isso, as notificações estão funcionando!',
      tag: 'test',
      url: '/perfil'
    });
  }, [showLocalNotification]);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification,
    testNotification,
  };
}

// Helpers
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
