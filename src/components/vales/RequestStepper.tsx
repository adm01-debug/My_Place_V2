import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Utensils, 
  Bus, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Info,
  CheckCircle2,
  Wallet,
  AlertCircle,
  Paperclip,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TipoVale, valeLabels } from '@/pages/Vales';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RequestStepperProps {
  onClose: () => void;
  onSubmit: (data: { type: TipoVale; amount: string; justification: string; attachmentUrl?: string }) => void;
  isSubmitting: boolean;
  availableAdvance: number;
}

const steps = [
  { id: 'type', title: 'Tipo de Vale', description: 'O que você precisa?' },
  { id: 'details', title: 'Valores', description: 'Quanto e por quê?' },
  { id: 'review', title: 'Revisão', description: 'Tudo certinho?' },
  { id: 'success', title: 'Sucesso', description: 'Tudo pronto!' }
];

export const RequestStepper = ({ onClose, onSubmit, isSubmitting, availableAdvance }: RequestStepperProps) => {
  const salaryMissing = availableAdvance === 0 && (availableAdvance !== availableAdvance || availableAdvance === null || availableAdvance === 0);
  // Actually, let's just check if availableAdvance is passed as 0 and if salary is likely missing.
  // In Vales.tsx: availableAdvance = salary > 0 ? maxAdvance - currentUsed : 0;
  // So if salary is 0, availableAdvance is 0.

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedType, setSelectedType] = useState<TipoVale>('adiantamento_salarial');
  const [amount, setAmount] = useState('');
  const [justification, setJustification] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const typeOptions: { id: TipoVale; label: string; icon: any; color: string; description: string }[] = [
    { 
      id: 'adiantamento_salarial', 
      label: 'Adiantamento', 
      icon: DollarSign, 
      color: 'bg-emerald-500',
      description: 'Antecipação do seu salário base' 
    },
    { 
      id: 'vale_refeicao', 
      label: 'Vale Refeição', 
      icon: Utensils, 
      color: 'bg-orange-500',
      description: 'Auxílio para alimentação diária' 
    },
    { 
      id: 'vale_transporte', 
      label: 'Transporte', 
      icon: Bus, 
      color: 'bg-blue-500',
      description: 'Recarga de cartões de transporte' 
    },
    { 
      id: 'vale_combustivel', 
      label: 'Combustível', 
      icon: ShieldCheck, 
      color: 'bg-indigo-500',
      description: 'Auxílio para deslocamento próprio' 
    },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'O limite é de 5MB.' });
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `solicitacoes/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('anexos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('anexos')
        .getPublicUrl(filePath);

      setAttachmentUrl(publicUrl);
      toast.success('Arquivo enviado!');
    } catch (error: any) {
      toast.error('Erro no upload', { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      await onSubmit({ 
        type: selectedType, 
        amount, 
        justification, 
        attachmentUrl: attachmentUrl || undefined 
      });
      setCurrentStep(3);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  };

  const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
  const isAmountValid = numAmount > 0 && (selectedType !== 'adiantamento_salarial' || numAmount <= availableAdvance);

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  index <= currentStep 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStep ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold">{index + 1}</span>}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-[2px] flex-1 mx-4 transition-all duration-500 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-1 min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typeOptions.map((option) => (
                  <Card
                    key={option.id}
                    onClick={() => setSelectedType(option.id)}
                    className={`p-4 cursor-pointer transition-all border-2 relative group hover:shadow-md ${
                      selectedType === option.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border/50 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${option.color} text-white shadow-lg`}>
                        <option.icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm">{option.label}</h4>
                        <p className="text-xs text-muted-foreground leading-tight">{option.description}</p>
                      </div>
                    </div>
                    {selectedType === option.id && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    Valor Solicitado
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
                    <Input
                      type="text"
                      placeholder="0,00"
                      className="pl-12 h-14 text-2xl font-black bg-muted/30 border-2 border-border/50 focus:border-primary transition-all"
                      value={amount}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value) {
                          value = (parseInt(value) / 100).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          });
                          setAmount(value);
                        } else {
                          setAmount('');
                        }
                      }}
                    />
                  </div>
                  
                  {selectedType === 'adiantamento_salarial' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-2"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-bold uppercase tracking-wider">Simulador de Impacto</span>
                        <Badge variant="outline" className="text-[10px] font-black uppercase">Próximo Holerite</Badge>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Dedução Estimada</p>
                          <p className={`text-lg font-black ${numAmount > availableAdvance ? 'text-red-500' : 'text-primary'}`}>
                            - R$ {numAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Limite Disponível</p>
                          <p className="text-sm font-bold">R$ {availableAdvance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      {numAmount > availableAdvance && (
                        <div className="flex items-center gap-2 pt-2 text-[10px] text-red-500 font-bold uppercase">
                          <AlertCircle className="w-3 h-3" />
                          Valor excede o limite permitido
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    Justificativa (Opcional)
                  </Label>
                  <Textarea
                    placeholder="Descreva brevemente o motivo da solicitação..."
                    className="min-h-[100px] bg-muted/30 border-2 border-border/50 focus:border-primary transition-all rounded-xl"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-primary" />
                    Anexar Comprovante (Opcional)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12 border-dashed border-2 hover:border-primary/50 transition-all"
                      disabled={isUploading}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Paperclip className="w-4 h-4 mr-2" />}
                      {attachmentUrl ? 'Arquivo Pronto' : 'Selecionar Arquivo'}
                    </Button>
                    <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
                    {attachmentUrl && (
                      <Button variant="ghost" size="icon" onClick={() => setAttachmentUrl(null)} className="text-red-500">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-2xl p-6 border-2 border-border/50 space-y-4">
                  <div className="flex justify-between items-center border-b border-border/50 pb-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tipo</span>
                    <Badge className="bg-primary hover:bg-primary px-3 py-1 font-black text-[10px] uppercase">
                      {valeLabels[selectedType]}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Valor</span>
                    <span className="text-2xl font-black text-primary">R$ {amount}</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Justificativa</span>
                    <p className="text-sm text-foreground/80 leading-relaxed italic bg-background/50 p-3 rounded-lg border border-border/30">
                      "{justification || 'Nenhuma justificativa informada.'}"
                    </p>
                  </div>
                  {attachmentUrl && (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase">Comprovante em anexo</span>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                  <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 leading-tight">
                    Ao confirmar, sua solicitação entrará em fluxo de aprovação.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Solicitação Enviada!</h3>
                  <p className="text-sm text-muted-foreground max-w-[280px]">
                    Sua solicitação de {valeLabels[selectedType]} no valor de R$ {amount} foi registrada com sucesso.
                  </p>
                </div>
                <Button onClick={onClose} className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                  Voltar ao Dashboard
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Stepper Footer */}
      {currentStep < 3 && (
        <div className="flex gap-3 pt-8 mt-auto px-2">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 h-12 rounded-xl border-border/50 font-bold uppercase text-[10px] tracking-widest transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          <Button
            onClick={handleNext}
            disabled={isSubmitting || isUploading || (currentStep === 1 && !isAmountValid)}
            className="flex-[2] h-12 rounded-xl shadow-lg shadow-primary/20 font-bold uppercase text-[10px] tracking-widest transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {currentStep === 2 ? 'Confirmar Solicitação' : 'Continuar'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
