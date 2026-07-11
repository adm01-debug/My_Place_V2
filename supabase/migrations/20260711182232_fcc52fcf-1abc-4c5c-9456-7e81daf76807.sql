
-- Credenciais WebAuthn (biometria)
CREATE TABLE public.webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_name TEXT NOT NULL DEFAULT 'Dispositivo',
  transports TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webauthn_credentials TO authenticated;
GRANT ALL ON public.webauthn_credentials TO service_role;

ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam suas credenciais biométricas"
ON public.webauthn_credentials FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_webauthn_credentials_user ON public.webauthn_credentials(user_id);

CREATE TRIGGER trg_webauthn_credentials_updated_at
BEFORE UPDATE ON public.webauthn_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Challenges temporários (anti-replay)
CREATE TABLE public.webauthn_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('register','authenticate')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.webauthn_challenges TO authenticated;
GRANT ALL ON public.webauthn_challenges TO service_role;

ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas seus desafios"
ON public.webauthn_challenges FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX idx_webauthn_challenges_user ON public.webauthn_challenges(user_id);
CREATE INDEX idx_webauthn_challenges_expires ON public.webauthn_challenges(expires_at);

-- Limpeza de desafios expirados
CREATE OR REPLACE FUNCTION public.cleanup_webauthn_challenges()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_deleted INTEGER;
BEGIN
  DELETE FROM public.webauthn_challenges WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END; $$;
