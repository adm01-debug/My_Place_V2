
-- Item 52 (corrigido): usa colunas reais (categoria, variaveis_esperadas) e assinatura de fn_notificar_template.

INSERT INTO public.notificacao_templates
  (codigo, categoria, canal, idioma, versao, titulo_template, mensagem_template, variaveis_esperadas, ativo)
VALUES
  ('epi_recebido','operacional','in_app','pt-BR',1,'EPI recebido 🦺',
   'Você recebeu {{quantidade}} × {{nome_epi}}{{sufixo_troca}}. Assine o recebimento na ficha.',
   '["quantidade","nome_epi","sufixo_troca"]'::jsonb, true),
  ('viagem_aprovada','operacional','in_app','pt-BR',1,'Viagem aprovada ✈️',
   'Sua viagem para {{destino}} de {{data_ida}} a {{data_volta}} foi aprovada.',
   '["destino","data_ida","data_volta"]'::jsonb, true),
  ('viagem_reprovada','operacional','in_app','pt-BR',1,'Viagem reprovada',
   'Sua viagem para {{destino}} não foi aprovada. Motivo: {{motivo}}.',
   '["destino","motivo"]'::jsonb, true),
  ('viagem_prestacao_pendente','operacional','in_app','pt-BR',1,'Prestação de contas pendente',
   'A viagem para {{destino}} exige prestação de contas até {{prazo}}.',
   '["destino","prazo"]'::jsonb, true),
  ('holerite_novo','financeiro','in_app','pt-BR',1,'Novo holerite disponível 💰',
   'Seu holerite de {{competencia}} já está disponível para consulta e download.',
   '["competencia"]'::jsonb, true),
  ('assinatura_pendente','operacional','in_app','pt-BR',1,'Documento aguardando assinatura ✍️',
   'O documento "{{titulo}}" está aguardando sua assinatura.',
   '["titulo"]'::jsonb, true)
ON CONFLICT (codigo, canal, idioma, versao) DO UPDATE
  SET titulo_template = EXCLUDED.titulo_template,
      mensagem_template = EXCLUDED.mensagem_template,
      variaveis_esperadas = EXCLUDED.variaveis_esperadas,
      categoria = EXCLUDED.categoria,
      updated_at = now();

-- Refatorar fn_gerar_parcelas_emprestimo
CREATE OR REPLACE FUNCTION public.fn_gerar_parcelas_emprestimo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE i INT;
BEGIN
  IF NEW.status = 'aprovado' AND (OLD.status IS DISTINCT FROM 'aprovado') THEN
    DELETE FROM public.parcelas_emprestimo WHERE emprestimo_id = NEW.id;
    FOR i IN 1..NEW.num_parcelas LOOP
      INSERT INTO public.parcelas_emprestimo (emprestimo_id, numero, vencimento, valor)
      VALUES (NEW.id, i, (COALESCE(NEW.aprovado_em, now())::date + (i * INTERVAL '1 month'))::date, NEW.valor_parcela);
    END LOOP;
    PERFORM public.fn_notificar_template(
      NEW.user_id,'emprestimo_aprovado',
      jsonb_build_object('valor',NEW.valor_solicitado::text,'parcelas',NEW.num_parcelas::text),
      'sucesso'::tipo_notificacao,'financeiro'::notif_categoria,'/emprestimos'
    );
  ELSIF NEW.status = 'recusado' AND (OLD.status IS DISTINCT FROM 'recusado') THEN
    PERFORM public.fn_notificar_template(
      NEW.user_id,'emprestimo_reprovado',
      jsonb_build_object('motivo',COALESCE(NEW.observacao_admin,'Contate o RH.')),
      'erro'::tipo_notificacao,'financeiro'::notif_categoria,'/emprestimos'
    );
  END IF;
  RETURN NEW;
END; $function$;

-- Refatorar notify_epi_entrega
CREATE OR REPLACE FUNCTION public.notify_epi_entrega()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_nome TEXT;
  v_sufixo TEXT := '';
BEGIN
  SELECT nome INTO v_nome FROM public.epis_catalogo WHERE id = NEW.epi_id;
  IF NEW.previsao_troca IS NOT NULL THEN
    v_sufixo := ' — previsão de troca: ' || to_char(NEW.previsao_troca, 'DD/MM/YYYY');
  END IF;
  PERFORM public.fn_notificar_template(
    NEW.user_id,'epi_recebido',
    jsonb_build_object('quantidade',NEW.quantidade::text,'nome_epi',COALESCE(v_nome,'EPI'),'sufixo_troca',v_sufixo),
    'info'::tipo_notificacao,'operacional'::notif_categoria,'/epis'
  );
  RETURN NEW;
END; $function$;

-- Refatorar notify_treinamento_matricula
CREATE OR REPLACE FUNCTION public.notify_treinamento_matricula()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_titulo TEXT;
BEGIN
  SELECT titulo INTO v_titulo FROM public.treinamentos WHERE id = NEW.treinamento_id;
  PERFORM public.fn_notificar_template(
    NEW.user_id,'treinamento_atribuido',
    jsonb_build_object('titulo',COALESCE(v_titulo,'Treinamento')),
    'info'::tipo_notificacao,'aprendizagem'::notif_categoria,'/treinamentos'
  );
  RETURN NEW;
END; $function$;

-- Refatorar notify_viagem_status
CREATE OR REPLACE FUNCTION public.notify_viagem_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'aprovada' THEN
      PERFORM public.fn_notificar_template(
        NEW.user_id,'viagem_aprovada',
        jsonb_build_object(
          'destino',COALESCE(NEW.destino,''),
          'data_ida',to_char(NEW.data_ida,'DD/MM/YYYY'),
          'data_volta',to_char(NEW.data_volta,'DD/MM/YYYY')
        ),
        'sucesso'::tipo_notificacao,'operacional'::notif_categoria,'/viagens'
      );
    ELSIF NEW.status = 'reprovada' THEN
      PERFORM public.fn_notificar_template(
        NEW.user_id,'viagem_reprovada',
        jsonb_build_object('destino',COALESCE(NEW.destino,''),'motivo',COALESCE(NEW.observacao_admin,'Não informado')),
        'erro'::tipo_notificacao,'operacional'::notif_categoria,'/viagens'
      );
    END IF;
  END IF;
  RETURN NEW;
END; $function$;

-- Refatorar notify_signatario
CREATE OR REPLACE FUNCTION public.notify_signatario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_titulo TEXT;
BEGIN
  SELECT titulo INTO v_titulo FROM public.documentos_assinatura WHERE id = NEW.documento_id;
  PERFORM public.fn_notificar_template(
    NEW.user_id,'assinatura_pendente',
    jsonb_build_object('titulo',COALESCE(v_titulo,'Documento')),
    'info'::tipo_notificacao,'operacional'::notif_categoria,'/assinaturas'
  );
  RETURN NEW;
END; $function$;

-- Novo trigger: holerite disponibilizado
CREATE OR REPLACE FUNCTION public.fn_notify_holerite_novo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.fn_notificar_template(
    NEW.user_id,'holerite_novo',
    jsonb_build_object('competencia',COALESCE(NEW.competencia,to_char(NEW.created_at,'MM/YYYY'))),
    'sucesso'::tipo_notificacao,'financeiro'::notif_categoria,'/holerites'
  );
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS trg_notify_holerite_novo ON public.holerites;
CREATE TRIGGER trg_notify_holerite_novo
AFTER INSERT ON public.holerites
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_holerite_novo();
