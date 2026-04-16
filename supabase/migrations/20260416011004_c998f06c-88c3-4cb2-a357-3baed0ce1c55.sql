
-- Enum para tipo de notificação
CREATE TYPE public.tipo_notificacao AS ENUM ('info', 'sucesso', 'alerta', 'erro');

-- Tabela de notificações
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo tipo_notificacao NOT NULL DEFAULT 'info',
  lida BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notificacoes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notificacoes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notificacoes FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications"
  ON public.notificacoes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index para consultas rápidas
CREATE INDEX idx_notificacoes_user_lida ON public.notificacoes (user_id, lida, created_at DESC);

-- Trigger: notificar quando status de férias muda
CREATE OR REPLACE FUNCTION public.fn_notify_ferias_status()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status_label TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status != 'pendente' THEN
    v_status_label := CASE NEW.status
      WHEN 'aprovada' THEN 'aprovada ✅'
      WHEN 'recusada' THEN 'recusada ❌'
      WHEN 'cancelada' THEN 'cancelada'
      ELSE NEW.status::TEXT
    END;

    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (
      NEW.user_id,
      'Férias ' || v_status_label,
      'Sua solicitação de férias de ' || NEW.data_inicio || ' a ' || NEW.data_fim || ' foi ' || v_status_label || '.',
      CASE WHEN NEW.status = 'aprovada' THEN 'sucesso'
           WHEN NEW.status = 'recusada' THEN 'erro'
           ELSE 'info' END::tipo_notificacao,
      '/ferias'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_ferias_status
  AFTER UPDATE ON public.solicitacoes_ferias
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_ferias_status();

-- Trigger: notificar quando status de solicitação geral muda
CREATE OR REPLACE FUNCTION public.fn_notify_solicitacao_status()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status_label TEXT;
  v_tipo_label TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status != 'pendente' THEN
    v_tipo_label := CASE NEW.tipo
      WHEN 'declaracao_vinculo' THEN 'Declaração de Vínculo'
      WHEN 'alteracao_dados' THEN 'Alteração de Dados'
      WHEN 'adiantamento_salarial' THEN 'Adiantamento Salarial'
      WHEN 'carta_recomendacao' THEN 'Carta de Recomendação'
      ELSE 'Solicitação'
    END;

    v_status_label := CASE NEW.status
      WHEN 'aprovada' THEN 'aprovada ✅'
      WHEN 'recusada' THEN 'recusada ❌'
      WHEN 'em_analise' THEN 'em análise 🔍'
      WHEN 'cancelada' THEN 'cancelada'
      ELSE NEW.status::TEXT
    END;

    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (
      NEW.user_id,
      v_tipo_label || ' ' || v_status_label,
      'Sua solicitação de ' || v_tipo_label || ' foi ' || v_status_label || '.',
      CASE WHEN NEW.status = 'aprovada' THEN 'sucesso'
           WHEN NEW.status = 'recusada' THEN 'erro'
           WHEN NEW.status = 'em_analise' THEN 'info'
           ELSE 'info' END::tipo_notificacao,
      '/solicitacoes'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_solicitacao_status
  AFTER UPDATE ON public.solicitacoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_solicitacao_status();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
