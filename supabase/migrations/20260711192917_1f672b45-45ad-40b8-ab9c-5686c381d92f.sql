
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE public.salas_recursos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('sala','veiculo','equipamento','outro')),
  localizacao TEXT,
  capacidade INT,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.salas_recursos TO authenticated;
GRANT ALL ON public.salas_recursos TO service_role;
ALTER TABLE public.salas_recursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos autenticados podem listar recursos" ON public.salas_recursos
  FOR SELECT TO authenticated USING (ativo = true OR public.is_admin(auth.uid()));
CREATE POLICY "admins gerenciam recursos" ON public.salas_recursos
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_salas_upd BEFORE UPDATE ON public.salas_recursos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TYPE public.reserva_status AS ENUM ('confirmada','cancelada','concluida');

CREATE TABLE public.reservas_recursos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recurso_id UUID NOT NULL REFERENCES public.salas_recursos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  participantes INT,
  status public.reserva_status NOT NULL DEFAULT 'confirmada',
  cancelada_em TIMESTAMPTZ,
  motivo_cancelamento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reserva_periodo_valido CHECK (data_fim > data_inicio),
  CONSTRAINT reserva_sem_conflito EXCLUDE USING gist (
    recurso_id WITH =,
    tstzrange(data_inicio, data_fim, '[)') WITH &&
  ) WHERE (status = 'confirmada')
);

CREATE INDEX idx_reservas_recurso_periodo ON public.reservas_recursos (recurso_id, data_inicio);
CREATE INDEX idx_reservas_user ON public.reservas_recursos (user_id, data_inicio DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservas_recursos TO authenticated;
GRANT ALL ON public.reservas_recursos TO service_role;
ALTER TABLE public.reservas_recursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "colaboradores veem todas reservas" ON public.reservas_recursos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "colaboradores criam suas reservas" ON public.reservas_recursos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND data_inicio >= now() - INTERVAL '5 minutes');
CREATE POLICY "colaboradores editam suas reservas futuras" ON public.reservas_recursos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND data_inicio > now() AND status = 'confirmada')
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins gerenciam todas reservas" ON public.reservas_recursos
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_reservas_upd BEFORE UPDATE ON public.reservas_recursos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial de recursos comuns
INSERT INTO public.salas_recursos (nome, tipo, localizacao, capacidade, descricao) VALUES
  ('Sala de Reunião Alpha', 'sala', 'Andar 1 - Ala Norte', 8, 'TV 55", videoconferência'),
  ('Sala de Reunião Beta', 'sala', 'Andar 2 - Ala Sul', 12, 'Projetor e quadro branco'),
  ('Auditório Principal', 'sala', 'Térreo', 50, 'Palco, microfones e projeção'),
  ('Veículo Corporativo 01', 'veiculo', 'Garagem G1', 4, 'Sedan executivo'),
  ('Kit Notebooks (5un)', 'equipamento', 'TI - Sala 12', NULL, 'Notebooks para eventos externos');
