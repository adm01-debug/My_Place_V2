-- Ativar RLS no FAQ
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

-- Permitir que todos visualizem o FAQ
CREATE POLICY "FAQ visível para todos os usuários autenticados" 
ON public.faq FOR SELECT 
USING (auth.role() = 'authenticated');

-- Ajustar a função de auditoria com search_path seguro
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
