import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'notif_alertas_som';

/**
 * Alerta audível + tátil para novas notificações prioritárias.
 * - Som via Web Audio API (sem depender de asset externo).
 * - Vibração via navigator.vibrate quando suportado (mobile).
 * - Respeita preferência do usuário persistida em localStorage.
 * - Debounce interno (800ms) evita "flood" quando várias entram juntas.
 */
export function useNotificationAlert() {
  const [alertasAtivos, setAlertasAtivos] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) !== '0';
  });
  const lastPlayedRef = useRef<number>(0);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, alertasAtivos ? '1' : '0');
  }, [alertasAtivos]);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (ctxRef.current) return ctxRef.current;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctxRef.current = new Ctor();
      return ctxRef.current;
    } catch {
      return null;
    }
  }, []);

  const playAlert = useCallback(
    (priority: 'alta' | 'media' | 'baixa' = 'media') => {
      if (!alertasAtivos) return;
      if (priority === 'baixa') return;
      const now = Date.now();
      if (now - lastPlayedRef.current < 800) return;
      lastPlayedRef.current = now;

      // Vibração tátil (mobile)
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(priority === 'alta' ? [80, 40, 120] : [60]);
        }
      } catch {
        /* ignore */
      }

      // Som sintetizado (dois tons rápidos para alta prioridade)
      const ctx = getCtx();
      if (!ctx) return;
      try {
        if (ctx.state === 'suspended') void ctx.resume();
        const tones = priority === 'alta' ? [880, 1175] : [660];
        tones.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const start = ctx.currentTime + i * 0.16;
          const dur = 0.14;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
          osc.connect(gain).connect(ctx.destination);
          osc.start(start);
          osc.stop(start + dur + 0.02);
        });
      } catch {
        /* ignore */
      }
    },
    [alertasAtivos, getCtx],
  );

  const toggleAlertas = useCallback(() => {
    setAlertasAtivos((v) => {
      const next = !v;
      // "Prime" o AudioContext no gesto do usuário para permitir tocar depois.
      if (next) {
        const ctx = getCtx();
        if (ctx && ctx.state === 'suspended') void ctx.resume();
      }
      return next;
    });
  }, [getCtx]);

  return { alertasAtivos, toggleAlertas, playAlert };
}
