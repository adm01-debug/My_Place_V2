-- =============================================
-- SCRIPT SQL PARA EXECUTAR NO SUPABASE DASHBOARD
-- Dashboard > SQL Editor > New Query
-- =============================================

-- 1. Primeiro, desabilite as políticas RLS temporariamente
-- (execute apenas para seed/teste)

-- Desabilitar RLS nas tabelas principais
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feriados DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicados DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_ferias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_ponto DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.holerites DISABLE ROW LEVEL SECURITY;

-- 2. Limpar dados existentes
TRUNCATE public.profiles CASCADE;
TRUNCATE public.beneficios CASCADE;
TRUNCATE public.feriados CASCADE;
TRUNCATE public.faq CASCADE;
TRUNCATE public.solicitacoes CASCADE;
TRUNCATE public.solicitacoes_ferias CASCADE;
TRUNCATE public.notificacoes CASCADE;
TRUNCATE public.registros_ponto CASCADE;
TRUNCATE public.holerites CASCADE;

-- 3. Após executar o seed, reabilite RLS
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.beneficios ENABLE ROW LEVEL SECURITY;
-- ... (repita para todas)

-- =============================================
-- OBS: Após o seed, você pode recriar as políticas RLS
-- Para permitir operações autenticadas, use políticas como:
-- =============================================

-- Exemplo de política para profiles (usuários veem apenas seu próprio perfil):
/*
CREATE POLICY "Usuários veem próprio perfil"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admin vê todos perfis"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
*/

-- =============================================
-- Para facilitar, aqui está um script completo para:
-- 1. Desabilitar RLS
-- 2. Seed (INSERTs)
-- 3. Reabilitar RLS
-- =============================================
