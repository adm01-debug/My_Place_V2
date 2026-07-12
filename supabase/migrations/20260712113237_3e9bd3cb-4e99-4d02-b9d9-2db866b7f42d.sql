
-- Tabela pai
CREATE TABLE public.documentos_assinatura (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE DEFAULT ('DOC-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6)),
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('contrato','aditivo','acordo','termo','nda','procuracao','outros')),
  arquivo_url TEXT NOT NULL,
  arquivo_hash TEXT NOT NULL,
  criado_por UUID NOT NULL,
  data_limite DATE,
  status TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando','parcial','concluido','cancelado','expirado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doc_assin_status ON public.documentos_assinatura(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos_assinatura TO authenticated;
GRANT ALL ON public.documentos_assinatura TO service_role;
ALTER TABLE public.documentos_assinatura ENABLE ROW LEVEL SECURITY;

-- Tabela filha
CREATE TABLE public.documentos_assinaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id UUID NOT NULL REFERENCES public.documentos_assinatura(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 1,
  papel TEXT NOT NULL DEFAULT 'signatario' CHECK (papel IN ('signatario','testemunha','aprovador')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','assinado','recusado')),
  assinatura_hash TEXT,
  arquivo_hash_assinado TEXT,
  ip TEXT,
  user_agent TEXT,
  assinado_em TIMESTAMPTZ,
  motivo_recusa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (documento_id, user_id)
);
CREATE INDEX idx_doc_assinaturas_user ON public.documentos_assinaturas(user_id);
GRANT SELECT, INSERT, UPDATE ON public.documentos_assinaturas TO authenticated;
GRANT ALL ON public.documentos_assinaturas TO service_role;
ALTER TABLE public.documentos_assinaturas ENABLE ROW LEVEL SECURITY;

-- Policies pai (agora podem referenciar filha)
CREATE POLICY "doc_view" ON public.documentos_assinatura FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'gestor')
  OR EXISTS (SELECT 1 FROM public.documentos_assinaturas s WHERE s.documento_id = documentos_assinatura.id AND s.user_id = auth.uid())
);
CREATE POLICY "doc_admin_all" ON public.documentos_assinatura FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_doc_assin_upd BEFORE UPDATE ON public.documentos_assinatura
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Policies filha
CREATE POLICY "assin_view" ON public.documentos_assinaturas FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'));

CREATE POLICY "assin_admin_insert" ON public.documentos_assinaturas FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "assin_signer_update" ON public.documentos_assinaturas FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND status = 'pendente')
WITH CHECK (user_id = auth.uid());

-- Trigger: recalcular status do documento pai
CREATE OR REPLACE FUNCTION public.atualizar_status_documento()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total INT; v_assinados INT; v_recusados INT; v_doc UUID;
BEGIN
  v_doc := COALESCE(NEW.documento_id, OLD.documento_id);
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status='assinado'), COUNT(*) FILTER (WHERE status='recusado')
    INTO v_total, v_assinados, v_recusados
  FROM public.documentos_assinaturas WHERE documento_id = v_doc;

  UPDATE public.documentos_assinatura
     SET status = CASE
       WHEN v_recusados > 0 THEN 'cancelado'
       WHEN v_assinados = v_total AND v_total > 0 THEN 'concluido'
       WHEN v_assinados > 0 THEN 'parcial'
       ELSE 'aguardando'
     END,
     updated_at = now()
   WHERE id = v_doc;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_atualiza_status_doc
AFTER INSERT OR UPDATE OR DELETE ON public.documentos_assinaturas
FOR EACH ROW EXECUTE FUNCTION public.atualizar_status_documento();

-- Trigger: notificar signatário
CREATE OR REPLACE FUNCTION public.notify_signatario()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_titulo TEXT;
BEGIN
  SELECT titulo INTO v_titulo FROM public.documentos_assinatura WHERE id = NEW.documento_id;
  INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem, link)
  VALUES (NEW.user_id, 'assinatura', 'Documento aguardando sua assinatura', v_titulo, '/assinaturas');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_signatario
AFTER INSERT ON public.documentos_assinaturas
FOR EACH ROW EXECUTE FUNCTION public.notify_signatario();

-- View de resumo
CREATE OR REPLACE VIEW public.vw_documentos_assinatura
WITH (security_invoker = true) AS
SELECT
  d.*,
  (SELECT COUNT(*) FROM public.documentos_assinaturas s WHERE s.documento_id = d.id) AS total_signatarios,
  (SELECT COUNT(*) FROM public.documentos_assinaturas s WHERE s.documento_id = d.id AND s.status = 'assinado') AS total_assinados,
  (SELECT COUNT(*) FROM public.documentos_assinaturas s WHERE s.documento_id = d.id AND s.status = 'pendente') AS total_pendentes
FROM public.documentos_assinatura d;

GRANT SELECT ON public.vw_documentos_assinatura TO authenticated;
