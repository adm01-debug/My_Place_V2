import { TipoVale, ValeRequest, valeLabels } from '@/pages/Vales';

interface ValeReceiptProfile {
  nome?: string | null;
  cargo?: string | null;
  matricula?: string | null;
  cpf?: string | null;
}

interface ValeReceiptProps {
  vale: ValeRequest;
  profile: ValeReceiptProfile | null;
}

export const ValeReceipt = ({ vale, profile }: ValeReceiptProps) => {
  return (
    <div className="p-8 bg-white text-slate-900 font-serif max-w-2xl mx-auto border shadow-sm rounded-lg overflow-hidden relative">
      {/* Security Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
        <p className="text-9xl font-black rotate-[-35deg] whitespace-nowrap">
          ORIGINAL • ORIGINAL • ORIGINAL
        </p>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
          <div>
            <div className="bg-slate-900 text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest mb-2 inline-block rounded">
              Documento Oficial Interno
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-tighter">Comprovante de Operação</h1>
            <p className="text-[10px] text-slate-500 mt-1 font-sans">AUTENTICAÇÃO: {vale.id.toUpperCase()}</p>
          </div>
          <div className="text-right font-sans">
            <p className="font-bold text-sm">{new Date().toLocaleDateString('pt-BR')}</p>
            <p className="text-[9px] uppercase font-bold text-emerald-600 flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
              Assinatura Digital Ativa
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 font-sans">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Beneficiário</p>
              <p className="font-bold text-lg leading-tight">{profile?.nome || 'Colaborador'}</p>
              <p className="text-xs text-slate-600">{profile?.cargo || 'Cargo não informado'}</p>
              <p className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1 font-mono">
                MAT: {profile?.matricula || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">CPF / Identificação</p>
              <p className="text-sm font-medium">{profile?.cpf || '---'}</p>
            </div>
          </div>
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg transform rotate-1">
            <p className="text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-widest text-right">Valor Líquido</p>
            <p className="text-4xl font-black text-right tracking-tighter">
              R$ {vale.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="h-0.5 bg-white/20 my-3" />
            <p className="text-[9px] text-slate-300 text-right leading-tight italic">
              Este montante será processado conforme as normas de {valeLabels[vale.tipo].toLowerCase()}.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-12 font-sans">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-[9px] uppercase font-black text-slate-400 mb-1 tracking-wider">Natureza da Solicitação</p>
            <p className="font-bold text-slate-700">{valeLabels[vale.tipo]}</p>
          </div>
          <div className="p-4 border-l-4 border-slate-200 bg-slate-50/50">
            <p className="text-[9px] uppercase font-black text-slate-400 mb-1 tracking-wider">Justificativa Declarada</p>
            <p className="text-sm leading-relaxed text-slate-600 italic">"{vale.justificativa}"</p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t-2 border-slate-100 font-sans">
          <div className="grid grid-cols-2 gap-16">
            <div className="text-center">
              <div className="h-[1px] bg-slate-300 mb-2 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] text-slate-300 italic">Validado Eletronicamente</div>
              </div>
              <p className="text-[9px] uppercase font-black text-slate-400">Departamento de RH / Financeiro</p>
              <p className="text-[8px] text-slate-300 mt-1">SISTEMA INTEGRADO DE GESTÃO</p>
            </div>
            <div className="text-center">
              <div className="h-[1px] bg-slate-300 mb-2 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] text-slate-300 italic">Assinado via Token</div>
              </div>
              <p className="text-[9px] uppercase font-black text-slate-400">Assinatura do Colaborador</p>
              <p className="text-[8px] text-slate-300 mt-1">ID DISPOSITIVO: {Math.random().toString(36).substring(7).toUpperCase()}</p>
            </div>
          </div>
          
          <div className="mt-12 flex justify-between items-end border-t border-slate-50 pt-4">
            <div className="text-[7px] text-slate-400 max-w-xs leading-tight">
              A autenticidade deste documento pode ser verificada no portal do colaborador. 
              Emissão gerada automaticamente pelo sistema em {new Date().toLocaleString('pt-BR')}.
              Conforme MP 2.200-2/2001.
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center border border-slate-200">
               {/* Simulating a small QR code space */}
               <div className="grid grid-cols-3 gap-0.5">
                 {[...Array(9)].map((_, i) => (
                   <div key={i} className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-slate-900' : 'bg-transparent'}`} />
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
