import { useEffect, useRef } from 'react';

/**
 * Atualiza dinamicamente o <title> da aba e desenha um badge circular
 * no favicon com a contagem de notificações não lidas.
 *
 * - Preserva o título original e o favicon original ao desmontar.
 * - Usa canvas 64x64 para nitidez em telas retina.
 * - Cap visual em "99+" quando count > 99.
 */
export function useFaviconBadge(count: number, baseTitle = 'Notificações') {
  const originalTitleRef = useRef<string | null>(null);
  const originalHrefRef = useRef<string | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (originalTitleRef.current === null) {
      originalTitleRef.current = document.title;
    }
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (link && originalHrefRef.current === null) {
      originalHrefRef.current = link.href;
    }
  }, []);

  useEffect(() => {
    document.title = count > 0 ? `(${count > 99 ? '99+' : count}) ${baseTitle}` : baseTitle;
  }, [count, baseTitle]);

  useEffect(() => {
    const link =
      document.querySelector<HTMLLinkElement>("link[rel~='icon']") ||
      (() => {
        const l = document.createElement('link');
        l.rel = 'icon';
        document.head.appendChild(l);
        return l;
      })();

    if (!originalHrefRef.current) originalHrefRef.current = link.href;

    if (count <= 0) {
      if (originalHrefRef.current) link.href = originalHrefRef.current;
      return;
    }

    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawBadge = () => {
      // círculo de fundo vermelho
      const radius = 22;
      const cx = size - radius - 2;
      const cy = size - radius - 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // texto
      const text = count > 99 ? '99+' : String(count);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${text.length > 2 ? 22 : 28}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, cx, cy + 1);

      link.href = canvas.toDataURL('image/png');
    };

    // desenha o favicon original como base, depois o badge
    const img = new Image();
    img.crossOrigin = 'anonymous';
    originalImageRef.current = img;
    img.onload = () => {
      ctx.clearRect(0, 0, size, size);
      try {
        ctx.drawImage(img, 0, 0, size, size);
      } catch {
        // se CORS bloquear, usa fundo neutro
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, size, size);
      }
      drawBadge();
    };
    img.onerror = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, size, size);
      drawBadge();
    };
    img.src = originalHrefRef.current || '/favicon.ico';
  }, [count]);

  useEffect(() => {
    return () => {
      if (originalTitleRef.current !== null) {
        document.title = originalTitleRef.current;
      }
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (link && originalHrefRef.current) {
        link.href = originalHrefRef.current;
      }
    };
  }, []);
}
