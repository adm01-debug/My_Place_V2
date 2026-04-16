
-- Create enum for punch types
CREATE TYPE public.punch_type AS ENUM ('entrada', 'saida_almoco', 'retorno_almoco', 'saida');

-- Create table for time punches
CREATE TABLE public.registros_ponto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo public.punch_type NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  endereco TEXT,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookup by user and date
CREATE INDEX idx_registros_ponto_user_data ON public.registros_ponto (user_id, data_hora DESC);

-- Enable RLS
ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;

-- Users can view their own punches
CREATE POLICY "Users can view own punches"
  ON public.registros_ponto FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own punches
CREATE POLICY "Users can insert own punches"
  ON public.registros_ponto FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all punches
CREATE POLICY "Admins can view all punches"
  ON public.registros_ponto FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Gestores can view subordinate punches
CREATE POLICY "Gestores can view subordinate punches"
  ON public.registros_ponto FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = registros_ponto.user_id
      AND profiles.gestor_id = auth.uid()
    )
  );
