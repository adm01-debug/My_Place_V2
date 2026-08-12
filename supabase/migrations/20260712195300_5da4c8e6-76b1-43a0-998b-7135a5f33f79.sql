
-- 1) Kudos → template kudos_recebido
CREATE OR REPLACE FUNCTION public.fn_notify_kudos_recebido()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_remetente TEXT;
BEGIN
  SELECT nome INTO v_remetente FROM public.profiles WHERE id = NEW.remetente_id;
  PERFORM public.fn_notificar_template(
    NEW.destinatario_id,
    'kudos_recebido',
    jsonb_build_object(
      'remetente', COALESCE(v_remetente, 'Um colega'),
      'mensagem',  COALESCE(NEW.mensagem, ''),
      'icone',     COALESCE(NEW.icone, '🎉')
    ),
    'sucesso'::tipo_notificacao,
    'engajamento'::notif_categoria,
    '/kudos',
    'info'::notif_nivel
  );
  RETURN NEW;
END; $$;

-- 2) Férias → ferias_aprovadas | ferias_reprovadas (fallback ferias_solicitadas)
CREATE OR REPLACE FUNCTION public.fn_notify_ferias_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_codigo TEXT; v_tipo tipo_notificacao;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status <> 'pendente' THEN
    v_codigo := CASE NEW.status
      WHEN 'aprovada' THEN 'ferias_aprovadas'
      WHEN 'recusada' THEN 'ferias_reprovadas'
      ELSE 'ferias_solicitadas'
    END;
    v_tipo := CASE NEW.status
      WHEN 'aprovada' THEN 'sucesso'::tipo_notificacao
      WHEN 'recusada' THEN 'erro'::tipo_notificacao
      ELSE 'info'::tipo_notificacao
    END;
    PERFORM public.fn_notificar_template(
      NEW.user_id,
      v_codigo,
      jsonb_build_object(
        'inicio', to_char(NEW.data_inicio,'DD/MM/YYYY'),
        'fim',    to_char(NEW.data_fim,'DD/MM/YYYY'),
        'motivo', COALESCE(NEW.observacoes_gestor, NEW.observacoes, '')
      ),
      v_tipo,
      'ferias'::notif_categoria,
      '/ferias',
      'info'::notif_nivel
    );
  END IF;
  RETURN NEW;
END; $$;

-- 3) Chamado status → chamado_atualizado / chamado_resolvido
CREATE OR REPLACE FUNCTION public.fn_notify_chamado_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_codigo TEXT;
BEGIN
  IF TG_OP='UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    v_codigo := CASE
      WHEN NEW.status::text IN ('resolvido','fechado') THEN 'chamado_resolvido'
      ELSE 'chamado_atualizado'
    END;
    PERFORM public.fn_notificar_template(
      NEW.user_id,
      v_codigo,
      jsonb_build_object(
        'numero',   NEW.numero,
        'status',   REPLACE(NEW.status::text,'_',' '),
        'mensagem', COALESCE(NEW.assunto, '')
      ),
      'info'::tipo_notificacao,
      'helpdesk'::notif_categoria,
      '/chamados',
      'info'::notif_nivel
    );
  END IF;
  RETURN NEW;
END; $$;
