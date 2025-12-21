-- =====================================================
-- CONFIGURAÇÃO DE CRON JOBS AUTOMATIZADOS
-- my-place Portal do Colaborador
-- =====================================================

-- Habilitar extensão pg_cron (se disponível)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- FUNÇÃO: Verificar Aniversariantes do Dia
-- Executa diariamente às 08:00
-- =====================================================
CREATE OR REPLACE FUNCTION fn_verificar_aniversariantes_do_dia()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_aniversariante RECORD;
    v_hoje DATE := CURRENT_DATE;
BEGIN
    -- Buscar aniversariantes do dia
    FOR v_aniversariante IN 
        SELECT id, nome, email, data_nascimento
        FROM profiles
        WHERE EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM v_hoje)
          AND EXTRACT(DAY FROM data_nascimento) = EXTRACT(DAY FROM v_hoje)
    LOOP
        -- Criar notificação para todos os usuários
        INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link, dados)
        SELECT 
            p.id,
            '🎂 Aniversário!',
            'Hoje é aniversário de ' || v_aniversariante.nome || '! Não esqueça de parabenizar!',
            'aniversario',
            '/organograma',
            jsonb_build_object('aniversariante_id', v_aniversariante.id, 'aniversariante_nome', v_aniversariante.nome)
        FROM profiles p
        WHERE p.id != v_aniversariante.id;
        
        RAISE NOTICE 'Notificações criadas para aniversariante: %', v_aniversariante.nome;
    END LOOP;
END;
$$;

-- =====================================================
-- FUNÇÃO: Verificar Vencimentos de Férias
-- Executa diariamente às 07:00
-- =====================================================
CREATE OR REPLACE FUNCTION fn_verificar_vencimentos_ferias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_colaborador RECORD;
    v_hoje DATE := CURRENT_DATE;
    v_limite_30_dias DATE := v_hoje + INTERVAL '30 days';
    v_limite_60_dias DATE := v_hoje + INTERVAL '60 days';
BEGIN
    -- Buscar colaboradores com férias vencendo
    FOR v_colaborador IN 
        SELECT 
            p.id,
            p.nome,
            p.gestor_id,
            p.data_admissao,
            p.data_admissao + INTERVAL '12 months' AS data_vencimento
        FROM profiles p
        WHERE p.data_admissao IS NOT NULL
          AND (p.data_admissao + INTERVAL '12 months') BETWEEN v_hoje AND v_limite_60_dias
    LOOP
        -- Verificar se já existe férias aprovada no período
        IF NOT EXISTS (
            SELECT 1 FROM ferias 
            WHERE user_id = v_colaborador.id 
              AND status IN ('aprovada', 'programada', 'em_gozo')
              AND data_inicio <= v_colaborador.data_vencimento
        ) THEN
            -- Notificar colaborador
            INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link, dados)
            VALUES (
                v_colaborador.id,
                '⚠️ Férias a vencer',
                'Suas férias vencem em ' || (v_colaborador.data_vencimento - v_hoje) || ' dias. Solicite suas férias!',
                'alerta',
                '/ferias',
                jsonb_build_object('data_vencimento', v_colaborador.data_vencimento, 'urgencia', 
                    CASE 
                        WHEN (v_colaborador.data_vencimento - v_hoje) <= 30 THEN 'alta'
                        ELSE 'media'
                    END
                )
            )
            ON CONFLICT DO NOTHING;
            
            -- Notificar gestor se existir
            IF v_colaborador.gestor_id IS NOT NULL THEN
                INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link, dados)
                VALUES (
                    v_colaborador.gestor_id,
                    '⚠️ Férias de subordinado a vencer',
                    'As férias de ' || v_colaborador.nome || ' vencem em ' || (v_colaborador.data_vencimento - v_hoje) || ' dias.',
                    'alerta',
                    '/gestao',
                    jsonb_build_object('colaborador_id', v_colaborador.id, 'colaborador_nome', v_colaborador.nome)
                )
                ON CONFLICT DO NOTHING;
            END IF;
            
            RAISE NOTICE 'Alerta de férias criado para: %', v_colaborador.nome;
        END IF;
    END LOOP;
