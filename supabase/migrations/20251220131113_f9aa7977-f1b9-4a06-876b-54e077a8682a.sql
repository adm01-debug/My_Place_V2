
-- ============================================
-- TABELA: comunicados
-- ============================================
CREATE TABLE public.comunicados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  resumo TEXT,
  categoria TEXT NOT NULL DEFAULT 'Outros',
  importante BOOLEAN NOT NULL DEFAULT false,
  fixado BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  anexo_url TEXT,
  anexo_nome TEXT,
  data_publicacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_expiracao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active comunicados"
ON public.comunicados FOR SELECT
TO authenticated
USING (ativo = true);

-- ============================================
-- TABELA: comunicados_lidos
-- ============================================
CREATE TABLE public.comunicados_lidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comunicado_id UUID NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  lido_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comunicado_id, user_id)
);

ALTER TABLE public.comunicados_lidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lidos"
ON public.comunicados_lidos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lidos"
ON public.comunicados_lidos FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABELA: beneficios
-- ============================================
CREATE TABLE public.beneficios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_mensal NUMERIC NOT NULL DEFAULT 0,
  valor_desconto NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_adesao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_cancelamento DATE,
  operadora TEXT,
  numero_cartao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.beneficios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own beneficios"
ON public.beneficios FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own beneficios"
ON public.beneficios FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own beneficios"
ON public.beneficios FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- TABELA: dependentes_beneficio
-- ============================================
CREATE TABLE public.dependentes_beneficio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  beneficio_id UUID NOT NULL REFERENCES public.beneficios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  parentesco TEXT NOT NULL,
  data_nascimento DATE,
  cpf TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dependentes_beneficio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dependentes"
ON public.dependentes_beneficio FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dependentes"
ON public.dependentes_beneficio FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dependentes"
ON public.dependentes_beneficio FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- TABELA: treinamentos
-- ============================================
CREATE TABLE public.treinamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'Geral',
  carga_horaria INTEGER NOT NULL DEFAULT 0,
  obrigatorio BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  conteudo_url TEXT,
  thumbnail_url TEXT,
  instrutor TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view treinamentos"
ON public.treinamentos FOR SELECT
TO authenticated
USING (ativo = true);

-- ============================================
-- TABELA: treinamentos_colaborador
-- ============================================
CREATE TABLE public.treinamentos_colaborador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treinamento_id UUID NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  progresso INTEGER NOT NULL DEFAULT 0,
  nota NUMERIC,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  data_limite DATE,
  certificado_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(treinamento_id, user_id)
);

ALTER TABLE public.treinamentos_colaborador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own treinamentos_colaborador"
ON public.treinamentos_colaborador FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own treinamentos_colaborador"
ON public.treinamentos_colaborador FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- TABELA: documentos
-- ============================================
CREATE TABLE public.documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  arquivo_url TEXT NOT NULL,
  tamanho_bytes BIGINT,
  mime_type TEXT,
  data_documento DATE,
  data_validade DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documentos"
ON public.documentos FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- TABELA: comissoes
-- ============================================
CREATE TABLE public.comissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  percentual NUMERIC,
  referencia TEXT,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_pagamento DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own comissoes"
ON public.comissoes FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- TABELA: bonificacoes
-- ============================================
CREATE TABLE public.bonificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'bonus',
  referencia TEXT,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_pagamento DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bonificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bonificacoes"
ON public.bonificacoes FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- TABELA: metas
-- ============================================
CREATE TABLE public.metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'vendas',
  valor_meta NUMERIC NOT NULL,
  valor_atual NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT DEFAULT 'R$',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metas"
ON public.metas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own metas"
ON public.metas FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- TABELA: notificacoes
-- ============================================
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'info',
  lida BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  dados JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notificacoes"
ON public.notificacoes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notificacoes"
ON public.notificacoes FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- TABELA: locais_permitidos
-- ============================================
CREATE TABLE public.locais_permitidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  raio_metros INTEGER NOT NULL DEFAULT 100,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.locais_permitidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view locais_permitidos"
ON public.locais_permitidos FOR SELECT
TO authenticated
USING (ativo = true);

-- ============================================
-- TABELA: justificativas_ponto
-- ============================================
CREATE TABLE public.justificativas_ponto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  registro_ponto_id UUID REFERENCES public.registros_ponto(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  tipo TEXT NOT NULL,
  motivo TEXT NOT NULL,
  anexo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  resposta TEXT,
  aprovado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.justificativas_ponto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own justificativas"
ON public.justificativas_ponto FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own justificativas"
ON public.justificativas_ponto FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own justificativas"
ON public.justificativas_ponto FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- FUNÇÕES: Validação de localização
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_calcular_distancia(
  lat1 NUMERIC, lon1 NUMERIC, lat2 NUMERIC, lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R CONSTANT NUMERIC := 6371000; -- Raio da Terra em metros
  phi1 NUMERIC;
  phi2 NUMERIC;
  delta_phi NUMERIC;
  delta_lambda NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  phi1 := radians(lat1);
  phi2 := radians(lat2);
  delta_phi := radians(lat2 - lat1);
  delta_lambda := radians(lon2 - lon1);
  
  a := sin(delta_phi / 2) * sin(delta_phi / 2) +
       cos(phi1) * cos(phi2) *
       sin(delta_lambda / 2) * sin(delta_lambda / 2);
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  
  RETURN R * c;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_validar_localizacao(
  p_latitude NUMERIC, p_longitude NUMERIC
)
RETURNS TABLE (
  local_id UUID,
  local_nome TEXT,
  distancia_metros NUMERIC,
  dentro_raio BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.id,
    lp.nome,
    fn_calcular_distancia(p_latitude, p_longitude, lp.latitude, lp.longitude) AS distancia,
    fn_calcular_distancia(p_latitude, p_longitude, lp.latitude, lp.longitude) <= lp.raio_metros AS dentro
  FROM public.locais_permitidos lp
  WHERE lp.ativo = true
  ORDER BY distancia;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_esta_em_local_permitido(
  p_latitude NUMERIC, p_longitude NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.locais_permitidos lp
    WHERE lp.ativo = true
      AND fn_calcular_distancia(p_latitude, p_longitude, lp.latitude, lp.longitude) <= lp.raio_metros
  );
END;
$$;

-- ============================================
-- TRIGGERS: updated_at automático
-- ============================================
CREATE TRIGGER update_comunicados_updated_at
BEFORE UPDATE ON public.comunicados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beneficios_updated_at
BEFORE UPDATE ON public.beneficios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treinamentos_updated_at
BEFORE UPDATE ON public.treinamentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treinamentos_colaborador_updated_at
BEFORE UPDATE ON public.treinamentos_colaborador
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentos_updated_at
BEFORE UPDATE ON public.documentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metas_updated_at
BEFORE UPDATE ON public.metas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_justificativas_ponto_updated_at
BEFORE UPDATE ON public.justificativas_ponto
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
