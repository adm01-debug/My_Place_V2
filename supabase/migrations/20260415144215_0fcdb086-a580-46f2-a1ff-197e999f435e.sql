DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notificacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notificacoes;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'comunicados_lidos'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.comunicados_lidos;
  END IF;
END $$;