
-- ============================================
-- FUNÇÃO PARA CRIAR NOTIFICAÇÃO
-- ============================================
CREATE OR REPLACE FUNCTION public.criar_notificacao(
  p_user_id UUID,
  p_titulo TEXT,
  p_mensagem TEXT,
  p_tipo TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL,
  p_dados JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link, dados)
  VALUES (p_user_id, p_titulo, p_mensagem, p_tipo, p_link, p_dados)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- ============================================
-- TRIGGER: Notificação quando férias são aprovadas/rejeitadas
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_notificar_ferias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só notifica quando status muda
  IF OLD.status = 'pendente' AND NEW.status IN ('aprovado', 'rejeitado') THEN
    PERFORM public.criar_notificacao(
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'aprovado' THEN '🎉 Férias Aprovadas!'
        ELSE '❌ Férias Não Aprovadas'
      END,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Suas férias foram aprovadas. Confira os detalhes.'
        ELSE 'Sua solicitação de férias foi rejeitada. Verifique o motivo.'
      END,
      CASE WHEN NEW.status = 'aprovado' THEN 'success' ELSE 'alert' END,
      '/ferias',
      jsonb_build_object('ferias_id', NEW.id, 'data_inicio', NEW.data_inicio, 'data_fim', NEW.data_fim)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ferias_status_change
AFTER UPDATE OF status ON public.ferias
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notificar_ferias();

-- ============================================
-- TRIGGER: Notificação quando novo holerite é disponibilizado
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_notificar_holerite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mes_nome TEXT;
BEGIN
  v_mes_nome := CASE NEW.mes
    WHEN 1 THEN 'Janeiro'
    WHEN 2 THEN 'Fevereiro'
    WHEN 3 THEN 'Março'
    WHEN 4 THEN 'Abril'
    WHEN 5 THEN 'Maio'
    WHEN 6 THEN 'Junho'
    WHEN 7 THEN 'Julho'
    WHEN 8 THEN 'Agosto'
    WHEN 9 THEN 'Setembro'
    WHEN 10 THEN 'Outubro'
    WHEN 11 THEN 'Novembro'
    WHEN 12 THEN 'Dezembro'
  END;

  PERFORM public.criar_notificacao(
    NEW.user_id,
    '💰 Novo Holerite Disponível',
    'Seu holerite de ' || v_mes_nome || '/' || NEW.ano || ' está disponível.',
    'info',
    '/holerites',
    jsonb_build_object('holerite_id', NEW.id, 'mes', NEW.mes, 'ano', NEW.ano)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_holerite
AFTER INSERT ON public.holerites
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notificar_holerite();

-- ============================================
-- TRIGGER: Notificação quando solicitação é respondida
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_notificar_solicitacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'pendente' AND NEW.status IN ('aprovado', 'rejeitado', 'concluido') THEN
    PERFORM public.criar_notificacao(
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'aprovado' THEN '✅ Solicitação Aprovada'
        WHEN NEW.status = 'concluido' THEN '✅ Solicitação Concluída'
        ELSE '❌ Solicitação Rejeitada'
      END,
      'Sua solicitação "' || NEW.titulo || '" foi ' || 
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'aprovada'
        WHEN NEW.status = 'concluido' THEN 'concluída'
        ELSE 'rejeitada'
      END || '.',
      CASE WHEN NEW.status IN ('aprovado', 'concluido') THEN 'success' ELSE 'alert' END,
      '/solicitacoes',
      jsonb_build_object('solicitacao_id', NEW.id, 'tipo', NEW.tipo)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_solicitacao_status_change
AFTER UPDATE OF status ON public.solicitacoes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notificar_solicitacao();

-- ============================================
-- TRIGGER: Notificação quando empréstimo é aprovado/rejeitado
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_notificar_emprestimo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'pendente' AND NEW.status IN ('ativo', 'rejeitado') THEN
    PERFORM public.criar_notificacao(
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'ativo' THEN '💳 Empréstimo Aprovado!'
        ELSE '❌ Empréstimo Não Aprovado'
      END,
      CASE 
        WHEN NEW.status = 'ativo' THEN 'Seu empréstimo foi aprovado. O valor será creditado em breve.'
        ELSE 'Seu pedido de empréstimo foi rejeitado. Verifique o motivo.'
      END,
      CASE WHEN NEW.status = 'ativo' THEN 'success' ELSE 'alert' END,
      '/emprestimos',
      jsonb_build_object('emprestimo_id', NEW.id, 'valor', NEW.valor_original)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_emprestimo_status_change
AFTER UPDATE OF status ON public.emprestimos
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notificar_emprestimo();

-- ============================================
-- TRIGGER: Notificação quando justificativa é aprovada/rejeitada
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_notificar_justificativa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'pendente' AND NEW.status IN ('aprovado', 'rejeitado') THEN
    PERFORM public.criar_notificacao(
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'aprovado' THEN '✅ Justificativa Aceita'
        ELSE '❌ Justificativa Rejeitada'
      END,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Sua justificativa de ponto foi aceita.'
        ELSE 'Sua justificativa de ponto foi rejeitada. Verifique o motivo.'
      END,
      CASE WHEN NEW.status = 'aprovado' THEN 'success' ELSE 'alert' END,
      '/ponto',
      jsonb_build_object('justificativa_id', NEW.id, 'data', NEW.data)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_justificativa_status_change
AFTER UPDATE OF status ON public.justificativas_ponto
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notificar_justificativa();

-- ============================================
-- TRIGGER: Notificação quando novo comunicado importante é publicado
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_notificar_comunicado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Só notifica para comunicados importantes e ativos
  IF NEW.importante = true AND NEW.ativo = true THEN
    -- Criar notificação para todos os usuários
    FOR v_user IN SELECT id FROM public.profiles LOOP
      PERFORM public.criar_notificacao(
        v_user.id,
        '📢 Comunicado Importante',
        NEW.titulo,
        'warning',
        '/comunicados',
        jsonb_build_object('comunicado_id', NEW.id, 'categoria', NEW.categoria)
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_comunicado_importante
AFTER INSERT ON public.comunicados
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notificar_comunicado();

-- ============================================
-- TRIGGER: Notificação quando novo treinamento é atribuído
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_notificar_treinamento_atribuido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_treinamento RECORD;
BEGIN
  SELECT titulo, obrigatorio INTO v_treinamento 
  FROM public.treinamentos 
  WHERE id = NEW.treinamento_id;

  PERFORM public.criar_notificacao(
    NEW.user_id,
    CASE 
      WHEN v_treinamento.obrigatorio THEN '🔴 Treinamento Obrigatório'
      ELSE '📚 Novo Treinamento Disponível'
    END,
    'O treinamento "' || v_treinamento.titulo || '" foi atribuído a você.',
    CASE WHEN v_treinamento.obrigatorio THEN 'warning' ELSE 'info' END,
    '/treinamentos',
    jsonb_build_object('treinamento_colaborador_id', NEW.id, 'treinamento_id', NEW.treinamento_id)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_treinamento_atribuido
AFTER INSERT ON public.treinamentos_colaborador
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notificar_treinamento_atribuido();

-- ============================================
-- HABILITAR REALTIME PARA NOTIFICAÇÕES
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
