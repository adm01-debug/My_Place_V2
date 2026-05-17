-- Create documents table
CREATE TABLE public.documentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT NOT NULL, -- 'Contrato', 'Holerite', 'Identificação', 'Outros'
    url TEXT NOT NULL,
    extensao TEXT,
    tamanho_kb INTEGER,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own documents" 
ON public.documentos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all documents" 
ON public.documentos 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_documentos_updated_at
BEFORE UPDATE ON public.documentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
