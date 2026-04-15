import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { TipoRemuneracao, RemuneracaoVariavelInsert } from '@/hooks/useRemuneracaoVariavel';

const schema = z.object({
  tipo: z.enum({ comissao: 'comissao', bonificacao: 'bonificacao', premio: 'premio', plr: 'plr', outro: 'outro' }, {
    message: 'Selecione o tipo',
  }),
  descricao: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  mes: z.coerce.number().min(1).max(12),
  ano: z.coerce.number().min(2000).max(2100),
  referencia: z.string().optional(),
  percentual: z.coerce.number().min(0).max(100).optional().nullable(),
  observacao: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface RemuneracaoVariavelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<RemuneracaoVariavelInsert, 'user_id'>) => Promise<{ success: boolean; error?: string }>;
  initialData?: Partial<FormData>;
  mode?: 'create' | 'edit';
}

const tipoOptions: { value: TipoRemuneracao; label: string }[] = [
  { value: 'comissao', label: 'Comissão' },
  { value: 'bonificacao', label: 'Bonificação' },
  { value: 'premio', label: 'Prêmio' },
  { value: 'plr', label: 'PLR' },
  { value: 'outro', label: 'Outro' },
];

const mesesOptions = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export function RemuneracaoVariavelModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'create',
}: RemuneracaoVariavelModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentDate = new Date();
  const getDefaultValues = (): Partial<FormData> => ({
    tipo: 'comissao',
    mes: currentDate.getMonth() + 1,
    ano: currentDate.getFullYear(),
    descricao: '',
    valor: undefined,
    referencia: '',
    percentual: null,
    observacao: '',
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(),
  });

  // Reset form when initialData changes (edit mode) or when opening in create mode
  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          ...getDefaultValues(),
          ...initialData,
        });
      } else {
        reset(getDefaultValues());
      }
    }
  }, [open, initialData, reset]);

  const tipoValue = watch('tipo');
  const mesValue = watch('mes');
  const anoValue = watch('ano');

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    const submitData: Omit<RemuneracaoVariavelInsert, 'user_id'> = {
      tipo: data.tipo,
      descricao: data.descricao,
      valor: data.valor,
      mes: data.mes,
      ano: data.ano,
      referencia: data.referencia || null,
      percentual: data.percentual || null,
      observacao: data.observacao || null,
      status: 'pendente',
    };

    const result = await onSubmit(submitData);
    
    setIsSubmitting(false);
    
    if (result.success) {
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Generate year options (current year - 1 to current year + 1)
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nova Remuneração Variável' : 'Editar Remuneração'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select
              value={tipoValue}
              onValueChange={(value) => setValue('tipo', value as TipoRemuneracao)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipo && (
              <p className="text-sm text-destructive">{errors.tipo.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              placeholder="Ex: Comissão de vendas Q1"
              {...register('descricao')}
            />
            {errors.descricao && (
              <p className="text-sm text-destructive">{errors.descricao.message}</p>
            )}
          </div>

          {/* Valor e Percentual */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register('valor')}
              />
              {errors.valor && (
                <p className="text-sm text-destructive">{errors.valor.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentual">Percentual (%)</Label>
              <Input
                id="percentual"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                {...register('percentual')}
              />
            </div>
          </div>

          {/* Mês e Ano */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Mês *</Label>
              <Select
                value={String(mesValue)}
                onValueChange={(value) => setValue('mes', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mesesOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano *</Label>
              <Select
                value={String(anoValue)}
                onValueChange={(value) => setValue('ano', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Referência */}
          <div className="space-y-2">
            <Label htmlFor="referencia">Referência</Label>
            <Input
              id="referencia"
              placeholder="Ex: Projeto X, Cliente Y"
              {...register('referencia')}
            />
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              placeholder="Informações adicionais..."
              rows={2}
              {...register('observacao')}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Criar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
