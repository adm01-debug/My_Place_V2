-- Tabela de Benefícios
CREATE TABLE IF NOT EXISTS public.beneficios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL, -- Ex: Plano de Saúde Bradesco, Vale Refeição
    tipo TEXT NOT NULL, -- Ex: Saude, Alimentação, Seguro
    descricao TEXT,
    valor_mensal DECIMAL(10,2),
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Gastos de Plano de Saúde (Coparticipação/Débitos)
CREATE TABLE IF NOT EXISTS public.plano_saude_gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    beneficio_id UUID REFERENCES public.beneficios(id) ON DELETE SET NULL,
    descricao TEXT NOT NULL, -- Ex: Consulta Clínica, Exame de Sangue
    data_evento DATE NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    valor_coparticipacao DECIMAL(10,2) NOT NULL,
    mes_referencia TEXT NOT NULL, -- YYYY-MM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ocorrências (Faltas, Advertências, Suspensões)
CREATE TABLE IF NOT EXISTS public.ocorrencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- falta, advertencia, suspensao
    data_inicio DATE NOT NULL,
    data_fim DATE,
    justificada BOOLEAN DEFAULT false,
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Remunerações Variáveis (Premiações, Bônus)
CREATE TABLE IF NOT EXISTS public.remuneracoes_variaveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- premiaçao, bonus, gratificação
    valor DECIMAL(10,2) NOT NULL,
    data_pagamento DATE,
    mes_referencia TEXT NOT NULL, -- YYYY-MM
    motivo TEXT, -- Ex: Esforço extraordinário, Meta batida
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Vale Transporte
CREATE TABLE IF NOT EXISTS public.vale_transportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cartao_numero TEXT,
    valor_recarga DECIMAL(10,2) NOT NULL,
    data_recarga DATE NOT NULL,
    status TEXT DEFAULT 'disponivel',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Decimo Terceiro (Projeção/Histórico)
CREATE TABLE IF NOT EXISTS public.decimo_terceiro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ano INTEGER NOT NULL,
    valor_estimado DECIMAL(10,2),
    valor_pago DECIMAL(10,2),
    parcela INTEGER, -- 1 ou 2
    data_pagamento DATE,
    status TEXT DEFAULT 'estimado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Melhorias na tabela de holerites para incluir comprovante bancário
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'holerites' AND COLUMN_NAME = 'comprovante_bancario_url') THEN
        ALTER TABLE public.holerites ADD COLUMN comprovante_bancario_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'holerites' AND COLUMN_NAME = 'data_pagamento_banco') THEN
        ALTER TABLE public.holerites ADD COLUMN data_pagamento_banco DATE;
    END IF;
END $$;

-- RLS Policies
ALTER TABLE public.beneficios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_saude_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracoes_variaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vale_transportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decimo_terceiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own beneficios" ON public.beneficios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own health costs" ON public.plano_saude_gastos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own occurrences" ON public.ocorrencias FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own rewards" ON public.remuneracoes_variaveis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own transport info" ON public.vale_transportes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own 13th salary info" ON public.decimo_terceiro FOR SELECT USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_beneficios_updated_at BEFORE UPDATE ON public.beneficios FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_plano_saude_gastos_updated_at BEFORE UPDATE ON public.plano_saude_gastos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_ocorrencias_updated_at BEFORE UPDATE ON public.ocorrencias FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_remuneracoes_variaveis_updated_at BEFORE UPDATE ON public.remuneracoes_variaveis FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_vale_transportes_updated_at BEFORE UPDATE ON public.vale_transportes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_decimo_terceiro_updated_at BEFORE UPDATE ON public.decimo_terceiro FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
