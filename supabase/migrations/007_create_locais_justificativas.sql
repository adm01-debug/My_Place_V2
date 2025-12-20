-- =====================================================
-- MIGRATION 007: Criar tabela de locais permitidos
-- Projeto: my-place (Portal do Colaborador)
-- Data: 2025-12-20
-- =====================================================

-- Tabela de locais permitidos para registro de ponto
CREATE TABLE public.locais_permitidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  endereco TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  raio_metros INTEGER NOT NULL DEFAULT 100,
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Restrições de horário (opcional)
  horario_inicio TIME,
  horario_fim TIME,
  dias_semana INTEGER[], -- 0=Dom, 1=Seg, ..., 6=Sab
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de justificativas de ponto
CREATE TABLE public.justificativas_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_ponto_id UUID NOT NULL REFERENCES public.registros_ponto(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  motivo TEXT NOT NULL CHECK (motivo IN (
    'esquecimento', 'problema_sistema', 'trabalho_externo',
    'reuniao_externa', 'atestado_medico', 'outros'
  )),
  descricao TEXT NOT NULL,
  anexo_url TEXT,
  
  -- Aprovação
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.locais_permitidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.justificativas_ponto ENABLE ROW LEVEL SECURITY;

-- Policies para locais (todos podem ver ativos)
CREATE POLICY "Anyone can view active locais"
  ON public.locais_permitidos FOR SELECT
  USING (ativo = true);

-- Policies para justificativas
CREATE POLICY "Users can view own justificativas"
  ON public.justificativas_ponto FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own justificativas"
  ON public.justificativas_ponto FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending justificativas"
  ON public.justificativas_ponto FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pendente');

-- Triggers
CREATE TRIGGER update_locais_permitidos_updated_at
  BEFORE UPDATE ON public.locais_permitidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_justificativas_ponto_updated_at
  BEFORE UPDATE ON public.justificativas_ponto
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function para validar localização
CREATE OR REPLACE FUNCTION public.fn_validar_localizacao(
  p_latitude DECIMAL,
  p_longitude DECIMAL
) RETURNS TABLE (
  local_id UUID,
  local_nome TEXT,
  distancia_metros DECIMAL,
  dentro_raio BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.id as local_id,
    lp.nome as local_nome,
    -- Fórmula de Haversine simplificada (aproximação)
    ROUND(
      (6371000 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(p_latitude - lp.latitude) / 2), 2) +
        COS(RADIANS(lp.latitude)) * COS(RADIANS(p_latitude)) *
        POWER(SIN(RADIANS(p_longitude - lp.longitude) / 2), 2)
      )))::DECIMAL, 2
    ) as distancia_metros,
    (
      6371000 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(p_latitude - lp.latitude) / 2), 2) +
        COS(RADIANS(lp.latitude)) * COS(RADIANS(p_latitude)) *
        POWER(SIN(RADIANS(p_longitude - lp.longitude) / 2), 2)
      ))
    ) <= lp.raio_metros as dentro_raio
  FROM public.locais_permitidos lp
  WHERE lp.ativo = true
  ORDER BY distancia_metros ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function para verificar se está em local permitido
CREATE OR REPLACE FUNCTION public.fn_esta_em_local_permitido(
  p_latitude DECIMAL,
  p_longitude DECIMAL
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.fn_validar_localizacao(p_latitude, p_longitude)
    WHERE dentro_raio = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Inserir dados iniciais (exemplo)
INSERT INTO public.locais_permitidos (nome, descricao, endereco, latitude, longitude, raio_metros) VALUES
('Sede Principal', 'Escritório central', 'Rua Principal, 123 - São Paulo/SP', -23.5505, -46.6333, 100),
('Filial Centro', 'Filial do centro', 'Av. Central, 456 - São Paulo/SP', -23.5489, -46.6388, 50),
('Home Office', 'Trabalho remoto autorizado', 'Endereço do colaborador', 0, 0, 50000); -- Raio grande para home office

-- Índices
CREATE INDEX idx_locais_permitidos_coords ON public.locais_permitidos(latitude, longitude);
CREATE INDEX idx_justificativas_ponto_registro_id ON public.justificativas_ponto(registro_ponto_id);
CREATE INDEX idx_justificativas_ponto_user_id ON public.justificativas_ponto(user_id);
CREATE INDEX idx_justificativas_ponto_status ON public.justificativas_ponto(status);

-- Comentários
COMMENT ON TABLE public.locais_permitidos IS 'Locais autorizados para registro de ponto';
COMMENT ON TABLE public.justificativas_ponto IS 'Justificativas para registros de ponto irregulares';
COMMENT ON FUNCTION public.fn_validar_localizacao IS 'Valida se coordenadas estão próximas de locais permitidos';
