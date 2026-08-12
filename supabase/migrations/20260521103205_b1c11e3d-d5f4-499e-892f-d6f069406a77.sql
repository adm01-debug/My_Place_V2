-- Create rate_limits table for Edge Functions
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Index for fast lookup by key and creation date
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_created_at ON public.rate_limits (key, created_at DESC);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow Edge Functions (using service role) to manage rate limits
-- We don't need policies for anonymous/authenticated users as this is internal

-- Optional: Cleanup old rate limits to save space (auto-deletion via trigger or cron if available)
-- For now, we just ensure the table exists as required by the shared utility.
