-- =====================================================
-- MIGRATION 011: Triggers adicionais de notificações
-- Projeto: my-place (Portal do Colaborador)
-- Data: 2025-12-20
-- =====================================================

-- =====================================================
-- TRIGGER 5: Treinamento vencendo (7 dias)
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_notificar_treinamento_vencendo()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se a validade está a menos de 7 dias
  IF NEW.validade IS NOT NULL 
     AND NEW.validade - CURRENT_DATE <= 7 
     AND NEW.validade >= CURRENT_DATE 
     AND NEW.status = 'concluido' THEN
    
    PERFORM public.fn_criar_notificacao(
      NEW.user_id,
      'warning',
      'treinamento',
      'Treinamento vencendo',
      'O treinamento "' || 
        (SELECT titulo FROM public.treinamentos WHERE id = NEW.treinamento_id) || 
        '" vence em ' || (NEW.validade - CURRENT_DATE) || ' dia(s). Realize a reciclagem.',
      'Ver treinamentos',
      '/treinamentos',
      'treinamento',
      NEW.treinamento_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que roda em UPDATE (quando validade é alterada ou status muda)
CREATE TRIGGER trigger_notificar_treinamento_vencendo
  AFTER UPDATE ON public.treinamentos_colaborador
  FOR EACH ROW
  WHEN (NEW.status = 'concluido' AND NEW.validade IS NOT NULL)
  EXECUTE FUNCTION public.fn_notificar_treinamento_vencendo();

-- =====================================================
-- TRIGGER 6: Parcela de empréstimo vencendo (5 dias)
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_notificar_parcela_vencendo()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se a data de vencimento está a menos de 5 dias
  IF NEW.data_vencimento - CURRENT_DATE <= 5 
     AND NEW.data_vencimento >= CURRENT_DATE 
     AND NEW.status = 'pendente' THEN
    
    PERFORM public.fn_criar_notificacao(
      NEW.user_id,
      'warning',
      'emprestimo',
      'Parcela vencendo',
      'A parcela ' || NEW.numero || ' do seu empréstimo vence em ' || 
        to_char(NEW.data_vencimento, 'DD/MM/YYYY') || 
        '. Valor: R$ ' || to_char(NEW.valor, 'FM999G999D00'),
      'Ver empréstimos',
      '/emprestimos',
      'parcela_emprestimo',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger em INSERT de parcelas
CREATE TRIGGER trigger_notificar_parcela_vencendo_insert
  AFTER INSERT ON public.parcelas_emprestimo
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notificar_parcela_vencendo();

-- =====================================================
-- TRIGGER 7: Novo comunicado publicado
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_notificar_novo_comunicado()
RETURNS TRIGGER AS $$
DECLARE
  v_usuario RECORD;
BEGIN
  -- Notifica todos os usuários ativos
  FOR v_usuario IN 
    SELECT id FROM auth.users WHERE deleted_at IS NULL
  LOOP
    PERFORM public.fn_criar_notificacao(
      v_usuario.id,
      CASE WHEN NEW.importante THEN 'alert' ELSE 'info' END,
      'comunicado',
      CASE WHEN NEW.importante THEN '📢 ' ELSE '' END || 'Novo comunicado',
      NEW.titulo || ': ' || COALESCE(NEW.resumo, LEFT(NEW.conteudo, 100) || '...'),
      'Ler comunicado',
      '/comunicados',
      'comunicado',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notificar_novo_comunicado
  AFTER INSERT ON public.comunicados
  FOR EACH ROW
  WHEN (NEW.data_publicacao <= CURRENT_TIMESTAMP)
  EXECUTE FUNCTION public.fn_notificar_novo_comunicado();

-- =====================================================
-- TRIGGER 8: Empréstimo aprovado/rejeitado
-- =====================================================

-- Primeiro, criar a tabela emprestimos se não existir
-- (Se já existir, esta parte será ignorada)

CREATE TABLE IF NOT EXISTS public.emprestimos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('consignado', 'antecipacao_13', 'emergencial')),
  valor_solicitado DECIMAL(12,2) NOT NULL,
  valor_aprovado DECIMAL(12,2),
  parcelas INTEGER NOT NULL,
  taxa_juros DECIMAL(5,4) NOT NULL,
  valor_parcela DECIMAL(12,2),
  status TEXT NOT NULL DEFAULT 'analise' CHECK (status IN ('analise', 'aprovado', 'rejeitado', 'cancelado', 'quitado')),
  motivo_rejeicao TEXT,
  data_aprovacao TIMESTAMPTZ,
  data_primeiro_desconto DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para emprestimos
ALTER TABLE public.emprestimos ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own emprestimos"
  ON public.emprestimos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own emprestimos"
  ON public.emprestimos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_emprestimos_user_id ON public.emprestimos(user_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_status ON public.emprestimos(status);

-- Function de notificação de empréstimo
CREATE OR REPLACE FUNCTION public.fn_notificar_emprestimo_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'analise' AND NEW.status IN ('aprovado', 'rejeitado') THEN
    PERFORM public.fn_criar_notificacao(
      NEW.user_id,
      CASE WHEN NEW.status = 'aprovado' THEN 'success' ELSE 'alert' END,
      'emprestimo',
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Empréstimo aprovado!'
        ELSE 'Empréstimo não aprovado'
      END,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 
          'Seu empréstimo de R$ ' || to_char(NEW.valor_aprovado, 'FM999G999D00') || 
          ' foi aprovado em ' || NEW.parcelas || 'x de R$ ' || 
          to_char(NEW.valor_parcela, 'FM999G999D00')
        ELSE 
          'Infelizmente seu empréstimo não foi aprovado. ' || 
          COALESCE('Motivo: ' || NEW.motivo_rejeicao, 'Entre em contato com o RH.')
      END,
      'Ver detalhes',
      '/emprestimos',
      'emprestimo',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notificar_emprestimo_status
  AFTER UPDATE ON public.emprestimos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notificar_emprestimo_status();

-- =====================================================
-- TRIGGER EXTRA: Justificativa de ponto aprovada/rejeitada
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_notificar_justificativa_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pendente' AND NEW.status IN ('aprovado', 'rejeitado') THEN
    PERFORM public.fn_criar_notificacao(
      NEW.user_id,
      CASE WHEN NEW.status = 'aprovado' THEN 'success' ELSE 'alert' END,
      'ponto',
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Justificativa aprovada'
        ELSE 'Justificativa rejeitada'
      END,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 
          'Sua justificativa do dia ' || to_char(NEW.data, 'DD/MM/YYYY') || ' foi aprovada.'
        ELSE 
          'Sua justificativa do dia ' || to_char(NEW.data, 'DD/MM/YYYY') || ' foi rejeitada. ' ||
          COALESCE('Motivo: ' || NEW.observacao_gestor, '')
      END,
      'Ver histórico',
      '/ponto',
      'justificativa_ponto',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notificar_justificativa_status
  AFTER UPDATE ON public.justificativas_ponto
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notificar_justificativa_status();

-- =====================================================
-- TRIGGER EXTRA: Novo documento disponível
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_notificar_novo_documento()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.fn_criar_notificacao(
    NEW.user_id,
    'info',
    'documento',
    'Novo documento disponível',
    'O documento "' || NEW.titulo || '" está disponível para download.',
    'Baixar documento',
    '/documentos',
    'documento',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notificar_novo_documento
  AFTER INSERT ON public.documentos
  FOR EACH ROW
  WHEN (NEW.disponivel = true)
  EXECUTE FUNCTION public.fn_notificar_novo_documento();

-- =====================================================
-- TRIGGER EXTRA: Benefício alterado
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_notificar_beneficio_alterado()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.ativo != NEW.ativo OR OLD.credito_mensal != NEW.credito_mensal THEN
    PERFORM public.fn_criar_notificacao(
      NEW.user_id,
      'info',
      'beneficio',
      'Benefício atualizado',
      'O benefício "' || NEW.tipo || '" foi ' || 
        CASE 
          WHEN OLD.ativo = true AND NEW.ativo = false THEN 'desativado'
          WHEN OLD.ativo = false AND NEW.ativo = true THEN 'reativado'
          ELSE 'atualizado'
        END || '.',
      'Ver benefícios',
      '/beneficios',
      'beneficio',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notificar_beneficio_alterado
  AFTER UPDATE ON public.beneficios
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notificar_beneficio_alterado();

-- =====================================================
-- JOB PARA VERIFICAR TREINAMENTOS VENCENDO DIARIAMENTE
-- =====================================================

-- Esta function deve ser chamada por um cron job externo (n8n, pg_cron, etc.)
CREATE OR REPLACE FUNCTION public.fn_verificar_treinamentos_vencendo()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_treinamento RECORD;
BEGIN
  FOR v_treinamento IN 
    SELECT 
      tc.id,
      tc.user_id,
      tc.treinamento_id,
      tc.validade,
      t.titulo
    FROM public.treinamentos_colaborador tc
    JOIN public.treinamentos t ON t.id = tc.treinamento_id
    WHERE tc.status = 'concluido'
      AND tc.validade IS NOT NULL
      AND tc.validade - CURRENT_DATE = 7 -- Exatamente 7 dias antes
  LOOP
    PERFORM public.fn_criar_notificacao(
      v_treinamento.user_id,
      'warning',
      'treinamento',
      'Treinamento vencendo em 7 dias',
      'O treinamento "' || v_treinamento.titulo || '" vence em ' || 
        to_char(v_treinamento.validade, 'DD/MM/YYYY') || '. Providencie a reciclagem.',
      'Ver treinamentos',
      '/treinamentos',
      'treinamento',
      v_treinamento.treinamento_id
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- JOB PARA VERIFICAR PARCELAS VENCENDO DIARIAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_verificar_parcelas_vencendo()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_parcela RECORD;
BEGIN
  FOR v_parcela IN 
    SELECT 
      pe.id,
      pe.user_id,
      pe.emprestimo_id,
      pe.numero,
      pe.valor,
      pe.data_vencimento
    FROM public.parcelas_emprestimo pe
    WHERE pe.status = 'pendente'
      AND pe.data_vencimento - CURRENT_DATE = 5 -- Exatamente 5 dias antes
  LOOP
    PERFORM public.fn_criar_notificacao(
      v_parcela.user_id,
      'warning',
      'emprestimo',
      'Parcela vence em 5 dias',
      'A parcela ' || v_parcela.numero || ' no valor de R$ ' || 
        to_char(v_parcela.valor, 'FM999G999D00') || ' vence em ' ||
        to_char(v_parcela.data_vencimento, 'DD/MM/YYYY') || '.',
      'Ver empréstimos',
      '/emprestimos',
      'parcela_emprestimo',
      v_parcela.id
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION public.fn_verificar_treinamentos_vencendo IS 
  'Verifica treinamentos que vencem em 7 dias e cria notificações. Chamar via cron diário.';

COMMENT ON FUNCTION public.fn_verificar_parcelas_vencendo IS 
  'Verifica parcelas que vencem em 5 dias e cria notificações. Chamar via cron diário.';
