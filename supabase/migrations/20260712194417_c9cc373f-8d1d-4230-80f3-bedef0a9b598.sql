
-- 1) Tabela de configuração de limites por categoria
CREATE TABLE IF NOT EXISTS public.notificacao_rate_limits (
  categoria text PRIMARY KEY,
  janela_minutos int NOT NULL DEFAULT 60 CHECK (janela_minutos > 0),
  max_por_janela int NOT NULL DEFAULT 20 CHECK (max_por_janela > 0),
  descricao text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.notificacao_rate_limits TO authenticated;
GRANT ALL ON public.notificacao_rate_limits TO service_role;

ALTER TABLE public.notificacao_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rl_select_all_auth" ON public.notificacao_rate_limits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rl_admin_all" ON public.notificacao_rate_limits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Defaults sensatos por categoria
INSERT INTO public.notificacao_rate_limits (categoria, janela_minutos, max_por_janela, descricao) VALUES
  ('ponto', 60, 10, 'Lembretes de ponto'),
  ('ferias', 1440, 15, 'Movimentações de férias'),
  ('holerite', 1440, 5, 'Novos contracheques'),
  ('solicitacao', 60, 20, 'Solicitações internas'),
  ('vale', 1440, 15, 'Vales e adiantamentos'),
  ('emprestimo', 1440, 10, 'Parcelas e empréstimos'),
  ('treinamento', 1440, 15, 'Treinamentos e cursos'),
  ('feedback', 1440, 20, 'Feedback 360º'),
  ('kudos', 60, 30, 'Reconhecimentos'),
  ('comunicado', 1440, 20, 'Comunicados corporativos'),
  ('chamado', 60, 30, 'Atualizações de tickets'),
  ('politica', 1440, 10, 'Políticas corporativas'),
  ('aniversario', 1440, 50, 'Aniversários'),
  ('sistema', 60, 50, 'Notificações sistêmicas'),
  ('seguranca', 60, 100, 'Alertas de segurança (alto limite)')
ON CONFLICT (categoria) DO NOTHING;

-- 2) Contador de janela deslizante por usuário/categoria
CREATE TABLE IF NOT EXISTS public.notificacao_rate_contadores (
  user_id uuid NOT NULL,
  categoria text NOT NULL,
  janela_inicio timestamptz NOT NULL DEFAULT now(),
  contador int NOT NULL DEFAULT 0,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, categoria)
);

GRANT SELECT ON public.notificacao_rate_contadores TO authenticated;
GRANT ALL ON public.notificacao_rate_contadores TO service_role;

ALTER TABLE public.notificacao_rate_contadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rlc_select_own" ON public.notificacao_rate_contadores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 3) Função para checar & incrementar atômicamente. Retorna true se PERMITIDO, false se BLOQUEADO.
CREATE OR REPLACE FUNCTION public.fn_rate_limit_check(_user_id uuid, _categoria text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cfg RECORD;
  _row RECORD;
  _agora timestamptz := now();
BEGIN
  SELECT janela_minutos, max_por_janela INTO _cfg
    FROM public.notificacao_rate_limits WHERE categoria = _categoria;

  -- Sem config = sem limite
  IF NOT FOUND THEN RETURN true; END IF;

  INSERT INTO public.notificacao_rate_contadores (user_id, categoria, janela_inicio, contador, atualizado_em)
  VALUES (_user_id, _categoria, _agora, 1, _agora)
  ON CONFLICT (user_id, categoria) DO UPDATE
    SET contador = CASE
        WHEN public.notificacao_rate_contadores.janela_inicio < (_agora - make_interval(mins => _cfg.janela_minutos))
          THEN 1
        ELSE public.notificacao_rate_contadores.contador + 1
      END,
      janela_inicio = CASE
        WHEN public.notificacao_rate_contadores.janela_inicio < (_agora - make_interval(mins => _cfg.janela_minutos))
          THEN _agora
        ELSE public.notificacao_rate_contadores.janela_inicio
      END,
      atualizado_em = _agora
  RETURNING contador INTO _row;

  RETURN _row.contador <= _cfg.max_por_janela;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_rate_limit_check(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_rate_limit_check(uuid, text) TO service_role;
