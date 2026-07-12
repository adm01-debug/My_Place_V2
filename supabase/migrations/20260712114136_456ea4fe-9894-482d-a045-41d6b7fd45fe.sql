
-- MV 1
CREATE MATERIALIZED VIEW IF NOT EXISTS public.bi_headcount_mensal AS
WITH meses AS (
  SELECT generate_series(date_trunc('month', now() - interval '23 months'),
    date_trunc('month', now()), interval '1 month')::date AS mes
)
SELECT m.mes, COALESCE(p.departamento, 'Sem Departamento') AS departamento,
  COUNT(p.id) FILTER (WHERE p.data_admissao IS NOT NULL
    AND p.data_admissao <= (m.mes + interval '1 month' - interval '1 day')::date)::int AS ativos
FROM meses m LEFT JOIN public.profiles p ON true
GROUP BY m.mes, COALESCE(p.departamento, 'Sem Departamento');
CREATE UNIQUE INDEX IF NOT EXISTS idx_bi_headcount_pk ON public.bi_headcount_mensal (mes, departamento);

-- MV 2
CREATE MATERIALIZED VIEW IF NOT EXISTS public.bi_absenteismo_mensal AS
SELECT date_trunc('month', a.data_inicial)::date AS mes,
  COALESCE(p.departamento, 'Sem Departamento') AS departamento,
  COUNT(*)::int AS total_atestados,
  COALESCE(SUM(a.dias_afastamento), 0)::int AS dias_afastados,
  ROUND((COALESCE(SUM(a.dias_afastamento), 0)::numeric
    / NULLIF(COUNT(DISTINCT p.id) * 22, 0)) * 100, 2) AS taxa_absenteismo_pct
FROM public.atestados a JOIN public.profiles p ON p.id = a.user_id
WHERE a.status = 'validado'::atestado_status
  AND a.data_inicial >= (now() - interval '24 months')::date
GROUP BY 1, 2;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bi_absent_pk ON public.bi_absenteismo_mensal (mes, departamento);

-- MV 3
CREATE MATERIALIZED VIEW IF NOT EXISTS public.bi_custo_pessoal_mensal AS
WITH meses AS (
  SELECT generate_series(date_trunc('month', now() - interval '11 months'),
    date_trunc('month', now()), interval '1 month')::date AS mes
),
salarios AS (
  SELECT m.mes, COALESCE(p.departamento, 'Sem Departamento') AS departamento,
    COALESCE(SUM(p.salario_base), 0) AS total
  FROM meses m LEFT JOIN public.profiles p ON p.data_admissao IS NOT NULL
    AND p.data_admissao <= (m.mes + interval '1 month' - interval '1 day')::date
  GROUP BY m.mes, COALESCE(p.departamento, 'Sem Departamento')
),
reemb AS (
  SELECT date_trunc('month', r.created_at)::date AS mes,
    COALESCE(p.departamento, 'Sem Departamento') AS departamento,
    COALESCE(SUM(r.valor), 0) AS total
  FROM public.reembolsos r JOIN public.profiles p ON p.id = r.user_id
  WHERE r.status IN ('aprovado'::reembolso_status,'pago'::reembolso_status)
  GROUP BY 1, 2
),
viag AS (
  SELECT date_trunc('month', v.created_at)::date AS mes,
    COALESCE(p.departamento, 'Sem Departamento') AS departamento,
    COALESCE(SUM(v.total_despesas), 0) AS total
  FROM public.viagens v JOIN public.profiles p ON p.id = v.user_id GROUP BY 1, 2
),
vales AS (
  SELECT date_trunc('month', vt.data_recarga)::date AS mes,
    COALESCE(p.departamento, 'Sem Departamento') AS departamento,
    COALESCE(SUM(vt.valor_recarga), 0) AS total
  FROM public.vale_transportes vt JOIN public.profiles p ON p.id = vt.user_id GROUP BY 1, 2
)
SELECT s.mes, s.departamento,
  s.total::numeric(14,2) AS salarios,
  COALESCE(r.total,0)::numeric(14,2) AS reembolsos,
  COALESCE(v.total,0)::numeric(14,2) AS viagens,
  COALESCE(vl.total,0)::numeric(14,2) AS vales,
  (s.total + COALESCE(r.total,0) + COALESCE(v.total,0) + COALESCE(vl.total,0))::numeric(14,2) AS total
FROM salarios s
LEFT JOIN reemb r ON r.mes = s.mes AND r.departamento = s.departamento
LEFT JOIN viag v ON v.mes = s.mes AND v.departamento = s.departamento
LEFT JOIN vales vl ON vl.mes = s.mes AND vl.departamento = s.departamento;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bi_custo_pk ON public.bi_custo_pessoal_mensal (mes, departamento);

