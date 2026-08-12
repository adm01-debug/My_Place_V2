
-- Item 47: Analytics de Templates
ALTER TABLE public.notificacao_entregas
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.notificacao_templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notif_entregas_template
  ON public.notificacao_entregas(template_id) WHERE template_id IS NOT NULL;

-- Reescreve fn_notificar_template para persistir template_id nas entregas
CREATE OR REPLACE FUNCTION public.fn_notificar_template(
  _user_id UUID,
  _codigo TEXT,
  _vars JSONB DEFAULT '{}'::jsonb,
  _tipo public.tipo_notificacao DEFAULT 'info',
  _categoria public.notif_categoria DEFAULT 'sistema',
  _link TEXT DEFAULT NULL,
  _nivel public.notif_nivel DEFAULT 'info',
  _idioma TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tpl public.notificacao_templates;
  _lang TEXT;
  _titulo TEXT;
  _mensagem TEXT;
  _notif_id UUID;
BEGIN
  IF _user_id IS NULL OR _codigo IS NULL THEN RETURN NULL; END IF;

  IF _idioma IS NULL THEN
    SELECT COALESCE(NULLIF(idioma_preferido, ''), 'pt-BR') INTO _lang
      FROM public.profiles WHERE id = _user_id;
    _lang := COALESCE(_lang, 'pt-BR');
  ELSE
    _lang := _idioma;
  END IF;

  _tpl := public.fn_get_template(_codigo, 'in_app', _lang);

  IF _tpl.id IS NULL THEN
    _titulo := _codigo;
    _mensagem := CASE WHEN _vars = '{}'::jsonb OR _vars IS NULL
                      THEN 'Nova notificação: ' || _codigo
                      ELSE _vars::text END;
  ELSE
    _titulo := public.fn_render_template(_tpl.titulo_template, _vars);
    _mensagem := public.fn_render_template(_tpl.mensagem_template, _vars);
    IF _categoria = 'sistema' AND _tpl.categoria IS NOT NULL THEN
      BEGIN _categoria := _tpl.categoria::public.notif_categoria;
      EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
  END IF;

  _notif_id := public.fn_notificar(_user_id, _titulo, _mensagem, _tipo, _categoria, _link, _nivel);

  -- Marca todas as entregas recém criadas dessa notificação com o template usado
  IF _tpl.id IS NOT NULL THEN
    IF _notif_id IS NOT NULL THEN
      UPDATE public.notificacao_entregas
        SET template_id = _tpl.id
        WHERE notificacao_id = _notif_id AND template_id IS NULL;
    ELSE
      -- Casos em que fn_notificar não retornou id (rate_limited/agrupado): marca as mais recentes desse usuário
      UPDATE public.notificacao_entregas
        SET template_id = _tpl.id
        WHERE user_id = _user_id
          AND template_id IS NULL
          AND created_at >= now() - interval '2 seconds';
    END IF;
  END IF;

  RETURN _notif_id;
END $$;

GRANT EXECUTE ON FUNCTION public.fn_notificar_template(
  UUID, TEXT, JSONB, public.tipo_notificacao, public.notif_categoria, TEXT, public.notif_nivel, TEXT
) TO authenticated, service_role;

-- Estatísticas agregadas por template (para dashboard/A/B)
CREATE OR REPLACE FUNCTION public.fn_notif_template_stats(_periodo_dias INT DEFAULT 30)
RETURNS TABLE (
  template_id UUID,
  codigo TEXT,
  canal TEXT,
  idioma TEXT,
  versao INT,
  total_envios BIGINT,
  entregues BIGINT,
  bloqueados BIGINT,
  agrupados BIGINT,
  taxa_sucesso NUMERIC,
  ultimo_uso TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.codigo,
    t.canal,
    t.idioma,
    t.versao,
    COUNT(e.id) AS total_envios,
    COUNT(*) FILTER (WHERE e.status = 'enviado') AS entregues,
    COUNT(*) FILTER (WHERE e.status = 'bloqueado') AS bloqueados,
    COUNT(*) FILTER (WHERE e.status = 'agrupado') AS agrupados,
    ROUND(
      CASE WHEN COUNT(e.id) = 0 THEN 0
           ELSE (COUNT(*) FILTER (WHERE e.status = 'enviado'))::numeric * 100 / COUNT(e.id)
      END, 2) AS taxa_sucesso,
    MAX(e.created_at) AS ultimo_uso
  FROM public.notificacao_templates t
  LEFT JOIN public.notificacao_entregas e
    ON e.template_id = t.id
   AND e.created_at >= now() - make_interval(days => GREATEST(_periodo_dias, 1))
  GROUP BY t.id, t.codigo, t.canal, t.idioma, t.versao
  ORDER BY total_envios DESC, t.codigo;
$$;

GRANT EXECUTE ON FUNCTION public.fn_notif_template_stats(INT) TO authenticated, service_role;
