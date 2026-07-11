
CREATE TYPE public.tipo_justificativa AS ENUM ('esquecimento','atestado_medico','problema_tecnico','transporte','folga_compensada','outros');
CREATE TYPE public.status_justificativa AS ENUM ('pendente','aprovada','recusada');

CREATE TABLE public.justificativas_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  tipo tipo_justificativa NOT NULL,
  descricao TEXT NOT NULL,
  anexo_url TEXT,
  status status_justificativa NOT NULL DEFAULT 'pendente',
  registro_ponto_id UUID REFERENCES public.registros_ponto(id) ON DELETE SET NULL,
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  observacao_admin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.justificativas_ponto TO authenticated;
GRANT ALL ON public.justificativas_ponto TO service_role;

ALTER TABLE public.justificativas_ponto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own justificativas" ON public.justificativas_ponto
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'));

CREATE POLICY "Users create own justificativas" ON public.justificativas_ponto
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own pending" ON public.justificativas_ponto
  FOR UPDATE TO authenticated USING ((auth.uid() = user_id AND status = 'pendente') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'));

CREATE POLICY "Admin delete" ON public.justificativas_ponto
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_justif_user_data ON public.justificativas_ponto(user_id, data_referencia DESC);
CREATE INDEX idx_justif_status ON public.justificativas_ponto(status) WHERE status='pendente';

CREATE TRIGGER trg_justif_updated_at BEFORE UPDATE ON public.justificativas_ponto
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.fn_notify_justificativa_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_label TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status <> 'pendente' THEN
    v_label := CASE NEW.status WHEN 'aprovada' THEN 'aprovada ✅' ELSE 'recusada ❌' END;
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (NEW.user_id, 'Justificativa de Ponto ' || v_label,
      'Sua justificativa referente a ' || NEW.data_referencia || ' foi ' || v_label || '.',
      CASE WHEN NEW.status='aprovada' THEN 'sucesso' ELSE 'erro' END::tipo_notificacao,
      '/ponto');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_justif AFTER UPDATE ON public.justificativas_ponto
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_justificativa_status();
