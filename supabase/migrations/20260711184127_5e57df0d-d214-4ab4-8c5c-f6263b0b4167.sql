
CREATE TYPE public.ideia_status AS ENUM ('nova','em_analise','aprovada','implementada','recusada');
CREATE TYPE public.ideia_impacto AS ENUM ('baixo','medio','alto');

CREATE TABLE public.ideias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT,
  impacto public.ideia_impacto NOT NULL DEFAULT 'medio',
  status public.ideia_status NOT NULL DEFAULT 'nova',
  status_observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideias TO authenticated;
GRANT ALL ON public.ideias TO service_role;
ALTER TABLE public.ideias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_view_ideias" ON public.ideias FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_insert_own_ideia" ON public.ideias FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_own_ideia" ON public.ideias FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "user_delete_own_ideia" ON public.ideias FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE INDEX idx_ideias_status ON public.ideias(status);
CREATE INDEX idx_ideias_user ON public.ideias(user_id);

CREATE TRIGGER trg_ideias_updated
  BEFORE UPDATE ON public.ideias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ideias_votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ideia_id UUID NOT NULL REFERENCES public.ideias(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ideia_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.ideias_votos TO authenticated;
GRANT ALL ON public.ideias_votos TO service_role;
ALTER TABLE public.ideias_votos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_view_votos" ON public.ideias_votos FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_vote" ON public.ideias_votos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_unvote" ON public.ideias_votos FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_ideias_votos_ideia ON public.ideias_votos(ideia_id);

CREATE TABLE public.ideias_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ideia_id UUID NOT NULL REFERENCES public.ideias(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.ideias_comentarios TO authenticated;
GRANT ALL ON public.ideias_comentarios TO service_role;
ALTER TABLE public.ideias_comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_view_comentarios" ON public.ideias_comentarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_insert_comentario" ON public.ideias_comentarios FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_delete_own_comentario" ON public.ideias_comentarios FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE INDEX idx_ideias_comentarios_ideia ON public.ideias_comentarios(ideia_id);

-- Notificar autor quando status mudar
CREATE OR REPLACE FUNCTION public.fn_notify_ideia_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_label TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_label := CASE NEW.status
      WHEN 'em_analise' THEN 'em análise 🔍'
      WHEN 'aprovada' THEN 'aprovada ✅'
      WHEN 'implementada' THEN 'implementada 🚀'
      WHEN 'recusada' THEN 'recusada ❌'
      ELSE NEW.status::TEXT END;
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (NEW.user_id, 'Sua ideia foi ' || v_label,
      'A ideia "' || NEW.titulo || '" foi ' || v_label || '.',
      CASE WHEN NEW.status IN ('aprovada','implementada') THEN 'sucesso'
           WHEN NEW.status='recusada' THEN 'erro' ELSE 'info' END::tipo_notificacao,
      '/ideias');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_ideia_status
  AFTER UPDATE OF status ON public.ideias
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_ideia_status();
