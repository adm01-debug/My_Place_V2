
CREATE TABLE IF NOT EXISTS public.onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  area TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.onboarding_templates(id) ON DELETE CASCADE,
  ordem INT NOT NULL DEFAULT 0,
  area TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  dias_apos_admissao INT NOT NULL DEFAULT 0,
  obrigatoria BOOLEAN NOT NULL DEFAULT true,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onb_tarefas_tpl ON public.onboarding_tarefas(template_id);

CREATE TABLE IF NOT EXISTS public.onboarding_colaborador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.onboarding_templates(id) ON DELETE RESTRICT,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  concluido BOOLEAN NOT NULL DEFAULT false,
  concluido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_id)
);
CREATE INDEX IF NOT EXISTS idx_onb_col_user ON public.onboarding_colaborador(user_id);

CREATE TABLE IF NOT EXISTS public.onboarding_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id UUID NOT NULL REFERENCES public.onboarding_colaborador(id) ON DELETE CASCADE,
  tarefa_id UUID NOT NULL REFERENCES public.onboarding_tarefas(id) ON DELETE CASCADE,
  concluida BOOLEAN NOT NULL DEFAULT false,
  concluida_em TIMESTAMPTZ,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (onboarding_id, tarefa_id)
);
CREATE INDEX IF NOT EXISTS idx_onb_prog_onb ON public.onboarding_progresso(onboarding_id);

-- GRANTS
GRANT SELECT ON public.onboarding_templates TO authenticated;
GRANT ALL ON public.onboarding_templates TO service_role;
GRANT SELECT ON public.onboarding_tarefas TO authenticated;
GRANT ALL ON public.onboarding_tarefas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_colaborador TO authenticated;
GRANT ALL ON public.onboarding_colaborador TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_progresso TO authenticated;
GRANT ALL ON public.onboarding_progresso TO service_role;

-- RLS
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_colaborador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos veem templates ativos" ON public.onboarding_templates
  FOR SELECT TO authenticated USING (ativo OR public.is_admin(auth.uid()));
CREATE POLICY "Admin gerencia templates" ON public.onboarding_templates
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Todos veem tarefas" ON public.onboarding_tarefas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia tarefas" ON public.onboarding_tarefas
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Colab vê seu onboarding" ON public.onboarding_colaborador
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admin cria/edita onboardings" ON public.onboarding_colaborador
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Colab vê seu progresso" ON public.onboarding_progresso
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.onboarding_colaborador oc
            WHERE oc.id = onboarding_progresso.onboarding_id
              AND (oc.user_id = auth.uid() OR public.is_admin(auth.uid())))
  );
CREATE POLICY "Colab atualiza seu progresso" ON public.onboarding_progresso
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.onboarding_colaborador oc
            WHERE oc.id = onboarding_progresso.onboarding_id AND oc.user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Colab edita seu progresso" ON public.onboarding_progresso
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.onboarding_colaborador oc
            WHERE oc.id = onboarding_progresso.onboarding_id
              AND (oc.user_id = auth.uid() OR public.is_admin(auth.uid())))
  );
CREATE POLICY "Admin exclui progresso" ON public.onboarding_progresso
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Triggers updated_at
CREATE TRIGGER trg_onb_tpl_updated BEFORE UPDATE ON public.onboarding_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_onb_col_updated BEFORE UPDATE ON public.onboarding_colaborador
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_onb_prog_updated BEFORE UPDATE ON public.onboarding_progresso
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: quando marca concluída, seta concluida_em; e recalcula onboarding.concluido
CREATE OR REPLACE FUNCTION public.fn_onboarding_prog_after()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total INT; v_feitas INT; v_onb UUID;
BEGIN
  IF NEW.concluida AND NEW.concluida_em IS NULL THEN
    NEW.concluida_em := now();
  END IF;
  v_onb := NEW.onboarding_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_onb_prog_before BEFORE INSERT OR UPDATE ON public.onboarding_progresso
  FOR EACH ROW EXECUTE FUNCTION public.fn_onboarding_prog_after();

