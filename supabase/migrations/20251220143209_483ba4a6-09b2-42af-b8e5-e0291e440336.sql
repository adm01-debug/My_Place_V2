
-- Criar tabela de ciclos de avaliação
CREATE TABLE public.ciclos_avaliacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  tipo TEXT NOT NULL DEFAULT 'trimestral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de competências
CREATE TABLE public.competencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'tecnica',
  peso NUMERIC NOT NULL DEFAULT 1,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de avaliações
CREATE TABLE public.avaliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ciclo_id UUID NOT NULL REFERENCES public.ciclos_avaliacao(id) ON DELETE CASCADE,
  avaliador_id UUID NOT NULL,
  avaliado_id UUID NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'par',
  status TEXT NOT NULL DEFAULT 'pendente',
  nota_geral NUMERIC,
  comentario_geral TEXT,
  pontos_fortes TEXT,
  pontos_melhoria TEXT,
  data_envio TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de notas por competência
CREATE TABLE public.avaliacoes_competencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL REFERENCES public.avaliacoes(id) ON DELETE CASCADE,
  competencia_id UUID NOT NULL REFERENCES public.competencias(id) ON DELETE CASCADE,
  nota NUMERIC NOT NULL,
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ciclos_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_competencias ENABLE ROW LEVEL SECURITY;

-- RLS Policies para ciclos_avaliacao
CREATE POLICY "Authenticated users can view active ciclos" ON public.ciclos_avaliacao
  FOR SELECT USING (status = 'ativo' OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage ciclos" ON public.ciclos_avaliacao
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- RLS Policies para competencias
CREATE POLICY "Authenticated users can view competencias" ON public.competencias
  FOR SELECT USING (ativa = true);

CREATE POLICY "Admins can manage competencias" ON public.competencias
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- RLS Policies para avaliacoes
CREATE POLICY "Users can view avaliacoes they sent" ON public.avaliacoes
  FOR SELECT USING (avaliador_id = auth.uid());

CREATE POLICY "Users can view avaliacoes they received" ON public.avaliacoes
  FOR SELECT USING (avaliado_id = auth.uid() AND status = 'enviado');

CREATE POLICY "Users can insert own avaliacoes" ON public.avaliacoes
  FOR INSERT WITH CHECK (avaliador_id = auth.uid());

CREATE POLICY "Users can update own avaliacoes" ON public.avaliacoes
  FOR UPDATE USING (avaliador_id = auth.uid() AND status = 'pendente');

CREATE POLICY "Admins can view all avaliacoes" ON public.avaliacoes
  FOR SELECT USING (is_admin(auth.uid()));

-- RLS Policies para avaliacoes_competencias
CREATE POLICY "Users can view own avaliacoes_competencias" ON public.avaliacoes_competencias
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.avaliacoes a
      WHERE a.id = avaliacao_id
      AND (a.avaliador_id = auth.uid() OR (a.avaliado_id = auth.uid() AND a.status = 'enviado'))
    )
  );

CREATE POLICY "Users can insert avaliacoes_competencias" ON public.avaliacoes_competencias
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.avaliacoes a
      WHERE a.id = avaliacao_id AND a.avaliador_id = auth.uid()
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_ciclos_avaliacao_updated_at
  BEFORE UPDATE ON public.ciclos_avaliacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_avaliacoes_updated_at
  BEFORE UPDATE ON public.avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir competências padrão
INSERT INTO public.competencias (nome, descricao, categoria, peso) VALUES
  ('Comunicação', 'Capacidade de se expressar claramente e ouvir ativamente', 'comportamental', 1),
  ('Trabalho em Equipe', 'Colaboração e cooperação com colegas', 'comportamental', 1),
  ('Proatividade', 'Iniciativa e antecipação de necessidades', 'comportamental', 1),
  ('Liderança', 'Capacidade de influenciar e guiar equipes', 'lideranca', 1.5),
  ('Gestão de Tempo', 'Organização e cumprimento de prazos', 'comportamental', 1),
  ('Conhecimento Técnico', 'Domínio das habilidades da função', 'tecnica', 1.5),
  ('Resolução de Problemas', 'Análise e solução de desafios', 'tecnica', 1),
  ('Inovação', 'Criatividade e proposição de melhorias', 'tecnica', 1),
  ('Foco em Resultados', 'Orientação para metas e entregas', 'comportamental', 1),
  ('Adaptabilidade', 'Flexibilidade diante de mudanças', 'comportamental', 1);
