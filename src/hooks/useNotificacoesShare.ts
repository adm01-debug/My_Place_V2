import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Notificacao } from '@/components/notificacoes/types';

/**
 * Resolve o link da notificação para uma URL absoluta.
 * Retorna `undefined` quando não há link associado.
 */
function resolveLinkAbsoluto(link: string | null): string | undefined {
  if (!link) return undefined;
  if (link.startsWith('http')) return link;
  return `${window.location.origin}${link.startsWith('/') ? '' : '/'}${link}`;
}

/** Monta o texto compartilhável: título, mensagem e link absoluto (quando existir). */
export function buildShareText(n: Notificacao): string {
  const linkAbs = resolveLinkAbsoluto(n.link);
  return `${n.titulo}\n\n${n.mensagem}${linkAbs ? `\n\n${linkAbs}` : ''}`;
}

/** Copia texto usando Clipboard API com fallback para `execCommand` em navegadores antigos. */
async function copyToClipboard(texto: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(texto);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = texto;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

export interface NotificacoesShare {
  copiarNotificacao: (n: Notificacao) => Promise<void>;
  compartilharNotificacao: (n: Notificacao) => Promise<void>;
}

/**
 * Encapsula copiar/compartilhar notificações.
 * `compartilharNotificacao` usa Web Share API quando disponível e degrada
 * silenciosamente para a área de transferência. Cancelamento do usuário
 * (`AbortError`) não é tratado como erro.
 */
export function useNotificacoesShare(): NotificacoesShare {
  const copiarNotificacao = useCallback(async (n: Notificacao) => {
    try {
      await copyToClipboard(buildShareText(n));
      toast.success('Notificação copiada para a área de transferência');
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Não foi possível copiar');
    }
  }, []);

  const compartilharNotificacao = useCallback(
    async (n: Notificacao) => {
      const linkAbs = resolveLinkAbsoluto(n.link);
      try {
        if (typeof navigator.share === 'function') {
          await navigator.share({
            title: n.titulo,
            text: n.mensagem,
            ...(linkAbs ? { url: linkAbs } : {}),
          });
          return;
        }
        await copiarNotificacao(n);
      } catch (error: unknown) {
        // AbortError = usuário cancelou o share nativo, não é falha
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Erro ao compartilhar:', error);
        await copiarNotificacao(n);
      }
    },
    [copiarNotificacao],
  );

  return { copiarNotificacao, compartilharNotificacao };
}
