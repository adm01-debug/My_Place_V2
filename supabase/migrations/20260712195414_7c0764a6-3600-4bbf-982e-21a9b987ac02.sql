
-- Novos templates
INSERT INTO public.notificacao_templates (codigo, categoria, canal, idioma, versao, ativo, titulo_template, mensagem_template, variaveis_esperadas, descricao) VALUES
('atestado_validado','ponto','in_app','pt-BR',1,true,'Atestado validado ✅','Seu atestado de {{dias}} dia(s) a partir de {{inicio}} foi validado.','["dias","inicio"]'::jsonb,NULL),
('atestado_recusado','ponto','in_app','pt-BR',1,true,'Atestado recusado ❌','Seu atestado de {{dias}} dia(s) a partir de {{inicio}} foi recusado. {{motivo}}','["dias","inicio","motivo"]'::jsonb,NULL),
('reembolso_aprovado','financeiro','in_app','pt-BR',1,true,'Reembolso aprovado 💰','Seu reembolso de R$ {{valor}} foi aprovado.','["valor"]'::jsonb,NULL),
('reembolso_reprovado','financeiro','in_app','pt-BR',1,true,'Reembolso não aprovado','Seu reembolso de R$ {{valor}} não foi aprovado. Motivo: {{motivo}}','["valor","motivo"]'::jsonb,NULL),
('solicitacao_aprovada','solicitacoes','in_app','pt-BR',1,true,'Solicitação aprovada ✅','Sua solicitação "{{titulo}}" foi aprovada.','["titulo"]'::jsonb,NULL),
('solicitacao_reprovada','solicitacoes','in_app','pt-BR',1,true,'Solicitação reprovada','Sua solicitação "{{titulo}}" foi reprovada. Motivo: {{motivo}}','["titulo","motivo"]'::jsonb,NULL),
('ideia_atualizada','engajamento','in_app','pt-BR',1,true,'Sua ideia foi {{status}}','A ideia "{{titulo}}" foi {{status}}.','["titulo","status"]'::jsonb,NULL),
('justificativa_atualizada','ponto','in_app','pt-BR',1,true,'Justificativa {{status}}','Sua justificativa referente a {{data}} foi {{status}}.','["data","status"]'::jsonb,NULL),
('chamado_mensagem_nova','helpdesk','in_app','pt-BR',1,true,'Nova mensagem no chamado #{{numero}}','{{previa}}','["numero","previa"]'::jsonb,NULL)
ON CONFLICT DO NOTHING;

-- Atestado
CREATE OR REPLACE FUNCTION public.fn_notify_atestado_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_codigo TEXT; v_tipo tipo_notificacao;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status <> 'pendente' THEN
    v_codigo := CASE NEW.status WHEN 'validado' THEN 'atestado_validado' WHEN 'recusado' THEN 'atestado_recusado' ELSE NULL END;
    IF v_codigo IS NULL THEN RETURN NEW; END IF;
    v_tipo := CASE NEW.status WHEN 'validado' THEN 'sucesso' ELSE 'erro' END::tipo_notificacao;
    PERFORM public.fn_notificar_template(NEW.user_id, v_codigo,
      jsonb_build_object('dias', NEW.dias_afastamento, 'inicio', to_char(NEW.data_inicial,'DD/MM/YYYY'),
                         'motivo', COALESCE(NEW.observacoes,'')),
      v_tipo, 'ponto'::notif_categoria, '/atestados', 'info'::notif_nivel);
  END IF;
  RETURN NEW;
END; $$;

-- Reembolso
CREATE OR REPLACE FUNCTION public.fn_notify_reembolso_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_codigo TEXT; v_tipo tipo_notificacao;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status <> 'pendente' THEN
    v_codigo := CASE NEW.status WHEN 'aprovado' THEN 'reembolso_aprovado' WHEN 'reprovado' THEN 'reembolso_reprovado' ELSE NULL END;
    IF v_codigo IS NULL THEN RETURN NEW; END IF;
    v_tipo := CASE NEW.status WHEN 'aprovado' THEN 'sucesso' ELSE 'erro' END::tipo_notificacao;
    PERFORM public.fn_notificar_template(NEW.user_id, v_codigo,
      jsonb_build_object('valor', to_char(NEW.valor,'FM999G999G990D00'),
                         'motivo', COALESCE(NEW.motivo_reprovacao, NEW.observacoes,'')),
      v_tipo, 'financeiro'::notif_categoria, '/reembolsos','info'::notif_nivel);
  END IF;
  RETURN NEW;
