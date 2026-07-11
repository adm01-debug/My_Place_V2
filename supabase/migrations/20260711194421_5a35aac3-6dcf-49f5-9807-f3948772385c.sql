
-- Enums
CREATE TYPE public.chamado_categoria AS ENUM ('rh','ti','facilities','financeiro','outros');
CREATE TYPE public.chamado_prioridade AS ENUM ('baixa','media','alta','urgente');
CREATE TYPE public.chamado_status AS ENUM ('aberto','em_andamento','aguardando_solicitante','resolvido','fechado');

-- Tabela principal
CREATE TABLE public.chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero BIGSERIAL UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria public.chamado_categoria NOT NULL,
  prioridade public.chamado_prioridade NOT NULL DEFAULT 'media',
  assunto TEXT NOT NULL,
  descricao TEXT NOT NULL,
  status public.chamado_status NOT NULL DEFAULT 'aberto',
  atendente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sla_prazo TIMESTAMPTZ,
  primeira_resposta_em TIMESTAMPTZ,
  resolvido_em TIMESTAMPTZ,
  fechado_em TIMESTAMPTZ,
  avaliacao_nota INT CHECK (avaliacao_nota BETWEEN 1 AND 5),
  avaliacao_comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chamados_user ON public.chamados(user_id);
CREATE INDEX idx_chamados_status ON public.chamados(status);
CREATE INDEX idx_chamados_atendente ON public.chamados(atendente_id);
CREATE INDEX idx_chamados_categoria ON public.chamados(categoria);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamados TO authenticated;
GRANT ALL ON public.chamados TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.chamados_numero_seq TO authenticated;

ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chamados_select_own_or_admin" ON public.chamados
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()) OR atendente_id = auth.uid());

CREATE POLICY "chamados_insert_own" ON public.chamados
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chamados_update_admin_or_close_own" ON public.chamados
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR atendente_id = auth.uid() OR user_id = auth.uid())
  WITH CHECK (public.is_admin(auth.uid()) OR atendente_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "chamados_delete_admin" ON public.chamados
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Mensagens
CREATE TABLE public.chamados_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  interna BOOLEAN NOT NULL DEFAULT false,
  anexo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chamados_mensagens_chamado ON public.chamados_mensagens(chamado_id, created_at);

GRANT SELECT, INSERT, DELETE ON public.chamados_mensagens TO authenticated;
GRANT ALL ON public.chamados_mensagens TO service_role;

ALTER TABLE public.chamados_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "msg_select_participants" ON public.chamados_mensagens
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chamados c
      WHERE c.id = chamado_id
        AND (c.user_id = auth.uid() OR c.atendente_id = auth.uid() OR public.is_admin(auth.uid()))
        AND (interna = false OR c.atendente_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "msg_insert_participants" ON public.chamados_mensagens
  FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chamados c
      WHERE c.id = chamado_id
        AND (c.user_id = auth.uid() OR c.atendente_id = auth.uid() OR public.is_admin(auth.uid()))
    )
    AND (interna = false OR public.is_admin(auth.uid()) OR EXISTS(SELECT 1 FROM public.chamados c WHERE c.id=chamado_id AND c.atendente_id=auth.uid()))
  );

CREATE POLICY "msg_delete_own_or_admin" ON public.chamados_mensagens
  FOR DELETE TO authenticated
  USING (autor_id = auth.uid() OR public.is_admin(auth.uid()));

-- Trigger: SLA e updated_at
CREATE OR REPLACE FUNCTION public.fn_chamado_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.sla_prazo := NEW.created_at + CASE NEW.prioridade
      WHEN 'urgente' THEN INTERVAL '4 hours'
      WHEN 'alta'    THEN INTERVAL '1 day'
      WHEN 'media'   THEN INTERVAL '3 days'
      ELSE                INTERVAL '7 days'
    END;
  END IF;
  NEW.updated_at := now();
  IF NEW.status = 'resolvido' AND OLD.status IS DISTINCT FROM 'resolvido' THEN
    NEW.resolvido_em := now();
  END IF;
  IF NEW.status = 'fechado' AND OLD.status IS DISTINCT FROM 'fechado' THEN
    NEW.fechado_em := now();
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_chamado_sla
BEFORE INSERT OR UPDATE ON public.chamados
FOR EACH ROW EXECUTE FUNCTION public.fn_chamado_sla();

-- Trigger: notificar solicitante quando status muda
CREATE OR REPLACE FUNCTION public.fn_notify_chamado_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP='UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (
      NEW.user_id,
      'Chamado #' || NEW.numero || ' — ' || REPLACE(NEW.status::text,'_',' '),
      'Seu chamado "' || NEW.assunto || '" foi atualizado.',
      'info'::tipo_notificacao,
      '/chamados'
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_chamado_status
AFTER UPDATE ON public.chamados
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_chamado_status();

-- Trigger: notificar em nova mensagem (para a outra parte)
CREATE OR REPLACE FUNCTION public.fn_notify_chamado_msg()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ch RECORD; v_destinatario UUID;
BEGIN
  IF NEW.interna THEN RETURN NEW; END IF;
  SELECT * INTO v_ch FROM public.chamados WHERE id = NEW.chamado_id;
  v_destinatario := CASE WHEN NEW.autor_id = v_ch.user_id THEN v_ch.atendente_id ELSE v_ch.user_id END;
  -- registra primeira resposta do atendente
  IF v_ch.primeira_resposta_em IS NULL AND NEW.autor_id <> v_ch.user_id THEN
    UPDATE public.chamados SET primeira_resposta_em = now(), status = CASE WHEN status='aberto' THEN 'em_andamento'::chamado_status ELSE status END
    WHERE id = v_ch.id;
  END IF;
  IF v_destinatario IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (v_destinatario,
      'Nova mensagem no chamado #' || v_ch.numero,
      LEFT(NEW.mensagem, 120),
      'info'::tipo_notificacao,
      '/chamados');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_chamado_msg
AFTER INSERT ON public.chamados_mensagens
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_chamado_msg();

-- View de métricas (admin only via RLS na tabela base)
CREATE OR REPLACE VIEW public.vw_chamados_metrics AS
SELECT
  categoria,
  status,
  COUNT(*) AS total,
  AVG(EXTRACT(EPOCH FROM (resolvido_em - created_at))/3600)::NUMERIC(10,2) AS horas_medias_resolucao,
  COUNT(*) FILTER (WHERE resolvido_em IS NOT NULL AND resolvido_em <= sla_prazo) AS dentro_sla,
  COUNT(*) FILTER (WHERE resolvido_em IS NOT NULL AND resolvido_em >  sla_prazo) AS fora_sla
FROM public.chamados
GROUP BY categoria, status;

GRANT SELECT ON public.vw_chamados_metrics TO authenticated;
