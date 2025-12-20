// Service Worker para Push Notifications + Offline Mode
// Portal do Colaborador - my-place

const CACHE_NAME = 'my-place-v1';
const OFFLINE_PONTO_KEY = 'offline-registros-ponto';

// Recursos para cache estático
const STATIC_CACHE = [
  '/',
  '/ponto',
  '/offline.html',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/favicon.ico',
];

// =====================================================
// INSTALAÇÃO
// =====================================================

self.addEventListener('install', function(event) {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Cache aberto, adicionando recursos estáticos');
      return cache.addAll(STATIC_CACHE).catch(err => {
        console.warn('[SW] Alguns recursos não puderam ser cacheados:', err);
      });
    })
  );
  
  self.skipWaiting();
});

// =====================================================
// ATIVAÇÃO
// =====================================================

self.addEventListener('activate', function(event) {
  console.log('[SW] Service Worker ativado');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// =====================================================
// FETCH - Cache Strategy
// =====================================================

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  
  // Ignorar requests que não são GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignorar requests para APIs externas (Supabase)
  if (url.hostname.includes('supabase')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        // Retorna do cache, mas atualiza em background
        event.waitUntil(updateCache(event.request));
        return cachedResponse;
      }
      
      return fetch(event.request).then(function(networkResponse) {
        // Cacheia a resposta para próximos acessos
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(function() {
        // Offline - retorna página offline para navegação
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

async function updateCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response);
    }
  } catch (err) {
    // Silently fail - estamos offline
  }
}

// =====================================================
// PUSH NOTIFICATIONS
// =====================================================

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
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (urlToOpen !== '/') {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

// =====================================================
// BACKGROUND SYNC - Registros de Ponto Offline
// =====================================================

self.addEventListener('sync', function(event) {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-ponto') {
    event.waitUntil(syncRegistrosPonto());
  }
});

async function syncRegistrosPonto() {
  console.log('[SW] Sincronizando registros de ponto offline...');
  
  try {
    // Buscar registros salvos offline
    const db = await openIndexedDB();
    const registros = await getAllOfflineRegistros(db);
    
    if (registros.length === 0) {
      console.log('[SW] Nenhum registro offline para sincronizar');
      return;
    }
    
    console.log('[SW] Encontrados', registros.length, 'registros para sincronizar');
    
    // Buscar token de autenticação do localStorage (via cliente)
    const clients = await self.clients.matchAll({ type: 'window' });
    let authToken = null;
    
    for (const client of clients) {
      try {
        const messageChannel = new MessageChannel();
        client.postMessage({ type: 'GET_AUTH_TOKEN' }, [messageChannel.port2]);
        
        authToken = await new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data.token);
          };
          // Timeout após 2 segundos
          setTimeout(() => resolve(null), 2000);
        });
        
        if (authToken) break;
      } catch (err) {
        console.warn('[SW] Erro ao obter token do cliente:', err);
      }
    }
    
    if (!authToken) {
      console.warn('[SW] Sem token de autenticação, tentando sincronização anônima...');
      // Guardar para tentar depois
      return;
    }
    
    // Preparar dados para envio
    const dadosParaEnviar = registros.map(r => ({
      ...r.data,
      offline_id: String(r.id),
    }));
    
    // Enviar para a edge function
    const supabaseUrl = 'https://kovduclqrnkdwhjygaej.supabase.co';
    const response = await fetch(`${supabaseUrl}/functions/v1/sync-ponto-offline`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(dadosParaEnviar)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('[SW] Resultado da sincronização:', result);
      
      // Remover registros sincronizados com sucesso
      for (const successId of result.details.success) {
        const registroId = registros.find(r => String(r.id) === successId)?.id;
        if (registroId) {
          await deleteOfflineRegistro(db, registroId);
          console.log('[SW] Registro removido do offline:', registroId);
        }
      }
      
      // Notificar usuário
      if (result.success > 0) {
        await self.registration.showNotification('Ponto sincronizado', {
          body: `${result.success} registro(s) de ponto sincronizado(s) com sucesso.`,
          icon: '/pwa-192x192.png',
          tag: 'sync-success'
        });
      }
      
      if (result.failed > 0) {
        await self.registration.showNotification('Erro na sincronização', {
          body: `${result.failed} registro(s) não puderam ser sincronizados.`,
          icon: '/pwa-192x192.png',
          tag: 'sync-error'
        });
      }
    } else {
      const errorText = await response.text();
      console.error('[SW] Erro na resposta:', response.status, errorText);
    }
    
  } catch (err) {
    console.error('[SW] Erro no sync:', err);
  }
}

// =====================================================
// INDEXED DB HELPERS
// =====================================================

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('my-place-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('registros-ponto')) {
        db.createObjectStore('registros-ponto', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllOfflineRegistros(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['registros-ponto'], 'readonly');
    const store = transaction.objectStore('registros-ponto');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteOfflineRegistro(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['registros-ponto'], 'readwrite');
    const store = transaction.objectStore('registros-ponto');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// =====================================================
// MESSAGE HANDLER - Comunicação com o App
// =====================================================

self.addEventListener('message', function(event) {
  console.log('[SW] Mensagem recebida:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'SAVE_PONTO_OFFLINE') {
    event.waitUntil(
      saveRegistroPontoOffline(event.data.payload).then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch(err => {
        event.ports[0].postMessage({ success: false, error: err.message });
      })
    );
  }
  
  if (event.data.type === 'GET_OFFLINE_COUNT') {
    event.waitUntil(
      getOfflineCount().then(count => {
        event.ports[0].postMessage({ count });
      })
    );
  }
});

async function saveRegistroPontoOffline(data) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['registros-ponto'], 'readwrite');
    const store = transaction.objectStore('registros-ponto');
    const request = store.add({
      data,
      timestamp: Date.now()
    });
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Registrar para sync quando online
      if ('sync' in self.registration) {
        self.registration.sync.register('sync-ponto');
      }
      resolve(request.result);
    };
  });
}

async function getOfflineCount() {
  try {
    const db = await openIndexedDB();
    const registros = await getAllOfflineRegistros(db);
    return registros.length;
  } catch {
    return 0;
  }
}

console.log('[SW] Service Worker carregado - my-place v1');
