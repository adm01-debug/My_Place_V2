# Database Schema - MY-PLACE

## Tabelas Principais (34)

### Core: profiles, user_roles
### RH: holerites, ferias, registros_ponto, justificativas_ponto, emprestimos, parcelas_emprestimo, beneficios
### Desenvolvimento: treinamentos, treinamentos_colaborador, metas, key_results, ciclos_avaliacao, avaliacoes, competencias, avaliacoes_competencias
### Comunicação: notificacoes, comunicados, comunicados_lidos, push_subscriptions
### Gamificação: kudos_categorias, kudos, kudos_reacoes, kudos_pontos, badges, badges_usuarios, trilhas_desenvolvimento, trilhas_etapas, trilhas_progresso, trilhas_etapas_concluidas
### Outros: documentos, solicitacoes, faq, locais_permitidos, eventos_corporativos, pesquisas_clima, perguntas_clima, respostas_clima, participacoes_clima, documentos_downloads, cron_job_logs

## Funções RPC
- criar_notificacao, fn_calcular_distancia, fn_esta_em_local_permitido
- fn_validar_localizacao, get_organograma, get_subordinados, has_role
- incrementar_visualizacao_faq, registrar_utilidade_faq
- fn_atualizar_pontos_kudos, fn_atualizar_progresso_trilha, fn_registrar_download_documento
- fn_verificar_aniversariantes_do_dia, fn_verificar_vencimentos_ferias
- fn_verificar_treinamentos_pendentes, fn_gerar_resumo_diario_gestor
- fn_limpar_notificacoes_antigas, fn_execute_cron_job

## Views
- vw_kudos_feed, vw_kudos_ranking, vw_trilhas_usuario

Ver migrations em /supabase/migrations/ para schema completo.
