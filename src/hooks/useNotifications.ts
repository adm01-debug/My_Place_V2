import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    route: string;
  };
}

const mockNotifications: Omit<Notification, 'id' | 'timestamp' | 'read'>[] = [
  {
    title: 'Holerite disponível',
    message: 'Seu holerite de Dezembro/2024 está disponível para consulta.',
    type: 'success',
    action: { label: 'Ver holerite', route: '/holerites' },
  },
  {
    title: 'Férias aprovadas',
    message: 'Sua solicitação de férias foi aprovada pelo gestor.',
    type: 'success',
    action: { label: 'Ver detalhes', route: '/ferias' },
  },
  {
    title: 'Treinamento pendente',
    message: 'Você tem 2 treinamentos obrigatórios pendentes.',
    type: 'warning',
    action: { label: 'Ver treinamentos', route: '/treinamentos' },
  },
  {
    title: 'Novo comunicado',
    message: 'A empresa publicou um novo comunicado importante.',
    type: 'info',
    action: { label: 'Ler comunicado', route: '/comunicados' },
  },
  {
    title: 'Ponto irregular',
    message: 'Foi detectada uma inconsistência no seu registro de ponto.',
    type: 'alert',
    action: { label: 'Verificar', route: '/ponto' },
  },
  {
    title: 'Benefício atualizado',
    message: 'Seu vale refeição foi creditado com sucesso.',
    type: 'success',
    action: { label: 'Ver benefícios', route: '/beneficios' },
  },
  {
    title: 'Meta atingida!',
    message: 'Parabéns! Você atingiu 100% da meta de vendas.',
    type: 'success',
    action: { label: 'Ver metas', route: '/variavel' },
  },
  {
    title: 'Documento expirado',
    message: 'Seu atestado de saúde ocupacional vence em 7 dias.',
    type: 'warning',
    action: { label: 'Ver documentos', route: '/documentos' },
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Generate initial notifications
  useEffect(() => {
    const initial: Notification[] = mockNotifications.slice(0, 3).map((n, i) => ({
      ...n,
      id: `notif-${i}`,
      timestamp: new Date(Date.now() - i * 3600000), // Stagger by hours
      read: i > 0, // First one unread
    }));
    setNotifications(initial);
    setUnreadCount(initial.filter(n => !n.read).length);
  }, []);

  // Simulate push notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const randomNotif = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
      const newNotif: Notification = {
        ...randomNotif,
        id: `notif-${Date.now()}`,
        timestamp: new Date(),
        read: false,
      };

      setNotifications(prev => [newNotif, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);

      // Show toast
      toast({
        title: newNotif.title,
        description: newNotif.message,
        variant: newNotif.type === 'alert' ? 'destructive' : 'default',
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [toast]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notif = prev.find(n => n.id === id);
      if (notif && !notif.read) {
        setUnreadCount(c => Math.max(0, c - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  const triggerNotification = useCallback(() => {
    const randomNotif = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
    const newNotif: Notification = {
      ...randomNotif,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
    setUnreadCount(prev => prev + 1);

    toast({
      title: newNotif.title,
      description: newNotif.message,
      variant: newNotif.type === 'alert' ? 'destructive' : 'default',
    });

    return newNotif;
  }, [toast]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    triggerNotification,
  };
}