-- MV 4
CREATE MATERIALIZED VIEW IF NOT EXISTS public.bi_turnover_trimestral AS
WITH trims AS (
  SELECT generate_series(date_trunc('quarter', now() - interval '21 months'),
    date_trunc('quarter', now()), interval '3 months')::date AS trimestre
),
adm AS (
  SELECT date_trunc('quarter', data_admissao)::date AS trimestre,
    COALESCE(departamento, 'Sem Departamento') AS departamento, COUNT(*)::int AS admissoes
  FROM public.profiles WHERE data_admissao IS NOT NULL GROUP BY 1, 2
),
des AS (
  SELECT date_trunc('quarter', e.created_at)::date AS trimestre,
    COALESCE(p.departamento, 'Sem Departamento') AS departamento, COUNT(*)::int AS desligamentos
  FROM public.exit_interviews e JOIN public.profiles p ON p.id = e.user_id GROUP BY 1, 2
),
combos AS (
  SELECT DISTINCT trimestre, departamento FROM (
    SELECT trimestre, departamento FROM adm
    UNION ALL SELECT trimestre, departamento FROM des
  ) x
)
SELECT t.trimestre, c.departamento,
  COALESCE(a.admissoes, 0) AS admissoes,
  COALESCE(d.desligamentos, 0) AS desligamentos,
  ROUND(COALESCE(d.desligamentos, 0)::numeric
    / NULLIF(GREATEST(COALESCE(a.admissoes,0), 1), 0) * 100, 2) AS turnover_pct
FROM trims t
JOIN combos c ON c.trimestre = t.trimestre
LEFT JOIN adm a ON a.trimestre = t.trimestre AND a.departamento = c.departamento
LEFT JOIN des d ON d.trimestre = t.trimestre AND d.departamento = c.departamento;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bi_turnover_pk ON public.bi_turnover_trimestral (trimestre, departamento);

-- MV 5
CREATE MATERIALIZED VIEW IF NOT EXISTS public.bi_engajamento_mensal AS
WITH kd AS (
  SELECT date_trunc('month', k.created_at)::date AS mes,
    COALESCE(p.departamento, 'Sem Departamento') AS departamento, COUNT(*)::int AS kudos
  FROM public.kudos k JOIN public.profiles p ON p.id = k.destinatario_id GROUP BY 1, 2
),
tr AS (
  SELECT date_trunc('month', tm.data_conclusao)::date AS mes,
    COALESCE(p.departamento, 'Sem Departamento') AS departamento, COUNT(*)::int AS treinamentos_concluidos
  FROM public.treinamentos_matriculas tm JOIN public.profiles p ON p.id = tm.user_id
  WHERE tm.status = 'concluido' AND tm.data_conclusao IS NOT NULL GROUP BY 1, 2
),
cl AS (
  SELECT date_trunc('month', cr.created_at)::date AS mes,
    COALESCE(p.departamento, 'Sem Departamento') AS departamento, COUNT(*)::int AS clima_respostas
  FROM public.clima_respostas cr JOIN public.profiles p ON p.id = cr.user_id GROUP BY 1, 2
),
combos AS (
  SELECT DISTINCT mes, departamento FROM (
    SELECT mes, departamento FROM kd
    UNION ALL SELECT mes, departamento FROM tr
    UNION ALL SELECT mes, departamento FROM cl
  ) x
  WHERE mes >= (date_trunc('month', now()) - interval '11 months')::date
)
SELECT c.mes, c.departamento,
  COALESCE(kd.kudos, 0) AS kudos,
  COALESCE(tr.treinamentos_concluidos, 0) AS treinamentos_concluidos,
  COALESCE(cl.clima_respostas, 0) AS clima_respostas,
  (COALESCE(kd.kudos, 0)*3 + COALESCE(tr.treinamentos_concluidos, 0)*2 + COALESCE(cl.clima_respostas, 0))::int AS score_engajamento
FROM combos c
LEFT JOIN kd ON kd.mes = c.mes AND kd.departamento = c.departamento
LEFT JOIN tr ON tr.mes = c.mes AND tr.departamento = c.departamento
LEFT JOIN cl ON cl.mes = c.mes AND cl.departamento = c.departamento;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bi_engaj_pk ON public.bi_engajamento_mensal (mes, departamento);

