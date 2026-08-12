
CREATE TYPE public.politica_categoria AS ENUM ('codigo_conduta','lgpd','seguranca','beneficios','home_office','compliance','outros');

CREATE TABLE public.politicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria public.politica_categoria NOT NULL DEFAULT 'outros',
  obrigatoria BOOLEAN NOT NULL DEFAULT true,
  ativa BOOLEAN NOT NULL DEFAULT true,
  versao_vigente_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_politicas_ativa ON public.politicas(ativa) WHERE ativa;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.politicas TO authenticated;
GRANT ALL ON public.politicas TO service_role;
ALTER TABLE public.politicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pol_select_ativas" ON public.politicas FOR SELECT TO authenticated USING (ativa OR public.is_admin(auth.uid()));
CREATE POLICY "pol_admin_all" ON public.politicas FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.politicas_versoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politica_id UUID NOT NULL REFERENCES public.politicas(id) ON DELETE CASCADE,
  versao INT NOT NULL,
  conteudo TEXT NOT NULL,
  arquivo_url TEXT,
  changelog TEXT,
  publicada_em TIMESTAMPTZ,
  publicada_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(politica_id, versao)
);
CREATE INDEX idx_pol_ver_politica ON public.politicas_versoes(politica_id, versao DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.politicas_versoes TO authenticated;
GRANT ALL ON public.politicas_versoes TO service_role;
ALTER TABLE public.politicas_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "polv_select_all" ON public.politicas_versoes FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.politicas p WHERE p.id=politica_id AND (p.ativa OR public.is_admin(auth.uid()))));
CREATE POLICY "polv_admin_all" ON public.politicas_versoes FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.politicas ADD CONSTRAINT fk_versao_vigente FOREIGN KEY (versao_vigente_id) REFERENCES public.politicas_versoes(id) ON DELETE SET NULL;

CREATE TABLE public.politicas_aceites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  versao_id UUID NOT NULL REFERENCES public.politicas_versoes(id) ON DELETE CASCADE,
  aceito_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  hash_integridade TEXT NOT NULL,
  UNIQUE(user_id, versao_id)
);
CREATE INDEX idx_pol_aceites_user ON public.politicas_aceites(user_id);
GRANT SELECT, INSERT ON public.politicas_aceites TO authenticated;
GRANT ALL ON public.politicas_aceites TO service_role;
ALTER TABLE public.politicas_aceites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acc_select_own_or_admin" ON public.politicas_aceites FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "acc_insert_own" ON public.politicas_aceites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Trigger: ao publicar versão, define versao_vigente_id na política e seta publicada_em
CREATE OR REPLACE FUNCTION public.fn_politica_publicar()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.publicada_em IS NOT NULL AND (OLD IS NULL OR OLD.publicada_em IS NULL) THEN
    UPDATE public.politicas SET versao_vigente_id = NEW.id, updated_at = now() WHERE id = NEW.politica_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_politica_publicar
AFTER INSERT OR UPDATE ON public.politicas_versoes
FOR EACH ROW EXECUTE FUNCTION public.fn_politica_publicar();

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.fn_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_politicas_updated BEFORE UPDATE ON public.politicas
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();

-- View: pendências por usuário (usa auth.uid())
CREATE OR REPLACE VIEW public.vw_politicas_pendentes AS
SELECT
  p.id AS politica_id,
  p.titulo,
  p.categoria,
  p.obrigatoria,
  v.id AS versao_vigente_id,
  v.versao AS versao_numero,
  v.publicada_em
FROM public.politicas p
JOIN public.politicas_versoes v ON v.id = p.versao_vigente_id
WHERE p.ativa
  AND NOT EXISTS (
    SELECT 1 FROM public.politicas_aceites a
    WHERE a.versao_id = v.id AND a.user_id = auth.uid()
  );
GRANT SELECT ON public.vw_politicas_pendentes TO authenticated;
