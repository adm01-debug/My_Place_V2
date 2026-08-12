
-- Storage policies for 'anexos' bucket
CREATE POLICY "Users can upload own anexos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'anexos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own anexos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'anexos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all anexos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'anexos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Gestores can view subordinate anexos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'anexos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (storage.foldername(name))[1]::uuid
      AND profiles.gestor_id = auth.uid()
  )
);
