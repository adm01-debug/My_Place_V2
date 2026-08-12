-- =====================================================
-- SISTEMA DE KUDOS/RECONHECIMENTO SOCIAL
-- my-place Portal do Colaborador
-- =====================================================

-- =====================================================
-- TABELA: Categorias de Kudos
-- =====================================================
CREATE TABLE IF NOT EXISTS kudos_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    icone TEXT NOT NULL DEFAULT '⭐',
    cor TEXT NOT NULL DEFAULT '#FFD700',
    pontos INTEGER NOT NULL DEFAULT 10,
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO kudos_categorias (nome, descricao, icone, cor, pontos, ordem) VALUES
    ('Trabalho em Equipe', 'Reconhecimento por colaboração excepcional', '🤝', '#3B82F6', 15, 1),
    ('Inovação', 'Ideias criativas e soluções inovadoras', '💡', '#F59E0B', 20, 2),
    ('Excelência', 'Trabalho de alta qualidade', '🏆', '#10B981', 25, 3),
    ('Atitude Positiva', 'Energia e positividade no trabalho', '😊', '#EC4899', 10, 4),
    ('Superação', 'Superar desafios e expectativas', '🚀', '#8B5CF6', 30, 5),
    ('Mentoria', 'Ajudar colegas a crescer', '🎓', '#06B6D4', 20, 6),
    ('Cliente em Foco', 'Foco na satisfação do cliente', '❤️', '#EF4444', 15, 7),
    ('Iniciativa', 'Proatividade e iniciativa', '⚡', '#F97316', 15, 8)
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABELA: Kudos (Reconhecimentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    remetente_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    destinatario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES kudos_categorias(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    pontos INTEGER NOT NULL DEFAULT 10,
    publico BOOLEAN DEFAULT true,
    destaque BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT no_self_kudos CHECK (remetente_id != destinatario_id)
);

CREATE INDEX IF NOT EXISTS idx_kudos_destinatario ON kudos(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_kudos_remetente ON kudos(remetente_id);
CREATE INDEX IF NOT EXISTS idx_kudos_created_at ON kudos(created_at DESC);

-- =====================================================
-- TABELA: Reações aos Kudos
-- =====================================================
CREATE TABLE IF NOT EXISTS kudos_reacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kudos_id UUID NOT NULL REFERENCES kudos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL DEFAULT '👏',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(kudos_id, user_id)
);

-- =====================================================
-- TABELA: Pontos Acumulados
-- =====================================================
CREATE TABLE IF NOT EXISTS kudos_pontos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    pontos_recebidos INTEGER NOT NULL DEFAULT 0,
    pontos_enviados INTEGER NOT NULL DEFAULT 0,
    kudos_recebidos INTEGER NOT NULL DEFAULT 0,
    kudos_enviados INTEGER NOT NULL DEFAULT 0,
    nivel INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABELA: Badges/Conquistas
-- =====================================================
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    icone TEXT NOT NULL,
    cor TEXT NOT NULL DEFAULT '#FFD700',
    criterio_tipo TEXT NOT NULL,
    criterio_valor INTEGER NOT NULL,
    criterio_categoria_id UUID REFERENCES kudos_categorias(id),
    raridade TEXT NOT NULL DEFAULT 'comum',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO badges (nome, descricao, icone, cor, criterio_tipo, criterio_valor, raridade) VALUES
    ('Primeiros Passos', 'Recebeu seu primeiro kudos', '🌟', '#FFD700', 'kudos_recebidos', 1, 'comum'),
    ('Popular', 'Recebeu 10 kudos', '⭐', '#C0C0C0', 'kudos_recebidos', 10, 'comum'),
    ('Estrela', 'Recebeu 50 kudos', '🌠', '#FFD700', 'kudos_recebidos', 50, 'raro'),
    ('Lenda', 'Recebeu 100 kudos', '👑', '#9333EA', 'kudos_recebidos', 100, 'epico'),
    ('Generoso', 'Enviou 10 kudos', '🎁', '#10B981', 'kudos_enviados', 10, 'comum'),
    ('Motivador', 'Enviou 50 kudos', '🎯', '#3B82F6', 'kudos_enviados', 50, 'raro'),
    ('Centurião', 'Acumulou 100 pontos', '💯', '#F59E0B', 'pontos', 100, 'comum'),
    ('Milionário', 'Acumulou 1000 pontos', '💰', '#EF4444', 'pontos', 1000, 'lendario')
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABELA: Badges Conquistados
-- =====================================================
CREATE TABLE IF NOT EXISTS badges_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    conquistado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- =====================================================
-- FUNCTION: Atualizar pontos após kudos
-- =====================================================
CREATE OR REPLACE FUNCTION fn_atualizar_pontos_kudos()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO kudos_pontos (user_id, pontos_recebidos, kudos_recebidos)
    VALUES (NEW.destinatario_id, NEW.pontos, 1)
    ON CONFLICT (user_id) DO UPDATE SET
        pontos_recebidos = kudos_pontos.pontos_recebidos + NEW.pontos,
        kudos_recebidos = kudos_pontos.kudos_recebidos + 1,
        nivel = GREATEST(1, FLOOR((kudos_pontos.pontos_recebidos + NEW.pontos) / 100) + 1),
        updated_at = NOW();
    
    INSERT INTO kudos_pontos (user_id, pontos_enviados, kudos_enviados)
    VALUES (NEW.remetente_id, NEW.pontos, 1)
    ON CONFLICT (user_id) DO UPDATE SET
        pontos_enviados = kudos_pontos.pontos_enviados + NEW.pontos,
        kudos_enviados = kudos_pontos.kudos_enviados + 1,
        updated_at = NOW();
    
    INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link, dados)
    SELECT NEW.destinatario_id, '🎉 Você recebeu um kudos!',
        p.nome || ' reconheceu você!', 'kudos', '/kudos',
        jsonb_build_object('kudos_id', NEW.id, 'remetente_id', NEW.remetente_id)
    FROM profiles p WHERE p.id = NEW.remetente_id;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_atualizar_pontos_kudos ON kudos;
