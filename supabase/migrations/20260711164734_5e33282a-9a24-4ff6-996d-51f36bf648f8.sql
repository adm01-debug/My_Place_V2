
-- Enum de categorias
DO $$ BEGIN
  CREATE TYPE public.kudos_categoria AS ENUM ('colaboracao','inovacao','excelencia','lideranca','proatividade','gratidao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remetente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destinatario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria public.kudos_categoria NOT NULL DEFAULT 'gratidao',
  mensagem TEXT NOT NULL CHECK (char_length(mensagem) BETWEEN 3 AND 500),
  icone TEXT NOT NULL DEFAULT '⭐',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (remetente_id <> destinatario_id)
);

CREATE INDEX IF NOT EXISTS idx_kudos_destinatario ON public.kudos(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_kudos_remetente ON public.kudos(remetente_id);
CREATE INDEX IF NOT EXISTS idx_kudos_created ON public.kudos(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kudos TO authenticated;
GRANT ALL ON public.kudos TO service_role;

ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kudos visíveis a todos autenticados" ON public.kudos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuário envia kudos como remetente" ON public.kudos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = remetente_id);

CREATE POLICY "Remetente pode excluir seu kudos" ON public.kudos
  FOR DELETE TO authenticated USING (auth.uid() = remetente_id);

CREATE TRIGGER trg_kudos_updated_at
  BEFORE UPDATE ON public.kudos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notifica destinatário ao receber kudos
CREATE OR REPLACE FUNCTION public.fn_notify_kudos_recebido()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_remetente TEXT;
BEGIN
  SELECT nome INTO v_remetente FROM public.profiles WHERE id = NEW.remetente_id;
  INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
  VALUES (
    NEW.destinatario_id,
    'Você recebeu um Kudos! ' || NEW.icone,
    COALESCE(v_remetente,'Um colega') || ' te reconheceu: "' || NEW.mensagem || '"',
    'sucesso'::tipo_notificacao,
    '/kudos'
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_kudos_notify
  AFTER INSERT ON public.kudos
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_kudos_recebido();
