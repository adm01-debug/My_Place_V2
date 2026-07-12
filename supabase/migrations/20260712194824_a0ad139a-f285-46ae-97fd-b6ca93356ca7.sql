
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
BEGIN
  IF _user_id IS NULL OR _codigo IS NULL THEN
    RETURN NULL;
  END IF;

  -- Resolve idioma: parâmetro > profile > pt-BR
  IF _idioma IS NULL THEN
    SELECT COALESCE(NULLIF(idioma_preferido, ''), 'pt-BR') INTO _lang
      FROM public.profiles WHERE id = _user_id;
    _lang := COALESCE(_lang, 'pt-BR');
  ELSE
    _lang := _idioma;
  END IF;

  _tpl := public.fn_get_template(_codigo, 'in_app', _lang);

  IF _tpl.id IS NULL THEN
    -- Fallback seguro: sem template cadastrado, usa código como título
    _titulo := _codigo;
    _mensagem := CASE WHEN _vars = '{}'::jsonb OR _vars IS NULL
                      THEN 'Nova notificação: ' || _codigo
                      ELSE _vars::text END;
  ELSE
    _titulo := public.fn_render_template(_tpl.titulo_template, _vars);
    _mensagem := public.fn_render_template(_tpl.mensagem_template, _vars);
    -- Categoria do template prevalece se caller passou default 'sistema'
    IF _categoria = 'sistema' AND _tpl.categoria IS NOT NULL THEN
      BEGIN
        _categoria := _tpl.categoria::public.notif_categoria;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END IF;

  RETURN public.fn_notificar(_user_id, _titulo, _mensagem, _tipo, _categoria, _link, _nivel);
END $$;

GRANT EXECUTE ON FUNCTION public.fn_notificar_template(
  UUID, TEXT, JSONB, public.tipo_notificacao, public.notif_categoria, TEXT, public.notif_nivel, TEXT
) TO authenticated, service_role;

-- Adiciona coluna idioma_preferido no profile se ainda não existir
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'idioma_preferido'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN idioma_preferido TEXT DEFAULT 'pt-BR';
  END IF;
END $$;
