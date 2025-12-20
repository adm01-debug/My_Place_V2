-- =====================================================
-- MIGRATION 000: Função utilitária update_updated_at_column
-- Projeto: my-place (Portal do Colaborador)
-- Data: 2025-12-20
-- NOTA: Este arquivo deve ser executado PRIMEIRO
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário
COMMENT ON FUNCTION public.update_updated_at_column IS 'Função trigger para atualizar automaticamente o campo updated_at';
