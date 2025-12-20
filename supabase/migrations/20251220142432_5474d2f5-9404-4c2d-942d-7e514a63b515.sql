-- Tabela de eventos corporativos
CREATE TABLE public.eventos_corporativos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descricao text,
  data_inicio date NOT NULL,
  data_fim date,
  hora_inicio time,
  hora_fim time,
  tipo text NOT NULL DEFAULT 'evento', -- evento, feriado, confraternizacao, treinamento
  cor text DEFAULT '#3b82f6',
  local text,
  online boolean DEFAULT false,
  link_reuniao text,
  criado_por uuid REFERENCES auth.users(id),
  ativo boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_eventos_data ON public.eventos_corporativos(data_inicio, data_fim);
CREATE INDEX idx_eventos_tipo ON public.eventos_corporativos(tipo);

-- Enable RLS
ALTER TABLE public.eventos_corporativos ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Authenticated users can view active eventos"
ON public.eventos_corporativos
FOR SELECT
TO authenticated
USING (ativo = true);

CREATE POLICY "Admins can insert eventos"
ON public.eventos_corporativos
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update eventos"
ON public.eventos_corporativos
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete eventos"
ON public.eventos_corporativos
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_eventos_updated_at
  BEFORE UPDATE ON public.eventos_corporativos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir feriados brasileiros 2025
INSERT INTO public.eventos_corporativos (titulo, data_inicio, tipo, cor) VALUES
('Confraternização Universal', '2025-01-01', 'feriado', '#ef4444'),
('Carnaval', '2025-03-03', 'feriado', '#f97316'),
('Carnaval', '2025-03-04', 'feriado', '#f97316'),
('Sexta-feira Santa', '2025-04-18', 'feriado', '#ef4444'),
('Tiradentes', '2025-04-21', 'feriado', '#ef4444'),
('Dia do Trabalho', '2025-05-01', 'feriado', '#ef4444'),
('Corpus Christi', '2025-06-19', 'feriado', '#ef4444'),
('Independência do Brasil', '2025-09-07', 'feriado', '#22c55e'),
('Nossa Senhora Aparecida', '2025-10-12', 'feriado', '#3b82f6'),
('Finados', '2025-11-02', 'feriado', '#6b7280'),
('Proclamação da República', '2025-11-15', 'feriado', '#22c55e'),
('Natal', '2025-12-25', 'feriado', '#ef4444');