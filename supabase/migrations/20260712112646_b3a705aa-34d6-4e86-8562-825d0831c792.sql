
CREATE TABLE public.patrimonio_ativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('notebook','desktop','monitor','celular','tablet','chip_sim','cracha','veiculo','ferramenta','mobiliario','outros')),
  descricao TEXT NOT NULL,
  marca TEXT, modelo TEXT, numero_serie TEXT, patrimonio_num TEXT,
  valor_aquisicao NUMERIC(12,2), data_aquisicao DATE,
  estado_conservacao TEXT NOT NULL DEFAULT 'novo' CHECK (estado_conservacao IN ('novo','otimo','bom','regular','ruim','inservivel')),
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel','em_uso','manutencao','baixado')),
  foto_url TEXT, observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patrimonio_ativos TO authenticated;
GRANT ALL ON public.patrimonio_ativos TO service_role;
ALTER TABLE public.patrimonio_ativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patr_ativos_sel" ON public.patrimonio_ativos FOR SELECT TO authenticated USING (true);
CREATE POLICY "patr_ativos_admin" ON public.patrimonio_ativos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.patrimonio_movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ativo_id UUID NOT NULL REFERENCES public.patrimonio_ativos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo_movimentacao TEXT NOT NULL CHECK (tipo_movimentacao IN ('entrega','devolucao','transferencia','manutencao','baixa')),
  data_movimentacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado_no_ato TEXT NOT NULL CHECK (estado_no_ato IN ('novo','otimo','bom','regular','ruim','inservivel')),
  observacoes TEXT,
  registrado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assinatura_hash TEXT, assinatura_ip TEXT, assinatura_user_agent TEXT, assinatura_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.patrimonio_movimentacoes TO authenticated;
GRANT ALL ON public.patrimonio_movimentacoes TO service_role;
ALTER TABLE public.patrimonio_movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_patr_mov_ativo ON public.patrimonio_movimentacoes(ativo_id);
CREATE INDEX idx_patr_mov_user ON public.patrimonio_movimentacoes(user_id);

CREATE POLICY "patr_mov_sel" ON public.patrimonio_movimentacoes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'));
CREATE POLICY "patr_mov_ins" ON public.patrimonio_movimentacoes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'));
CREATE POLICY "patr_mov_upd" ON public.patrimonio_movimentacoes FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.patrimonio_apos_movimentacao()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.tipo_movimentacao = 'entrega' THEN
    UPDATE public.patrimonio_ativos SET status='em_uso', estado_conservacao=NEW.estado_no_ato, updated_at=now() WHERE id=NEW.ativo_id;
  ELSIF NEW.tipo_movimentacao = 'devolucao' THEN
    UPDATE public.patrimonio_ativos SET status='disponivel', estado_conservacao=NEW.estado_no_ato, updated_at=now() WHERE id=NEW.ativo_id;
  ELSIF NEW.tipo_movimentacao = 'manutencao' THEN
    UPDATE public.patrimonio_ativos SET status='manutencao', updated_at=now() WHERE id=NEW.ativo_id;
  ELSIF NEW.tipo_movimentacao = 'baixa' THEN
    UPDATE public.patrimonio_ativos SET status='baixado', estado_conservacao=NEW.estado_no_ato, updated_at=now() WHERE id=NEW.ativo_id;
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_patrimonio_apos_mov AFTER INSERT ON public.patrimonio_movimentacoes
  FOR EACH ROW EXECUTE FUNCTION public.patrimonio_apos_movimentacao();

CREATE TRIGGER trg_patr_ativos_upd BEFORE UPDATE ON public.patrimonio_ativos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_patr_mov_upd BEFORE UPDATE ON public.patrimonio_movimentacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.vw_patrimonio_em_uso WITH (security_invoker = true) AS
WITH ultima_mov AS (
  SELECT DISTINCT ON (ativo_id) ativo_id, user_id, tipo_movimentacao, data_movimentacao, estado_no_ato, assinatura_em, id AS movimentacao_id
  FROM public.patrimonio_movimentacoes ORDER BY ativo_id, data_movimentacao DESC
)
SELECT a.id AS ativo_id, a.codigo, a.tipo, a.descricao, a.marca, a.modelo, a.numero_serie, a.patrimonio_num,
  a.status, a.estado_conservacao, a.foto_url,
  u.user_id, u.data_movimentacao AS entregue_em, u.estado_no_ato AS estado_na_entrega, u.assinatura_em, u.movimentacao_id
FROM public.patrimonio_ativos a
JOIN ultima_mov u ON u.ativo_id = a.id
WHERE a.status='em_uso' AND u.tipo_movimentacao='entrega';

GRANT SELECT ON public.vw_patrimonio_em_uso TO authenticated;

INSERT INTO public.patrimonio_ativos (codigo, tipo, descricao, marca, modelo, numero_serie, valor_aquisicao, data_aquisicao, estado_conservacao) VALUES
  ('NB-0001','notebook','Notebook padrão','Dell','Latitude 5540','SN-DEL-5540-0001', 6800.00, CURRENT_DATE-90, 'novo'),
  ('NB-0002','notebook','Notebook padrão','Dell','Latitude 5540','SN-DEL-5540-0002', 6800.00, CURRENT_DATE-90, 'novo'),
  ('MO-0001','monitor','Monitor 24" FHD','LG','24MP400','SN-LG-24-0001', 780.00, CURRENT_DATE-60, 'novo'),
  ('CE-0001','celular','Celular corporativo','Motorola','Moto G84','SN-MOT-G84-0001', 1400.00, CURRENT_DATE-30, 'novo'),
  ('CR-0001','cracha','Crachá de acesso',NULL,NULL,'CR-0001', 25.00, CURRENT_DATE-5, 'novo');
