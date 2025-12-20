import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  user_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  url?: string;
  tag?: string;
  tipo?: string;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Helper functions for base64url encoding/decoding
function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Web Push implementation using Web Crypto API
async function generateVapidAuthHeader(
  audience: string,
  subject: string,
  publicKey: string,
  privateKey: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key - need to convert to proper format for ECDSA
  const privateKeyBuffer = base64UrlToArrayBuffer(privateKey);
  
  // For ECDSA P-256, we need to import as JWK
  const privateKeyArray = new Uint8Array(privateKeyBuffer);
  const publicKeyBuffer = base64UrlToArrayBuffer(publicKey);
  const publicKeyArray = new Uint8Array(publicKeyBuffer);
  
  // Create JWK from raw keys
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: arrayBufferToBase64Url(publicKeyArray.slice(1, 33).buffer),
    y: arrayBufferToBase64Url(publicKeyArray.slice(33, 65).buffer),
    d: arrayBufferToBase64Url(privateKeyArray.buffer),
  };

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = arrayBufferToBase64Url(signature);
  const jwt = `${unsignedToken}.${signatureB64}`;

  return {
    authorization: `vapid t=${jwt}, k=${publicKey}`,
    cryptoKey: publicKey,
  };
}

// Encrypt the payload for Web Push using aes128gcm
async function encryptPayload(
  payloadText: string,
  p256dh: string,
  auth: string
): Promise<{ body: ArrayBuffer; salt: Uint8Array; localPublicKey: ArrayBuffer }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Generate local key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Import subscriber's public key
  const subscriberPublicKeyBuffer = base64UrlToArrayBuffer(p256dh);
  const subscriberPublicKey = await crypto.subtle.importKey(
    'raw',
    subscriberPublicKeyBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );

  // Export local public key
  const localPublicKeyBuffer = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyBuffer);

  // Derive encryption key using HKDF
  const authBuffer = base64UrlToArrayBuffer(auth);
  const authArray = new Uint8Array(authBuffer);
  const subscriberKeyArray = new Uint8Array(subscriberPublicKeyBuffer);
  
  // Create IKM info
  const ikmInfo = new Uint8Array([
    ...new TextEncoder().encode('WebPush: info\0'),
    ...subscriberKeyArray,
    ...localPublicKey,
  ]);

  // Import auth for HKDF
  const authKey = await crypto.subtle.importKey(
    'raw',
    authBuffer,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  // Derive IKM
  const ikm = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(sharedSecret),
      info: ikmInfo,
    },
    authKey,
    256
  );

  // Import IKM for deriving content encryption key and nonce
  const ikmKey = await crypto.subtle.importKey(
    'raw',
    ikm,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  // Derive content encryption key (16 bytes)
  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const contentEncryptionKey = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: cekInfo,
    },
    ikmKey,
    128
  );

  // Derive nonce (12 bytes)
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');
  const nonce = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: nonceInfo,
    },
    ikmKey,
    96
  );

  // Prepare payload with padding
  const payloadBytes = new TextEncoder().encode(payloadText);
  const paddedPayload = new Uint8Array(payloadBytes.length + 2);
  paddedPayload[0] = 2; // Delimiter
  paddedPayload[1] = 0; // No padding
  paddedPayload.set(payloadBytes, 2);

  // Import content encryption key for AES-GCM
  const aesKey = await crypto.subtle.importKey(
    'raw',
    contentEncryptionKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt the payload
  const encryptedPayload = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(nonce) },
    aesKey,
    paddedPayload
  );

  // Build the body: salt (16) + rs (4) + idlen (1) + keyid (65) + encrypted
  const recordSize = 4096;
  const header = new Uint8Array(86);
  header.set(salt, 0);
  header[16] = (recordSize >> 24) & 0xff;
  header[17] = (recordSize >> 16) & 0xff;
  header[18] = (recordSize >> 8) & 0xff;
  header[19] = recordSize & 0xff;
  header[20] = localPublicKey.length;
  header.set(localPublicKey, 21);

  const encryptedArray = new Uint8Array(encryptedPayload);
  const body = new Uint8Array(header.length + encryptedArray.length);
  body.set(header, 0);
  body.set(encryptedArray, header.length);

  return {
    body: body.buffer,
    salt,
    localPublicKey: localPublicKeyBuffer,
  };
}

