
ALTER TABLE public.metas_colaborador
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'pessoal' CHECK (tipo IN ('pessoal','equipe','empresa')),
  ADD COLUMN IF NOT EXISTS prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta'));

DO $$ BEGIN
  CREATE POLICY "Users can delete own metas"
  ON public.metas_colaborador FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
