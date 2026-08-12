-- Função para processar os logs de auditoria
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_changed_by UUID := auth.uid();
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
    END IF;

    INSERT INTO public.audit_log (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_by,
        changed_at
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)::TEXT,
        TG_OP,
        v_old_data,
        v_new_data,
        v_changed_by,
        now()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers de auditoria em tabelas críticas
DROP TRIGGER IF EXISTS tr_audit_profiles ON public.profiles;
CREATE TRIGGER tr_audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS tr_audit_registros_ponto ON public.registros_ponto;
CREATE TRIGGER tr_audit_registros_ponto
AFTER INSERT OR UPDATE OR DELETE ON public.registros_ponto
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS tr_audit_solicitacoes_ferias ON public.solicitacoes_ferias;
CREATE TRIGGER tr_audit_solicitacoes_ferias
AFTER INSERT OR UPDATE OR DELETE ON public.solicitacoes_ferias
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS tr_audit_solicitacoes ON public.solicitacoes;
CREATE TRIGGER tr_audit_solicitacoes
AFTER INSERT OR UPDATE OR DELETE ON public.solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Garantir que a tabela audit_log tenha RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_log;
CREATE POLICY "Admins can view audit logs"
ON public.audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
