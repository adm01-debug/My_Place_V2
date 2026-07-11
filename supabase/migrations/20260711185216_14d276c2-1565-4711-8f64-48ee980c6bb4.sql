
DO $$ BEGIN
  CREATE TYPE public.atestado_tipo AS ENUM ('medico','odontologico','acompanhamento','maternidade','paternidade','luto','casamento','outros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.atestado_status AS ENUM ('pendente','validado','recusado','cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.atestados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo public.atestado_tipo NOT NULL,
  data_inicial DATE NOT NULL,
  dias_afastamento INT NOT NULL CHECK (dias_afastamento BETWEEN 1 AND 365),
  cid TEXT CHECK (cid IS NULL OR length(cid) <= 10),
  medico_nome TEXT,
  medico_crm TEXT,
  anexo_url TEXT,
  observacao TEXT,
  status public.atestado_status NOT NULL DEFAULT 'pendente',
  observacao_rh TEXT,
  validador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atestados_user ON public.atestados(user_id, data_inicial DESC);
CREATE INDEX IF NOT EXISTS idx_atestados_status ON public.atestados(status) WHERE status = 'pendente';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.atestados TO authenticated;
GRANT ALL ON public.atestados TO service_role;

ALTER TABLE public.atestados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver atestados próprios ou como gestor"
  ON public.atestados FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'gestor'));

CREATE POLICY "Criar próprio atestado"
  ON public.atestados FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Atualizar atestado"
  ON public.atestados FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id AND status = 'pendente')
    OR public.is_admin(auth.uid())
    OR public.has_role(auth.uid(),'gestor'));

CREATE POLICY "Deletar próprio pendente"
  ON public.atestados FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'pendente');

DROP TRIGGER IF EXISTS trg_atestados_updated_at ON public.atestados;
CREATE TRIGGER trg_atestados_updated_at
BEFORE UPDATE ON public.atestados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.fn_notify_atestado_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_label TEXT; v_tipo tipo_notificacao;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status <> 'pendente' THEN
    v_label := CASE NEW.status
      WHEN 'validado' THEN 'validado ✅'
      WHEN 'recusado' THEN 'recusado ❌'
      WHEN 'cancelado' THEN 'cancelado'
      ELSE NEW.status::TEXT END;
    v_tipo := (CASE NEW.status
      WHEN 'validado' THEN 'sucesso'
      WHEN 'recusado' THEN 'erro'
      ELSE 'info' END)::tipo_notificacao;
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (NEW.user_id, 'Atestado ' || v_label,
      'Seu atestado de ' || NEW.dias_afastamento || ' dia(s) a partir de ' || to_char(NEW.data_inicial,'DD/MM/YYYY') || ' foi ' || v_label || '.',
      v_tipo, '/atestados');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_atestados_notify ON public.atestados;
CREATE TRIGGER trg_atestados_notify
AFTER UPDATE ON public.atestados
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_atestado_status();

CREATE OR REPLACE FUNCTION public.fn_notify_manager_new_atestado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_nome TEXT; v_gestor_id UUID; v_admin RECORD;
BEGIN
  SELECT nome, gestor_id INTO v_nome, v_gestor_id FROM public.profiles WHERE id = NEW.user_id;
  IF v_gestor_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (v_gestor_id, 'Novo Atestado',
      COALESCE(v_nome,'Colaborador') || ' enviou atestado de ' || NEW.dias_afastamento || ' dia(s).',
      'info'::tipo_notificacao, '/admin/aprovacoes');
  END IF;
  FOR v_admin IN
    SELECT ur.user_id FROM public.user_roles ur
    WHERE ur.role = 'admin' AND ur.user_id != NEW.user_id AND ur.user_id IS DISTINCT FROM v_gestor_id
  LOOP
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (v_admin.user_id, 'Novo Atestado',
      COALESCE(v_nome,'Colaborador') || ' enviou atestado de ' || NEW.dias_afastamento || ' dia(s).',
      'info'::tipo_notificacao, '/admin/aprovacoes');
  END LOOP;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_atestados_notify_manager ON public.atestados;
CREATE TRIGGER trg_atestados_notify_manager
AFTER INSERT ON public.atestados
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_manager_new_atestado();
