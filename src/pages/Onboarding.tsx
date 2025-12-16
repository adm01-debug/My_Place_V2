import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  FileText, 
  Clock, 
  Umbrella, 
  Bell, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface OnboardingStep {
  id: number;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  features: string[];
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    icon: Sparkles,
    title: 'Bem-vindo ao Portal!',
    description: 'Seu novo espaço para gerenciar tudo sobre sua vida profissional de forma simples e rápida.',
    color: 'primary',
    features: [
      'Acesso 24/7 pelo celular ou computador',
      'Informações sempre atualizadas',
      'Interface simples e intuitiva',
    ],
  },
  {
    id: 2,
    icon: FileText,
    title: 'Seus Documentos',
    description: 'Acesse holerites, informes de rendimento, declarações e muito mais em segundos.',
    color: 'hr',
    features: [
      'Holerites dos últimos 12 meses',
      'Informe de rendimentos para IR',
      'Declarações e cartas de referência',
    ],
  },
  {
    id: 3,
    icon: Clock,
    title: 'Controle de Ponto',
    description: 'Acompanhe suas horas trabalhadas, extras e banco de horas em tempo real.',
    color: 'finance',
    features: [
      'Espelho de ponto detalhado',
      'Horas extras e adicional noturno',
      'Banco de horas atualizado',
    ],
  },
  {
    id: 4,
    icon: Umbrella,
    title: 'Férias e Benefícios',
    description: 'Solicite férias, acompanhe seus benefícios e gerencie tudo em um só lugar.',
    color: 'projects',
    features: [
      'Saldo de férias disponível',
      'Solicitação online de férias',
      'Detalhes de todos os benefícios',
    ],
  },
  {
    id: 5,
    icon: Bell,
    title: 'Fique por Dentro',
    description: 'Receba notificações importantes e comunicados da empresa diretamente no app.',
    color: 'operations',
    features: [
      'Alertas de documentos pendentes',
      'Comunicados importantes',
      'Lembretes de prazos',
    ],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    
    if (isLastStep) {
      localStorage.setItem('onboarding_completed', 'true');
      navigate('/');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/');
  };

  const getColorClasses = (color: string) => ({
    bg: `bg-${color}/10`,
    text: `text-${color}`,
    border: `border-${color}/20`,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">Portal</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
          Pular
        </Button>
      </div>

      {/* Progress */}
      <div className="px-4 mb-6">
        <Progress value={progress} className="h-1" />
        <div className="flex justify-between mt-2">
          {steps.map((s, index) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(index)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                index === currentStep
                  ? 'bg-primary text-primary-foreground scale-110'
                  : completedSteps.includes(index)
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {completedSteps.includes(index) ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col"
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className={`w-24 h-24 rounded-3xl bg-${step.color}/10 flex items-center justify-center`}>
                <step.icon className={`w-12 h-12 text-${step.color}`} />
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                {step.title}
              </h1>
              <p className="text-muted-foreground">
                {step.description}
              </p>
            </div>

            {/* Features */}
            <Card className="border-0 shadow-card p-4 flex-1">
              <div className="space-y-3">
                {step.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-6 h-6 rounded-full bg-${step.color}/10 flex items-center justify-center flex-shrink-0`}>
                      <Check className={`w-3.5 h-3.5 text-${step.color}`} />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-3">
        <Button 
          className="w-full h-12 text-base font-semibold"
          onClick={handleNext}
        >
          {isLastStep ? (
            <>
              <Rocket className="w-5 h-5 mr-2" />
              Começar a usar
            </>
          ) : (
            <>
              Continuar
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
        
        {currentStep > 0 && (
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={handlePrevious}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        )}
      </div>
    </div>
  );
}
