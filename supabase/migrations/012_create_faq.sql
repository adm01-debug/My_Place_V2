-- =====================================================
-- MIGRATION 012: Criar tabela FAQ dinâmico
-- Projeto: my-place (Portal do Colaborador)
-- Data: 2025-12-20
-- =====================================================

-- Tabela de FAQs
CREATE TABLE public.faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Conteúdo
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN (
    'rh', 'financeiro', 'ferias', 'ponto', 'beneficios', 
    'documentos', 'seguranca', 'treinamentos', 'geral'
  )),
  tags TEXT[] DEFAULT '{}',
  
  -- Ordenação e visibilidade
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,
  
  -- Métricas
  visualizacoes INTEGER DEFAULT 0,
  utilidade_positiva INTEGER DEFAULT 0,
  utilidade_negativa INTEGER DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

-- Policies - Todos podem ler FAQs ativos
CREATE POLICY "Anyone can view active FAQ"
  ON public.faq FOR SELECT
  USING (ativo = true);

-- Admins podem gerenciar FAQs
CREATE POLICY "Admins can manage FAQ"
  ON public.faq FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'rh')
    )
  );

-- Usuários podem incrementar visualizações
CREATE POLICY "Users can update views"
  ON public.faq FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Índices
CREATE INDEX idx_faq_categoria ON public.faq(categoria);
CREATE INDEX idx_faq_ativo ON public.faq(ativo) WHERE ativo = true;
CREATE INDEX idx_faq_ordem ON public.faq(ordem);
CREATE INDEX idx_faq_tags ON public.faq USING GIN(tags);
CREATE INDEX idx_faq_destaque ON public.faq(destaque) WHERE destaque = true;

