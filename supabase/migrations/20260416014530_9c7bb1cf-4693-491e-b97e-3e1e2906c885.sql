
-- Notify manager when a new solicitacao is created
CREATE OR REPLACE FUNCTION public.fn_notify_manager_new_solicitacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_employee_name TEXT;
  v_tipo_label TEXT;
  v_gestor_id UUID;
  v_admin RECORD;
BEGIN
  -- Get employee info
  SELECT nome, gestor_id INTO v_employee_name, v_gestor_id
  FROM public.profiles WHERE id = NEW.user_id;

  v_tipo_label := CASE NEW.tipo
    WHEN 'declaracao_vinculo' THEN 'Declaração de Vínculo'
    WHEN 'alteracao_dados' THEN 'Alteração de Dados'
    WHEN 'adiantamento_salarial' THEN 'Adiantamento Salarial'
    WHEN 'carta_recomendacao' THEN 'Carta de Recomendação'
    ELSE 'Solicitação'
  END;

  -- Notify direct manager
  IF v_gestor_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (
      v_gestor_id,
      'Nova ' || v_tipo_label,
      COALESCE(v_employee_name, 'Colaborador') || ' enviou uma nova ' || v_tipo_label || ' para aprovação.',
      'info'::tipo_notificacao,
      '/admin/aprovacoes'
    );
  END IF;

  -- Notify all admins (except the employee themselves)
  FOR v_admin IN
    SELECT ur.user_id FROM public.user_roles ur
    WHERE ur.role = 'admin' AND ur.user_id != NEW.user_id AND ur.user_id IS DISTINCT FROM v_gestor_id
  LOOP
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (
      v_admin.user_id,
      'Nova ' || v_tipo_label,
      COALESCE(v_employee_name, 'Colaborador') || ' enviou uma nova ' || v_tipo_label || '.',
      'info'::tipo_notificacao,
      '/admin/aprovacoes'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Notify manager when a new vacation request is created
CREATE OR REPLACE FUNCTION public.fn_notify_manager_new_ferias()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_employee_name TEXT;
  v_gestor_id UUID;
  v_admin RECORD;
BEGIN
  SELECT nome, gestor_id INTO v_employee_name, v_gestor_id
  FROM public.profiles WHERE id = NEW.user_id;

  -- Notify direct manager
  IF v_gestor_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (
      v_gestor_id,
      'Nova Solicitação de Férias',
      COALESCE(v_employee_name, 'Colaborador') || ' solicitou férias de ' || NEW.data_inicio || ' a ' || NEW.data_fim || ' (' || NEW.dias || ' dias).',
      'info'::tipo_notificacao,
      '/admin/aprovacoes'
    );
  END IF;

  -- Notify admins
  FOR v_admin IN
    SELECT ur.user_id FROM public.user_roles ur
    WHERE ur.role = 'admin' AND ur.user_id != NEW.user_id AND ur.user_id IS DISTINCT FROM v_gestor_id
  LOOP
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (
      v_admin.user_id,
      'Nova Solicitação de Férias',
      COALESCE(v_employee_name, 'Colaborador') || ' solicitou férias de ' || NEW.data_inicio || ' a ' || NEW.data_fim || ' (' || NEW.dias || ' dias).',
      'info'::tipo_notificacao,
      '/admin/aprovacoes'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trg_notify_manager_new_solicitacao
  AFTER INSERT ON public.solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_manager_new_solicitacao();

CREATE TRIGGER trg_notify_manager_new_ferias
  AFTER INSERT ON public.solicitacoes_ferias
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_manager_new_ferias();
