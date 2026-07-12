
-- Item 53: canal push para eventos críticos + fan-out de comunicados

INSERT INTO public.notificacao_templates
  (codigo, categoria, canal, idioma, versao, titulo_template, mensagem_template, variaveis_esperadas, ativo)
VALUES
  ('holerite_novo','financeiro','push','pt-BR',1,'Novo holerite 💰','Holerite de {{competencia}} disponível.','["competencia"]'::jsonb,true),
  ('emprestimo_aprovado','financeiro','push','pt-BR',1,'Empréstimo aprovado ✅','R$ {{valor}} em {{parcelas}}x aprovado.','["valor","parcelas"]'::jsonb,true),
  ('emprestimo_reprovado','financeiro','push','pt-BR',1,'Empréstimo reprovado','Toque para ver detalhes.','[]'::jsonb,true),
  ('ferias_aprovadas','operacional','push','pt-BR',1,'Férias aprovadas 🌴','Suas férias foram aprovadas.','[]'::jsonb,true),
  ('ferias_reprovadas','operacional','push','pt-BR',1,'Férias reprovadas','Toque para ver detalhes.','[]'::jsonb,true),
  ('kudos_recebido','social','push','pt-BR',1,'Você recebeu um kudos! 🎉','{{de}}: {{mensagem}}','["de","mensagem"]'::jsonb,true),
  ('viagem_aprovada','operacional','push','pt-BR',1,'Viagem aprovada ✈️','{{destino}} — {{data_ida}} a {{data_volta}}.','["destino","data_ida","data_volta"]'::jsonb,true),
  ('assinatura_pendente','operacional','push','pt-BR',1,'Assinatura pendente ✍️','"{{titulo}}" aguardando você.','["titulo"]'::jsonb,true),
  ('chamado_atualizado','operacional','push','pt-BR',1,'Chamado atualizado','Toque para acompanhar.','[]'::jsonb,true),
  ('epi_recebido','operacional','push','pt-BR',1,'EPI recebido 🦺','{{quantidade}} × {{nome_epi}}.','["quantidade","nome_epi"]'::jsonb,true),
  ('comunicado_novo','comunicacao','push','pt-BR',1,'📢 {{titulo}}','{{resumo}}','["titulo","resumo"]'::jsonb,true)
ON CONFLICT (codigo, canal, idioma, versao) DO UPDATE
  SET titulo_template = EXCLUDED.titulo_template,
      mensagem_template = EXCLUDED.mensagem_template,
      variaveis_esperadas = EXCLUDED.variaveis_esperadas,
      updated_at = now();

-- Fan-out de comunicados
CREATE OR REPLACE FUNCTION public.fn_notify_comunicado_novo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  u RECORD;
  v_resumo TEXT;
BEGIN
  IF COALESCE(NEW.status,'ativo') <> 'ativo' THEN
    RETURN NEW;
  END IF;
  v_resumo := left(regexp_replace(NEW.conteudo, '<[^>]+>', '', 'g'), 140);
  FOR u IN
    SELECT p.id FROM public.profiles p
    WHERE COALESCE(p.status,'ativo') = 'ativo'
      AND p.id IS DISTINCT FROM NEW.autor_id
  LOOP
    PERFORM public.fn_notificar_template(
      u.id,'comunicado_novo',
      jsonb_build_object('titulo',NEW.titulo,'resumo',v_resumo),
      CASE COALESCE(NEW.prioridade,'baixa')
        WHEN 'urgente' THEN 'erro'::tipo_notificacao
        WHEN 'alta' THEN 'aviso'::tipo_notificacao
        ELSE 'info'::tipo_notificacao
      END,
      'comunicacao'::notif_categoria,
      '/comunicados'
    );
  END LOOP;
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS trg_notify_comunicado_novo ON public.comunicados;
CREATE TRIGGER trg_notify_comunicado_novo
AFTER INSERT ON public.comunicados
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_comunicado_novo();
