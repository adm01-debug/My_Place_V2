-- Check if bucket exists and create if it doesn't
INSERT INTO storage.buckets (id, name, public) 
SELECT 'solicitacoes_anexos', 'solicitacoes_anexos', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'solicitacoes_anexos'
);

-- Policies for solicitacoes_anexos
CREATE POLICY "Public Access for solicitacoes_anexos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'solicitacoes_anexos');

CREATE POLICY "Authenticated users can upload to solicitacoes_anexos" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'solicitacoes_anexos' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own objects in solicitacoes_anexos" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'solicitacoes_anexos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);