-- Trigger para updated_at
CREATE TRIGGER set_faq_updated_at
  BEFORE UPDATE ON public.faq
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- Function para incrementar visualização
CREATE OR REPLACE FUNCTION public.fn_faq_incrementar_view(p_faq_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.faq 
  SET visualizacoes = visualizacoes + 1 
  WHERE id = p_faq_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para registrar utilidade
CREATE OR REPLACE FUNCTION public.fn_faq_registrar_utilidade(
  p_faq_id UUID,
  p_util BOOLEAN
)
RETURNS void AS $$
BEGIN
  IF p_util THEN
    UPDATE public.faq 
    SET utilidade_positiva = utilidade_positiva + 1 
    WHERE id = p_faq_id;
  ELSE
    UPDATE public.faq 
    SET utilidade_negativa = utilidade_negativa + 1 
    WHERE id = p_faq_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir FAQs iniciais (migrar do hardcoded)
INSERT INTO public.faq (pergunta, resposta, categoria, tags, ordem) VALUES

-- RH
('Como atualizar meus dados cadastrais?', 
'Acesse a página "Meu Perfil" no menu principal. Lá você pode atualizar informações como foto, telefone e endereço. Para alterações de dados pessoais como nome ou CPF, abra uma solicitação ao RH através do menu "Minhas Solicitações".',
'rh', ARRAY['cadastro', 'perfil', 'dados pessoais'], 1),

('Como solicitar uma declaração de vínculo empregatício?',
'Vá em "Minhas Solicitações" e selecione o tipo "Declaração". Preencha os dados necessários e aguarde o processamento. O prazo médio é de 2 dias úteis.',
'rh', ARRAY['declaração', 'documento', 'vínculo'], 2),

('Qual o procedimento para comunicar mudança de endereço?',
'Acesse "Meu Perfil" > "Endereço" e clique em "Solicitar Alteração". Anexe um comprovante de residência atualizado (máximo 90 dias). A alteração será efetivada após validação pelo RH.',
'rh', ARRAY['endereço', 'comprovante', 'atualização'], 3),

-- Financeiro
('Quando o salário é depositado?',
'O pagamento é realizado até o 5º dia útil de cada mês. Você receberá uma notificação quando o holerite estiver disponível para consulta.',
'financeiro', ARRAY['salário', 'pagamento', 'depósito'], 1),

('Como consultar meu holerite?',
'Acesse o menu "Holerites" para visualizar seus contracheques. Você pode filtrar por mês/ano e baixar o PDF. Holerites anteriores ficam disponíveis por até 5 anos.',
'financeiro', ARRAY['holerite', 'contracheque', 'pdf'], 2),

('Como funciona o empréstimo consignado?',
'Acesse "Empréstimos" para simular e solicitar. O valor máximo é 30% do salário líquido por parcela. Taxa a partir de 1,8% a.m. Parcelas descontadas diretamente em folha.',
'financeiro', ARRAY['empréstimo', 'consignado', 'desconto'], 3),

-- Férias
('Como solicitar férias?',
'Acesse "Férias" e clique em "Solicitar Férias". Você verá seu saldo disponível e poderá escolher o período desejado. A solicitação será enviada para aprovação do seu gestor.',
'ferias', ARRAY['férias', 'solicitação', 'período'], 1),

('Posso vender parte das minhas férias?',
'Sim! O abono pecuniário permite vender até 10 dias. Marque a opção ao solicitar férias. O valor será pago junto com as férias.',
'ferias', ARRAY['abono', 'venda', 'pecuniário'], 2),

('Qual o prazo mínimo para solicitar férias?',
'O prazo mínimo é de 30 dias de antecedência. Para períodos de alta demanda (dezembro, janeiro, julho), recomendamos solicitar com 60 dias.',
'ferias', ARRAY['prazo', 'antecedência', 'planejamento'], 3),

-- Ponto
('Como registrar meu ponto?',
'Acesse "Meu Ponto" e clique no botão de registro. O sistema utilizará sua localização para validar. Em caso de problemas, entre em contato com o RH.',
'ponto', ARRAY['registro', 'ponto', 'localização'], 1),

('O que fazer se esquecer de bater o ponto?',
'Acesse "Meu Ponto", localize o dia com pendência e clique em "Justificar". Selecione o tipo "Esquecimento de registro" e descreva o ocorrido. Seu gestor irá analisar.',
'ponto', ARRAY['esquecimento', 'justificativa', 'correção'], 2),

('Como justificar uma falta?',
'No espelho de ponto, clique em "Justificar" no dia da falta. Selecione o motivo (atestado, falta justificada, etc.) e anexe o documento comprobatório se necessário.',
'ponto', ARRAY['falta', 'justificativa', 'atestado'], 3),

-- Benefícios
('Quais benefícios tenho direito?',
'Acesse "Benefícios" para ver todos os seus benefícios ativos: vale-transporte, vale-refeição, plano de saúde, plano odontológico e outros conforme seu contrato.',
'beneficios', ARRAY['benefícios', 'direitos', 'planos'], 1),

('Como incluir dependentes no plano de saúde?',
'Em "Benefícios" > "Plano de Saúde", clique em "Gerenciar Dependentes". Você pode incluir cônjuge e filhos até 21 anos (ou 24 se universitários).',
'beneficios', ARRAY['dependentes', 'plano de saúde', 'inclusão'], 2),

('Posso alterar o valor do vale-transporte?',
'Sim. Acesse "Benefícios" > "Vale Transporte" e solicite alteração informando as novas linhas/tarifas. A mudança vale a partir do próximo mês.',
'beneficios', ARRAY['vale-transporte', 'alteração', 'tarifa'], 3),

-- Documentos
('Onde encontro meus documentos?',
'Acesse "Documentos" para ver todos os documentos disponíveis: contratos, termos, políticas e declarações. Você pode baixar a qualquer momento.',
'documentos', ARRAY['documentos', 'download', 'contratos'], 1),

('Como solicitar o informe de rendimentos?',
'O informe de rendimentos fica disponível em "Documentos" a partir de fevereiro de cada ano, referente ao ano anterior. Você também pode acessar via "Holerites".',
'documentos', ARRAY['informe', 'rendimentos', 'IRPF'], 2),

-- Segurança
('Como alterar minha senha?',
'Clique no seu nome no topo da tela e selecione "Configurações". Na seção "Segurança", você pode alterar sua senha. Use uma senha forte com letras, números e símbolos.',
'seguranca', ARRAY['senha', 'segurança', 'alteração'], 1),

('O que fazer se suspeitar de acesso indevido?',
'Altere sua senha imediatamente e notifique o RH através de "Minhas Solicitações" > "Segurança". Revise seus últimos acessos em "Configurações" > "Histórico de Acesso".',
'seguranca', ARRAY['segurança', 'acesso', 'invasão'], 2),

-- Treinamentos
('Como acessar os treinamentos obrigatórios?',
'Acesse "Treinamentos" para ver todos disponíveis. Os obrigatórios aparecem com destaque. Clique em "Iniciar" para começar e acompanhe seu progresso.',
'treinamentos', ARRAY['treinamentos', 'obrigatórios', 'cursos'], 1),

('Onde encontro meus certificados?',
'Em "Treinamentos", os cursos concluídos têm o botão "Certificado" disponível. Você pode baixar e imprimir. Os certificados também ficam em "Documentos".',
'treinamentos', ARRAY['certificados', 'cursos', 'download'], 2);

-- Comentários
COMMENT ON TABLE public.faq IS 'Perguntas frequentes do portal do colaborador';
COMMENT ON FUNCTION public.fn_faq_incrementar_view IS 'Incrementa contador de visualizações de uma FAQ';
COMMENT ON FUNCTION public.fn_faq_registrar_utilidade IS 'Registra se a FAQ foi útil ou não';
