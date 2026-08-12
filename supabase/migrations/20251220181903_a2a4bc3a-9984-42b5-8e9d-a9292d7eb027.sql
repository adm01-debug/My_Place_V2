-- Create FAQ table
CREATE TABLE public.faq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Geral',
  tags TEXT[] DEFAULT '{}',
  ordem INTEGER DEFAULT 0,
  destaque BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  visualizacoes INTEGER DEFAULT 0,
  utilidade_positiva INTEGER DEFAULT 0,
  utilidade_negativa INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view active FAQs
CREATE POLICY "Authenticated users can view active FAQ"
ON public.faq
FOR SELECT
USING (ativo = true);

-- Only admins can manage FAQs
CREATE POLICY "Admins can manage FAQ"
ON public.faq
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create function to increment FAQ visualizations
CREATE OR REPLACE FUNCTION public.incrementar_visualizacao_faq(p_faq_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE faq
  SET visualizacoes = visualizacoes + 1,
      updated_at = now()
  WHERE id = p_faq_id AND ativo = true;
END;
$$;

-- Create function to register FAQ utility feedback
CREATE OR REPLACE FUNCTION public.registrar_utilidade_faq(p_faq_id UUID, p_util BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_util THEN
    UPDATE faq
    SET utilidade_positiva = utilidade_positiva + 1,
        updated_at = now()
    WHERE id = p_faq_id AND ativo = true;
  ELSE
    UPDATE faq
    SET utilidade_negativa = utilidade_negativa + 1,
        updated_at = now()
    WHERE id = p_faq_id AND ativo = true;
  END IF;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_faq_updated_at
BEFORE UPDATE ON public.faq
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial FAQ data
INSERT INTO public.faq (pergunta, resposta, categoria, tags, ordem, destaque) VALUES
('Como solicitar férias?', 'Para solicitar férias, acesse o menu Férias no portal, selecione o período desejado e clique em "Nova Solicitação". Sua solicitação será enviada para aprovação do seu gestor.', 'Férias', ARRAY['férias', 'solicitação', 'ausência'], 1, true),
('Como acessar meus holerites?', 'Acesse o menu Holerites no portal. Lá você encontrará todos os seus contracheques organizados por mês e ano. É possível visualizar online ou baixar em PDF.', 'Holerites', ARRAY['holerite', 'contracheque', 'pagamento', 'salário'], 2, true),
('Como registrar meu ponto?', 'O registro de ponto pode ser feito através do menu Ponto no portal. Clique no botão de registro correspondente (entrada, saída para almoço, retorno do almoço ou saída final).', 'Ponto', ARRAY['ponto', 'registro', 'horário', 'jornada'], 3, true),
('O que fazer se esquecer de bater o ponto?', 'Em caso de esquecimento, você pode solicitar uma justificativa de ponto através do menu Ponto > Justificativas. Descreva o motivo e seu gestor irá analisar a solicitação.', 'Ponto', ARRAY['ponto', 'esquecimento', 'justificativa', 'ajuste'], 4, true),
('Como atualizar meus dados cadastrais?', 'Acesse o menu Perfil no portal. Lá você pode atualizar suas informações pessoais, foto de perfil e dados de contato. Algumas informações podem requerer validação do RH.', 'Cadastro', ARRAY['cadastro', 'perfil', 'dados', 'atualização'], 5, true),
('Como funciona o vale-refeição?', 'O vale-refeição é creditado todo dia 1º do mês. O valor é proporcional aos dias trabalhados. Em caso de faltas não justificadas, pode haver desconto proporcional.', 'Benefícios', ARRAY['benefício', 'vale-refeição', 'VR', 'alimentação'], 6, false),
('Como funciona o plano de saúde?', 'O plano de saúde cobre você e seus dependentes diretos. Para inclusão de dependentes, envie a documentação através do menu Solicitações > Nova Solicitação > Benefícios.', 'Benefícios', ARRAY['benefício', 'plano de saúde', 'saúde', 'dependentes'], 7, false),
('Como solicitar empréstimo consignado?', 'Acesse o menu Empréstimos no portal para ver as opções disponíveis, simular valores e prazos. A aprovação está sujeita à análise de crédito e margem consignável.', 'Financeiro', ARRAY['empréstimo', 'consignado', 'crédito', 'financeiro'], 8, false),
('Como acessar treinamentos obrigatórios?', 'Acesse o menu Treinamentos no portal. Os treinamentos obrigatórios aparecem destacados e possuem prazo para conclusão. Você receberá notificações sobre novos treinamentos.', 'Treinamentos', ARRAY['treinamento', 'capacitação', 'curso', 'obrigatório'], 9, false),
('Como participar da pesquisa de clima?', 'Quando houver uma pesquisa de clima ativa, você receberá uma notificação e verá um banner no portal. Acesse o menu Pesquisas de Clima para participar. Suas respostas são anônimas.', 'Pesquisas', ARRAY['pesquisa', 'clima', 'satisfação', 'anônimo'], 10, false),
('Qual é a política de home office?', 'A política de home office varia por departamento e função. Consulte seu gestor ou acesse os comunicados do RH para informações específicas sobre sua área.', 'Políticas', ARRAY['home office', 'remoto', 'trabalho', 'política'], 11, false),
('Como obter declaração de vínculo empregatício?', 'Para solicitar uma declaração de vínculo, acesse Solicitações > Nova Solicitação > Documentos. O RH processará sua solicitação em até 3 dias úteis.', 'Documentos', ARRAY['declaração', 'vínculo', 'documento', 'RH'], 12, false);