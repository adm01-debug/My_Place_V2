import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function useExportPDF() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToPDF = useCallback(async (
    content: HTMLElement | string,
    options: ExportOptions = {}
  ) => {
    setIsExporting(true);

    try {
      const {
        title = 'Documento',
        orientation = 'portrait',
      } = options;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão permitidos.');
      }

      const contentHtml = typeof content === 'string' 
        ? content 
        : content.innerHTML;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            @page { size: A4 ${orientation}; margin: 20mm; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 12px; line-height: 1.5; color: #1a1a1a;
              background: white; margin: 0; padding: 20px;
            }
            h1, h2, h3, h4, h5, h6 { margin-top: 0; font-weight: 600; }
            h1 { font-size: 24px; } h2 { font-size: 20px; } h3 { font-size: 16px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #e5e5e5; padding: 8px 12px; text-align: left; }
            th { background: #f5f5f5; font-weight: 600; }
            .header {
              display: flex; justify-content: space-between; align-items: center;
              border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px;
            }
            .logo { font-size: 20px; font-weight: bold; color: #3b82f6; }
            .date { color: #666; font-size: 11px; }
            .footer {
              margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5;
              text-align: center; color: #666; font-size: 10px;
            }
            .highlight { background: #f0f9ff; padding: 12px; border-radius: 4px; margin: 8px 0; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; }
            .badge-success { background: #dcfce7; color: #166534; }
            .badge-warning { background: #fef3c7; color: #92400e; }
            .badge-error { background: #fee2e2; color: #991b1b; }
            .badge-info { background: #dbeafe; color: #1e40af; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
            .card { border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; }
            .stat-box { text-align: center; padding: 12px; border: 1px solid #e5e5e5; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
            .stat-label { font-size: 11px; color: #666; margin-top: 4px; }
            .section { margin-top: 24px; }
            @media print { body { padding: 0; } .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Portal do Colaborador</div>
            <div class="date">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
          </div>
          ${contentHtml}
          <div class="footer">
            Documento gerado automaticamente pelo Portal do Colaborador.<br>
            Este documento é válido sem assinatura conforme legislação vigente.
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
      setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);

      toast({ title: 'PDF gerado', description: 'Use a caixa de diálogo para salvar ou imprimir.' });
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast({ title: 'Erro ao exportar PDF', description: error.message, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  const generateTableHTML = useCallback((
    headers: string[],
    rows: (string | number)[][],
    title?: string
  ): string => {
    const headerCells = headers.map(h => `<th>${h}</th>`).join('');
    const bodyRows = rows.map(row =>
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
    return `
      ${title ? `<h2>${title}</h2>` : ''}
      <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
    `;
  }, []);

  // ==================== HOLERITE ====================
  const exportHolerite = useCallback((holerite: {
    mes: number; ano: number; salario_bruto: number; descontos: number;
    salario_liquido: number; detalhes?: any;
  }, colaboradorNome: string) => {
    const proventos = holerite.detalhes?.proventos || [];
    const descontos = holerite.detalhes?.descontos || [];

    const content = `
      <h1>Demonstrativo de Pagamento</h1>
      <h3>${MESES[holerite.mes - 1]} de ${holerite.ano}</h3>
      <div class="highlight"><strong>Colaborador:</strong> ${colaboradorNome}</div>
      <div class="grid" style="margin-top: 24px;">
        <div class="card">
          <h3>Proventos</h3>
          <table>
            <thead><tr><th>Descrição</th><th>Valor</th></tr></thead>
            <tbody>
              ${proventos.length > 0
                ? proventos.map((p: any) => `<tr><td>${p.descricao}</td><td>${formatCurrency(p.valor)}</td></tr>`).join('')
                : `<tr><td>Salário Base</td><td>${formatCurrency(holerite.salario_bruto)}</td></tr>`}
            </tbody>
            <tfoot><tr><th>Total Proventos</th><th>${formatCurrency(holerite.salario_bruto)}</th></tr></tfoot>
          </table>
        </div>
        <div class="card">
          <h3>Descontos</h3>
          <table>
            <thead><tr><th>Descrição</th><th>Valor</th></tr></thead>
            <tbody>
              ${descontos.length > 0
                ? descontos.map((d: any) => `<tr><td>${d.descricao}</td><td>${formatCurrency(d.valor)}</td></tr>`).join('')
                : `<tr><td>Descontos Diversos</td><td>${formatCurrency(holerite.descontos)}</td></tr>`}
            </tbody>
            <tfoot><tr><th>Total Descontos</th><th>${formatCurrency(holerite.descontos)}</th></tr></tfoot>
          </table>
        </div>
      </div>
      <div class="highlight" style="margin-top: 24px; text-align: center;">
        <h2 style="margin: 0; color: #16a34a;">Salário Líquido: ${formatCurrency(holerite.salario_liquido)}</h2>
      </div>
    `;

    exportToPDF(content, {
      filename: `holerite-${holerite.mes}-${holerite.ano}`,
      title: `Holerite ${MESES[holerite.mes - 1]} ${holerite.ano}`,
    });
  }, [exportToPDF]);

  // ==================== ESPELHO DE PONTO ====================
  const exportEspelhoPonto = useCallback((
    espelho: Array<{
      data: string;
      registros: Array<{ tipo: string; data_hora: string; status: string }>;
      horasTrabalhadas: number;
      status: string;
    }>,
    resumo: {
      horasNormais: number;
      horasExtras: number;
      bancoHoras: number;
      faltas: number;
      atrasos: number;
    },
    colaboradorNome: string,
    mesAno: string
  ) => {
    const formatMin = (min: number) => {
      const h = Math.floor(Math.abs(min) / 60);
      const m = Math.abs(min) % 60;
      const sinal = min < 0 ? '-' : min > 0 ? '+' : '';
      return `${sinal}${h}:${String(m).padStart(2, '0')}`;
    };

    const statusLabel: Record<string, string> = {
      ok: '✅ Regular',
      incompleto: '⚠️ Incompleto',
      falta: '❌ Falta',
      feriado: '🎉 Feriado',
      dsr: '🔵 DSR',
    };

    const rows = espelho.map(dia => {
      const dataFormatted = format(new Date(dia.data + 'T12:00:00'), 'dd/MM (EEE)', { locale: ptBR });
      const batidas = dia.registros.map(r =>
        format(new Date(r.data_hora), 'HH:mm')
      ).join(' | ') || '—';
      return [
        dataFormatted,
        batidas,
        formatMin(dia.horasTrabalhadas),
        statusLabel[dia.status] || dia.status,
      ];
    });

    const content = `
      <h1>Espelho de Ponto</h1>
      <h3>${mesAno}</h3>
      <div class="highlight"><strong>Colaborador:</strong> ${colaboradorNome}</div>

      <div class="grid" style="margin: 16px 0;">
        <div class="stat-box"><div class="stat-value">${formatMin(resumo.horasNormais)}</div><div class="stat-label">Horas Normais</div></div>
        <div class="stat-box"><div class="stat-value">${formatMin(resumo.horasExtras)}</div><div class="stat-label">Horas Extras</div></div>
        <div class="stat-box"><div class="stat-value">${formatMin(resumo.bancoHoras)}</div><div class="stat-label">Banco de Horas</div></div>
        <div class="stat-box"><div class="stat-value">${resumo.faltas}</div><div class="stat-label">Faltas</div></div>
      </div>

      ${generateTableHTML(['Data', 'Batidas', 'Horas', 'Status'], rows)}
    `;

    exportToPDF(content, {
      filename: `espelho-ponto-${mesAno.replace(/\//g, '-')}`,
      title: `Espelho de Ponto — ${mesAno}`,
    });
  }, [exportToPDF, generateTableHTML]);

  // ==================== FEEDBACK 360 ====================
  const exportFeedback360 = useCallback((
    dados: {
      colaboradorNome: string;
      cicloTitulo: string;
      mediaGeral: number;
      totalAvaliacoes: number;
      pontosFortes: string[];
      pontosMelhoria: string[];
      competencias: Array<{ nome: string; categoria: string; media: number; mediaEquipe: number }>;
    }
  ) => {
    const compRows = dados.competencias.map(c => [
      c.nome,
      c.categoria,
      c.media.toFixed(1),
      c.mediaEquipe.toFixed(1),
      c.media >= c.mediaEquipe ? '🟢 Acima' : '🔴 Abaixo',
    ]);

    const content = `
      <h1>Relatório de Feedback 360°</h1>
      <h3>${dados.cicloTitulo}</h3>
      <div class="highlight"><strong>Colaborador:</strong> ${dados.colaboradorNome}</div>

      <div class="grid" style="margin: 16px 0;">
        <div class="stat-box"><div class="stat-value">${dados.mediaGeral.toFixed(1)}</div><div class="stat-label">Média Geral</div></div>
        <div class="stat-box"><div class="stat-value">${dados.totalAvaliacoes}</div><div class="stat-label">Avaliações Recebidas</div></div>
      </div>

      <div class="section">
        ${generateTableHTML(
          ['Competência', 'Categoria', 'Sua Nota', 'Média Equipe', 'Posição'],
          compRows,
          'Avaliação por Competência'
        )}
      </div>

      <div class="grid section">
        <div class="card">
          <h3>🌟 Pontos Fortes</h3>
          <ul>${dados.pontosFortes.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
        <div class="card">
          <h3>📈 Pontos de Melhoria</h3>
          <ul>${dados.pontosMelhoria.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
      </div>
    `;

    exportToPDF(content, {
      filename: `feedback-360-${dados.cicloTitulo.replace(/\s/g, '-').toLowerCase()}`,
      title: `Feedback 360° — ${dados.cicloTitulo}`,
    });
  }, [exportToPDF, generateTableHTML]);

  // ==================== CERTIFICADO DE TREINAMENTO ====================
  const exportCertificado = useCallback((
    dados: {
      colaboradorNome: string;
      treinamentoTitulo: string;
      cargaHoraria: number;
      dataConclusao: string;
      nota?: number | null;
      instrutor?: string | null;
      categoria: string;
    }
  ) => {
    const dataFormatted = format(new Date(dados.dataConclusao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    const content = `
      <div style="text-align: center; padding: 40px 20px; border: 3px double #3b82f6; margin: 20px;">
        <div style="font-size: 14px; color: #666; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 8px;">
          Portal do Colaborador
        </div>
        <h1 style="font-size: 32px; color: #1e3a5f; margin: 24px 0 8px;">CERTIFICADO</h1>
        <p style="font-size: 14px; color: #666; margin-bottom: 32px;">de conclusão de treinamento</p>
        
        <p style="font-size: 14px; color: #333; margin-bottom: 8px;">Certificamos que</p>
        <h2 style="font-size: 28px; color: #3b82f6; border-bottom: 2px solid #3b82f6; display: inline-block; padding-bottom: 4px;">
          ${dados.colaboradorNome}
        </h2>
        
        <p style="font-size: 14px; color: #333; margin-top: 24px;">
          concluiu com êxito o treinamento
        </p>
        <h3 style="font-size: 22px; color: #1e3a5f; margin: 12px 0;">${dados.treinamentoTitulo}</h3>
        
        <div style="display: flex; justify-content: center; gap: 32px; margin: 24px 0;">
          <div><span class="badge badge-info">${dados.categoria}</span></div>
          <div><strong>${dados.cargaHoraria}h</strong> de carga horária</div>
          ${dados.nota ? `<div>Nota: <strong>${dados.nota.toFixed(1)}</strong></div>` : ''}
        </div>
        
        <p style="font-size: 13px; color: #666; margin-top: 32px;">
          Concluído em ${dataFormatted}
        </p>
        ${dados.instrutor ? `<p style="font-size: 13px; color: #666;">Instrutor: ${dados.instrutor}</p>` : ''}
        
        <div style="margin-top: 48px; display: flex; justify-content: space-around;">
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; width: 200px; margin: 0 auto; padding-top: 8px;">
              Coordenação de RH
            </div>
          </div>
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; width: 200px; margin: 0 auto; padding-top: 8px;">
              ${dados.instrutor || 'Instrutor Responsável'}
            </div>
          </div>
        </div>
      </div>
    `;

    exportToPDF(content, {
      filename: `certificado-${dados.treinamentoTitulo.replace(/\s/g, '-').toLowerCase()}`,
      title: `Certificado — ${dados.treinamentoTitulo}`,
      orientation: 'landscape',
    });
  }, [exportToPDF]);

  return {
    isExporting,
    exportToPDF,
    generateTableHTML,
    exportHolerite,
    exportEspelhoPonto,
    exportFeedback360,
    exportCertificado,
  };
}