-- Adicionar comunicados à publicação realtime (notificacoes já está)
ALTER TABLE public.comunicados REPLICA IDENTITY FULL;
ALTER TABLE public.comunicados_lidos REPLICA IDENTITY FULL;

-- Só adicionar se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'comunicados'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comunicados;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'comunicados_lidos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comunicados_lidos;
  END IF;
END $$;