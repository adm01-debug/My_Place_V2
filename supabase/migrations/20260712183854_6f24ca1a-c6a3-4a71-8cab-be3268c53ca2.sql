CREATE OR REPLACE FUNCTION public.fn_notificar(
  _user_id uuid,
  _titulo text,
  _mensagem text,
  _tipo tipo_notificacao,
  _categoria notif_categoria,
  _link text DEFAULT NULL,
  _nivel notif_nivel DEFAULT 'info'::notif_nivel
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT public.fn_pode_notificar(_user_id, _categoria, 'in_app', _nivel) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
  VALUES (_user_id, _titulo, _mensagem, _tipo, _link)
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_notificar(uuid, text, text, tipo_notificacao, notif_categoria, text, notif_nivel) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_notificar(uuid, text, text, tipo_notificacao, notif_categoria, text, notif_nivel) TO authenticated, service_role;