
-- ============================================
-- CRIAR STORAGE BUCKETS
-- ============================================

-- Bucket para avatares (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Bucket para documentos (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documentos', 'documentos', false, 10485760);

-- Bucket para atestados (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('atestados', 'atestados', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

-- Bucket para certificados (público para download)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('certificados', 'certificados', true, 2097152, ARRAY['application/pdf', 'image/jpeg', 'image/png']);

-- Bucket para anexos de comunicados (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('comunicados', 'comunicados', true, 10485760);

-- Bucket para anexos de solicitações (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('anexos', 'anexos', false, 5242880);

-- ============================================
-- POLÍTICAS RLS PARA AVATARS (público)
-- ============================================
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- POLÍTICAS RLS PARA DOCUMENTOS (privado)
-- ============================================
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documentos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documentos'
  AND public.is_admin(auth.uid())
);

-- ============================================
-- POLÍTICAS RLS PARA ATESTADOS (privado)
-- ============================================
CREATE POLICY "Users can view their own atestados"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'atestados' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own atestados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'atestados' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- POLÍTICAS RLS PARA CERTIFICADOS (público)
-- ============================================
CREATE POLICY "Certificates are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificados');

CREATE POLICY "Admins can upload certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificados'
  AND public.is_admin(auth.uid())
);

-- ============================================
-- POLÍTICAS RLS PARA COMUNICADOS (público)
-- ============================================
CREATE POLICY "Comunicados attachments are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'comunicados');

CREATE POLICY "Admins can upload comunicados attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comunicados'
  AND public.is_admin(auth.uid())
);

-- ============================================
-- POLÍTICAS RLS PARA ANEXOS (privado)
-- ============================================
CREATE POLICY "Users can view their own anexos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'anexos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own anexos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'anexos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own anexos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'anexos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
