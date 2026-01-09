-- Table to track login attempts
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Index for faster lookups
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts (email, attempted_at DESC);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated and anonymous users (for tracking)
CREATE POLICY "Anyone can insert login attempts"
  ON public.login_attempts
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view login attempts
CREATE POLICY "Admins can view login attempts"
  ON public.login_attempts
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.check_account_locked(p_email TEXT)
RETURNS TABLE (
  is_locked BOOLEAN,
  failed_attempts INTEGER,
  locked_until TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_failed_count INTEGER;
  v_last_attempt TIMESTAMP WITH TIME ZONE;
  v_lockout_duration INTERVAL := '15 minutes';
  v_max_attempts INTEGER := 5;
BEGIN
  -- Count failed attempts in the last lockout window
  SELECT COUNT(*), MAX(attempted_at)
  INTO v_failed_count, v_last_attempt
  FROM public.login_attempts
  WHERE email = LOWER(p_email)
    AND success = false
    AND attempted_at > (now() - v_lockout_duration);

  -- Check if locked
  IF v_failed_count >= v_max_attempts THEN
    RETURN QUERY SELECT 
      true::BOOLEAN,
      v_failed_count,
      (v_last_attempt + v_lockout_duration);
  ELSE
    RETURN QUERY SELECT 
      false::BOOLEAN,
      v_failed_count,
      NULL::TIMESTAMP WITH TIME ZONE;
  END IF;
END;
$$;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, success, ip_address)
  VALUES (LOWER(p_email), p_success, p_ip_address);
  
  -- If successful, we could optionally clear old failed attempts
  IF p_success THEN
    DELETE FROM public.login_attempts
    WHERE email = LOWER(p_email)
      AND success = false
      AND attempted_at < now() - interval '24 hours';
  END IF;
END;
$$;

-- Cleanup old attempts (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.login_attempts
  WHERE attempted_at < now() - interval '30 days';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;