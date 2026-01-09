-- Tabela para armazenar configurações de 2FA
CREATE TABLE public.user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  secret TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  backup_codes TEXT[] DEFAULT '{}',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Policy: users can only view their own 2FA settings
CREATE POLICY "Users can view their own 2FA settings"
ON public.user_2fa
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: users can insert their own 2FA settings
CREATE POLICY "Users can insert their own 2FA settings"
ON public.user_2fa
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: users can update their own 2FA settings
CREATE POLICY "Users can update their own 2FA settings"
ON public.user_2fa
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: users can delete their own 2FA settings
CREATE POLICY "Users can delete their own 2FA settings"
ON public.user_2fa
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_2fa_updated_at
BEFORE UPDATE ON public.user_2fa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user has 2FA enabled (for login flow)
CREATE OR REPLACE FUNCTION public.check_2fa_enabled(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM public.user_2fa WHERE user_id = p_user_id),
    false
  )
$$;