async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    // Generate VAPID headers
    const vapidHeaders = await generateVapidAuthHeader(
      audience,
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Encrypt the payload
    const { body } = await encryptPayload(
      payload,
      subscription.p256dh,
      subscription.auth
    );

    // Send the push notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': vapidHeaders.authorization,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Content-Length': body.byteLength.toString(),
        'TTL': '86400', // 24 hours
        'Urgency': 'normal',
      },
      body: body,
    });

    if (response.status === 201 || response.status === 200) {
      return { success: true, statusCode: response.status };
    } else if (response.status === 410 || response.status === 404) {
      // Subscription expired or not found
      return { success: false, statusCode: response.status, error: 'Subscription expired' };
    } else {
      const errorText = await response.text();
      return { success: false, statusCode: response.status, error: errorText };
    }
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message || 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@myplace.com';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    console.log('[push] Recebido payload:', JSON.stringify(payload));

    // Check if VAPID keys are configured
    const hasVapidKeys = vapidPublicKey && vapidPrivateKey;
    if (!hasVapidKeys) {
      console.log('[push] VAPID keys não configuradas - usando modo fallback (notificações in-app)');
    }

    // Determinar lista de user_ids
    let userIds: string[] = [];
    if (payload.user_ids && payload.user_ids.length > 0) {
      userIds = payload.user_ids;
    } else if (payload.user_id) {
      userIds = [payload.user_id];
    } else {
      // Broadcast para todos
      const { data: allSubs } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .limit(1000);
      userIds = [...new Set((allSubs || []).map((s: { user_id: string }) => s.user_id))];
    }

    if (userIds.length === 0) {
      console.log('[push] Nenhum usuário para notificar');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'Nenhum usuário para notificar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar subscriptions dos usuários
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subError) {
      console.error('[push] Erro ao buscar subscriptions:', subError);
      throw subError;
    }

    console.log(`[push] Encontradas ${subscriptions?.length || 0} subscriptions para ${userIds.length} usuários`);

    // Preparar payload de notificação
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.tag || payload.tipo || 'default',
      url: payload.url || '/',
      data: { url: payload.url || '/' }
    });

    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    // Criar notificação in-app para todos os usuários
    for (const userId of userIds) {
      try {
        const { error: notifError } = await supabase.rpc('criar_notificacao', {
          p_user_id: userId,
          p_titulo: payload.title,
          p_mensagem: payload.body,
          p_tipo: payload.tipo || 'push',
          p_link: payload.url || '/',
          p_dados: { push_sent: hasVapidKeys, tag: payload.tag }
        });

        if (notifError) {
          console.error(`[push] Erro ao criar notificação in-app para ${userId}:`, notifError);
        }
      } catch (err) {
        console.error(`[push] Erro ao criar notificação in-app:`, err);
      }
    }

    // Enviar push notifications reais se VAPID keys estiverem configuradas
    if (hasVapidKeys && subscriptions && subscriptions.length > 0) {
      console.log('[push] Enviando push notifications reais...');
      
      const pushPromises = subscriptions.map(async (sub: PushSubscription) => {
        const result = await sendWebPush(
          sub,
          notificationPayload,
          vapidPublicKey!,
          vapidPrivateKey!,
          vapidSubject
        );

        if (result.success) {
          console.log(`[push] ✓ Enviado para user ${sub.user_id}`);
          sent++;
        } else {
          console.error(`[push] ✗ Falha para user ${sub.user_id}: ${result.error}`);
          failed++;
          
          // Mark expired subscriptions for removal
          if (result.statusCode === 410 || result.statusCode === 404) {
            expiredEndpoints.push(sub.endpoint);
          }
        }
      });

      await Promise.all(pushPromises);
    } else if (!hasVapidKeys) {
      // Fallback: mark all as "sent" since we created in-app notifications
      sent = userIds.length;
      console.log(`[push] Modo fallback: ${sent} notificações in-app criadas`);
    }

    // Limpar endpoints expirados
    if (expiredEndpoints.length > 0) {
      console.log(`[push] Removendo ${expiredEndpoints.length} endpoints expirados`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    console.log(`[push] Concluído: ${sent} enviados, ${failed} falharam, VAPID: ${hasVapidKeys ? 'ativo' : 'inativo'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent, 
        failed,
        mode: hasVapidKeys ? 'web-push' : 'fallback',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err as Error;
    console.error('[push] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
