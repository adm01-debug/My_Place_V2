-- 1. CRITICAL: Anonymize survey responses
CREATE OR REPLACE FUNCTION public.fn_anonymize_survey_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_anonima BOOLEAN;
BEGIN
  SELECT anonima INTO v_anonima
  FROM public.pesquisas_clima
  WHERE id = NEW.pesquisa_id;
  IF v_anonima = true THEN
    NEW.user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_anonymize_survey_response ON public.respostas_clima;
CREATE TRIGGER trg_anonymize_survey_response
  BEFORE INSERT ON public.respostas_clima
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_anonymize_survey_response();

-- 2. CRITICAL: Replace permissive manager profile policy
DROP POLICY IF EXISTS "Gestores can view subordinate profiles" ON public.profiles;

CREATE POLICY "Gestores can view subordinate profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    gestor_id = auth.uid()
    OR auth.uid() = id
  );

-- 3. Fix RLS always-true on login_attempts
DROP POLICY IF EXISTS "Anon can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Authenticated users can insert login attempts" ON public.login_attempts;

CREATE POLICY "Anon can insert login attempts"
  ON public.login_attempts FOR INSERT TO anon
  WITH CHECK (char_length(email) <= 255 AND char_length(COALESCE(ip_address, '')) <= 45);

CREATE POLICY "Authenticated users can insert login attempts"
  ON public.login_attempts FOR INSERT TO authenticated
  WITH CHECK (char_length(email) <= 255 AND char_length(COALESCE(ip_address, '')) <= 45);

-- 4. Admin policies for bonificacoes
CREATE POLICY "Admins can manage bonificacoes"
  ON public.bonificacoes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Admin policies for holerites
CREATE POLICY "Admins can manage holerites"
  ON public.holerites FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. Admin + manager policies for registros_ponto
CREATE POLICY "Admins can view all registros_ponto"
  ON public.registros_ponto FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Gestores can view subordinate registros_ponto"
  ON public.registros_ponto FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = registros_ponto.user_id AND p.gestor_id = auth.uid()
  ));

-- 7. Admin policies for parcelas_emprestimo
CREATE POLICY "Admins can manage parcelas_emprestimo"
  ON public.parcelas_emprestimo FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 8. User write policies for documentos
CREATE POLICY "Users can insert own documentos"
  ON public.documentos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documentos"
  ON public.documentos FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 9. Admin policies for comissoes
CREATE POLICY "Admins can manage comissoes"
  ON public.comissoes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 10. Birthday recipients can read messages
CREATE POLICY "Recipients can view birthday messages"
  ON public.aniversario_parabens FOR SELECT TO authenticated
  USING (auth.uid() = aniversariante_id);