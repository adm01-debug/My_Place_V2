import { z } from 'zod';

// ============================================================================
// SHARED VALIDATORS
// ============================================================================

export const cpfSchema = z.string().regex(
  /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
  'CPF inválido. Use o formato 000.000.000-00'
);

export const emailSchema = z.string().email('Email inválido');

export const phoneSchema = z.string().regex(
  /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/,
  'Telefone inválido. Use o formato (00) 00000-0000'
);

export const dateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Data inválida. Use o formato AAAA-MM-DD'
);

export const positiveNumberSchema = z.number().positive('O valor deve ser positivo');

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const signupSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome muito longo'),
  email: emailSchema,
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
});

// ============================================================================
// FERIAS SCHEMA
// ============================================================================

export const feriasSchema = z.object({
  tipo: z.enum({ ferias: 'ferias', abono: 'abono', licenca: 'licenca' }),
  data_inicio: dateSchema,
  data_fim: dateSchema,
  dias_solicitados: z.number().int().min(1, 'Mínimo 1 dia').max(30, 'Máximo 30 dias'),
  observacao: z.string().max(500, 'Observação muito longa').optional(),
}).refine(
  data => new Date(data.data_fim) >= new Date(data.data_inicio),
  { message: 'Data fim deve ser após data início', path: ['data_fim'] }
);

// ============================================================================
// SOLICITACAO SCHEMA
// ============================================================================

export const solicitacaoSchema = z.object({
  tipo: z.string().min(1, 'Selecione o tipo de solicitação'),
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200, 'Título muito longo'),
  descricao: z.string().max(2000, 'Descrição muito longa').optional(),
  prioridade: z.enum({ baixa: 'baixa', normal: 'normal', alta: 'alta', urgente: 'urgente' }).default('normal'),
});

// ============================================================================
// EMPRESTIMO SCHEMA
// ============================================================================

export const emprestimoSchema = z.object({
  valor_original: positiveNumberSchema.max(100000, 'Valor máximo de R$ 100.000'),
  quantidade_parcelas: z.number().int().min(1, 'Mínimo 1 parcela').max(60, 'Máximo 60 parcelas'),
  motivo: z.string().min(5, 'Descreva o motivo').max(500, 'Motivo muito longo').optional(),
});

// ============================================================================
// META SCHEMA
// ============================================================================

export const metaSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200),
  descricao: z.string().max(1000).optional(),
  tipo: z.string().min(1, 'Selecione o tipo'),
  data_inicio: dateSchema,
  data_fim: dateSchema,
  valor_meta: positiveNumberSchema,
  unidade: z.string().optional(),
}).refine(
  data => new Date(data.data_fim) >= new Date(data.data_inicio),
  { message: 'Data fim deve ser após data início', path: ['data_fim'] }
);

// ============================================================================
// PROFILE UPDATE SCHEMA
// ============================================================================

export const profileUpdateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100).optional(),
  cargo: z.string().max(100).optional(),
  departamento: z.string().max(100).optional(),
  cpf: cpfSchema.optional(),
});

// ============================================================================
// COMUNICADO SCHEMA
// ============================================================================

export const comunicadoSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200),
  conteudo: z.string().min(10, 'Conteúdo deve ter no mínimo 10 caracteres'),
  resumo: z.string().max(300).optional(),
  categoria: z.string().min(1, 'Selecione a categoria'),
  importante: z.boolean().default(false),
  fixado: z.boolean().default(false),
});

// ============================================================================
// HELPER: Validate and return errors
// ============================================================================

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach(issue => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });

  return { success: false, errors };
}

// ============================================================================
// TYPES
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type FeriasInput = z.infer<typeof feriasSchema>;
export type SolicitacaoInput = z.infer<typeof solicitacaoSchema>;
export type EmprestimoInput = z.infer<typeof emprestimoSchema>;
export type MetaInput = z.infer<typeof metaSchema>;
export type ComunicadoInput = z.infer<typeof comunicadoSchema>;
