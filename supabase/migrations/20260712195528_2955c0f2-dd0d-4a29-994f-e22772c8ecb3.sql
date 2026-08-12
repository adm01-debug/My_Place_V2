
INSERT INTO public.notificacao_templates (codigo, categoria, canal, idioma, versao, ativo, titulo_template, mensagem_template, variaveis_esperadas, descricao) VALUES
('gestor_novo_atestado','aprovacoes','in_app','pt-BR',1,true,'Novo atestado para análise','{{colaborador}} enviou atestado de {{dias}} dia(s) a partir de {{inicio}}.','["colaborador","dias","inicio"]'::jsonb,NULL),
('gestor_nova_ferias','aprovacoes','in_app','pt-BR',1,true,'Nova solicitação de férias','{{colaborador}} solicitou férias de {{inicio}} a {{fim}} ({{dias}} dias).','["colaborador","inicio","fim","dias"]'::jsonb,NULL),
('gestor_novo_reembolso','aprovacoes','in_app','pt-BR',1,true,'Novo reembolso para análise','{{colaborador}} enviou reembolso de R$ {{valor}} — {{descricao}}.','["colaborador","valor","descricao"]'::jsonb,NULL),
('gestor_nova_solicitacao','aprovacoes','in_app','pt-BR',1,true,'Nova solicitação para análise','{{colaborador}} abriu: "{{titulo}}".','["colaborador","titulo"]'::jsonb,NULL)
ON CONFLICT DO NOTHING;

-- Helper: notifica gestor + todos os admins (dedup, exclui o próprio autor)
CREATE OR REPLACE FUNCTION public.fn_notificar_aprovadores(
  _autor_id UUID, _codigo TEXT, _vars JSONB, _link TEXT
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT dest_id FROM (
      SELECT gestor_id AS dest_id FROM public.profiles WHERE id = _autor_id AND gestor_id IS NOT NULL
      UNION
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    ) x
    WHERE dest_id IS NOT NULL AND dest_id <> _autor_id
  LOOP
    PERFORM public.fn_notificar_template(
      r.dest_id, _codigo, _vars,
      'info'::tipo_notificacao, 'aprovacoes'::notif_categoria, _link, 'info'::notif_nivel
    );
  END LOOP;
END; $$;

-- Atestado
CREATE OR REPLACE FUNCTION public.fn_notify_manager_new_atestado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_nome TEXT;
BEGIN
  SELECT nome INTO v_nome FROM public.profiles WHERE id = NEW.user_id;
  PERFORM public.fn_notificar_aprovadores(NEW.user_id,'gestor_novo_atestado',
    jsonb_build_object('colaborador', COALESCE(v_nome,'Colaborador'),
                       'dias', NEW.dias_afastamento,
                       'inicio', to_char(NEW.data_inicial,'DD/MM/YYYY')),
    '/admin/aprovacoes');
  RETURN NEW;
END; $$;

-- Férias
CREATE OR REPLACE FUNCTION public.fn_notify_manager_new_ferias()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_nome TEXT;
BEGIN
  SELECT nome INTO v_nome FROM public.profiles WHERE id = NEW.user_id;
  PERFORM public.fn_notificar_aprovadores(NEW.user_id,'gestor_nova_ferias',
    jsonb_build_object('colaborador', COALESCE(v_nome,'Colaborador'),
                       'inicio', to_char(NEW.data_inicio,'DD/MM/YYYY'),
                       'fim',    to_char(NEW.data_fim,'DD/MM/YYYY'),
                       'dias',   NEW.dias),
    '/admin/aprovacoes');
  RETURN NEW;
END; $$;

-- Reembolso
CREATE OR REPLACE FUNCTION public.fn_notify_manager_new_reembolso()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_nome TEXT;
BEGIN
  SELECT nome INTO v_nome FROM public.profiles WHERE id = NEW.user_id;
  PERFORM public.fn_notificar_aprovadores(NEW.user_id,'gestor_novo_reembolso',
    jsonb_build_object('colaborador', COALESCE(v_nome,'Colaborador'),
                       'valor', to_char(NEW.valor,'FM999G999G990D00'),
                       'descricao', COALESCE(NEW.descricao,'')),
    '/admin/aprovacoes');
  RETURN NEW;
END; $$;

-- Solicitação genérica
CREATE OR REPLACE FUNCTION public.fn_notify_manager_new_solicitacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_nome TEXT;
BEGIN
  SELECT nome INTO v_nome FROM public.profiles WHERE id = NEW.user_id;
  PERFORM public.fn_notificar_aprovadores(NEW.user_id,'gestor_nova_solicitacao',
    jsonb_build_object('colaborador', COALESCE(v_nome,'Colaborador'),
                       'titulo', COALESCE(NEW.titulo,'Solicitação')),
    '/admin/aprovacoes');
  RETURN NEW;
END; $$;
