
-- Trilhas
CREATE TABLE public.trilhas_desenvolvimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  nivel TEXT NOT NULL DEFAULT 'iniciante' CHECK (nivel IN ('iniciante','intermediario','avancado')),
  duracao_estimada_min INT DEFAULT 0,
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trilhas_desenvolvimento TO authenticated;
GRANT ALL ON public.trilhas_desenvolvimento TO service_role;
ALTER TABLE public.trilhas_desenvolvimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver trilhas ativas" ON public.trilhas_desenvolvimento FOR SELECT TO authenticated USING (ativo = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin gerencia trilhas" ON public.trilhas_desenvolvimento FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_trilhas_updated BEFORE UPDATE ON public.trilhas_desenvolvimento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Etapas
CREATE TABLE public.trilhas_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id UUID NOT NULL REFERENCES public.trilhas_desenvolvimento(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'artigo' CHECK (tipo IN ('video','artigo','quiz','tarefa')),
  conteudo_url TEXT,
  duracao_min INT DEFAULT 0,
  ordem INT NOT NULL DEFAULT 1,
  obrigatoria BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trilhas_etapas_trilha ON public.trilhas_etapas(trilha_id, ordem);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trilhas_etapas TO authenticated;
GRANT ALL ON public.trilhas_etapas TO service_role;
ALTER TABLE public.trilhas_etapas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver etapas" ON public.trilhas_etapas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia etapas" ON public.trilhas_etapas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_etapas_updated BEFORE UPDATE ON public.trilhas_etapas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Conclusões
CREATE TABLE public.trilhas_etapas_concluidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  etapa_id UUID NOT NULL REFERENCES public.trilhas_etapas(id) ON DELETE CASCADE,
  trilha_id UUID NOT NULL REFERENCES public.trilhas_desenvolvimento(id) ON DELETE CASCADE,
  concluida_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, etapa_id)
);
CREATE INDEX idx_concluidas_user ON public.trilhas_etapas_concluidas(user_id, trilha_id);
GRANT SELECT, INSERT, DELETE ON public.trilhas_etapas_concluidas TO authenticated;
GRANT ALL ON public.trilhas_etapas_concluidas TO service_role;
ALTER TABLE public.trilhas_etapas_concluidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver próprias conclusões" ON public.trilhas_etapas_concluidas FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Registrar própria conclusão" ON public.trilhas_etapas_concluidas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Remover própria conclusão" ON public.trilhas_etapas_concluidas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed
INSERT INTO public.trilhas_desenvolvimento (titulo, descricao, categoria, nivel, duracao_estimada_min) VALUES
('Onboarding do Colaborador','Conheça a empresa, políticas e ferramentas essenciais.','Cultura','iniciante',90),
('Liderança Essencial','Fundamentos para novos gestores e futuros líderes.','Liderança','intermediario',180),
('Compliance & LGPD','Boas práticas de segurança da informação e proteção de dados.','Compliance','iniciante',60);

INSERT INTO public.trilhas_etapas (trilha_id, titulo, tipo, ordem, duracao_min, descricao)
SELECT id, 'Boas-vindas','video',1,10,'Vídeo institucional de boas-vindas.' FROM public.trilhas_desenvolvimento WHERE titulo='Onboarding do Colaborador'
UNION ALL SELECT id, 'Nossa Cultura','artigo',2,20,'Missão, visão e valores.' FROM public.trilhas_desenvolvimento WHERE titulo='Onboarding do Colaborador'
UNION ALL SELECT id, 'Ferramentas do dia a dia','artigo',3,30,'Como usar o portal, ponto e benefícios.' FROM public.trilhas_desenvolvimento WHERE titulo='Onboarding do Colaborador'
UNION ALL SELECT id, 'Quiz Inicial','quiz',4,15,'Valide seu aprendizado.' FROM public.trilhas_desenvolvimento WHERE titulo='Onboarding do Colaborador'
UNION ALL SELECT id, 'Perfis de liderança','artigo',1,40,'Estilos e quando aplicar.' FROM public.trilhas_desenvolvimento WHERE titulo='Liderança Essencial'
UNION ALL SELECT id, 'Feedback contínuo','video',2,30,'Como dar e receber feedback.' FROM public.trilhas_desenvolvimento WHERE titulo='Liderança Essencial'
UNION ALL SELECT id, 'Delegação eficaz','artigo',3,45,'Matriz de delegação.' FROM public.trilhas_desenvolvimento WHERE titulo='Liderança Essencial'
UNION ALL SELECT id, 'Tarefa: PDI da equipe','tarefa',4,60,'Elabore um PDI para 1 subordinado.' FROM public.trilhas_desenvolvimento WHERE titulo='Liderança Essencial'
UNION ALL SELECT id, 'Fundamentos da LGPD','artigo',1,20,'Princípios e bases legais.' FROM public.trilhas_desenvolvimento WHERE titulo='Compliance & LGPD'
UNION ALL SELECT id, 'Boas práticas de segurança','video',2,20,'Senhas, phishing e MFA.' FROM public.trilhas_desenvolvimento WHERE titulo='Compliance & LGPD'
UNION ALL SELECT id, 'Quiz LGPD','quiz',3,20,'Confirme seu conhecimento.' FROM public.trilhas_desenvolvimento WHERE titulo='Compliance & LGPD';
