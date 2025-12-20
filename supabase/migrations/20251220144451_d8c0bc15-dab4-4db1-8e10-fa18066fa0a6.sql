
-- Criar tabela de pesquisas de clima
CREATE TABLE public.pesquisas_clima (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'pulso',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  anonima BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de perguntas
CREATE TABLE public.perguntas_clima (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pesquisa_id UUID NOT NULL REFERENCES public.pesquisas_clima(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'escala',
  categoria TEXT NOT NULL DEFAULT 'geral',
  ordem INTEGER NOT NULL DEFAULT 0,
  obrigatoria BOOLEAN NOT NULL DEFAULT true,
  opcoes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de respostas
CREATE TABLE public.respostas_clima (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pesquisa_id UUID NOT NULL REFERENCES public.pesquisas_clima(id) ON DELETE CASCADE,
  pergunta_id UUID NOT NULL REFERENCES public.perguntas_clima(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  valor_escala INTEGER,
  valor_texto TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de participações (para rastrear quem respondeu)
CREATE TABLE public.participacoes_clima (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pesquisa_id UUID NOT NULL REFERENCES public.pesquisas_clima(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  concluida BOOLEAN NOT NULL DEFAULT false,
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_conclusao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pesquisa_id, user_id)
);

-- Enable RLS
ALTER TABLE public.pesquisas_clima ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perguntas_clima ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_clima ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participacoes_clima ENABLE ROW LEVEL SECURITY;

-- RLS Policies para pesquisas_clima
CREATE POLICY "Authenticated users can view active pesquisas" ON public.pesquisas_clima
  FOR SELECT USING (status = 'ativo' OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage pesquisas" ON public.pesquisas_clima
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- RLS Policies para perguntas_clima
CREATE POLICY "Authenticated users can view perguntas" ON public.perguntas_clima
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pesquisas_clima p
      WHERE p.id = pesquisa_id AND (p.status = 'ativo' OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "Admins can manage perguntas" ON public.perguntas_clima
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- RLS Policies para respostas_clima
CREATE POLICY "Users can insert own respostas" ON public.respostas_clima
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own respostas" ON public.respostas_clima
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all respostas" ON public.respostas_clima
  FOR SELECT USING (is_admin(auth.uid()));

-- RLS Policies para participacoes_clima
CREATE POLICY "Users can view own participacoes" ON public.participacoes_clima
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own participacoes" ON public.participacoes_clima
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participacoes" ON public.participacoes_clima
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all participacoes" ON public.participacoes_clima
  FOR SELECT USING (is_admin(auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_pesquisas_clima_updated_at
  BEFORE UPDATE ON public.pesquisas_clima
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir pesquisa exemplo com perguntas
INSERT INTO public.pesquisas_clima (id, titulo, descricao, tipo, data_inicio, data_fim, anonima) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pulso de Satisfação - Dezembro 2024', 'Queremos saber como você está se sentindo no trabalho', 'pulso', '2024-12-01', '2024-12-31', true);

INSERT INTO public.perguntas_clima (pesquisa_id, texto, tipo, categoria, ordem) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Como você avalia seu nível de satisfação geral com o trabalho?', 'escala', 'satisfacao', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Você se sente motivado a dar o seu melhor todos os dias?', 'escala', 'engajamento', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Você sente que suas opiniões são ouvidas e valorizadas?', 'escala', 'comunicacao', 3),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Como você avalia o ambiente de trabalho e a relação com colegas?', 'escala', 'ambiente', 4),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Você tem as ferramentas e recursos necessários para fazer seu trabalho?', 'escala', 'recursos', 5),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Você recomendaria esta empresa como um bom lugar para trabalhar?', 'escala', 'enps', 6),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'O que podemos melhorar para tornar seu dia a dia melhor?', 'texto', 'sugestoes', 7);