CREATE OR REPLACE FUNCTION public.fn_onboarding_recalc()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total INT; v_feitas INT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.onboarding_tarefas t
    JOIN public.onboarding_colaborador oc ON oc.template_id = t.template_id
    WHERE oc.id = NEW.onboarding_id AND t.obrigatoria = true;
  SELECT COUNT(*) INTO v_feitas FROM public.onboarding_progresso p
    JOIN public.onboarding_tarefas t ON t.id = p.tarefa_id
    WHERE p.onboarding_id = NEW.onboarding_id AND p.concluida = true AND t.obrigatoria = true;
  IF v_total > 0 AND v_feitas >= v_total THEN
    UPDATE public.onboarding_colaborador SET concluido = true, concluido_em = COALESCE(concluido_em, now())
      WHERE id = NEW.onboarding_id AND concluido = false;
  ELSE
    UPDATE public.onboarding_colaborador SET concluido = false, concluido_em = NULL
      WHERE id = NEW.onboarding_id AND concluido = true;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_onb_recalc AFTER INSERT OR UPDATE ON public.onboarding_progresso
  FOR EACH ROW EXECUTE FUNCTION public.fn_onboarding_recalc();

-- View de progresso
CREATE OR REPLACE VIEW public.vw_onboarding_progresso AS
SELECT
  oc.id AS onboarding_id,
  oc.user_id,
  oc.template_id,
  oc.data_inicio,
  oc.concluido,
  oc.concluido_em,
  (SELECT COUNT(*) FROM public.onboarding_tarefas t WHERE t.template_id = oc.template_id) AS total_tarefas,
  (SELECT COUNT(*) FROM public.onboarding_progresso p WHERE p.onboarding_id = oc.id AND p.concluida = true) AS concluidas,
  CASE WHEN (SELECT COUNT(*) FROM public.onboarding_tarefas t WHERE t.template_id = oc.template_id) = 0 THEN 0
       ELSE ROUND(100.0 * (SELECT COUNT(*) FROM public.onboarding_progresso p WHERE p.onboarding_id = oc.id AND p.concluida = true)
                         / (SELECT COUNT(*) FROM public.onboarding_tarefas t WHERE t.template_id = oc.template_id), 1)
  END AS percentual
FROM public.onboarding_colaborador oc;

GRANT SELECT ON public.vw_onboarding_progresso TO authenticated;

-- Seed: template padrão
INSERT INTO public.onboarding_templates (nome, descricao, area)
VALUES ('Integração Padrão', 'Checklist inicial para novos colaboradores', 'Geral')
ON CONFLICT DO NOTHING;

WITH tpl AS (SELECT id FROM public.onboarding_templates WHERE nome = 'Integração Padrão' LIMIT 1)
INSERT INTO public.onboarding_tarefas (template_id, ordem, area, titulo, descricao, dias_apos_admissao, obrigatoria)
SELECT tpl.id, o, a, t, d, dias, true FROM tpl, (VALUES
  (1,'RH','Assinar contrato e documentos','Ler e assinar contrato de trabalho e termos.',0),
  (2,'RH','Enviar documentos pessoais','RG, CPF, comprovante de residência, foto 3x4.',0),
  (3,'TI','Receber credenciais e e-mail corporativo','Login, senha inicial, VPN, 2FA.',1),
  (4,'TI','Configurar notebook e ferramentas','Slack, Google Workspace, sistemas internos.',1),
  (5,'Gestor','Tour pela empresa e apresentação da equipe','Reunião de boas-vindas com o time.',1),
  (6,'RH','Assistir vídeo institucional','Missão, visão, valores e código de conduta.',2),
  (7,'Gestor','1:1 com gestor direto','Alinhamento de expectativas e OKRs.',3),
  (8,'RH','Concluir treinamento LGPD e Segurança','Trilha obrigatória de compliance.',7),
  (9,'RH','Cadastrar dados bancários e dependentes','Portal do colaborador.',7),
  (10,'Gestor','Feedback dos primeiros 30 dias','Reunião de checkpoint com gestor.',30)
) AS v(o, a, t, d, dias)
ON CONFLICT DO NOTHING;
