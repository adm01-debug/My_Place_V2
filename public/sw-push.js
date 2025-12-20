// Service Worker para Push Notifications
// Este arquivo lida com notificações push em background

self.addEventListener('push', function(event) {
  console.log('[SW] Push recebido:', event);

  let data = {
    title: 'Portal do Colaborador',
    body: 'Você tem uma nova notificação',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'default',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || payload.type || data.tag,
        data: {
          url: payload.url || payload.link || '/',
          ...payload.data
        }
      };
    } catch (e) {
      console.error('[SW] Erro ao parsear payload:', e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [100, 50, 100],
    renotify: true,
    requireInteraction: data.tag === 'importante',
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ],
    data: data.data
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notificação clicada:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Se já existe uma janela aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (urlToOpen !== '/') {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // Senão, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notificação fechada:', event);
});

// Evento para sincronização em background
self.addEventListener('sync', function(event) {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      // Lógica de sincronização de notificações pendentes
      Promise.resolve()
    );
  }
});

// Evento de instalação
self.addEventListener('install', function(event) {
  console.log('[SW Push] Instalado');
  self.skipWaiting();
});

// Evento de ativação
self.addEventListener('activate', function(event) {
  console.log('[SW Push] Ativado');
  event.waitUntil(clients.claim());
});
