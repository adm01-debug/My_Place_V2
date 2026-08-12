CREATE TABLE IF NOT EXISTS public.configuracoes_globais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_empresa TEXT DEFAULT 'Portal do Colaborador',
    logo_url TEXT,
    cor_primaria TEXT DEFAULT '#0ea5e9',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.configuracoes_globais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on global config"
ON public.configuracoes_globais FOR SELECT USING (true);

CREATE POLICY "Allow admins to update global config"
ON public.configuracoes_globais FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Insert default config
INSERT INTO public.configuracoes_globais (nome_empresa, cor_primaria)
VALUES ('Portal do Colaborador', '#0ea5e9')
ON CONFLICT DO NOTHING;
