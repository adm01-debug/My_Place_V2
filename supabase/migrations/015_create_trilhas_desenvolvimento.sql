-- =====================================================
-- TRILHAS DE DESENVOLVIMENTO E LOG DE DOWNLOADS
-- my-place Portal do Colaborador
-- =====================================================

-- =====================================================
-- TABELA: Trilhas de Desenvolvimento
-- =====================================================
CREATE TABLE IF NOT EXISTS trilhas_desenvolvimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    nivel_entrada TEXT NOT NULL DEFAULT 'junior', -- junior, pleno, senior, especialista, gestor
    nivel_saida TEXT NOT NULL DEFAULT 'pleno',
    departamento TEXT,
    carga_horaria_total INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir trilhas padrão
INSERT INTO trilhas_desenvolvimento (nome, descricao, nivel_entrada, nivel_saida, departamento, ordem) VALUES
    ('Fundamentos Corporativos', 'Treinamentos essenciais para todos os colaboradores', 'junior', 'junior', NULL, 1),
    ('Desenvolvimento Profissional', 'Habilidades interpessoais e liderança', 'pleno', 'senior', NULL, 2),
    ('Liderança e Gestão', 'Preparação para cargos de gestão', 'senior', 'gestor', NULL, 3),
    ('Especialização Técnica', 'Aprofundamento em áreas específicas', 'pleno', 'especialista', NULL, 4),
    ('Comercial - Básico', 'Fundamentos de vendas', 'junior', 'pleno', 'Comercial', 5),
    ('Comercial - Avançado', 'Técnicas avançadas de negociação', 'pleno', 'senior', 'Comercial', 6),
    ('Logística', 'Processos e otimização logística', 'junior', 'pleno', 'Logística', 7),
    ('Administrativo', 'Processos administrativos e financeiros', 'junior', 'pleno', 'Administrativo', 8)
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABELA: Etapas da Trilha
-- =====================================================
CREATE TABLE IF NOT EXISTS trilhas_etapas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trilha_id UUID NOT NULL REFERENCES trilhas_desenvolvimento(id) ON DELETE CASCADE,
    treinamento_id UUID REFERENCES treinamentos(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    ordem INTEGER NOT NULL DEFAULT 0,
    obrigatorio BOOLEAN DEFAULT true,
    carga_horaria INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trilhas_etapas_trilha ON trilhas_etapas(trilha_id);

-- =====================================================
-- TABELA: Progresso do Colaborador nas Trilhas
-- =====================================================
CREATE TABLE IF NOT EXISTS trilhas_progresso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trilha_id UUID NOT NULL REFERENCES trilhas_desenvolvimento(id) ON DELETE CASCADE,
    etapa_atual_id UUID REFERENCES trilhas_etapas(id),
    status TEXT NOT NULL DEFAULT 'em_andamento', -- nao_iniciada, em_andamento, concluida, abandonada
    progresso_percentual INTEGER NOT NULL DEFAULT 0,
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_conclusao TIMESTAMPTZ,
    certificado_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, trilha_id)
);

CREATE INDEX IF NOT EXISTS idx_trilhas_progresso_user ON trilhas_progresso(user_id);

-- =====================================================
-- TABELA: Etapas Concluídas pelo Colaborador
-- =====================================================
CREATE TABLE IF NOT EXISTS trilhas_etapas_concluidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    etapa_id UUID NOT NULL REFERENCES trilhas_etapas(id) ON DELETE CASCADE,
    nota DECIMAL(5,2),
    data_conclusao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    observacoes TEXT,
    UNIQUE(user_id, etapa_id)
);

-- =====================================================
-- TABELA: Log de Downloads de Documentos
-- =====================================================
CREATE TABLE IF NOT EXISTS documentos_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    documento_id UUID NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    tipo_documento TEXT,
    nome_arquivo TEXT,
    tamanho_bytes BIGINT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documentos_downloads_user ON documentos_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_documentos_downloads_doc ON documentos_downloads(documento_id);
CREATE INDEX IF NOT EXISTS idx_documentos_downloads_created ON documentos_downloads(created_at DESC);

-- =====================================================
-- FUNCTION: Atualizar progresso da trilha
-- =====================================================
CREATE OR REPLACE FUNCTION fn_atualizar_progresso_trilha()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_trilha_id UUID;
    v_total_etapas INTEGER;
    v_etapas_concluidas INTEGER;
    v_progresso INTEGER;
