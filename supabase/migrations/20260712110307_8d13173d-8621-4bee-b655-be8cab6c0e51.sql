
CREATE TABLE public.treinamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'outros' CHECK (categoria IN ('nr','iso','lgpd','seguranca','compliance','tecnico','comportamental','outros')),
  carga_horaria_minutos INTEGER NOT NULL DEFAULT 60 CHECK (carga_horaria_minutos > 0),
  validade_meses INTEGER CHECK (validade_meses IS NULL OR validade_meses > 0),
  obrigatorio_para_todos BOOLEAN NOT NULL DEFAULT false,
  cargos_obrigatorios TEXT[] NOT NULL DEFAULT '{}',
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treinamentos TO authenticated;
GRANT ALL ON public.treinamentos TO service_role;
ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "treinamentos_select_ativos" ON public.treinamentos
  FOR SELECT TO authenticated
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "treinamentos_admin_manage" ON public.treinamentos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_treinamentos_updated
  BEFORE UPDATE ON public.treinamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.treinamentos_matriculas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treinamento_id UUID NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluido','expirado','dispensado')),
  data_matricula TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_inicio TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  data_vencimento TIMESTAMPTZ,
  nota NUMERIC(5,2) CHECK (nota IS NULL OR (nota >= 0 AND nota <= 100)),
  certificado_url TEXT,
  instrutor TEXT,
  observacoes TEXT,
  notificado_vencimento BOOLEAN NOT NULL DEFAULT false,
  matriculado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_treinamentos_matriculas_user ON public.treinamentos_matriculas(user_id);
CREATE INDEX idx_treinamentos_matriculas_treinamento ON public.treinamentos_matriculas(treinamento_id);
CREATE INDEX idx_treinamentos_matriculas_status ON public.treinamentos_matriculas(status);
CREATE INDEX idx_treinamentos_matriculas_vencimento ON public.treinamentos_matriculas(data_vencimento) WHERE status = 'concluido';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.treinamentos_matriculas TO authenticated;
GRANT ALL ON public.treinamentos_matriculas TO service_role;
ALTER TABLE public.treinamentos_matriculas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matriculas_select_own_or_manager" ON public.treinamentos_matriculas
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
  );
CREATE POLICY "matriculas_insert_managers" ON public.treinamentos_matriculas
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
  );
CREATE POLICY "matriculas_update_own_or_manager" ON public.treinamentos_matriculas
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
  );
CREATE POLICY "matriculas_delete_admin" ON public.treinamentos_matriculas
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_matriculas_updated
  BEFORE UPDATE ON public.treinamentos_matriculas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.calc_treinamento_vencimento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_validade INTEGER;
BEGIN
  IF NEW.status = 'concluido' AND NEW.data_conclusao IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.data_conclusao IS DISTINCT FROM NEW.data_conclusao OR OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT validade_meses INTO v_validade FROM public.treinamentos WHERE id = NEW.treinamento_id;
    IF v_validade IS NOT NULL THEN
      NEW.data_vencimento := NEW.data_conclusao + (v_validade || ' months')::INTERVAL;
    END IF;
    NEW.notificado_vencimento := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calc_vencimento
  BEFORE INSERT OR UPDATE ON public.treinamentos_matriculas
  FOR EACH ROW EXECUTE FUNCTION public.calc_treinamento_vencimento();

CREATE OR REPLACE FUNCTION public.notify_treinamento_matricula()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_titulo TEXT;
  v_obrigatorio BOOLEAN;
BEGIN
  SELECT titulo, obrigatorio_para_todos INTO v_titulo, v_obrigatorio
  FROM public.treinamentos WHERE id = NEW.treinamento_id;

  INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem, link)
  VALUES (
    NEW.user_id,
    CASE WHEN v_obrigatorio THEN 'alerta' ELSE 'info' END,
    'Novo treinamento disponível',
    'Você foi matriculado no treinamento "' || v_titulo || '"' ||
      CASE WHEN v_obrigatorio THEN ' (obrigatório)' ELSE '' END || '.',
    '/treinamentos'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_matricula
  AFTER INSERT ON public.treinamentos_matriculas
  FOR EACH ROW EXECUTE FUNCTION public.notify_treinamento_matricula();

CREATE OR REPLACE VIEW public.vw_treinamentos_status
WITH (security_invoker = true) AS
SELECT
  m.id AS matricula_id,
  m.user_id,
  m.treinamento_id,
  t.codigo,
  t.titulo,
  t.categoria,
  t.carga_horaria_minutos,
  t.validade_meses,
  t.obrigatorio_para_todos,
  m.status,
  m.data_matricula,
  m.data_inicio,
  m.data_conclusao,
  m.data_vencimento,
  m.nota,
  m.certificado_url,
  CASE
    WHEN m.status = 'dispensado' THEN 'dispensado'
    WHEN m.status IN ('pendente','em_andamento') THEN 'pendente'
    WHEN m.status = 'concluido' AND m.data_vencimento IS NULL THEN 'vigente'
    WHEN m.status = 'concluido' AND m.data_vencimento > now() + INTERVAL '30 days' THEN 'vigente'
    WHEN m.status = 'concluido' AND m.data_vencimento > now() THEN 'vencendo'
    WHEN m.status = 'concluido' AND m.data_vencimento <= now() THEN 'vencido'
    WHEN m.status = 'expirado' THEN 'vencido'
    ELSE 'indefinido'
  END AS situacao,
  CASE
    WHEN m.data_vencimento IS NOT NULL
    THEN EXTRACT(DAY FROM (m.data_vencimento - now()))::INTEGER
    ELSE NULL
  END AS dias_ate_vencimento
FROM public.treinamentos_matriculas m
JOIN public.treinamentos t ON t.id = m.treinamento_id;

GRANT SELECT ON public.vw_treinamentos_status TO authenticated;

INSERT INTO public.treinamentos (codigo, titulo, descricao, categoria, carga_horaria_minutos, validade_meses, obrigatorio_para_todos) VALUES
('NR-05', 'CIPA - Comissão Interna de Prevenção de Acidentes', 'Treinamento obrigatório sobre prevenção de acidentes de trabalho.', 'nr', 1200, 12, false),
('NR-06', 'EPI - Equipamentos de Proteção Individual', 'Uso correto, conservação e higienização de EPIs.', 'nr', 240, 12, true),
('LGPD-01', 'LGPD - Lei Geral de Proteção de Dados', 'Fundamentos, direitos dos titulares e obrigações da empresa.', 'lgpd', 180, 24, true),
('SEG-INFO', 'Segurança da Informação', 'Boas práticas contra phishing, senhas fortes e proteção de dados.', 'seguranca', 120, 12, true),
('COD-CONDUTA', 'Código de Conduta e Ética', 'Valores, integridade e canais de denúncia.', 'compliance', 90, 24, true);