-- MV 6
CREATE MATERIALIZED VIEW IF NOT EXISTS public.bi_compliance AS
WITH base AS (
  SELECT id, COALESCE(departamento, 'Sem Departamento') AS departamento FROM public.profiles
),
politicas_total AS (
  SELECT GREATEST(COUNT(*), 1)::numeric AS total FROM public.politicas WHERE versao_vigente_id IS NOT NULL
),
aceites_por_user AS (
  SELECT pa.user_id, COUNT(DISTINCT pv.politica_id)::numeric AS aceitas
  FROM public.politicas_aceites pa
  JOIN public.politicas_versoes pv ON pv.id = pa.versao_id
  GROUP BY pa.user_id
),
pol_dep AS (
  SELECT b.departamento,
    AVG(COALESCE(a.aceitas, 0) / (SELECT total FROM politicas_total)) * 100 AS pct
  FROM base b LEFT JOIN aceites_por_user a ON a.user_id = b.id
  GROUP BY b.departamento
),
tr_dep AS (
  SELECT b.departamento,
    CASE WHEN COUNT(tm.id) > 0
      THEN COUNT(*) FILTER (WHERE tm.status = 'concluido'
        AND (tm.data_vencimento IS NULL OR tm.data_vencimento >= CURRENT_DATE))::numeric
        / COUNT(tm.id) * 100 ELSE 100 END AS pct
  FROM base b LEFT JOIN public.treinamentos_matriculas tm ON tm.user_id = b.id
  GROUP BY b.departamento
),
epi_dep AS (
  SELECT b.departamento,
    CASE WHEN COUNT(ee.id) > 0
      THEN COUNT(*) FILTER (WHERE ee.status = 'entregue'
        AND (ee.previsao_troca IS NULL OR ee.previsao_troca >= CURRENT_DATE))::numeric
        / COUNT(ee.id) * 100 ELSE 100 END AS pct
  FROM base b LEFT JOIN public.epis_entregas ee ON ee.user_id = b.id
  GROUP BY b.departamento
)
SELECT COALESCE(p.departamento, t.departamento, e.departamento) AS departamento,
  ROUND(COALESCE(p.pct, 100), 2) AS politicas_pct,
  ROUND(COALESCE(t.pct, 100), 2) AS treinamentos_pct,
  ROUND(COALESCE(e.pct, 100), 2) AS epis_pct,
  ROUND((COALESCE(p.pct, 100) + COALESCE(t.pct, 100) + COALESCE(e.pct, 100)) / 3, 2) AS score_geral
FROM pol_dep p
FULL JOIN tr_dep t ON t.departamento = p.departamento
FULL JOIN epi_dep e ON e.departamento = COALESCE(p.departamento, t.departamento);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bi_compliance_pk ON public.bi_compliance (departamento);

CREATE OR REPLACE FUNCTION public.fn_bi_pode_ver()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
$$;

CREATE OR REPLACE FUNCTION public.fn_bi_refresh_all()
RETURNS TABLE(view_name text, refreshed_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem atualizar o BI';
  END IF;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.bi_headcount_mensal;
  RETURN QUERY SELECT 'bi_headcount_mensal'::text, now();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.bi_absenteismo_mensal;
  RETURN QUERY SELECT 'bi_absenteismo_mensal'::text, now();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.bi_custo_pessoal_mensal;
  RETURN QUERY SELECT 'bi_custo_pessoal_mensal'::text, now();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.bi_turnover_trimestral;
  RETURN QUERY SELECT 'bi_turnover_trimestral'::text, now();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.bi_engajamento_mensal;
  RETURN QUERY SELECT 'bi_engajamento_mensal'::text, now();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.bi_compliance;
  RETURN QUERY SELECT 'bi_compliance'::text, now();
END; $$;

CREATE OR REPLACE FUNCTION public.fn_bi_headcount(p_meses int DEFAULT 12)
RETURNS SETOF public.bi_headcount_mensal
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.fn_bi_pode_ver() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  RETURN QUERY SELECT * FROM public.bi_headcount_mensal
    WHERE mes >= (date_trunc('month', now()) - (p_meses || ' months')::interval)::date
    ORDER BY mes, departamento;
END; $$;

CREATE OR REPLACE FUNCTION public.fn_bi_absenteismo(p_meses int DEFAULT 12)
RETURNS SETOF public.bi_absenteismo_mensal
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.fn_bi_pode_ver() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  RETURN QUERY SELECT * FROM public.bi_absenteismo_mensal
    WHERE mes >= (date_trunc('month', now()) - (p_meses || ' months')::interval)::date
    ORDER BY mes, departamento;
END; $$;

CREATE OR REPLACE FUNCTION public.fn_bi_custo(p_meses int DEFAULT 12)
RETURNS SETOF public.bi_custo_pessoal_mensal
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.fn_bi_pode_ver() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  RETURN QUERY SELECT * FROM public.bi_custo_pessoal_mensal
    WHERE mes >= (date_trunc('month', now()) - (p_meses || ' months')::interval)::date
    ORDER BY mes, departamento;
END; $$;

CREATE OR REPLACE FUNCTION public.fn_bi_turnover()
RETURNS SETOF public.bi_turnover_trimestral
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.fn_bi_pode_ver() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  RETURN QUERY SELECT * FROM public.bi_turnover_trimestral ORDER BY trimestre, departamento;
END; $$;

CREATE OR REPLACE FUNCTION public.fn_bi_engajamento(p_meses int DEFAULT 12)
RETURNS SETOF public.bi_engajamento_mensal
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.fn_bi_pode_ver() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  RETURN QUERY SELECT * FROM public.bi_engajamento_mensal
    WHERE mes >= (date_trunc('month', now()) - (p_meses || ' months')::interval)::date
    ORDER BY mes, departamento;
END; $$;

CREATE OR REPLACE FUNCTION public.fn_bi_compliance()
RETURNS SETOF public.bi_compliance
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.fn_bi_pode_ver() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  RETURN QUERY SELECT * FROM public.bi_compliance ORDER BY score_geral DESC NULLS LAST;
END; $$;

CREATE TABLE IF NOT EXISTS public.bi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia date NOT NULL UNIQUE,
  criado_por uuid REFERENCES auth.users(id),
  headcount_total int NOT NULL DEFAULT 0,
  custo_total numeric(14,2) NOT NULL DEFAULT 0,
  absenteismo_medio numeric(6,2) NOT NULL DEFAULT 0,
  turnover_medio numeric(6,2) NOT NULL DEFAULT 0,
  compliance_score numeric(6,2) NOT NULL DEFAULT 0,
  engajamento_score int NOT NULL DEFAULT 0,
  kpis_detalhados jsonb NOT NULL DEFAULT '{}'::jsonb,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.bi_snapshots TO authenticated;
GRANT ALL ON public.bi_snapshots TO service_role;
ALTER TABLE public.bi_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BI snapshots select gestores" ON public.bi_snapshots FOR SELECT TO authenticated
  USING (public.fn_bi_pode_ver());
CREATE POLICY "BI snapshots insert admin" ON public.bi_snapshots FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND criado_por = auth.uid());