END; $$;

-- Solicitação genérica
CREATE OR REPLACE FUNCTION public.fn_notify_solicitacao_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_codigo TEXT; v_tipo tipo_notificacao;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status <> 'pendente' THEN
    v_codigo := CASE NEW.status WHEN 'aprovada' THEN 'solicitacao_aprovada' WHEN 'reprovada' THEN 'solicitacao_reprovada' ELSE NULL END;
    IF v_codigo IS NULL THEN RETURN NEW; END IF;
    v_tipo := CASE NEW.status WHEN 'aprovada' THEN 'sucesso' ELSE 'erro' END::tipo_notificacao;
    PERFORM public.fn_notificar_template(NEW.user_id, v_codigo,
      jsonb_build_object('titulo', COALESCE(NEW.titulo,'Solicitação'),
                         'motivo', COALESCE(NEW.observacoes_gestor,'')),
      v_tipo, 'solicitacoes'::notif_categoria, '/solicitacoes','info'::notif_nivel);
  END IF;
  RETURN NEW;
END; $$;

-- Ideia
CREATE OR REPLACE FUNCTION public.fn_notify_ideia_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_label TEXT; v_tipo tipo_notificacao;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_label := CASE NEW.status
      WHEN 'em_analise' THEN 'em análise 🔍'
      WHEN 'aprovada' THEN 'aprovada ✅'
      WHEN 'implementada' THEN 'implementada 🚀'
      WHEN 'recusada' THEN 'recusada ❌'
      ELSE NEW.status::TEXT END;
    v_tipo := CASE WHEN NEW.status IN ('aprovada','implementada') THEN 'sucesso'
                   WHEN NEW.status='recusada' THEN 'erro' ELSE 'info' END::tipo_notificacao;
    PERFORM public.fn_notificar_template(NEW.user_id,'ideia_atualizada',
      jsonb_build_object('titulo', NEW.titulo, 'status', v_label),
      v_tipo, 'engajamento'::notif_categoria, '/ideias', 'info'::notif_nivel);
  END IF;
  RETURN NEW;
END; $$;

-- Justificativa
CREATE OR REPLACE FUNCTION public.fn_notify_justificativa_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_label TEXT; v_tipo tipo_notificacao;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status <> 'pendente' THEN
    v_label := CASE NEW.status WHEN 'aprovada' THEN 'aprovada ✅' ELSE 'recusada ❌' END;
    v_tipo  := CASE NEW.status WHEN 'aprovada' THEN 'sucesso' ELSE 'erro' END::tipo_notificacao;
    PERFORM public.fn_notificar_template(NEW.user_id,'justificativa_atualizada',
      jsonb_build_object('data', to_char(NEW.data_referencia,'DD/MM/YYYY'), 'status', v_label),
      v_tipo, 'ponto'::notif_categoria, '/ponto', 'info'::notif_nivel);
  END IF;
  RETURN NEW;
END; $$;

-- Chamado mensagem nova
CREATE OR REPLACE FUNCTION public.fn_notify_chamado_msg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_ch RECORD; v_destinatario UUID;
BEGIN
  IF NEW.interna THEN RETURN NEW; END IF;
  SELECT * INTO v_ch FROM public.chamados WHERE id = NEW.chamado_id;
  v_destinatario := CASE WHEN NEW.autor_id = v_ch.user_id THEN v_ch.atendente_id ELSE v_ch.user_id END;
  IF v_ch.primeira_resposta_em IS NULL AND NEW.autor_id <> v_ch.user_id THEN
    UPDATE public.chamados SET primeira_resposta_em = now(),
      status = CASE WHEN status='aberto' THEN 'em_andamento'::chamado_status ELSE status END
    WHERE id = v_ch.id;
  END IF;
  IF v_destinatario IS NOT NULL THEN
    PERFORM public.fn_notificar_template(v_destinatario,'chamado_mensagem_nova',
      jsonb_build_object('numero', v_ch.numero, 'previa', LEFT(NEW.mensagem,120)),
      'info'::tipo_notificacao, 'helpdesk'::notif_categoria, '/chamados', 'info'::notif_nivel);
  END IF;
  RETURN NEW;
END; $$;
