
-- Corrigir search_path da função fn_calcular_distancia
CREATE OR REPLACE FUNCTION public.fn_calcular_distancia(
  lat1 NUMERIC, lon1 NUMERIC, lat2 NUMERIC, lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  R CONSTANT NUMERIC := 6371000;
  phi1 NUMERIC;
  phi2 NUMERIC;
  delta_phi NUMERIC;
  delta_lambda NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  phi1 := radians(lat1);
  phi2 := radians(lat2);
  delta_phi := radians(lat2 - lat1);
  delta_lambda := radians(lon2 - lon1);
  
  a := sin(delta_phi / 2) * sin(delta_phi / 2) +
       cos(phi1) * cos(phi2) *
       sin(delta_lambda / 2) * sin(delta_lambda / 2);
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  
  RETURN R * c;
END;
$$;