END;
$$;

-- =====================================================
-- FUNÇÃO: Verificar Treinamentos Obrigatórios Pendentes
-- Executa diariamente às 07:30
-- =====================================================
CREATE OR REPLACE FUNCTION fn_verificar_treinamentos_pendentes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_treinamento RECORD;
    v_hoje DATE := CURRENT_DATE;
BEGIN
    -- Buscar treinamentos obrigatórios com prazo vencendo
    FOR v_treinamento IN 
        SELECT 
            tc.user_id,
            tc.treinamento_id,
            t.titulo,
            t.prazo,
            p.nome as colaborador_nome
        FROM treinamentos_colaborador tc
        JOIN treinamentos t ON t.id = tc.treinamento_id
        JOIN profiles p ON p.id = tc.user_id
        WHERE tc.status = 'pendente'
          AND t.obrigatorio = true
          AND t.prazo IS NOT NULL
          AND t.prazo BETWEEN v_hoje AND (v_hoje + INTERVAL '7 days')
    LOOP
        INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link, dados)
        VALUES (
            v_treinamento.user_id,
            '📚 Treinamento obrigatório pendente',
            'O treinamento "' || v_treinamento.titulo || '" vence em ' || (v_treinamento.prazo - v_hoje) || ' dias.',
            'treinamento',
            '/treinamentos',
            jsonb_build_object('treinamento_id', v_treinamento.treinamento_id, 'prazo', v_treinamento.prazo)
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Alerta de treinamento criado para: %', v_treinamento.colaborador_nome;
    END LOOP;
END;
$$;

-- =====================================================
-- FUNÇÃO: Gerar Resumo Diário para Gestores
-- Executa diariamente às 18:00
-- =====================================================
CREATE OR REPLACE FUNCTION fn_gerar_resumo_diario_gestor()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_gestor RECORD;
    v_hoje DATE := CURRENT_DATE;
    v_pendencias_ferias INTEGER;
    v_pendencias_ponto INTEGER;
    v_aniversarios INTEGER;
BEGIN
    -- Para cada gestor
    FOR v_gestor IN 
        SELECT DISTINCT gestor_id as id, pg.nome
        FROM profiles p
        JOIN profiles pg ON pg.id = p.gestor_id
        WHERE p.gestor_id IS NOT NULL
    LOOP
        -- Contar pendências de férias
        SELECT COUNT(*) INTO v_pendencias_ferias
        FROM ferias f
        JOIN profiles p ON p.id = f.user_id
        WHERE p.gestor_id = v_gestor.id
          AND f.status = 'pendente';
          
        -- Contar justificativas de ponto pendentes
        SELECT COUNT(*) INTO v_pendencias_ponto
        FROM justificativas_ponto jp
        JOIN registros_ponto rp ON rp.id = jp.registro_ponto_id
        JOIN profiles p ON p.id = rp.user_id
        WHERE p.gestor_id = v_gestor.id
          AND jp.status = 'pendente';
          
        -- Contar aniversários da semana
        SELECT COUNT(*) INTO v_aniversarios
        FROM profiles p
        WHERE p.gestor_id = v_gestor.id
          AND EXTRACT(WEEK FROM (
              MAKE_DATE(EXTRACT(YEAR FROM v_hoje)::int, 
                        EXTRACT(MONTH FROM p.data_nascimento)::int, 
                        EXTRACT(DAY FROM p.data_nascimento)::int)
          )) = EXTRACT(WEEK FROM v_hoje);
        
        -- Criar notificação de resumo se houver algo relevante
        IF v_pendencias_ferias > 0 OR v_pendencias_ponto > 0 THEN
            INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link, dados)
            VALUES (
                v_gestor.id,
                '📊 Resumo do dia',
                'Você tem ' || v_pendencias_ferias || ' férias e ' || v_pendencias_ponto || ' justificativas pendentes.',
                'resumo',
                '/gestao',
                jsonb_build_object(
                    'ferias_pendentes', v_pendencias_ferias,
                    'ponto_pendentes', v_pendencias_ponto,
                    'aniversarios_semana', v_aniversarios,
                    'data', v_hoje
                )
            )
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Resumo diário criado para gestor: %', v_gestor.nome;
        END IF;
    END LOOP;
