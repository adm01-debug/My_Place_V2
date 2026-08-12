-- Create comunicados table
CREATE TABLE public.comunicados (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    prioridade TEXT DEFAULT 'baixa', -- 'baixa', 'media', 'alta', 'critica'
    imagem_url TEXT,
    data_expiracao TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'ativo', -- 'ativo', 'arquivado'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    autor_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active announcements" 
ON public.comunicados 
FOR SELECT 
USING (status = 'ativo');

CREATE POLICY "Admins can manage announcements" 
ON public.comunicados 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_comunicados_updated_at
BEFORE UPDATE ON public.comunicados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
