-- Expandir o enum tipo_solicitacao
-- Nota: Enums no Postgres não podem ser alterados facilmente dentro de transações se forem usados em colunas.
-- Mas como estamos em ambiente de desenvolvimento/migração assistida, vamos adicionar os valores.
ALTER TYPE public.tipo_solicitacao ADD VALUE IF NOT EXISTS 'vale_refeicao';
ALTER TYPE public.tipo_solicitacao ADD VALUE IF NOT EXISTS 'vale_transporte';
ALTER TYPE public.tipo_solicitacao ADD VALUE IF NOT EXISTS 'vale_combustivel';

-- Adicionar coluna de valor
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS valor NUMERIC(15,2);

-- Criar um índice para performance em buscas financeiras
CREATE INDEX IF NOT EXISTS idx_solicitacoes_valor ON public.solicitacoes(valor);
