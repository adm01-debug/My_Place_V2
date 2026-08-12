
DO $$ BEGIN
  CREATE TYPE public.reembolso_categoria AS ENUM ('viagem','alimentacao','transporte','hospedagem','material','outros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reembolso_status AS ENUM ('pendente','em_analise','aprovado','pago','recusado','cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.reembolsos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria public.reembolso_categoria NOT NULL,
  descricao TEXT NOT NULL CHECK (length(descricao) BETWEEN 3 AND 500),
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0 AND valor <= 100000),
  data_despesa DATE NOT NULL CHECK (data_despesa <= CURRENT_DATE),
  anexo_url TEXT,
  status public.reembolso_status NOT NULL DEFAULT 'pendente',
  observacao_gestor TEXT,
  aprovador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  analisado_em TIMESTAMPTZ,
  pago_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reembolsos_user ON public.reembolsos(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reembolsos_status ON public.reembolsos(status) WHERE status IN ('pendente','em_analise');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reembolsos TO authenticated;
GRANT ALL ON public.reembolsos TO service_role;

ALTER TABLE public.reembolsos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver reembolsos próprios ou como gestor"
  ON public.reembolsos FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'gestor'));

CREATE POLICY "Criar próprio reembolso"
  ON public.reembolsos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Atualizar reembolso"
  ON public.reembolsos FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id AND status = 'pendente')
    OR public.is_admin(auth.uid())
    OR public.has_role(auth.uid(),'gestor'));

CREATE POLICY "Deletar próprio pendente"
  ON public.reembolsos FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'pendente');

DROP TRIGGER IF EXISTS trg_reembolsos_updated_at ON public.reembolsos;
CREATE TRIGGER trg_reembolsos_updated_at
BEFORE UPDATE ON public.reembolsos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.fn_notify_reembolso_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_label TEXT; v_tipo tipo_notificacao;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status <> 'pendente' THEN
    v_label := CASE NEW.status
      WHEN 'em_analise' THEN 'em análise 🔍'
      WHEN 'aprovado' THEN 'aprovado ✅'
      WHEN 'pago' THEN 'pago 💰'
      WHEN 'recusado' THEN 'recusado ❌'
      WHEN 'cancelado' THEN 'cancelado'
      ELSE NEW.status::TEXT END;
    v_tipo := (CASE NEW.status
      WHEN 'aprovado' THEN 'sucesso'
      WHEN 'pago' THEN 'sucesso'
      WHEN 'recusado' THEN 'erro'
      ELSE 'info' END)::tipo_notificacao;
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (NEW.user_id, 'Reembolso ' || v_label,
      'Seu reembolso de R$ ' || to_char(NEW.valor,'FM999G999G990D00') || ' (' || NEW.categoria || ') foi ' || v_label || '.',
      v_tipo, '/reembolsos');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_reembolsos_notify ON public.reembolsos;
CREATE TRIGGER trg_reembolsos_notify
AFTER UPDATE ON public.reembolsos
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_reembolso_status();

CREATE OR REPLACE FUNCTION public.fn_notify_manager_new_reembolso()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_nome TEXT; v_gestor_id UUID; v_admin RECORD;
BEGIN
  SELECT nome, gestor_id INTO v_nome, v_gestor_id FROM public.profiles WHERE id = NEW.user_id;
  IF v_gestor_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (v_gestor_id, 'Novo Reembolso',
      COALESCE(v_nome,'Colaborador') || ' solicitou reembolso de R$ ' || to_char(NEW.valor,'FM999G999G990D00') || '.',
      'info'::tipo_notificacao, '/admin/aprovacoes');
  END IF;
  FOR v_admin IN
    SELECT ur.user_id FROM public.user_roles ur
    WHERE ur.role = 'admin' AND ur.user_id != NEW.user_id AND ur.user_id IS DISTINCT FROM v_gestor_id
  LOOP
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (v_admin.user_id, 'Novo Reembolso',
      COALESCE(v_nome,'Colaborador') || ' solicitou reembolso de R$ ' || to_char(NEW.valor,'FM999G999G990D00') || '.',
      'info'::tipo_notificacao, '/admin/aprovacoes');
  END LOOP;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_reembolsos_notify_manager ON public.reembolsos;
CREATE TRIGGER trg_reembolsos_notify_manager
AFTER INSERT ON public.reembolsos
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_manager_new_reembolso();
