
-- Enum para tipo de férias
CREATE TYPE public.tipo_ferias AS ENUM ('regular', 'abono_pecuniario', 'fracionada');

-- Enum para status
CREATE TYPE public.status_ferias AS ENUM ('pendente', 'aprovada', 'recusada', 'cancelada');

-- Tabela de solicitações de férias
CREATE TABLE public.solicitacoes_ferias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias INTEGER NOT NULL,
  tipo tipo_ferias NOT NULL DEFAULT 'regular',
  status status_ferias NOT NULL DEFAULT 'pendente',
  observacao TEXT,
  aprovado_por UUID,
  aprovado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitacoes_ferias ENABLE ROW LEVEL SECURITY;

-- Usuário vê suas próprias solicitações
CREATE POLICY "Users can view own vacation requests"
  ON public.solicitacoes_ferias FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Usuário cria suas próprias solicitações
CREATE POLICY "Users can create own vacation requests"
  ON public.solicitacoes_ferias FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuário pode cancelar suas próprias solicitações pendentes
CREATE POLICY "Users can cancel own pending requests"
  ON public.solicitacoes_ferias FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pendente');

-- Admins gerenciam todas
CREATE POLICY "Admins can manage all vacation requests"
  ON public.solicitacoes_ferias FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Gestores podem ver e aprovar solicitações de subordinados
CREATE POLICY "Managers can view subordinate requests"
  ON public.solicitacoes_ferias FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = solicitacoes_ferias.user_id AND profiles.gestor_id = auth.uid()
  ));

CREATE POLICY "Managers can update subordinate requests"
  ON public.solicitacoes_ferias FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = solicitacoes_ferias.user_id AND profiles.gestor_id = auth.uid()
  ));

-- Trigger updated_at
CREATE TRIGGER update_solicitacoes_ferias_updated_at
  BEFORE UPDATE ON public.solicitacoes_ferias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular saldo de férias baseado na data de admissão
CREATE OR REPLACE FUNCTION public.fn_calcular_saldo_ferias(p_user_id UUID)
RETURNS TABLE(
  dias_direito INTEGER,
  dias_usados INTEGER,
  dias_pendentes INTEGER,
  dias_disponiveis INTEGER,
  periodo_aquisitivo_inicio DATE,
  periodo_aquisitivo_fim DATE,
  proximo_vencimento DATE
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_data_admissao DATE;
  v_periodo_inicio DATE;
  v_periodo_fim DATE;
  v_anos_completos INTEGER;
  v_dias_direito INTEGER;
  v_dias_usados INTEGER;
  v_dias_pendentes INTEGER;
BEGIN
  -- Buscar data de admissão
  SELECT data_admissao INTO v_data_admissao
  FROM profiles WHERE id = p_user_id;

  IF v_data_admissao IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0, 0, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE;
    RETURN;
  END IF;

  -- Calcular anos completos desde admissão
  v_anos_completos := EXTRACT(YEAR FROM age(CURRENT_DATE, v_data_admissao))::INTEGER;
  IF v_anos_completos < 1 THEN
    v_anos_completos := 0;
  END IF;

  -- Período aquisitivo atual
  v_periodo_inicio := v_data_admissao + (v_anos_completos * INTERVAL '1 year');
  v_periodo_fim := v_periodo_inicio + INTERVAL '1 year' - INTERVAL '1 day';

  -- Direito: 30 dias por período completo
  v_dias_direito := v_anos_completos * 30;

  -- Dias já usados (aprovados)
  SELECT COALESCE(SUM(dias), 0) INTO v_dias_usados
  FROM solicitacoes_ferias
  WHERE user_id = p_user_id AND status = 'aprovada';

  -- Dias pendentes de aprovação
  SELECT COALESCE(SUM(dias), 0) INTO v_dias_pendentes
  FROM solicitacoes_ferias
  WHERE user_id = p_user_id AND status = 'pendente';

  RETURN QUERY SELECT
    v_dias_direito,
    v_dias_usados,
    v_dias_pendentes,
    GREATEST(v_dias_direito - v_dias_usados - v_dias_pendentes, 0),
    v_periodo_inicio::DATE,
    v_periodo_fim::DATE,
    (v_periodo_fim + INTERVAL '1 year')::DATE;
END;
$$;