END;
$$;

-- =====================================================
-- FUNÇÃO: Limpar Notificações Antigas (30 dias)
-- Executa semanalmente aos domingos às 03:00
-- =====================================================
CREATE OR REPLACE FUNCTION fn_limpar_notificacoes_antigas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM notificacoes
    WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '30 days')
      AND lida = true;
      
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE 'Notificações antigas removidas: %', v_deleted;
END;
$$;

-- =====================================================
-- TABELA: Log de Execução de Cron Jobs
-- =====================================================
CREATE TABLE IF NOT EXISTS cron_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    records_affected INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para limpeza
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_created_at ON cron_job_logs(created_at);

-- =====================================================
-- FUNÇÃO WRAPPER: Executar Job com Log
-- =====================================================
CREATE OR REPLACE FUNCTION fn_execute_cron_job(p_job_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    -- Criar registro de log
    INSERT INTO cron_job_logs (job_name, status)
    VALUES (p_job_name, 'running')
    RETURNING id INTO v_log_id;
    
    -- Executar job baseado no nome
    CASE p_job_name
        WHEN 'verificar_aniversariantes' THEN
            PERFORM fn_verificar_aniversariantes_do_dia();
        WHEN 'verificar_vencimentos' THEN
            PERFORM fn_verificar_vencimentos_ferias();
        WHEN 'verificar_treinamentos' THEN
            PERFORM fn_verificar_treinamentos_pendentes();
        WHEN 'resumo_diario' THEN
            PERFORM fn_gerar_resumo_diario_gestor();
        WHEN 'limpar_notificacoes' THEN
            PERFORM fn_limpar_notificacoes_antigas();
        ELSE
            RAISE EXCEPTION 'Job não reconhecido: %', p_job_name;
    END CASE;
    
    -- Atualizar log como sucesso
    UPDATE cron_job_logs 
    SET status = 'success', finished_at = NOW()
    WHERE id = v_log_id;
    
EXCEPTION WHEN OTHERS THEN
    -- Atualizar log como erro
    UPDATE cron_job_logs 
    SET status = 'error', finished_at = NOW(), error_message = SQLERRM
    WHERE id = v_log_id;
    
    RAISE;
END;
$$;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON FUNCTION fn_verificar_aniversariantes_do_dia() IS 'Verifica aniversariantes e cria notificações. Executar diariamente às 08:00.';
COMMENT ON FUNCTION fn_verificar_vencimentos_ferias() IS 'Verifica férias a vencer e alerta colaboradores/gestores. Executar diariamente às 07:00.';
COMMENT ON FUNCTION fn_verificar_treinamentos_pendentes() IS 'Alerta sobre treinamentos obrigatórios. Executar diariamente às 07:30.';
COMMENT ON FUNCTION fn_gerar_resumo_diario_gestor() IS 'Gera resumo de pendências para gestores. Executar diariamente às 18:00.';
COMMENT ON FUNCTION fn_limpar_notificacoes_antigas() IS 'Remove notificações lidas com mais de 30 dias. Executar semanalmente.';

-- =====================================================
-- NOTA: Para configurar pg_cron (se disponível):
-- =====================================================
-- SELECT cron.schedule('verificar-aniversariantes', '0 8 * * *', 'SELECT fn_execute_cron_job(''verificar_aniversariantes'')');
-- SELECT cron.schedule('verificar-vencimentos', '0 7 * * *', 'SELECT fn_execute_cron_job(''verificar_vencimentos'')');
-- SELECT cron.schedule('verificar-treinamentos', '30 7 * * *', 'SELECT fn_execute_cron_job(''verificar_treinamentos'')');
-- SELECT cron.schedule('resumo-diario', '0 18 * * 1-5', 'SELECT fn_execute_cron_job(''resumo_diario'')');
-- SELECT cron.schedule('limpar-notificacoes', '0 3 * * 0', 'SELECT fn_execute_cron_job(''limpar_notificacoes'')');
