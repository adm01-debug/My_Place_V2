-- =====================================================
-- MIGRATION 004: Criar tabelas de comunicados
-- Projeto: my-place (Portal do Colaborador)
-- Data: 2025-12-20
-- =====================================================

-- Tabela de comunicados (publicados pelo RH/empresa)
CREATE TABLE public.comunicados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  resumo TEXT, -- Preview para listagem
  categoria TEXT NOT NULL CHECK (categoria IN (
    'RH', 'Financeiro', 'Institucional', 'Saúde', 
    'TI', 'Eventos', 'Benefícios', 'Treinamentos', 'Outros'
  )),
  
  -- Prioridade e visibilidade
  importante BOOLEAN NOT NULL DEFAULT false,
  fixado BOOLEAN NOT NULL DEFAULT false, -- Aparece no topo
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Segmentação (opcional)
  departamentos TEXT[], -- NULL = todos
  cargos TEXT[], -- NULL = todos
  
  -- Anexo
  anexo_url TEXT,
  anexo_nome TEXT,
  
  -- Publicação
  publicado_por UUID REFERENCES auth.users(id),
  data_publicacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_expiracao TIMESTAMPTZ, -- NULL = não expira
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de leitura de comunicados
CREATE TABLE public.comunicados_lidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicado_id UUID NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(comunicado_id, user_id)
);

-- Enable RLS
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicados_lidos ENABLE ROW LEVEL SECURITY;

-- Policies para comunicados (todos podem ver ativos)
CREATE POLICY "Anyone can view active comunicados"
  ON public.comunicados FOR SELECT
  USING (ativo = true AND (data_expiracao IS NULL OR data_expiracao > now()));

-- Policies para lidos
CREATE POLICY "Users can view own lidos"
  ON public.comunicados_lidos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark as read"
  ON public.comunicados_lidos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_comunicados_updated_at
  BEFORE UPDATE ON public.comunicados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_comunicados_categoria ON public.comunicados(categoria);
CREATE INDEX idx_comunicados_data_publicacao ON public.comunicados(data_publicacao DESC);
CREATE INDEX idx_comunicados_importante ON public.comunicados(importante) WHERE importante = true;
CREATE INDEX idx_comunicados_lidos_user_id ON public.comunicados_lidos(user_id);
CREATE INDEX idx_comunicados_lidos_comunicado_id ON public.comunicados_lidos(comunicado_id);

-- View para comunicados com status de leitura
CREATE OR REPLACE VIEW public.vw_comunicados_usuario AS
SELECT 
  c.*,
  CASE WHEN cl.id IS NOT NULL THEN true ELSE false END as lido,
  cl.lido_em
FROM public.comunicados c
LEFT JOIN public.comunicados_lidos cl ON c.id = cl.comunicado_id AND cl.user_id = auth.uid()
WHERE c.ativo = true 
  AND (c.data_expiracao IS NULL OR c.data_expiracao > now())
ORDER BY c.fixado DESC, c.importante DESC, c.data_publicacao DESC;

-- Comentários
COMMENT ON TABLE public.comunicados IS 'Comunicados e avisos da empresa';
COMMENT ON TABLE public.comunicados_lidos IS 'Registro de leitura de comunicados por usuário';
