
-- 1) Tabela principal de viagens
CREATE TABLE public.viagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  codigo TEXT NOT NULL UNIQUE DEFAULT ('VG-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6)),
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  motivo TEXT NOT NULL,
  meio_transporte TEXT NOT NULL CHECK (meio_transporte IN ('aereo','rodoviario','ferroviario','veiculo_proprio','veiculo_empresa','outros')),
  data_ida DATE NOT NULL,
  data_volta DATE NOT NULL,
  valor_estimado NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (valor_estimado >= 0),
  adiantamento_solicitado NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (adiantamento_solicitado >= 0),
  adiantamento_liberado NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (adiantamento_liberado >= 0),
  total_despesas NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','reprovada','em_andamento','prestacao_pendente','prestacao_enviada','concluida','cancelada')),
  observacoes TEXT,
  aprovador_id UUID,
  aprovado_em TIMESTAMPTZ,
  motivo_reprovacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (data_volta >= data_ida)
);

CREATE INDEX idx_viagens_user ON public.viagens(user_id);
CREATE INDEX idx_viagens_status ON public.viagens(status);
CREATE INDEX idx_viagens_data_ida ON public.viagens(data_ida);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.viagens TO authenticated;
GRANT ALL ON public.viagens TO service_role;
ALTER TABLE public.viagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "colab_view_own_viagens" ON public.viagens FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "colab_insert_own_viagens" ON public.viagens FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "colab_update_pendente" ON public.viagens FOR UPDATE TO authenticated
USING ((auth.uid() = user_id AND status IN ('pendente','prestacao_pendente')) OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'admin'))
WITH CHECK ((auth.uid() = user_id) OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "admin_delete_viagens" ON public.viagens FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_viagens_updated BEFORE UPDATE ON public.viagens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Despesas de viagem
CREATE TABLE public.viagens_despesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viagem_id UUID NOT NULL REFERENCES public.viagens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('passagem','hospedagem','alimentacao','transporte_local','combustivel','pedagio','estacionamento','material','outros')),
  descricao TEXT NOT NULL,
  data_despesa DATE NOT NULL,
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  reembolsavel BOOLEAN NOT NULL DEFAULT true,
  comprovante_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_viagens_despesas_viagem ON public.viagens_despesas(viagem_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.viagens_despesas TO authenticated;
GRANT ALL ON public.viagens_despesas TO service_role;
ALTER TABLE public.viagens_despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "despesas_select" ON public.viagens_despesas FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "despesas_insert" ON public.viagens_despesas FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "despesas_update" ON public.viagens_despesas FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "despesas_delete" ON public.viagens_despesas FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_viagens_despesas_updated BEFORE UPDATE ON public.viagens_despesas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Trigger: recalcular totais na viagem
CREATE OR REPLACE FUNCTION public.recalc_viagem_totais()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_total NUMERIC(12,2);
  v_adiant NUMERIC(12,2);
BEGIN
  v_id := COALESCE(NEW.viagem_id, OLD.viagem_id);
  SELECT COALESCE(SUM(valor),0) INTO v_total FROM public.viagens_despesas WHERE viagem_id = v_id AND reembolsavel = true;
  SELECT adiantamento_liberado INTO v_adiant FROM public.viagens WHERE id = v_id;
  UPDATE public.viagens
     SET total_despesas = v_total,
         saldo = COALESCE(v_adiant,0) - v_total,
         updated_at = now()
   WHERE id = v_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_recalc_viagem_totais
AFTER INSERT OR UPDATE OR DELETE ON public.viagens_despesas
FOR EACH ROW EXECUTE FUNCTION public.recalc_viagem_totais();

-- 4) Notificação em mudança de status
CREATE OR REPLACE FUNCTION public.notify_viagem_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem, link)
    VALUES (
      NEW.user_id,
      'viagem',
      'Viagem ' || NEW.codigo || ' — ' || NEW.status,
      'Sua viagem para ' || NEW.destino || ' teve status atualizado para: ' || NEW.status,
      '/viagens'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_viagem_status
AFTER UPDATE ON public.viagens
FOR EACH ROW EXECUTE FUNCTION public.notify_viagem_status();

-- 5) View de resumo
CREATE OR REPLACE VIEW public.vw_viagens_resumo
WITH (security_invoker = true) AS
SELECT
  v.*,
  (v.data_volta - v.data_ida + 1) AS duracao_dias,
  (SELECT COUNT(*) FROM public.viagens_despesas d WHERE d.viagem_id = v.id) AS total_lancamentos,
  CASE
    WHEN v.saldo > 0 THEN 'ressarcir_empresa'
    WHEN v.saldo < 0 THEN 'reembolsar_colaborador'
    ELSE 'quitado'
  END AS situacao_financeira
FROM public.viagens v;

GRANT SELECT ON public.vw_viagens_resumo TO authenticated;
