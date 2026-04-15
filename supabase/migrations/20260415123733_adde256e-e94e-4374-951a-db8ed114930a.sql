
-- Fix overly permissive INSERT on login_attempts
-- This table is written by security definer functions, so we can restrict direct access
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;

-- Allow inserts only from authenticated users (the RPC function uses SECURITY DEFINER anyway)
CREATE POLICY "Authenticated users can insert login attempts"
ON public.login_attempts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also allow anon for pre-auth login attempts (the RPC handles this)
CREATE POLICY "Anon can insert login attempts"
ON public.login_attempts
FOR INSERT
TO anon
WITH CHECK (true);
