
-- ============================================
-- ENUM e TABELA: user_roles (seguindo práticas de segurança)
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função SECURITY DEFINER para verificar roles (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- RLS: Users podem ver suas próprias roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- RLS: Admins podem ver todas as roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.is_admin(auth.uid()));

-- RLS: Admins podem gerenciar roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS: Admins podem ver TODOS os profiles
-- ============================================
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS: Admins podem gerenciar comunicados
-- ============================================
CREATE POLICY "Admins can insert comunicados"
ON public.comunicados FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update comunicados"
ON public.comunicados FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete comunicados"
ON public.comunicados FOR DELETE
USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS: Admins podem gerenciar treinamentos
-- ============================================
CREATE POLICY "Admins can insert treinamentos"
ON public.treinamentos FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update treinamentos"
ON public.treinamentos FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete treinamentos"
ON public.treinamentos FOR DELETE
USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS: Admins podem ver TODAS as solicitações
-- ============================================
CREATE POLICY "Admins can view all solicitacoes"
ON public.solicitacoes FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all solicitacoes"
ON public.solicitacoes FOR UPDATE
USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS: Admins podem ver TODAS as férias
-- ============================================
CREATE POLICY "Admins can view all ferias"
ON public.ferias FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all ferias"
ON public.ferias FOR UPDATE
USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS: Admins podem ver TODOS os empréstimos
-- ============================================
CREATE POLICY "Admins can view all emprestimos"
ON public.emprestimos FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all emprestimos"
ON public.emprestimos FOR UPDATE
USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS: Admins podem ver TODAS as justificativas
-- ============================================
CREATE POLICY "Admins can view all justificativas"
ON public.justificativas_ponto FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all justificativas"
ON public.justificativas_ponto FOR UPDATE
USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS: Admins podem atribuir treinamentos
-- ============================================
CREATE POLICY "Admins can insert treinamentos_colaborador"
ON public.treinamentos_colaborador FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));