CREATE TRIGGER trg_atualizar_pontos_kudos AFTER INSERT ON kudos
FOR EACH ROW EXECUTE FUNCTION fn_atualizar_pontos_kudos();

-- =====================================================
-- VIEW: Feed de kudos públicos
-- =====================================================
CREATE OR REPLACE VIEW vw_kudos_feed AS
SELECT k.id, k.mensagem, k.pontos, k.created_at,
    kr.nome as remetente_nome, kr.avatar_url as remetente_avatar,
    kd.nome as destinatario_nome, kd.avatar_url as destinatario_avatar,
    kc.nome as categoria_nome, kc.icone as categoria_icone, kc.cor as categoria_cor,
    (SELECT COUNT(*) FROM kudos_reacoes WHERE kudos_id = k.id) as total_reacoes
FROM kudos k
JOIN profiles kr ON kr.id = k.remetente_id
JOIN profiles kd ON kd.id = k.destinatario_id
JOIN kudos_categorias kc ON kc.id = k.categoria_id
WHERE k.publico = true
ORDER BY k.created_at DESC;

-- =====================================================
-- VIEW: Ranking de pontos
-- =====================================================
CREATE OR REPLACE VIEW vw_kudos_ranking AS
SELECT kp.user_id, p.nome, p.avatar_url, p.cargo, p.departamento,
    kp.pontos_recebidos, kp.kudos_recebidos, kp.nivel,
    RANK() OVER (ORDER BY kp.pontos_recebidos DESC) as posicao
FROM kudos_pontos kp
JOIN profiles p ON p.id = kp.user_id
ORDER BY kp.pontos_recebidos DESC;

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos_reacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos_pontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kudos_select" ON kudos FOR SELECT USING (publico = true OR remetente_id = auth.uid() OR destinatario_id = auth.uid());
CREATE POLICY "kudos_insert" ON kudos FOR INSERT WITH CHECK (remetente_id = auth.uid());
CREATE POLICY "reacoes_all" ON kudos_reacoes FOR ALL USING (true);
CREATE POLICY "pontos_select" ON kudos_pontos FOR SELECT USING (true);
CREATE POLICY "badges_select" ON badges_usuarios FOR SELECT USING (true);
