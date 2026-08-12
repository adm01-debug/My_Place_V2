-- =====================================================
-- MIGRATION 006: Criar sistema de notificações
-- Projeto: my-place (Portal do Colaborador)
-- Data: 2025-12-20
-- =====================================================

-- Tabela de notificações
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conteúdo
  tipo TEXT NOT NULL CHECK (tipo IN (
    'info', 'success', 'warning', 'alert', 'system'
  )),
  categoria TEXT NOT NULL CHECK (categoria IN (
    'ferias', 'ponto', 'holerite', 'emprestimo', 'solicitacao',
    'treinamento', 'comunicado', 'beneficio', 'documento', 'sistema'
  )),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  
  -- Ação opcional
  acao_label TEXT,
  acao_rota TEXT, -- Ex: '/ferias', '/holerites'
  
  -- Referência à entidade relacionada
  entidade_tipo TEXT, -- 'ferias', 'solicitacao', etc.
  entidade_id UUID,
  
  -- Status
  lida BOOLEAN NOT NULL DEFAULT false,
  lida_em TIMESTAMPTZ,
  arquivada BOOLEAN NOT NULL DEFAULT false,
  
  -- Push notification
  push_enviado BOOLEAN NOT NULL DEFAULT false,
  push_enviado_em TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own notificacoes"
  ON public.notificacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notificacoes"
  ON public.notificacoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notificacoes"
  ON public.notificacoes FOR INSERT
  WITH CHECK (true); -- Triggers e functions podem inserir

-- Índices
CREATE INDEX idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX idx_notificacoes_lida ON public.notificacoes(lida) WHERE lida = false;
CREATE INDEX idx_notificacoes_created_at ON public.notificacoes(created_at DESC);
CREATE INDEX idx_notificacoes_categoria ON public.notificacoes(categoria);

-- Function para criar notificação
CREATE OR REPLACE FUNCTION public.fn_criar_notificacao(
  p_user_id UUID,
  p_tipo TEXT,
  p_categoria TEXT,
  p_titulo TEXT,
  p_mensagem TEXT,
  p_acao_label TEXT DEFAULT NULL,
  p_acao_rota TEXT DEFAULT NULL,
  p_entidade_tipo TEXT DEFAULT NULL,
  p_entidade_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notificacao_id UUID;
BEGIN
  INSERT INTO public.notificacoes (
    user_id, tipo, categoria, titulo, mensagem,
    acao_label, acao_rota, entidade_tipo, entidade_id
  ) VALUES (
    p_user_id, p_tipo, p_categoria, p_titulo, p_mensagem,
    p_acao_label, p_acao_rota, p_entidade_tipo, p_entidade_id
  ) RETURNING id INTO v_notificacao_id;
  
  RETURN v_notificacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS PARA NOTIFICAÇÕES AUTOMÁTICAS
-- =====================================================

-- Trigger: Férias aprovadas/rejeitadas
CREATE OR REPLACE FUNCTION public.fn_notificar_ferias_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status AND NEW.status IN ('aprovado', 'rejeitado') THEN
    PERFORM public.fn_criar_notificacao(
      NEW.user_id,
      CASE WHEN NEW.status = 'aprovado' THEN 'success' ELSE 'alert' END,
      'ferias',
      CASE WHEN NEW.status = 'aprovado' THEN 'Férias aprovadas!' ELSE 'Férias rejeitadas' END,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 
          'Sua solicitação de férias foi aprovada. Período: ' || to_char(NEW.data_inicio, 'DD/MM/YYYY') || ' a ' || to_char(NEW.data_fim, 'DD/MM/YYYY')
        ELSE 
          'Sua solicitação de férias foi rejeitada. Entre em contato com o RH.'
      END,
      'Ver detalhes',
      '/ferias',
      'ferias',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notificar_ferias_status
  AFTER UPDATE ON public.ferias
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notificar_ferias_status();

-- Trigger: Novo holerite disponível
CREATE OR REPLACE FUNCTION public.fn_notificar_novo_holerite()
RETURNS TRIGGER AS $$
DECLARE
  v_mes_nome TEXT;
BEGIN
  v_mes_nome := CASE NEW.mes
    WHEN 1 THEN 'Janeiro' WHEN 2 THEN 'Fevereiro' WHEN 3 THEN 'Março'
    WHEN 4 THEN 'Abril' WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho'
    WHEN 7 THEN 'Julho' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Setembro'
    WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
  END;
  
  PERFORM public.fn_criar_notificacao(
    NEW.user_id,
    'success',
    'holerite',
    'Holerite disponível',
    'Seu holerite de ' || v_mes_nome || '/' || NEW.ano || ' está disponível para consulta.',
    'Ver holerite',
    '/holerites',
    'holerite',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notificar_novo_holerite
  AFTER INSERT ON public.holerites
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notificar_novo_holerite();

-- Trigger: Solicitação respondida
CREATE OR REPLACE FUNCTION public.fn_notificar_solicitacao_respondida()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.resposta IS NULL AND NEW.resposta IS NOT NULL THEN
    PERFORM public.fn_criar_notificacao(
      NEW.user_id,
      'info',
      'solicitacao',
      'Solicitação respondida',
      'Sua solicitação "' || NEW.titulo || '" recebeu uma resposta.',
      'Ver resposta',
      '/solicitacoes',
      'solicitacao',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notificar_solicitacao_respondida
  AFTER UPDATE ON public.solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notificar_solicitacao_respondida();

-- Trigger: Ponto fora de área
CREATE OR REPLACE FUNCTION public.fn_notificar_ponto_fora_area()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'fora_area' THEN
    PERFORM public.fn_criar_notificacao(
      NEW.user_id,
      'warning',
      'ponto',
      'Ponto fora de área',
      'Seu registro de ponto às ' || to_char(NEW.data_hora, 'HH24:MI') || ' foi marcado fora da área autorizada.',
      'Justificar',
      '/ponto',
      'registro_ponto',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notificar_ponto_fora_area
  AFTER INSERT ON public.registros_ponto
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notificar_ponto_fora_area();

-- Comentários
COMMENT ON TABLE public.notificacoes IS 'Notificações do sistema para os colaboradores';
COMMENT ON FUNCTION public.fn_criar_notificacao IS 'Cria uma nova notificação para o usuário';
