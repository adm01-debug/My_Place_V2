-- Permitir que usuários criem suas próprias metas
DROP POLICY IF EXISTS "Users can insert own metas" ON public.metas;
CREATE POLICY "Users can insert own metas"
ON public.metas
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir que admins vejam todas as metas
DROP POLICY IF EXISTS "Admins can view all metas" ON public.metas;
CREATE POLICY "Admins can view all metas"
ON public.metas
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Tabela de Key Results (resultados-chave) para OKRs
CREATE TABLE IF NOT EXISTS public.key_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_id uuid NOT NULL REFERENCES public.metas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  valor_meta numeric NOT NULL DEFAULT 100,
  valor_atual numeric NOT NULL DEFAULT 0,
  unidade text DEFAULT '%',
  peso numeric DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_key_results_meta_id ON public.key_results(meta_id);

-- Enable RLS
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- Políticas para key_results
CREATE POLICY "Users can view own key_results"
ON public.key_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.metas m
    WHERE m.id = key_results.meta_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own key_results"
ON public.key_results
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.metas m
    WHERE m.id = key_results.meta_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own key_results"
ON public.key_results
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.metas m
    WHERE m.id = key_results.meta_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own key_results"
ON public.key_results
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.metas m
    WHERE m.id = key_results.meta_id
    AND m.user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_key_results_updated_at
  BEFORE UPDATE ON public.key_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();