BEGIN
    -- Buscar trilha da etapa
    SELECT te.trilha_id INTO v_trilha_id
    FROM trilhas_etapas te
    WHERE te.id = NEW.etapa_id;
    
    IF v_trilha_id IS NULL THEN RETURN NEW; END IF;
    
    -- Contar total de etapas obrigatórias
    SELECT COUNT(*) INTO v_total_etapas
    FROM trilhas_etapas
    WHERE trilha_id = v_trilha_id AND obrigatorio = true;
    
    -- Contar etapas concluídas pelo usuário
    SELECT COUNT(*) INTO v_etapas_concluidas
    FROM trilhas_etapas_concluidas tec
    JOIN trilhas_etapas te ON te.id = tec.etapa_id
    WHERE tec.user_id = NEW.user_id 
      AND te.trilha_id = v_trilha_id 
      AND te.obrigatorio = true;
    
    -- Calcular progresso
    v_progresso := CASE WHEN v_total_etapas > 0 
        THEN ROUND((v_etapas_concluidas::NUMERIC / v_total_etapas) * 100)
        ELSE 0 END;
    
    -- Atualizar ou inserir progresso
    INSERT INTO trilhas_progresso (user_id, trilha_id, progresso_percentual, status, etapa_atual_id)
    VALUES (
        NEW.user_id, 
        v_trilha_id, 
        v_progresso,
        CASE WHEN v_progresso >= 100 THEN 'concluida' ELSE 'em_andamento' END,
        NEW.etapa_id
    )
    ON CONFLICT (user_id, trilha_id) DO UPDATE SET
        progresso_percentual = v_progresso,
        status = CASE WHEN v_progresso >= 100 THEN 'concluida' ELSE 'em_andamento' END,
        etapa_atual_id = NEW.etapa_id,
        data_conclusao = CASE WHEN v_progresso >= 100 THEN NOW() ELSE NULL END,
        updated_at = NOW();
    
    -- Notificar se concluiu
    IF v_progresso >= 100 THEN
        INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link, dados)
        SELECT NEW.user_id, '🎓 Trilha concluída!',
            'Parabéns! Você concluiu a trilha "' || t.nome || '"!',
            'trilha', '/treinamentos',
            jsonb_build_object('trilha_id', v_trilha_id)
        FROM trilhas_desenvolvimento t WHERE t.id = v_trilha_id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_atualizar_progresso_trilha ON trilhas_etapas_concluidas;
CREATE TRIGGER trg_atualizar_progresso_trilha AFTER INSERT ON trilhas_etapas_concluidas
FOR EACH ROW EXECUTE FUNCTION fn_atualizar_progresso_trilha();

-- =====================================================
-- FUNCTION: Registrar download de documento
-- =====================================================
CREATE OR REPLACE FUNCTION fn_registrar_download_documento(
    p_user_id UUID,
    p_documento_id UUID,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_log_id UUID;
    v_doc RECORD;
BEGIN
    -- Buscar info do documento
    SELECT tipo, titulo INTO v_doc FROM documentos WHERE id = p_documento_id;
    
    -- Registrar download
    INSERT INTO documentos_downloads (user_id, documento_id, tipo_documento, nome_arquivo, ip_address, user_agent)
    VALUES (p_user_id, p_documento_id, v_doc.tipo, v_doc.titulo, p_ip_address::INET, p_user_agent)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- =====================================================
-- VIEW: Trilhas disponíveis para usuário
-- =====================================================
CREATE OR REPLACE VIEW vw_trilhas_usuario AS
SELECT 
    td.id,
    td.nome,
    td.descricao,
    td.nivel_entrada,
    td.nivel_saida,
    td.departamento,
    td.carga_horaria_total,
    COALESCE(tp.status, 'nao_iniciada') as status,
    COALESCE(tp.progresso_percentual, 0) as progresso,
    tp.data_inicio,
    tp.data_conclusao,
    (SELECT COUNT(*) FROM trilhas_etapas WHERE trilha_id = td.id) as total_etapas,
    (SELECT COUNT(*) FROM trilhas_etapas WHERE trilha_id = td.id AND obrigatorio = true) as etapas_obrigatorias
FROM trilhas_desenvolvimento td
LEFT JOIN trilhas_progresso tp ON tp.trilha_id = td.id
WHERE td.ativo = true
ORDER BY td.ordem;

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE trilhas_desenvolvimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilhas_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilhas_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilhas_etapas_concluidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trilhas_select" ON trilhas_desenvolvimento FOR SELECT USING (ativo = true);
CREATE POLICY "etapas_select" ON trilhas_etapas FOR SELECT USING (true);
CREATE POLICY "progresso_select" ON trilhas_progresso FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "progresso_insert" ON trilhas_progresso FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "progresso_update" ON trilhas_progresso FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "etapas_concluidas_all" ON trilhas_etapas_concluidas FOR ALL USING (user_id = auth.uid());
CREATE POLICY "downloads_select" ON documentos_downloads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "downloads_insert" ON documentos_downloads FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE trilhas_desenvolvimento IS 'Trilhas de carreira/desenvolvimento';
COMMENT ON TABLE trilhas_etapas IS 'Etapas dentro de cada trilha';
COMMENT ON TABLE trilhas_progresso IS 'Progresso do colaborador em cada trilha';
COMMENT ON TABLE documentos_downloads IS 'Log de downloads de documentos para auditoria';
