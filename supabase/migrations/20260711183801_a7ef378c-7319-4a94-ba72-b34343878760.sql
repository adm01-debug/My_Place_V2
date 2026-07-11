
CREATE TYPE public.feriado_tipo AS ENUM ('nacional','estadual','municipal','facultativo');
CREATE TYPE public.evento_tipo AS ENUM ('treinamento','reuniao','confraternizacao','outro');

CREATE TABLE public.feriados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  nome TEXT NOT NULL,
  tipo public.feriado_tipo NOT NULL DEFAULT 'nacional',
  uf TEXT,
  recorrente BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feriados TO authenticated;
GRANT ALL ON public.feriados TO service_role;
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_view_feriados" ON public.feriados FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_feriados" ON public.feriados FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_feriados_data ON public.feriados(data);

CREATE TRIGGER trg_feriados_updated
  BEFORE UPDATE ON public.feriados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.eventos_corporativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo public.evento_tipo NOT NULL DEFAULT 'outro',
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,
  local TEXT,
  todos_convidados BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.eventos_corporativos TO authenticated;
GRANT ALL ON public.eventos_corporativos TO service_role;
ALTER TABLE public.eventos_corporativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_view_eventos" ON public.eventos_corporativos FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_eventos" ON public.eventos_corporativos FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_eventos_data ON public.eventos_corporativos(data_inicio);

CREATE TRIGGER trg_eventos_updated
  BEFORE UPDATE ON public.eventos_corporativos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função consolidada de eventos do calendário (feriados + eventos + férias aprovadas + aniversariantes)
CREATE OR REPLACE FUNCTION public.fn_calendario_mes(p_ano INTEGER, p_mes INTEGER)
RETURNS TABLE(
  data DATE,
  titulo TEXT,
  tipo TEXT,
  detalhe TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- Feriados (recorrentes projetados para o ano solicitado)
  SELECT
    CASE WHEN f.recorrente THEN make_date(p_ano, EXTRACT(MONTH FROM f.data)::INT, EXTRACT(DAY FROM f.data)::INT)
         ELSE f.data END AS data,
    f.nome AS titulo,
    'feriado'::TEXT AS tipo,
    f.tipo::TEXT AS detalhe
  FROM public.feriados f
  WHERE (f.recorrente AND EXTRACT(MONTH FROM f.data)::INT = p_mes)
     OR (NOT f.recorrente AND EXTRACT(YEAR FROM f.data)::INT = p_ano AND EXTRACT(MONTH FROM f.data)::INT = p_mes)

  UNION ALL

  -- Eventos corporativos
  SELECT
    e.data_inicio::DATE AS data,
    e.titulo,
    'evento'::TEXT AS tipo,
    e.tipo::TEXT AS detalhe
  FROM public.eventos_corporativos e
  WHERE EXTRACT(YEAR FROM e.data_inicio)::INT = p_ano
    AND EXTRACT(MONTH FROM e.data_inicio)::INT = p_mes

  UNION ALL

  -- Aniversariantes (só mês/dia, sem ano de nascimento)
  SELECT
    make_date(p_ano, EXTRACT(MONTH FROM p.data_nascimento)::INT, EXTRACT(DAY FROM p.data_nascimento)::INT) AS data,
    p.nome AS titulo,
    'aniversario'::TEXT AS tipo,
    NULL::TEXT AS detalhe
  FROM public.profiles p
  WHERE p.data_nascimento IS NOT NULL
    AND EXTRACT(MONTH FROM p.data_nascimento)::INT = p_mes

  UNION ALL

  -- Férias aprovadas (agregadas por colaborador, sem expor detalhes sensíveis)
  SELECT
    sf.data_inicio AS data,
    pr.nome AS titulo,
    'ferias'::TEXT AS tipo,
    (sf.dias || ' dias')::TEXT AS detalhe
  FROM public.solicitacoes_ferias sf
  JOIN public.profiles pr ON pr.id = sf.user_id
  WHERE sf.status = 'aprovada'
    AND ((EXTRACT(YEAR FROM sf.data_inicio)::INT = p_ano AND EXTRACT(MONTH FROM sf.data_inicio)::INT = p_mes)
      OR (EXTRACT(YEAR FROM sf.data_fim)::INT = p_ano AND EXTRACT(MONTH FROM sf.data_fim)::INT = p_mes))
$$;

-- Semear feriados nacionais fixos brasileiros
INSERT INTO public.feriados (data, nome, tipo, recorrente) VALUES
  ('2025-01-01','Confraternização Universal','nacional',true),
  ('2025-04-21','Tiradentes','nacional',true),
  ('2025-05-01','Dia do Trabalho','nacional',true),
  ('2025-09-07','Independência do Brasil','nacional',true),
  ('2025-10-12','Nossa Senhora Aparecida','nacional',true),
  ('2025-11-02','Finados','nacional',true),
  ('2025-11-15','Proclamação da República','nacional',true),
  ('2025-11-20','Consciência Negra','nacional',true),
  ('2025-12-25','Natal','nacional',true)
ON CONFLICT DO NOTHING;
