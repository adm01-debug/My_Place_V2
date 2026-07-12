
-- 1. CATÁLOGO
CREATE TABLE public.epis_catalogo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'outros' CHECK (categoria IN ('cabeca','olhos','ouvidos','respiratoria','maos','pes','corpo','queda','outros')),
  numero_ca TEXT,
  ca_validade DATE,
  fabricante TEXT,
  vida_util_dias INTEGER CHECK (vida_util_dias IS NULL OR vida_util_dias > 0),
  estoque_minimo INTEGER NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
  foto_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.epis_catalogo TO authenticated;
GRANT ALL ON public.epis_catalogo TO service_role;
ALTER TABLE public.epis_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "epis_catalogo_select_ativos" ON public.epis_catalogo
  FOR SELECT TO authenticated
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "epis_catalogo_admin_manage" ON public.epis_catalogo
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_epis_catalogo_updated
  BEFORE UPDATE ON public.epis_catalogo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. ENTREGAS
CREATE TABLE public.epis_entregas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  epi_id UUID NOT NULL REFERENCES public.epis_catalogo(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  numero_ca_entrega TEXT,
  data_entrega TIMESTAMPTZ NOT NULL DEFAULT now(),
  previsao_troca DATE,
  motivo TEXT NOT NULL DEFAULT 'entrega' CHECK (motivo IN ('entrega','troca','reposicao','perda','danificado')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','devolvido','vencido','substituido')),
  data_devolucao TIMESTAMPTZ,
  motivo_devolucao TEXT,
  assinatura_hash TEXT,
  assinatura_ip TEXT,
  assinatura_em TIMESTAMPTZ,
  observacoes TEXT,
  entregue_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT devolucao_coerente CHECK (
    (status IN ('devolvido','substituido') AND data_devolucao IS NOT NULL)
    OR (status NOT IN ('devolvido','substituido'))
  )
);
CREATE INDEX idx_epis_entregas_user ON public.epis_entregas(user_id);
CREATE INDEX idx_epis_entregas_epi ON public.epis_entregas(epi_id);
CREATE INDEX idx_epis_entregas_status ON public.epis_entregas(status);
CREATE INDEX idx_epis_entregas_previsao ON public.epis_entregas(previsao_troca) WHERE status = 'ativo';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.epis_entregas TO authenticated;
GRANT ALL ON public.epis_entregas TO service_role;
ALTER TABLE public.epis_entregas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "epis_entregas_select_own_or_manager" ON public.epis_entregas
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
  );
CREATE POLICY "epis_entregas_insert_managers" ON public.epis_entregas
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
  );
-- colaborador só pode ATUALIZAR sua própria entrega para assinar (assinatura_*) — gestor/admin fazem qualquer update
CREATE POLICY "epis_entregas_update_sign_or_manager" ON public.epis_entregas
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
  );
CREATE POLICY "epis_entregas_delete_admin" ON public.epis_entregas
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_epis_entregas_updated
  BEFORE UPDATE ON public.epis_entregas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. TRIGGER: calcula previsão de troca
CREATE OR REPLACE FUNCTION public.calc_epi_previsao_troca()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vida INTEGER;
  v_ca TEXT;
  v_ca_val DATE;
BEGIN
  SELECT vida_util_dias, numero_ca, ca_validade
    INTO v_vida, v_ca, v_ca_val
  FROM public.epis_catalogo WHERE id = NEW.epi_id;

  IF NEW.numero_ca_entrega IS NULL THEN
    NEW.numero_ca_entrega := v_ca;
  END IF;

  IF NEW.previsao_troca IS NULL AND v_vida IS NOT NULL THEN
    NEW.previsao_troca := (NEW.data_entrega::DATE) + v_vida;
  END IF;

  -- previsão nunca pode passar a validade do CA
  IF v_ca_val IS NOT NULL AND (NEW.previsao_troca IS NULL OR NEW.previsao_troca > v_ca_val) THEN
    NEW.previsao_troca := v_ca_val;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calc_epi_previsao
  BEFORE INSERT ON public.epis_entregas
  FOR EACH ROW EXECUTE FUNCTION public.calc_epi_previsao_troca();

-- 4. TRIGGER: notifica colaborador
CREATE OR REPLACE FUNCTION public.notify_epi_entrega()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome TEXT;
BEGIN
  SELECT nome INTO v_nome FROM public.epis_catalogo WHERE id = NEW.epi_id;
  INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem, link)
  VALUES (
    NEW.user_id,
    'info',
    'EPI recebido',
    'Você recebeu ' || NEW.quantidade || ' × ' || v_nome ||
      CASE WHEN NEW.previsao_troca IS NOT NULL
           THEN ' — previsão de troca: ' || to_char(NEW.previsao_troca, 'DD/MM/YYYY')
           ELSE '' END ||
      '. Assine o recebimento na ficha.',
    '/epis'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_epi_entrega
  AFTER INSERT ON public.epis_entregas
  FOR EACH ROW EXECUTE FUNCTION public.notify_epi_entrega();

-- 5. VIEW ATIVOS
CREATE OR REPLACE VIEW public.vw_epis_ativos
WITH (security_invoker = true) AS
SELECT
  e.id AS entrega_id,
  e.user_id,
  e.epi_id,
  c.codigo,
  c.nome,
  c.categoria,
  c.foto_url,
  e.quantidade,
  e.numero_ca_entrega,
  e.data_entrega,
  e.previsao_troca,
  e.motivo,
  e.status,
  e.assinatura_em,
  CASE
    WHEN e.status IN ('devolvido','substituido') THEN 'devolvido'
    WHEN e.previsao_troca IS NULL THEN 'vigente'
    WHEN e.previsao_troca <= CURRENT_DATE THEN 'vencido'
    WHEN e.previsao_troca <= CURRENT_DATE + INTERVAL '15 days' THEN 'trocar_em_breve'
    ELSE 'vigente'
  END AS situacao,
  CASE
    WHEN e.previsao_troca IS NOT NULL
    THEN (e.previsao_troca - CURRENT_DATE)::INTEGER
    ELSE NULL
  END AS dias_ate_troca
FROM public.epis_entregas e
JOIN public.epis_catalogo c ON c.id = e.epi_id;

GRANT SELECT ON public.vw_epis_ativos TO authenticated;

-- 6. SEED
INSERT INTO public.epis_catalogo (codigo, nome, descricao, categoria, numero_ca, vida_util_dias, estoque_minimo) VALUES
('CAP-001', 'Capacete de Segurança Classe B', 'Capacete para proteção contra impactos e choques elétricos.', 'cabeca', '31469', 1825, 10),
('LUV-NIT', 'Luva Nitrílica Descartável', 'Proteção química leve, uso único.', 'maos', '28324', 1, 500),
('OCU-001', 'Óculos de Proteção Ampla Visão', 'Proteção contra impactos e respingos.', 'olhos', '9722', 365, 20),
('PRO-AUR', 'Protetor Auricular Tipo Plug', 'Atenuação de ruído NRRsf 16 dB.', 'ouvidos', '5745', 180, 100),
('BOT-SEG', 'Bota de Segurança com Biqueira', 'Cabedal em couro, biqueira de composite.', 'pes', '40595', 730, 15),
('MAS-PFF2', 'Máscara Descartável PFF2', 'Proteção respiratória, uso único diário.', 'respiratoria', '38994', 1, 300);
