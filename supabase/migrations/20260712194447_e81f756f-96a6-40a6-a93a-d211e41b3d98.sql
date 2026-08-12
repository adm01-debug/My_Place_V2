
CREATE OR REPLACE FUNCTION public.fn_notificar(_user_id uuid, _titulo text, _mensagem text, _tipo tipo_notificacao, _categoria notif_categoria, _link text DEFAULT NULL::text, _nivel notif_nivel DEFAULT 'info'::notif_nivel)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _id uuid;
  _canal text;
  _motivo text;
  _canais text[] := ARRAY['in_app','email','push','whatsapp'];
  _freq public.notif_digest_freq;
  _agrupar boolean := false;
  _permitido boolean;
BEGIN
  IF _user_id IS NULL THEN RETURN NULL; END IF;

  -- Rate limit: aplica-se apenas a notificações não-críticas
  IF _nivel <> 'critico' THEN
    _permitido := public.fn_rate_limit_check(_user_id, _categoria::text);
    IF NOT _permitido THEN
      FOREACH _canal IN ARRAY _canais LOOP
        INSERT INTO public.notificacao_entregas
          (notificacao_id, user_id, categoria, nivel, canal, status, motivo, titulo, mensagem)
        VALUES (NULL, _user_id, _categoria, _nivel, _canal, 'bloqueado', 'rate_limited', _titulo, _mensagem);
      END LOOP;
      RETURN NULL;
    END IF;
  END IF;

  SELECT digest_frequencia INTO _freq
    FROM public.notificacao_preferencias
   WHERE user_id = _user_id AND categoria = _categoria;

  IF _freq IS NOT NULL AND _freq <> 'imediato' AND _nivel <> 'critico' THEN
    _agrupar := true;
  END IF;

  IF _agrupar THEN
    INSERT INTO public.notificacao_digest_fila
      (user_id, categoria, nivel, tipo, titulo, mensagem, link)
    VALUES (_user_id, _categoria, _nivel, _tipo, _titulo, _mensagem, _link);

    FOREACH _canal IN ARRAY _canais LOOP
      INSERT INTO public.notificacao_entregas
        (notificacao_id, user_id, categoria, nivel, canal, status, motivo, titulo, mensagem)
      VALUES (NULL, _user_id, _categoria, _nivel, _canal, 'agrupado', 'digest_pendente', _titulo, _mensagem);
    END LOOP;

    RETURN NULL;
  END IF;

  IF public.fn_pode_notificar(_user_id, _categoria, 'in_app', _nivel) THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (_user_id, _titulo, _mensagem, _tipo, _link)
    RETURNING id INTO _id;
  END IF;

  FOREACH _canal IN ARRAY _canais LOOP
    _motivo := public.fn_motivo_bloqueio(_user_id, _categoria, _canal, _nivel);
    INSERT INTO public.notificacao_entregas
      (notificacao_id, user_id, categoria, nivel, canal, status, motivo, titulo, mensagem)
    VALUES (
      _id, _user_id, _categoria, _nivel, _canal,
      CASE WHEN _motivo IS NULL THEN 'enviado' ELSE 'bloqueado' END,
      _motivo, _titulo, _mensagem
    );
  END LOOP;

  RETURN _id;
END $function$;
