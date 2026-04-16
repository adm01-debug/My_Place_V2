
CREATE OR REPLACE FUNCTION public.fn_haversine_distance(
  lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT 6371000.0 * 2 * ASIN(
    SQRT(
      POWER(SIN(RADIANS(lat2 - lat1) / 2), 2) +
      COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
      POWER(SIN(RADIANS(lon2 - lon1) / 2), 2)
    )
  )
$$;
