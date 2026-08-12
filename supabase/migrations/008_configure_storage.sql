-- =====================================================
-- MIGRATION 008: Configurar Supabase Storage
-- Projeto: my-place (Portal do Colaborador)
-- Data: 2025-12-20
-- =====================================================

-- NOTA: Este script deve ser executado no Supabase Dashboard > Storage
-- Os buckets precisam ser criados via interface ou API

-- Criar buckets (executar via Supabase Dashboard ou API)
-- 1. avatars - Fotos de perfil dos colaboradores
-- 2. documentos - Documentos gerais (holerites, contratos, etc.)
-- 3. atestados - Atestados e justificativas de ponto
-- 4. anexos - Anexos de solicitações
-- 5. certificados - Certificados de treinamentos
-- 6. comunicados - Anexos de comunicados

-- Políticas de Storage para avatars
-- Permitir usuários verem seus próprios avatars
CREATE POLICY "Users can view own avatar"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir usuários fazerem upload do próprio avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir usuários atualizarem próprio avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Políticas para documentos
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documentos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Políticas para atestados
CREATE POLICY "Users can upload own atestados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'atestados' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own atestados"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'atestados' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Políticas para anexos de solicitações
CREATE POLICY "Users can upload anexos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'anexos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own anexos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'anexos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Certificados - todos podem ver (são públicos após emitidos)
CREATE POLICY "Anyone can view certificados"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificados');

-- Comunicados - anexos são públicos
CREATE POLICY "Anyone can view comunicados anexos"
ON storage.objects FOR SELECT
USING (bucket_id = 'comunicados');

-- =====================================================
-- INSTRUÇÕES PARA CRIAR BUCKETS VIA SUPABASE DASHBOARD:
-- =====================================================
-- 1. Acesse: https://app.supabase.com/project/[PROJECT_ID]/storage/buckets
-- 2. Clique em "New bucket"
-- 3. Crie os seguintes buckets:
--    - avatars (público: true, file size limit: 2MB, mime types: image/*)
--    - documentos (público: false, file size limit: 10MB)
--    - atestados (público: false, file size limit: 5MB)
--    - anexos (público: false, file size limit: 5MB)
--    - certificados (público: true, file size limit: 2MB, mime types: application/pdf, image/*)
--    - comunicados (público: true, file size limit: 10MB)
-- =====================================================
