-- Adicionar coluna arquivada à tabela notificacoes
ALTER TABLE public.notificacoes 
ADD COLUMN IF NOT EXISTS arquivada boolean NOT NULL DEFAULT false;

-- Adicionar coluna lida_em para rastrear quando foi lida
ALTER TABLE public.notificacoes 
ADD COLUMN IF NOT EXISTS lida_em timestamp with time zone DEFAULT NULL;

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_arquivada 
ON public.notificacoes(user_id, arquivada);

CREATE INDEX IF NOT EXISTS idx_notificacoes_user_lida 
ON public.notificacoes(user_id, lida);