import { useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Notificacao, Filtro } from '@/components/notificacoes/types';

interface Params {
  filtradas: Notificacao[];
  filtro: Filtro;
  busca: string;
}

const escCsv = (v: string): string =>
  `"${(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

const escHtml = (s: string): string =>
  (s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  );

const TIPO_BADGE: Record<Notificacao['tipo'], string> = {
  erro: '#dc2626',
  alerta: '#d97706',
  sucesso: '#16a34a',
  info: '#2563eb',
};

export interface NotificacoesExport {
  exportarCSV: () => void;
  exportarPDF: () => void;
}

/**
 * Consolida exportação em CSV (BOM UTF-8, ; como separador) e PDF (via janela de impressão).
 * Ambas as funções tratam lista vazia com um toast informativo e escape seguro dos campos.
 */
export function useNotificacoesExport({ filtradas, filtro, busca }: Params): NotificacoesExport {
  const exportarCSV = useCallback(() => {
    if (filtradas.length === 0) {
      toast.info('Nada para exportar no filtro atual');
      return;
    }
    const header = ['Data', 'Tipo', 'Status', 'Título', 'Mensagem', 'Link'];
    const linhas = filtradas.map((n) => [
      format(new Date(n.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      n.tipo,
      n.lida ? 'lida' : 'não lida',
      n.titulo,
      n.mensagem,
      n.link ?? '',
    ]);
    const csv =
      '\ufeff' + [header, ...linhas].map((r) => r.map(escCsv).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notificacoes_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filtradas.length} notificações exportadas em CSV`);
  }, [filtradas]);

  const exportarPDF = useCallback(() => {
    if (filtradas.length === 0) {
      toast.info('Nada para exportar no filtro atual');
      return;
    }
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      toast.error('Bloqueado pelo navegador. Permita pop-ups para exportar em PDF.');
      return;
    }
    const rows = filtradas
      .map(
        (n) => `
      <tr class="${n.lida ? 'lida' : 'nao-lida'}">
        <td>${format(new Date(n.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</td>
        <td><span class="tipo" style="background:${TIPO_BADGE[n.tipo]}20;color:${TIPO_BADGE[n.tipo]}">${n.tipo}</span></td>
        <td>${n.lida ? '✓ lida' : '● não lida'}</td>
        <td><strong>${escHtml(n.titulo)}</strong><br/><span class="msg">${escHtml(n.mensagem)}</span></td>
      </tr>`,
      )
      .join('');
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
      <title>Notificações — ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</title>
      <style>
        *{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:24px;color:#111}
        h1{font-size:20px;margin:0 0 4px}.sub{color:#666;font-size:12px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th,td{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}
        th{background:#f9fafb;text-transform:uppercase;font-size:10px;letter-spacing:.05em;color:#6b7280}
        .tipo{padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;text-transform:capitalize}
        .msg{color:#4b5563;font-size:10px}.nao-lida td{background:#fef9c320}
        @media print{@page{size:A4;margin:15mm}body{margin:0}}
      </style></head><body>
      <h1>Central de Notificações</h1>
      <div class="sub">Exportado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} — ${filtradas.length} registro(s) — filtro: ${filtro}${busca ? ` — busca: "${escHtml(busca)}"` : ''}</div>
      <table><thead><tr><th>Data</th><th>Tipo</th><th>Status</th><th>Conteúdo</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script>
      </body></html>`);
    w.document.close();
    toast.success('Abrindo diálogo de impressão — selecione "Salvar como PDF"');
  }, [filtradas, filtro, busca]);

  return { exportarCSV, exportarPDF };
}
