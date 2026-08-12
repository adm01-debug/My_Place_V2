
-- Enum para tipo de solicitação
CREATE TYPE public.tipo_solicitacao AS ENUM (
  'declaracao_vinculo',
  'alteracao_dados',
  'adiantamento_salarial',
  'carta_recomendacao',
  'outros'
);

-- Enum para status de solicitação
CREATE TYPE public.status_solicitacao AS ENUM (
  'pendente',
  'em_analise',
  'aprovada',
  'recusada',
  'cancelada'
);

-- Enum para prioridade
CREATE TYPE public.prioridade_solicitacao AS ENUM ('baixa', 'normal', 'alta');

-- Tabela de solicitações
CREATE TABLE public.solicitacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo tipo_solicitacao NOT NULL,
  descricao TEXT NOT NULL,
  status status_solicitacao NOT NULL DEFAULT 'pendente',
  prioridade prioridade_solicitacao NOT NULL DEFAULT 'normal',
  resposta TEXT,
  anexo_url TEXT,
  aprovado_por UUID,
  aprovado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

-- Usuário vê suas próprias solicitações
CREATE POLICY "Users can view own requests"
  ON public.solicitacoes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Usuário cria suas próprias solicitações
CREATE POLICY "Users can create own requests"
  ON public.solicitacoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuário pode cancelar suas próprias solicitações pendentes
CREATE POLICY "Users can cancel own pending requests"
  ON public.solicitacoes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pendente');

-- Admins gerenciam todas
CREATE POLICY "Admins can manage all requests"
  ON public.solicitacoes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Gestores podem ver solicitações de subordinados
CREATE POLICY "Managers can view subordinate requests"
  ON public.solicitacoes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = solicitacoes.user_id AND profiles.gestor_id = auth.uid()
  ));

-- Gestores podem atualizar solicitações de subordinados
CREATE POLICY "Managers can update subordinate requests"
  ON public.solicitacoes FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = solicitacoes.user_id AND profiles.gestor_id = auth.uid()
  ));

-- Trigger updated_at
CREATE TRIGGER update_solicitacoes_updated_at
  BEFORE UPDATE ON public.solicitacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