CREATE OR REPLACE FUNCTION public.fn_bi_criar_snapshot(p_mes date DEFAULT date_trunc('month', now())::date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_headcount int; v_custo numeric; v_absent numeric;
  v_turnover numeric; v_compl numeric; v_engaj int; v_kpis jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem congelar snapshots';
  END IF;
  SELECT COALESCE(SUM(ativos), 0) INTO v_headcount FROM public.bi_headcount_mensal WHERE mes = p_mes;
  SELECT COALESCE(SUM(total), 0) INTO v_custo FROM public.bi_custo_pessoal_mensal WHERE mes = p_mes;
  SELECT COALESCE(AVG(taxa_absenteismo_pct), 0) INTO v_absent FROM public.bi_absenteismo_mensal WHERE mes = p_mes;
  SELECT COALESCE(AVG(turnover_pct), 0) INTO v_turnover FROM public.bi_turnover_trimestral
    WHERE trimestre = date_trunc('quarter', p_mes)::date;
  SELECT COALESCE(AVG(score_geral), 0) INTO v_compl FROM public.bi_compliance;
  SELECT COALESCE(SUM(score_engajamento), 0) INTO v_engaj FROM public.bi_engajamento_mensal WHERE mes = p_mes;
  v_kpis := jsonb_build_object(
    'headcount_por_departamento', (SELECT jsonb_agg(row_to_json(t)) FROM
      (SELECT departamento, ativos FROM public.bi_headcount_mensal WHERE mes = p_mes) t),
    'custo_por_departamento', (SELECT jsonb_agg(row_to_json(t)) FROM
      (SELECT departamento, total FROM public.bi_custo_pessoal_mensal WHERE mes = p_mes) t)
  );
  INSERT INTO public.bi_snapshots (mes_referencia, criado_por, headcount_total, custo_total,
    absenteismo_medio, turnover_medio, compliance_score, engajamento_score, kpis_detalhados)
  VALUES (p_mes, auth.uid(), v_headcount, v_custo, v_absent, v_turnover, v_compl, v_engaj, v_kpis)
  ON CONFLICT (mes_referencia) DO UPDATE SET
    headcount_total = EXCLUDED.headcount_total, custo_total = EXCLUDED.custo_total,
    absenteismo_medio = EXCLUDED.absenteismo_medio, turnover_medio = EXCLUDED.turnover_medio,
    compliance_score = EXCLUDED.compliance_score, engajamento_score = EXCLUDED.engajamento_score,
    kpis_detalhados = EXCLUDED.kpis_detalhados
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

REFRESH MATERIALIZED VIEW public.bi_headcount_mensal;
REFRESH MATERIALIZED VIEW public.bi_absenteismo_mensal;
REFRESH MATERIALIZED VIEW public.bi_custo_pessoal_mensal;
REFRESH MATERIALIZED VIEW public.bi_turnover_trimestral;
REFRESH MATERIALIZED VIEW public.bi_engajamento_mensal;
REFRESH MATERIALIZED VIEW public.bi_compliance;
