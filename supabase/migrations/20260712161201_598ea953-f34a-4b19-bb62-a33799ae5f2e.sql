
-- ==== ENUMS ====
DO $$ BEGIN
  CREATE TYPE public.notif_categoria AS ENUM (
    'ponto','ferias','holerite','solicitacao','vale','emprestimo',
    'treinamento','feedback','kudos','comunicado','chamado','politica',
    'aniversario','sistema','seguranca'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notif_nivel AS ENUM ('info','aviso','critico');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==== TABELA: preferências por categoria ====
CREATE TABLE IF NOT EXISTS public.notificacao_preferencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria public.notif_categoria NOT NULL,
  canal_in_app BOOLEAN NOT NULL DEFAULT true,
  canal_email BOOLEAN NOT NULL DEFAULT true,
  canal_push BOOLEAN NOT NULL DEFAULT true,
  canal_whatsapp BOOLEAN NOT NULL DEFAULT false,
  nivel_minimo public.notif_nivel NOT NULL DEFAULT 'info',
  silenciar_ate TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, categoria)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacao_preferencias TO authenticated;
GRANT ALL ON public.notificacao_preferencias TO service_role;
ALTER TABLE public.notificacao_preferencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user manages own prefs" ON public.notificacao_preferencias
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON public.notificacao_preferencias(user_id);

-- ==== TABELA: quiet hours ====
CREATE TABLE IF NOT EXISTS public.notificacao_quiet_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT false,
  inicio TIME NOT NULL DEFAULT '22:00',
  fim TIME NOT NULL DEFAULT '07:00',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  dias_semana INT[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6],
  permitir_criticos BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacao_quiet_hours TO authenticated;
GRANT ALL ON public.notificacao_quiet_hours TO service_role;
ALTER TABLE public.notificacao_quiet_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user manages own quiet" ON public.notificacao_quiet_hours
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==== TRIGGERS updated_at ====
CREATE OR REPLACE FUNCTION public.tg_notif_prefs_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_notif_prefs_touch ON public.notificacao_preferencias;
CREATE TRIGGER trg_notif_prefs_touch BEFORE UPDATE ON public.notificacao_preferencias
  FOR EACH ROW EXECUTE FUNCTION public.tg_notif_prefs_touch();

DROP TRIGGER IF EXISTS trg_notif_quiet_touch ON public.notificacao_quiet_hours;
CREATE TRIGGER trg_notif_quiet_touch BEFORE UPDATE ON public.notificacao_quiet_hours
  FOR EACH ROW EXECUTE FUNCTION public.tg_notif_prefs_touch();

-- ==== FUNÇÃO: pode_notificar ====
CREATE OR REPLACE FUNCTION public.fn_pode_notificar(
  _user_id UUID,
  _categoria public.notif_categoria,
  _canal TEXT,
  _nivel public.notif_nivel DEFAULT 'info'
) RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pref public.notificacao_preferencias%ROWTYPE;
  v_quiet public.notificacao_quiet_hours%ROWTYPE;
  v_permitido BOOLEAN := true;
  v_local_time TIME;
  v_dow INT;
  v_nivel_rank INT;
  v_min_rank INT;
BEGIN
  SELECT * INTO v_pref FROM public.notificacao_preferencias
    WHERE user_id = _user_id AND categoria = _categoria;

  IF FOUND THEN
    -- Nível mínimo
    v_nivel_rank := CASE _nivel WHEN 'info' THEN 1 WHEN 'aviso' THEN 2 WHEN 'critico' THEN 3 END;
    v_min_rank := CASE v_pref.nivel_minimo WHEN 'info' THEN 1 WHEN 'aviso' THEN 2 WHEN 'critico' THEN 3 END;
    IF v_nivel_rank < v_min_rank THEN RETURN false; END IF;

    -- Silenciamento temporário
    IF v_pref.silenciar_ate IS NOT NULL AND v_pref.silenciar_ate > now() THEN
      IF _nivel <> 'critico' THEN RETURN false; END IF;
    END IF;

    -- Canal
    v_permitido := CASE _canal
      WHEN 'in_app' THEN v_pref.canal_in_app
      WHEN 'email' THEN v_pref.canal_email
      WHEN 'push' THEN v_pref.canal_push
      WHEN 'whatsapp' THEN v_pref.canal_whatsapp
      ELSE true END;
    IF NOT v_permitido THEN RETURN false; END IF;
  END IF;

  -- Quiet hours
  SELECT * INTO v_quiet FROM public.notificacao_quiet_hours WHERE user_id = _user_id;
  IF FOUND AND v_quiet.ativo THEN
    v_local_time := (now() AT TIME ZONE v_quiet.timezone)::time;
    v_dow := EXTRACT(DOW FROM (now() AT TIME ZONE v_quiet.timezone))::int;
    IF v_dow = ANY(v_quiet.dias_semana) THEN
      IF (v_quiet.inicio < v_quiet.fim AND v_local_time BETWEEN v_quiet.inicio AND v_quiet.fim)
         OR (v_quiet.inicio > v_quiet.fim AND (v_local_time >= v_quiet.inicio OR v_local_time <= v_quiet.fim))
      THEN
        IF v_quiet.permitir_criticos AND _nivel = 'critico' THEN
          RETURN true;
        END IF;
        RETURN false;
      END IF;
    END IF;
  END IF;

  RETURN true;
END $$;

GRANT EXECUTE ON FUNCTION public.fn_pode_notificar(UUID, public.notif_categoria, TEXT, public.notif_nivel) TO authenticated, service_role;

-- ==== FUNÇÃO: reset defaults ====
CREATE OR REPLACE FUNCTION public.fn_notif_prefs_reset(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INT := 0; v_cat public.notif_categoria;
BEGIN
  IF auth.uid() <> _user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  DELETE FROM public.notificacao_preferencias WHERE user_id = _user_id;
  FOR v_cat IN SELECT unnest(enum_range(NULL::public.notif_categoria)) LOOP
    INSERT INTO public.notificacao_preferencias(user_id, categoria) VALUES (_user_id, v_cat);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION public.fn_notif_prefs_reset(UUID) TO authenticated, service_role;
