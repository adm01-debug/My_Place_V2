-- Tabela de perfis de colaboradores
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cargo TEXT,
  departamento TEXT,
  data_admissao DATE,
  matricula TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de registros de ponto
CREATE TABLE public.registros_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'intervalo_inicio', 'intervalo_fim')),
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  endereco TEXT,
  status TEXT NOT NULL DEFAULT 'aprovado' CHECK (status IN ('aprovado', 'pendente', 'rejeitado', 'fora_area')),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de holerites
CREATE TABLE public.holerites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  salario_bruto DECIMAL(10, 2) NOT NULL,
  descontos DECIMAL(10, 2) NOT NULL DEFAULT 0,
  salario_liquido DECIMAL(10, 2) NOT NULL,
  detalhes JSONB,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, mes, ano)
);

-- Tabela de férias
CREATE TABLE public.ferias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias_solicitados INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ferias', 'abono', 'venda')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'cancelado')),
  observacao TEXT,
  aprovado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de solicitações gerais
CREATE TABLE public.solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'rejeitado', 'concluido')),
  prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  resposta TEXT,
  anexos JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holerites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for registros_ponto
CREATE POLICY "Users can view own registros" ON public.registros_ponto FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own registros" ON public.registros_ponto FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for holerites
CREATE POLICY "Users can view own holerites" ON public.holerites FOR SELECT USING (auth.uid() = user_id);

-- Policies for ferias
CREATE POLICY "Users can view own ferias" ON public.ferias FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ferias" ON public.ferias FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ferias" ON public.ferias FOR UPDATE USING (auth.uid() = user_id);

-- Policies for solicitacoes
CREATE POLICY "Users can view own solicitacoes" ON public.solicitacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own solicitacoes" ON public.solicitacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own solicitacoes" ON public.solicitacoes FOR UPDATE USING (auth.uid() = user_id);

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'full_name', 'Colaborador'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ferias_updated_at BEFORE UPDATE ON public.ferias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_solicitacoes_updated_at BEFORE UPDATE ON public.solicitacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();