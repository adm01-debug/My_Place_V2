
-- Tabela de locais permitidos para registro de ponto
CREATE TABLE public.locais_permitidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  raio_metros INTEGER NOT NULL DEFAULT 200,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.locais_permitidos ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver locais ativos
CREATE POLICY "Authenticated users can view active locations"
  ON public.locais_permitidos FOR SELECT TO authenticated
  USING (ativo = true);

-- Apenas admins gerenciam locais
CREATE POLICY "Admins can manage locations"
  ON public.locais_permitidos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Função Haversine para calcular distância em metros
CREATE OR REPLACE FUNCTION public.fn_haversine_distance(
  lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE sql IMMUTABLE
AS $$
  SELECT 6371000.0 * 2 * ASIN(
    SQRT(
      POWER(SIN(RADIANS(lat2 - lat1) / 2), 2) +
      COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
      POWER(SIN(RADIANS(lon2 - lon1) / 2), 2)
    )
  )
$$;

-- Função que verifica se coordenadas estão dentro de algum local permitido
CREATE OR REPLACE FUNCTION public.fn_validar_ponto_no_raio(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
)
RETURNS TABLE(permitido BOOLEAN, local_nome TEXT, distancia_metros DOUBLE PRECISION)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    true AS permitido,
    lp.nome AS local_nome,
    fn_haversine_distance(p_latitude, p_longitude, lp.latitude, lp.longitude) AS distancia_metros
  FROM locais_permitidos lp
  WHERE lp.ativo = true
    AND fn_haversine_distance(p_latitude, p_longitude, lp.latitude, lp.longitude) <= lp.raio_metros
  ORDER BY distancia_metros ASC
  LIMIT 1
$$;

-- Inserir um local padrão (exemplo: escritório principal)
INSERT INTO public.locais_permitidos (nome, latitude, longitude, raio_metros)
VALUES ('Escritório Principal', -23.5505, -46.6333, 500);
