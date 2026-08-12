-- Criar tabela de FAQ se não existir
CREATE TABLE IF NOT EXISTS public.faq (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pergunta TEXT NOT NULL,
    resposta TEXT NOT NULL,
    categoria TEXT,
    prioridade INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar limite de adiantamento às configurações globais
ALTER TABLE public.configuracoes_globais ADD COLUMN IF NOT EXISTS limite_adiantamento_percentual NUMERIC(5,2) DEFAULT 40.00;

-- Criar tabela de histórico de solicitações para auditoria
CREATE TABLE IF NOT EXISTS public.solicitacoes_historico (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    solicitacao_id UUID REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
    status_anterior TEXT,
    status_novo TEXT,
    alterado_por UUID REFERENCES auth.users(id),
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ativar RLS no histórico
ALTER TABLE public.solicitacoes_historico ENABLE ROW LEVEL SECURITY;

-- Políticas para o histórico
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem ver o histórico de suas próprias solicitações') THEN
        CREATE POLICY "Usuários podem ver o histórico de suas próprias solicitações" 
        ON public.solicitacoes_historico FOR SELECT 
        USING (EXISTS (SELECT 1 FROM public.solicitacoes WHERE solicitacoes.id = solicitacoes_historico.solicitacao_id AND solicitacoes.user_id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins podem ver todo o histórico') THEN
        CREATE POLICY "Admins podem ver todo o histórico" 
        ON public.solicitacoes_historico FOR SELECT 
        USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

-- Trigger para registrar mudanças de status automaticamente
CREATE OR REPLACE FUNCTION public.fn_log_solicitacao_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.solicitacoes_historico (
            solicitacao_id,
            status_anterior,
            status_novo,
            alterado_por,
            observacao
        ) VALUES (
            NEW.id,
            OLD.status::text,
            NEW.status::text,
            auth.uid(),
            'Alteração automática de status via sistema.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_solicitacao_status ON public.solicitacoes;
CREATE TRIGGER tr_log_solicitacao_status
AFTER UPDATE ON public.solicitacoes
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_solicitacao_status_change();

-- Garantir que o FAQ tenha itens de Vales
INSERT INTO public.faq (pergunta, resposta, categoria, prioridade)
VALUES 
('Qual o limite máximo para adiantamento salarial?', 'O limite padrão é de 40% do seu salário base bruto, conforme configurado nas políticas da empresa.', 'Financeiro', 1),
('Quanto tempo demora para um vale ser aprovado?', 'O prazo médio para análise e aprovação é de 48 horas úteis.', 'Financeiro', 2),
('Posso cancelar uma solicitação?', 'Sim, enquanto o status for "Pendente" ou "Em Análise", você pode cancelar diretamente pelo portal.', 'Geral', 3)
ON CONFLICT (id) DO NOTHING;
