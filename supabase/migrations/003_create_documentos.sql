-- =====================================================
-- MIGRATION 003: Criar tabela documentos
-- Projeto: my-place (Portal do Colaborador)
-- Data: 2025-12-20
-- =====================================================

-- Tabela de documentos do colaborador
CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'holerite', 'informe_rendimentos', 'declaracao_vinculo', 
    'carta_referencia', 'recibo_ferias', 'contrato_trabalho',
    'certificado', 'atestado', 'advertencia', 'ferias',
    'rescisao', 'termo_aditivo', 'politica', 'outros'
  )),
  titulo TEXT NOT NULL,
  descricao TEXT,
  
  -- Arquivo
  arquivo_url TEXT, -- URL do Supabase Storage
  arquivo_nome TEXT,
  arquivo_tamanho INTEGER, -- bytes
  arquivo_tipo TEXT, -- mime type
  
  -- Status
  disponivel BOOLEAN NOT NULL DEFAULT true,
  confidencial BOOLEAN NOT NULL DEFAULT false,
  
  -- Datas
  gerado_em TIMESTAMPTZ DEFAULT now(),
  validade DATE, -- NULL = não expira
  referencia_mes INTEGER CHECK (referencia_mes >= 1 AND referencia_mes <= 12),
  referencia_ano INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de downloads (auditoria)
CREATE TABLE public.documentos_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_downloads ENABLE ROW LEVEL SECURITY;

-- Policies para documentos
CREATE POLICY "Users can view own documentos"
  ON public.documentos FOR SELECT
  USING (auth.uid() = user_id AND disponivel = true);

CREATE POLICY "Users can insert own documentos"
  ON public.documentos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies para downloads (auditoria)
CREATE POLICY "Users can log own downloads"
  ON public.documentos_downloads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own downloads"
  ON public.documentos_downloads FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_documentos_user_id ON public.documentos(user_id);
CREATE INDEX idx_documentos_tipo ON public.documentos(tipo);
CREATE INDEX idx_documentos_referencia ON public.documentos(referencia_ano, referencia_mes);
CREATE INDEX idx_documentos_downloads_documento_id ON public.documentos_downloads(documento_id);

-- Comentários
COMMENT ON TABLE public.documentos IS 'Documentos do colaborador (holerites, contratos, declarações, etc.)';
COMMENT ON TABLE public.documentos_downloads IS 'Registro de downloads para auditoria';
