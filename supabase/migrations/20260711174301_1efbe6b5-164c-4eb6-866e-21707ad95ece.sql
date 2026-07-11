
CREATE TABLE public.emprestimos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  valor_solicitado NUMERIC(12,2) NOT NULL CHECK (valor_solicitado > 0),
  num_parcelas INT NOT NULL CHECK (num_parcelas BETWEEN 1 AND 60),
  taxa_mensal NUMERIC(6,4) NOT NULL DEFAULT 0.015,
  valor_parcela NUMERIC(12,2) NOT NULL,
  valor_total NUMERIC(12,2) NOT NULL,
  motivo TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','recusado','quitado','cancelado')),
  observacao_admin TEXT,
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  quitado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_emprestimos_user ON public.emprestimos(user_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emprestimos TO authenticated;
GRANT ALL ON public.emprestimos TO service_role;
ALTER TABLE public.emprestimos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver próprios empréstimos" ON public.emprestimos FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Criar próprio empréstimo" ON public.emprestimos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pendente');
CREATE POLICY "Cancelar próprio pendente" ON public.emprestimos FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pendente') WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin gerencia empréstimos" ON public.emprestimos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_emprestimos_updated BEFORE UPDATE ON public.emprestimos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.parcelas_emprestimo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emprestimo_id UUID NOT NULL REFERENCES public.emprestimos(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  vencimento DATE NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','paga','atrasada')),
  paga_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (emprestimo_id, numero)
);
CREATE INDEX idx_parcelas_emp ON public.parcelas_emprestimo(emprestimo_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parcelas_emprestimo TO authenticated;
GRANT ALL ON public.parcelas_emprestimo TO service_role;
ALTER TABLE public.parcelas_emprestimo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver parcelas do próprio empréstimo" ON public.parcelas_emprestimo FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.emprestimos e WHERE e.id = emprestimo_id AND (e.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Admin gerencia parcelas" ON public.parcelas_emprestimo FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Gera parcelas ao aprovar
CREATE OR REPLACE FUNCTION public.fn_gerar_parcelas_emprestimo()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE i INT;
BEGIN
  IF NEW.status = 'aprovado' AND (OLD.status IS DISTINCT FROM 'aprovado') THEN
    DELETE FROM public.parcelas_emprestimo WHERE emprestimo_id = NEW.id;
    FOR i IN 1..NEW.num_parcelas LOOP
      INSERT INTO public.parcelas_emprestimo (emprestimo_id, numero, vencimento, valor)
      VALUES (NEW.id, i, (COALESCE(NEW.aprovado_em, now())::date + (i * INTERVAL '1 month'))::date, NEW.valor_parcela);
    END LOOP;
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (NEW.user_id, 'Empréstimo aprovado ✅',
      'Seu empréstimo de R$ ' || NEW.valor_solicitado || ' foi aprovado em ' || NEW.num_parcelas || 'x.',
      'sucesso'::tipo_notificacao, '/emprestimos');
  ELSIF NEW.status = 'recusado' AND (OLD.status IS DISTINCT FROM 'recusado') THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (NEW.user_id, 'Empréstimo recusado',
      COALESCE(NEW.observacao_admin, 'Seu empréstimo foi recusado. Contate o RH.'),
      'erro'::tipo_notificacao, '/emprestimos');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_emprestimo_aprovado
AFTER UPDATE ON public.emprestimos
FOR EACH ROW EXECUTE FUNCTION public.fn_gerar_parcelas_emprestimo();
