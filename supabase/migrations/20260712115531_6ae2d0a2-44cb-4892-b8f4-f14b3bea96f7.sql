
-- =========================================================
-- ITEM 36: Central de Integrações Externas & Webhooks
-- =========================================================

-- Tabela: integracoes (catálogo de conexões)
CREATE TABLE public.integracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('webhook','bitrix24','n8n','whatsapp','smtp','erp_folha','slack','generico')),
  nome TEXT NOT NULL,
  descricao TEXT,
  endpoint TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  secret_ref TEXT,
  hmac_secret_ref TEXT,
  timeout_ms INTEGER NOT NULL DEFAULT 15000 CHECK (timeout_ms BETWEEN 1000 AND 60000),
  headers_extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_integracoes_ativo ON public.integracoes(ativo);
CREATE INDEX idx_integracoes_tipo ON public.integracoes(tipo);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integracoes TO authenticated;
GRANT ALL ON public.integracoes TO service_role;
ALTER TABLE public.integracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam integracoes"
  ON public.integracoes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestores leem integracoes"
  ON public.integracoes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'gestor') OR public.has_role(auth.uid(), 'admin'));

-- Tabela: integracoes_eventos (fila)
CREATE TABLE public.integracoes_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integracao_id UUID NOT NULL REFERENCES public.integracoes(id) ON DELETE CASCADE,
  evento_tipo TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','processando','enviado','falhou','cancelado')),
  tentativas INTEGER NOT NULL DEFAULT 0,
  max_tentativas INTEGER NOT NULL DEFAULT 5,
  idempotency_key TEXT NOT NULL,
  ultimo_erro TEXT,
  proxima_tentativa TIMESTAMPTZ NOT NULL DEFAULT now(),
  processado_em TIMESTAMPTZ,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_integracoes_eventos_idem UNIQUE (integracao_id, idempotency_key)
);
CREATE INDEX idx_eventos_fila ON public.integracoes_eventos(status, proxima_tentativa) WHERE status IN ('pendente','processando');
CREATE INDEX idx_eventos_integracao ON public.integracoes_eventos(integracao_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integracoes_eventos TO authenticated;
GRANT ALL ON public.integracoes_eventos TO service_role;
ALTER TABLE public.integracoes_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam eventos"
  ON public.integracoes_eventos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestores leem eventos"
  ON public.integracoes_eventos FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'gestor') OR public.has_role(auth.uid(), 'admin'));

-- Tabela: integracoes_logs (imutável)
CREATE TABLE public.integracoes_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID NOT NULL REFERENCES public.integracoes_eventos(id) ON DELETE CASCADE,
  integracao_id UUID NOT NULL REFERENCES public.integracoes(id) ON DELETE CASCADE,
  tentativa INTEGER NOT NULL,
  request_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_body TEXT,
  response_status INTEGER,
  response_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_body TEXT,
  duracao_ms INTEGER,
  erro TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_logs_evento ON public.integracoes_logs(evento_id, created_at DESC);
CREATE INDEX idx_logs_integracao ON public.integracoes_logs(integracao_id, created_at DESC);

GRANT SELECT, INSERT ON public.integracoes_logs TO authenticated;
GRANT ALL ON public.integracoes_logs TO service_role;
ALTER TABLE public.integracoes_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins leem logs"
  ON public.integracoes_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Somente service role escreve logs"
  ON public.integracoes_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers updated_at
CREATE TRIGGER trg_integracoes_updated_at
  BEFORE UPDATE ON public.integracoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_integracoes_eventos_updated_at
  BEFORE UPDATE ON public.integracoes_eventos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- RPCs
-- =========================================================

-- Enfileirar evento (uso interno e por outros módulos)
CREATE OR REPLACE FUNCTION public.fn_integracao_enfileirar(
  p_integracao_id UUID,
  p_evento_tipo TEXT,
  p_payload JSONB,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_key TEXT;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  v_key := COALESCE(p_idempotency_key, gen_random_uuid()::text);

  INSERT INTO public.integracoes_eventos(integracao_id, evento_tipo, payload, idempotency_key, criado_por)
  VALUES (p_integracao_id, p_evento_tipo, p_payload, v_key, auth.uid())
  ON CONFLICT (integracao_id, idempotency_key) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Estatísticas agregadas
CREATE OR REPLACE FUNCTION public.fn_integracao_estatisticas(p_horas INTEGER DEFAULT 24)
RETURNS TABLE (
  integracao_id UUID,
  nome TEXT,
  total_eventos BIGINT,
  enviados BIGINT,
  falhou BIGINT,
  pendentes BIGINT,
  taxa_sucesso_pct NUMERIC,
  latencia_media_ms NUMERIC,
  latencia_p95_ms NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  WITH ev AS (
    SELECT e.integracao_id, e.status, e.id
    FROM public.integracoes_eventos e
    WHERE e.created_at >= now() - (p_horas || ' hours')::interval
  ),
  lat AS (
    SELECT l.integracao_id, l.duracao_ms
    FROM public.integracoes_logs l
    WHERE l.created_at >= now() - (p_horas || ' hours')::interval
      AND l.duracao_ms IS NOT NULL
  )
  SELECT
    i.id,
    i.nome,
    COALESCE(COUNT(ev.id), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN ev.status = 'enviado' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN ev.status = 'falhou' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN ev.status IN ('pendente','processando') THEN 1 ELSE 0 END), 0)::BIGINT,
    CASE WHEN COUNT(ev.id) > 0
      THEN ROUND(100.0 * SUM(CASE WHEN ev.status = 'enviado' THEN 1 ELSE 0 END) / COUNT(ev.id), 1)
      ELSE NULL END,
    (SELECT ROUND(AVG(duracao_ms)::numeric, 0) FROM lat WHERE lat.integracao_id = i.id),
    (SELECT ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duracao_ms)::numeric, 0) FROM lat WHERE lat.integracao_id = i.id)
  FROM public.integracoes i
  LEFT JOIN ev ON ev.integracao_id = i.id
  GROUP BY i.id, i.nome
  ORDER BY i.nome;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_integracao_enfileirar(UUID, TEXT, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_integracao_enfileirar(UUID, TEXT, JSONB, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.fn_integracao_estatisticas(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_integracao_estatisticas(INTEGER) TO authenticated;
