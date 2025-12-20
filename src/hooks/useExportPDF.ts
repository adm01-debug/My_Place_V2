import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ExportOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
}

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
        filename = 'documento',
        title = 'Documento',
        orientation = 'portrait',
      } = options;

      // Create a new window for printing
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
            @page {
              size: A4 ${orientation};
              margin: 20mm;
            }
            
            * {
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 12px;
              line-height: 1.5;
              color: #1a1a1a;
              background: white;
              margin: 0;
              padding: 20px;
            }
            
            h1, h2, h3, h4, h5, h6 {
              margin-top: 0;
              font-weight: 600;
            }
            
            h1 { font-size: 24px; }
            h2 { font-size: 20px; }
            h3 { font-size: 16px; }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
            }
            
            th, td {
              border: 1px solid #e5e5e5;
              padding: 8px 12px;
              text-align: left;
            }
            
            th {
              background: #f5f5f5;
              font-weight: 600;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            
            .logo {
              font-size: 20px;
              font-weight: bold;
              color: #3b82f6;
            }
            
            .date {
              color: #666;
              font-size: 11px;
            }
            
            .footer {
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid #e5e5e5;
              text-align: center;
              color: #666;
              font-size: 10px;
            }
            
            .highlight {
              background: #f0f9ff;
              padding: 12px;
              border-radius: 4px;
              margin: 8px 0;
            }
            
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 500;
            }
            
            .badge-success { background: #dcfce7; color: #166534; }
            .badge-warning { background: #fef3c7; color: #92400e; }
            .badge-error { background: #fee2e2; color: #991b1b; }
            
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
            }
            
            .card {
              border: 1px solid #e5e5e5;
              border-radius: 8px;
              padding: 16px;
            }
            
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
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
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };

      // Fallback for some browsers
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);

      toast({
        title: 'PDF gerado',
        description: 'Use a caixa de diálogo para salvar ou imprimir.',
      });

    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Erro ao exportar PDF',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  // Helper to generate table HTML
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
      <table>
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    `;
  }, []);

  // Helper for holerite export
  const exportHolerite = useCallback((holerite: {
    mes: number;
    ano: number;
    salario_bruto: number;
    descontos: number;
    salario_liquido: number;
    detalhes?: any;
  }, colaboradorNome: string) => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const formatCurrency = (v: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    const proventos = holerite.detalhes?.proventos || [];
    const descontos = holerite.detalhes?.descontos || [];

    const content = `
      <h1>Demonstrativo de Pagamento</h1>
      <h3>${meses[holerite.mes - 1]} de ${holerite.ano}</h3>
      
      <div class="highlight">
        <strong>Colaborador:</strong> ${colaboradorNome}
      </div>
      
      <div class="grid" style="margin-top: 24px;">
        <div class="card">
          <h3>Proventos</h3>
          <table>
            <thead>
              <tr><th>Descrição</th><th>Valor</th></tr>
            </thead>
            <tbody>
              ${proventos.length > 0 
                ? proventos.map((p: any) => `<tr><td>${p.descricao}</td><td>${formatCurrency(p.valor)}</td></tr>`).join('')
                : `<tr><td>Salário Base</td><td>${formatCurrency(holerite.salario_bruto)}</td></tr>`
              }
            </tbody>
            <tfoot>
              <tr><th>Total Proventos</th><th>${formatCurrency(holerite.salario_bruto)}</th></tr>
            </tfoot>
          </table>
        </div>
        
        <div class="card">
          <h3>Descontos</h3>
          <table>
            <thead>
              <tr><th>Descrição</th><th>Valor</th></tr>
            </thead>
            <tbody>
              ${descontos.length > 0
                ? descontos.map((d: any) => `<tr><td>${d.descricao}</td><td>${formatCurrency(d.valor)}</td></tr>`).join('')
                : `<tr><td>Descontos Diversos</td><td>${formatCurrency(holerite.descontos)}</td></tr>`
              }
            </tbody>
            <tfoot>
              <tr><th>Total Descontos</th><th>${formatCurrency(holerite.descontos)}</th></tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <div class="highlight" style="margin-top: 24px; text-align: center;">
        <h2 style="margin: 0; color: #16a34a;">
          Salário Líquido: ${formatCurrency(holerite.salario_liquido)}
        </h2>
      </div>
    `;

    exportToPDF(content, {
      filename: `holerite-${holerite.mes}-${holerite.ano}`,
      title: `Holerite ${meses[holerite.mes - 1]} ${holerite.ano}`,
    });
  }, [exportToPDF]);

  return {
    isExporting,
    exportToPDF,
    generateTableHTML,
    exportHolerite,
  };
}
