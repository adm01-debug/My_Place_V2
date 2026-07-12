export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      atestados: {
        Row: {
          anexo_url: string | null
          cid: string | null
          created_at: string
          data_inicial: string
          dias_afastamento: number
          id: string
          medico_crm: string | null
          medico_nome: string | null
          observacao: string | null
          observacao_rh: string | null
          status: Database["public"]["Enums"]["atestado_status"]
          tipo: Database["public"]["Enums"]["atestado_tipo"]
          updated_at: string
          user_id: string
          validado_em: string | null
          validador_id: string | null
        }
        Insert: {
          anexo_url?: string | null
          cid?: string | null
          created_at?: string
          data_inicial: string
          dias_afastamento: number
          id?: string
          medico_crm?: string | null
          medico_nome?: string | null
          observacao?: string | null
          observacao_rh?: string | null
          status?: Database["public"]["Enums"]["atestado_status"]
          tipo: Database["public"]["Enums"]["atestado_tipo"]
          updated_at?: string
          user_id: string
          validado_em?: string | null
          validador_id?: string | null
        }
        Update: {
          anexo_url?: string | null
          cid?: string | null
          created_at?: string
          data_inicial?: string
          dias_afastamento?: number
          id?: string
          medico_crm?: string | null
          medico_nome?: string | null
          observacao?: string | null
          observacao_rh?: string | null
          status?: Database["public"]["Enums"]["atestado_status"]
          tipo?: Database["public"]["Enums"]["atestado_tipo"]
          updated_at?: string
          user_id?: string
          validado_em?: string | null
          validador_id?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      beneficios: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          status: string | null
          tipo: string
          updated_at: string | null
          user_id: string
          valor_mensal: number | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          status?: string | null
          tipo: string
          updated_at?: string | null
          user_id: string
          valor_mensal?: number | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          status?: string | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
          valor_mensal?: number | null
        }
        Relationships: []
      }
      bi_snapshots: {
        Row: {
          absenteismo_medio: number
          compliance_score: number
          created_at: string
          criado_por: string | null
          custo_total: number
          engajamento_score: number
          headcount_total: number
          id: string
          kpis_detalhados: Json
          mes_referencia: string
          observacoes: string | null
          turnover_medio: number
        }
        Insert: {
          absenteismo_medio?: number
          compliance_score?: number
          created_at?: string
          criado_por?: string | null
          custo_total?: number
          engajamento_score?: number
          headcount_total?: number
          id?: string
          kpis_detalhados?: Json
          mes_referencia: string
          observacoes?: string | null
          turnover_medio?: number
        }
        Update: {
          absenteismo_medio?: number
          compliance_score?: number
          created_at?: string
          criado_por?: string | null
          custo_total?: number
          engajamento_score?: number
          headcount_total?: number
          id?: string
          kpis_detalhados?: Json
          mes_referencia?: string
          observacoes?: string | null
          turnover_medio?: number
        }
        Relationships: []
      }
      chamados: {
        Row: {
          assunto: string
          atendente_id: string | null
          avaliacao_comentario: string | null
          avaliacao_nota: number | null
          categoria: Database["public"]["Enums"]["chamado_categoria"]
          created_at: string
          descricao: string
          fechado_em: string | null
          id: string
          numero: number
          primeira_resposta_em: string | null
          prioridade: Database["public"]["Enums"]["chamado_prioridade"]
          resolvido_em: string | null
          sla_prazo: string | null
          status: Database["public"]["Enums"]["chamado_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assunto: string
          atendente_id?: string | null
          avaliacao_comentario?: string | null
          avaliacao_nota?: number | null
          categoria: Database["public"]["Enums"]["chamado_categoria"]
          created_at?: string
          descricao: string
          fechado_em?: string | null
          id?: string
          numero?: number
          primeira_resposta_em?: string | null
          prioridade?: Database["public"]["Enums"]["chamado_prioridade"]
          resolvido_em?: string | null
          sla_prazo?: string | null
          status?: Database["public"]["Enums"]["chamado_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assunto?: string
          atendente_id?: string | null
          avaliacao_comentario?: string | null
          avaliacao_nota?: number | null
          categoria?: Database["public"]["Enums"]["chamado_categoria"]
          created_at?: string
          descricao?: string
          fechado_em?: string | null
          id?: string
          numero?: number
          primeira_resposta_em?: string | null
          prioridade?: Database["public"]["Enums"]["chamado_prioridade"]
          resolvido_em?: string | null
          sla_prazo?: string | null
          status?: Database["public"]["Enums"]["chamado_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chamados_mensagens: {
        Row: {
          anexo_url: string | null
          autor_id: string
          chamado_id: string
          created_at: string
          id: string
          interna: boolean
          mensagem: string
        }
        Insert: {
          anexo_url?: string | null
          autor_id: string
          chamado_id: string
          created_at?: string
          id?: string
          interna?: boolean
          mensagem: string
        }
        Update: {
          anexo_url?: string | null
          autor_id?: string
          chamado_id?: string
          created_at?: string
          id?: string
          interna?: boolean
          mensagem?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamados_mensagens_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
        ]
      }
      clima_enquetes: {
        Row: {
          anonima: boolean
          ativa: boolean
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          perguntas: Json
          tipo: Database["public"]["Enums"]["clima_tipo"]
          titulo: string
          updated_at: string
        }
        Insert: {
          anonima?: boolean
          ativa?: boolean
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          perguntas?: Json
          tipo?: Database["public"]["Enums"]["clima_tipo"]
          titulo: string
          updated_at?: string
        }
        Update: {
          anonima?: boolean
          ativa?: boolean
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          perguntas?: Json
          tipo?: Database["public"]["Enums"]["clima_tipo"]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      clima_respostas: {
        Row: {
          comentario: string | null
          created_at: string
          enquete_id: string
          id: string
          respostas: Json
          score: number | null
          user_id: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          enquete_id: string
          id?: string
          respostas?: Json
          score?: number | null
          user_id: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          enquete_id?: string
          id?: string
          respostas?: Json
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clima_respostas_enquete_id_fkey"
            columns: ["enquete_id"]
            isOneToOne: false
            referencedRelation: "clima_enquetes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clima_respostas_enquete_id_fkey"
            columns: ["enquete_id"]
            isOneToOne: false
            referencedRelation: "clima_resultados_agg"
            referencedColumns: ["enquete_id"]
          },
        ]
      }
      comunicados: {
        Row: {
          autor_id: string | null
          conteudo: string
          created_at: string
          data_expiracao: string | null
          id: string
          imagem_url: string | null
          prioridade: string | null
          status: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id?: string | null
          conteudo: string
          created_at?: string
          data_expiracao?: string | null
          id?: string
          imagem_url?: string | null
          prioridade?: string | null
          status?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string | null
          conteudo?: string
          created_at?: string
          data_expiracao?: string | null
          id?: string
          imagem_url?: string | null
          prioridade?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_globais: {
        Row: {
          cor_primaria: string | null
          id: string
          limite_adiantamento_percentual: number | null
          logo_url: string | null
          nome_empresa: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          cor_primaria?: string | null
          id?: string
          limite_adiantamento_percentual?: number | null
          logo_url?: string | null
          nome_empresa?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          cor_primaria?: string | null
          id?: string
          limite_adiantamento_percentual?: number | null
          logo_url?: string | null
          nome_empresa?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      decimo_terceiro: {
        Row: {
          ano: number
          created_at: string | null
          data_pagamento: string | null
          id: string
          parcela: number | null
          status: string | null
          updated_at: string | null
          user_id: string
          valor_estimado: number | null
          valor_pago: number | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          parcela?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          valor_estimado?: number | null
          valor_pago?: number | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          parcela?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          valor_estimado?: number | null
          valor_pago?: number | null
        }
        Relationships: []
      }
      documentos: {
        Row: {
          categoria: string
          created_at: string
          descricao: string | null
          extensao: string | null
          id: string
          nome: string
          status: string | null
          tamanho_kb: number | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          descricao?: string | null
          extensao?: string | null
          id?: string
          nome: string
          status?: string | null
          tamanho_kb?: number | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          extensao?: string | null
          id?: string
          nome?: string
          status?: string | null
          tamanho_kb?: number | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      documentos_assinatura: {
        Row: {
          arquivo_hash: string
          arquivo_url: string
          categoria: string
          codigo: string
          created_at: string
          criado_por: string
          data_limite: string | null
          descricao: string | null
          id: string
          observacoes: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_hash: string
          arquivo_url: string
          categoria: string
          codigo?: string
          created_at?: string
          criado_por: string
          data_limite?: string | null
          descricao?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_hash?: string
          arquivo_url?: string
          categoria?: string
          codigo?: string
          created_at?: string
          criado_por?: string
          data_limite?: string | null
          descricao?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      documentos_assinaturas: {
        Row: {
          arquivo_hash_assinado: string | null
          assinado_em: string | null
          assinatura_hash: string | null
          created_at: string
          documento_id: string
          id: string
          ip: string | null
          motivo_recusa: string | null
          ordem: number
          papel: string
          status: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          arquivo_hash_assinado?: string | null
          assinado_em?: string | null
          assinatura_hash?: string | null
          created_at?: string
          documento_id: string
          id?: string
          ip?: string | null
          motivo_recusa?: string | null
          ordem?: number
          papel?: string
          status?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          arquivo_hash_assinado?: string | null
          assinado_em?: string | null
          assinatura_hash?: string | null
          created_at?: string
          documento_id?: string
          id?: string
          ip?: string | null
          motivo_recusa?: string | null
          ordem?: number
          papel?: string
          status?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_assinaturas_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_assinatura"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_assinaturas_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "vw_documentos_assinatura"
            referencedColumns: ["id"]
          },
        ]
      }
      emprestimos: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          id: string
          motivo: string | null
          num_parcelas: number
          observacao_admin: string | null
          quitado_em: string | null
          status: string
          taxa_mensal: number
          updated_at: string
          user_id: string
          valor_parcela: number
          valor_solicitado: number
          valor_total: number
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          id?: string
          motivo?: string | null
          num_parcelas: number
          observacao_admin?: string | null
          quitado_em?: string | null
          status?: string
          taxa_mensal?: number
          updated_at?: string
          user_id: string
          valor_parcela: number
          valor_solicitado: number
          valor_total: number
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          id?: string
          motivo?: string | null
          num_parcelas?: number
          observacao_admin?: string | null
          quitado_em?: string | null
          status?: string
          taxa_mensal?: number
          updated_at?: string
          user_id?: string
          valor_parcela?: number
          valor_solicitado?: number
          valor_total?: number
        }
        Relationships: []
      }
      epis_catalogo: {
        Row: {
          ativo: boolean
          ca_validade: string | null
          categoria: string
          codigo: string
          created_at: string
          criado_por: string | null
          descricao: string | null
          estoque_minimo: number
          fabricante: string | null
          foto_url: string | null
          id: string
          nome: string
          numero_ca: string | null
          updated_at: string
          vida_util_dias: number | null
        }
        Insert: {
          ativo?: boolean
          ca_validade?: string | null
          categoria?: string
          codigo: string
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          estoque_minimo?: number
          fabricante?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          numero_ca?: string | null
          updated_at?: string
          vida_util_dias?: number | null
        }
        Update: {
          ativo?: boolean
          ca_validade?: string | null
          categoria?: string
          codigo?: string
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          estoque_minimo?: number
          fabricante?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          numero_ca?: string | null
          updated_at?: string
          vida_util_dias?: number | null
        }
        Relationships: []
      }
      epis_entregas: {
        Row: {
          assinatura_em: string | null
          assinatura_hash: string | null
          assinatura_ip: string | null
          created_at: string
          data_devolucao: string | null
          data_entrega: string
          entregue_por: string | null
          epi_id: string
          id: string
          motivo: string
          motivo_devolucao: string | null
          numero_ca_entrega: string | null
          observacoes: string | null
          previsao_troca: string | null
          quantidade: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assinatura_em?: string | null
          assinatura_hash?: string | null
          assinatura_ip?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_entrega?: string
          entregue_por?: string | null
          epi_id: string
          id?: string
          motivo?: string
          motivo_devolucao?: string | null
          numero_ca_entrega?: string | null
          observacoes?: string | null
          previsao_troca?: string | null
          quantidade?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assinatura_em?: string | null
          assinatura_hash?: string | null
          assinatura_ip?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_entrega?: string
          entregue_por?: string | null
          epi_id?: string
          id?: string
          motivo?: string
          motivo_devolucao?: string | null
          numero_ca_entrega?: string | null
          observacoes?: string | null
          previsao_troca?: string | null
          quantidade?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "epis_entregas_epi_id_fkey"
            columns: ["epi_id"]
            isOneToOne: false
            referencedRelation: "epis_catalogo"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_corporativos: {
        Row: {
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          local: string | null
          tipo: Database["public"]["Enums"]["evento_tipo"]
          titulo: string
          todos_convidados: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          local?: string | null
          tipo?: Database["public"]["Enums"]["evento_tipo"]
          titulo: string
          todos_convidados?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          local?: string | null
          tipo?: Database["public"]["Enums"]["evento_tipo"]
          titulo?: string
          todos_convidados?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      exit_interviews: {
        Row: {
          comentario_final: string | null
          created_at: string
          data_desligamento: string | null
          enviada_em: string | null
          id: string
          motivo_principal: Database["public"]["Enums"]["exit_motivo"]
          nota_ambiente: number | null
          nota_crescimento: number | null
          nota_ferramentas: number | null
          nota_lideranca: number | null
          nota_remuneracao: number | null
          o_que_gostou: string | null
          o_que_melhoraria: string | null
          recomendaria: number | null
          status: Database["public"]["Enums"]["exit_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          comentario_final?: string | null
          created_at?: string
          data_desligamento?: string | null
          enviada_em?: string | null
          id?: string
          motivo_principal: Database["public"]["Enums"]["exit_motivo"]
          nota_ambiente?: number | null
          nota_crescimento?: number | null
          nota_ferramentas?: number | null
          nota_lideranca?: number | null
          nota_remuneracao?: number | null
          o_que_gostou?: string | null
          o_que_melhoraria?: string | null
          recomendaria?: number | null
          status?: Database["public"]["Enums"]["exit_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          comentario_final?: string | null
          created_at?: string
          data_desligamento?: string | null
          enviada_em?: string | null
          id?: string
          motivo_principal?: Database["public"]["Enums"]["exit_motivo"]
          nota_ambiente?: number | null
          nota_crescimento?: number | null
          nota_ferramentas?: number | null
          nota_lideranca?: number | null
          nota_remuneracao?: number | null
          o_que_gostou?: string | null
          o_que_melhoraria?: string | null
          recomendaria?: number | null
          status?: Database["public"]["Enums"]["exit_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      faq: {
        Row: {
          categoria: string | null
          created_at: string
          id: string
          pergunta: string
          prioridade: number | null
          resposta: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          id?: string
          pergunta: string
          prioridade?: number | null
          resposta: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          id?: string
          pergunta?: string
          prioridade?: number | null
          resposta?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback_avaliadores: {
        Row: {
          avaliado_id: string
          avaliador_id: string
          ciclo_id: string
          concluido: boolean
          concluido_em: string | null
          created_at: string
          id: string
          relacao: Database["public"]["Enums"]["feedback_relacao"]
        }
        Insert: {
          avaliado_id: string
          avaliador_id: string
          ciclo_id: string
          concluido?: boolean
          concluido_em?: string | null
          created_at?: string
          id?: string
          relacao: Database["public"]["Enums"]["feedback_relacao"]
        }
        Update: {
          avaliado_id?: string
          avaliador_id?: string
          ciclo_id?: string
          concluido?: boolean
          concluido_em?: string | null
          created_at?: string
          id?: string
          relacao?: Database["public"]["Enums"]["feedback_relacao"]
        }
        Relationships: [
          {
            foreignKeyName: "feedback_avaliadores_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "feedback_ciclos"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_ciclos: {
        Row: {
          competencias: Json
          created_at: string
          created_by: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          status: Database["public"]["Enums"]["feedback_ciclo_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          competencias?: Json
          created_at?: string
          created_by?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          status?: Database["public"]["Enums"]["feedback_ciclo_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          competencias?: Json
          created_at?: string
          created_by?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          status?: Database["public"]["Enums"]["feedback_ciclo_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback_respostas: {
        Row: {
          avaliado_id: string
          avaliador_id: string
          ciclo_id: string
          comentario: string | null
          competencia: string
          created_at: string
          id: string
          nota: number
          relacao: Database["public"]["Enums"]["feedback_relacao"]
        }
        Insert: {
          avaliado_id: string
          avaliador_id: string
          ciclo_id: string
          comentario?: string | null
          competencia: string
          created_at?: string
          id?: string
          nota: number
          relacao: Database["public"]["Enums"]["feedback_relacao"]
        }
        Update: {
          avaliado_id?: string
          avaliador_id?: string
          ciclo_id?: string
          comentario?: string | null
          competencia?: string
          created_at?: string
          id?: string
          nota?: number
          relacao?: Database["public"]["Enums"]["feedback_relacao"]
        }
        Relationships: [
          {
            foreignKeyName: "feedback_respostas_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "feedback_ciclos"
            referencedColumns: ["id"]
          },
        ]
      }
      feriados: {
        Row: {
          created_at: string
          data: string
          id: string
          nome: string
          recorrente: boolean
          tipo: Database["public"]["Enums"]["feriado_tipo"]
          uf: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          nome: string
          recorrente?: boolean
          tipo?: Database["public"]["Enums"]["feriado_tipo"]
          uf?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          nome?: string
          recorrente?: boolean
          tipo?: Database["public"]["Enums"]["feriado_tipo"]
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      holerites: {
        Row: {
          arquivo_url: string | null
          competencia: string
          comprovante_bancario_url: string | null
          created_at: string
          data_pagamento_banco: string | null
          id: string
          inss: number
          irrf: number
          outros_descontos: number
          salario_bruto: number
          salario_liquido: number
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivo_url?: string | null
          competencia: string
          comprovante_bancario_url?: string | null
          created_at?: string
          data_pagamento_banco?: string | null
          id?: string
          inss?: number
          irrf?: number
          outros_descontos?: number
          salario_bruto?: number
          salario_liquido?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivo_url?: string | null
          competencia?: string
          comprovante_bancario_url?: string | null
          created_at?: string
          data_pagamento_banco?: string | null
          id?: string
          inss?: number
          irrf?: number
          outros_descontos?: number
          salario_bruto?: number
          salario_liquido?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ideias: {
        Row: {
          categoria: string | null
          created_at: string
          descricao: string
          id: string
          impacto: Database["public"]["Enums"]["ideia_impacto"]
          status: Database["public"]["Enums"]["ideia_status"]
          status_observacao: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          descricao: string
          id?: string
          impacto?: Database["public"]["Enums"]["ideia_impacto"]
          status?: Database["public"]["Enums"]["ideia_status"]
          status_observacao?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          descricao?: string
          id?: string
          impacto?: Database["public"]["Enums"]["ideia_impacto"]
          status?: Database["public"]["Enums"]["ideia_status"]
          status_observacao?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ideias_comentarios: {
        Row: {
          comentario: string
          created_at: string
          id: string
          ideia_id: string
          user_id: string
        }
        Insert: {
          comentario: string
          created_at?: string
          id?: string
          ideia_id: string
          user_id: string
        }
        Update: {
          comentario?: string
          created_at?: string
          id?: string
          ideia_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideias_comentarios_ideia_id_fkey"
            columns: ["ideia_id"]
            isOneToOne: false
            referencedRelation: "ideias"
            referencedColumns: ["id"]
          },
        ]
      }
      ideias_votos: {
        Row: {
          created_at: string
          id: string
          ideia_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ideia_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ideia_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideias_votos_ideia_id_fkey"
            columns: ["ideia_id"]
            isOneToOne: false
            referencedRelation: "ideias"
            referencedColumns: ["id"]
          },
        ]
      }
      integracoes: {
        Row: {
          ativo: boolean
          config: Json
          created_at: string
          criado_por: string | null
          descricao: string | null
          endpoint: string
          headers_extra: Json
          hmac_secret_ref: string | null
          id: string
          nome: string
          secret_ref: string | null
          timeout_ms: number
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          config?: Json
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          endpoint: string
          headers_extra?: Json
          hmac_secret_ref?: string | null
          id?: string
          nome: string
          secret_ref?: string | null
          timeout_ms?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          config?: Json
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          endpoint?: string
          headers_extra?: Json
          hmac_secret_ref?: string | null
          id?: string
          nome?: string
          secret_ref?: string | null
          timeout_ms?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      integracoes_eventos: {
        Row: {
          created_at: string
          criado_por: string | null
          evento_tipo: string
          id: string
          idempotency_key: string
          integracao_id: string
          max_tentativas: number
          payload: Json
          processado_em: string | null
          proxima_tentativa: string
          status: string
          tentativas: number
          ultimo_erro: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          evento_tipo: string
          id?: string
          idempotency_key: string
          integracao_id: string
          max_tentativas?: number
          payload?: Json
          processado_em?: string | null
          proxima_tentativa?: string
          status?: string
          tentativas?: number
          ultimo_erro?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          evento_tipo?: string
          id?: string
          idempotency_key?: string
          integracao_id?: string
          max_tentativas?: number
          payload?: Json
          processado_em?: string | null
          proxima_tentativa?: string
          status?: string
          tentativas?: number
          ultimo_erro?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integracoes_eventos_integracao_id_fkey"
            columns: ["integracao_id"]
            isOneToOne: false
            referencedRelation: "integracoes"
            referencedColumns: ["id"]
          },
        ]
      }
      integracoes_logs: {
        Row: {
          created_at: string
          duracao_ms: number | null
          erro: string | null
          evento_id: string
          id: string
          integracao_id: string
          request_body: string | null
          request_headers: Json
          response_body: string | null
          response_headers: Json
          response_status: number | null
          tentativa: number
        }
        Insert: {
          created_at?: string
          duracao_ms?: number | null
          erro?: string | null
          evento_id: string
          id?: string
          integracao_id: string
          request_body?: string | null
          request_headers?: Json
          response_body?: string | null
          response_headers?: Json
          response_status?: number | null
          tentativa: number
        }
        Update: {
          created_at?: string
          duracao_ms?: number | null
          erro?: string | null
          evento_id?: string
          id?: string
          integracao_id?: string
          request_body?: string | null
          request_headers?: Json
          response_body?: string | null
          response_headers?: Json
          response_status?: number | null
          tentativa?: number
        }
        Relationships: [
          {
            foreignKeyName: "integracoes_logs_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "integracoes_eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integracoes_logs_integracao_id_fkey"
            columns: ["integracao_id"]
            isOneToOne: false
            referencedRelation: "integracoes"
            referencedColumns: ["id"]
          },
        ]
      }
      justificativas_ponto: {
        Row: {
          anexo_url: string | null
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          data_referencia: string
          descricao: string
          id: string
          observacao_admin: string | null
          registro_ponto_id: string | null
          status: Database["public"]["Enums"]["status_justificativa"]
          tipo: Database["public"]["Enums"]["tipo_justificativa"]
          updated_at: string
          user_id: string
        }
        Insert: {
          anexo_url?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data_referencia: string
          descricao: string
          id?: string
          observacao_admin?: string | null
          registro_ponto_id?: string | null
          status?: Database["public"]["Enums"]["status_justificativa"]
          tipo: Database["public"]["Enums"]["tipo_justificativa"]
          updated_at?: string
          user_id: string
        }
        Update: {
          anexo_url?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data_referencia?: string
          descricao?: string
          id?: string
          observacao_admin?: string | null
          registro_ponto_id?: string | null
          status?: Database["public"]["Enums"]["status_justificativa"]
          tipo?: Database["public"]["Enums"]["tipo_justificativa"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "justificativas_ponto_registro_ponto_id_fkey"
            columns: ["registro_ponto_id"]
            isOneToOne: false
            referencedRelation: "registros_ponto"
            referencedColumns: ["id"]
          },
        ]
      }
      kudos: {
        Row: {
          categoria: Database["public"]["Enums"]["kudos_categoria"]
          created_at: string
          destinatario_id: string
          icone: string
          id: string
          mensagem: string
          remetente_id: string
          updated_at: string
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["kudos_categoria"]
          created_at?: string
          destinatario_id: string
          icone?: string
          id?: string
          mensagem: string
          remetente_id: string
          updated_at?: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["kudos_categoria"]
          created_at?: string
          destinatario_id?: string
          icone?: string
          id?: string
          mensagem?: string
          remetente_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      locais_permitidos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          latitude: number
          longitude: number
          nome: string
          raio_metros: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          nome: string
          raio_metros?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          nome?: string
          raio_metros?: number
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
      }
      metas_colaborador: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          prioridade: string
          progresso: number
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          prioridade?: string
          progresso?: number
          tipo?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          prioridade?: string
          progresso?: number
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notificacao_digest_fila: {
        Row: {
          agrupado_em: string | null
          categoria: Database["public"]["Enums"]["notif_categoria"]
          created_at: string
          id: string
          link: string | null
          mensagem: string
          nivel: Database["public"]["Enums"]["notif_nivel"]
          notificacao_resumo_id: string | null
          tipo: Database["public"]["Enums"]["tipo_notificacao"]
          titulo: string
          user_id: string
        }
        Insert: {
          agrupado_em?: string | null
          categoria: Database["public"]["Enums"]["notif_categoria"]
          created_at?: string
          id?: string
          link?: string | null
          mensagem: string
          nivel?: Database["public"]["Enums"]["notif_nivel"]
          notificacao_resumo_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_notificacao"]
          titulo: string
          user_id: string
        }
        Update: {
          agrupado_em?: string | null
          categoria?: Database["public"]["Enums"]["notif_categoria"]
          created_at?: string
          id?: string
          link?: string | null
          mensagem?: string
          nivel?: Database["public"]["Enums"]["notif_nivel"]
          notificacao_resumo_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_notificacao"]
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacao_digest_fila_notificacao_resumo_id_fkey"
            columns: ["notificacao_resumo_id"]
            isOneToOne: false
            referencedRelation: "notificacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacao_entregas: {
        Row: {
          canal: string
          categoria: Database["public"]["Enums"]["notif_categoria"]
          created_at: string
          erro: string | null
          fallback_de: string | null
          fallback_para: string | null
          id: string
          integracao_id: string | null
          mensagem: string
          motivo: string | null
          nivel: Database["public"]["Enums"]["notif_nivel"]
          notificacao_id: string | null
          status: string
          tentativas: number
          titulo: string
          user_id: string
        }
        Insert: {
          canal: string
          categoria: Database["public"]["Enums"]["notif_categoria"]
          created_at?: string
          erro?: string | null
          fallback_de?: string | null
          fallback_para?: string | null
          id?: string
          integracao_id?: string | null
          mensagem: string
          motivo?: string | null
          nivel?: Database["public"]["Enums"]["notif_nivel"]
          notificacao_id?: string | null
          status: string
          tentativas?: number
          titulo: string
          user_id: string
        }
        Update: {
          canal?: string
          categoria?: Database["public"]["Enums"]["notif_categoria"]
          created_at?: string
          erro?: string | null
          fallback_de?: string | null
          fallback_para?: string | null
          id?: string
          integracao_id?: string | null
          mensagem?: string
          motivo?: string | null
          nivel?: Database["public"]["Enums"]["notif_nivel"]
          notificacao_id?: string | null
          status?: string
          tentativas?: number
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacao_entregas_fallback_de_fkey"
            columns: ["fallback_de"]
            isOneToOne: false
            referencedRelation: "notificacao_entregas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacao_entregas_integracao_id_fkey"
            columns: ["integracao_id"]
            isOneToOne: false
            referencedRelation: "integracoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacao_entregas_notificacao_id_fkey"
            columns: ["notificacao_id"]
            isOneToOne: false
            referencedRelation: "notificacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacao_preferencias: {
        Row: {
          canal_email: boolean
          canal_in_app: boolean
          canal_push: boolean
          canal_whatsapp: boolean
          categoria: Database["public"]["Enums"]["notif_categoria"]
          created_at: string
          digest_frequencia: Database["public"]["Enums"]["notif_digest_freq"]
          id: string
          nivel_minimo: Database["public"]["Enums"]["notif_nivel"]
          silenciar_ate: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canal_email?: boolean
          canal_in_app?: boolean
          canal_push?: boolean
          canal_whatsapp?: boolean
          categoria: Database["public"]["Enums"]["notif_categoria"]
          created_at?: string
          digest_frequencia?: Database["public"]["Enums"]["notif_digest_freq"]
          id?: string
          nivel_minimo?: Database["public"]["Enums"]["notif_nivel"]
          silenciar_ate?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canal_email?: boolean
          canal_in_app?: boolean
          canal_push?: boolean
          canal_whatsapp?: boolean
          categoria?: Database["public"]["Enums"]["notif_categoria"]
          created_at?: string
          digest_frequencia?: Database["public"]["Enums"]["notif_digest_freq"]
          id?: string
          nivel_minimo?: Database["public"]["Enums"]["notif_nivel"]
          silenciar_ate?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notificacao_quiet_hours: {
        Row: {
          ativo: boolean
          created_at: string
          dias_semana: number[]
          fim: string
          id: string
          inicio: string
          permitir_criticos: boolean
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dias_semana?: number[]
          fim?: string
          id?: string
          inicio?: string
          permitir_criticos?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dias_semana?: number[]
          fim?: string
          id?: string
          inicio?: string
          permitir_criticos?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notificacao_rate_contadores: {
        Row: {
          atualizado_em: string
          categoria: string
          contador: number
          janela_inicio: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          categoria: string
          contador?: number
          janela_inicio?: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          categoria?: string
          contador?: number
          janela_inicio?: string
          user_id?: string
        }
        Relationships: []
      }
      notificacao_rate_limits: {
        Row: {
          categoria: string
          descricao: string | null
          janela_minutos: number
          max_por_janela: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          categoria: string
          descricao?: string | null
          janela_minutos?: number
          max_por_janela?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          categoria?: string
          descricao?: string | null
          janela_minutos?: number
          max_por_janela?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          link: string | null
          mensagem: string
          tipo: Database["public"]["Enums"]["tipo_notificacao"]
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem: string
          tipo?: Database["public"]["Enums"]["tipo_notificacao"]
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string
          tipo?: Database["public"]["Enums"]["tipo_notificacao"]
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      ocorrencias: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          id: string
          justificada: boolean | null
          motivo: string | null
          tipo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          id?: string
          justificada?: boolean | null
          motivo?: string | null
          tipo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          id?: string
          justificada?: boolean | null
          motivo?: string | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_colaborador: {
        Row: {
          concluido: boolean
          concluido_em: string | null
          created_at: string
          data_inicio: string
          id: string
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concluido?: boolean
          concluido_em?: string | null
          created_at?: string
          data_inicio?: string
          id?: string
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concluido?: boolean
          concluido_em?: string | null
          created_at?: string
          data_inicio?: string
          id?: string
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_colaborador_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progresso: {
        Row: {
          concluida: boolean
          concluida_em: string | null
          created_at: string
          id: string
          observacao: string | null
          onboarding_id: string
          tarefa_id: string
          updated_at: string
        }
        Insert: {
          concluida?: boolean
          concluida_em?: string | null
          created_at?: string
          id?: string
          observacao?: string | null
          onboarding_id: string
          tarefa_id: string
          updated_at?: string
        }
        Update: {
          concluida?: boolean
          concluida_em?: string | null
          created_at?: string
          id?: string
          observacao?: string | null
          onboarding_id?: string
          tarefa_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progresso_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "onboarding_colaborador"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_progresso_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "vw_onboarding_progresso"
            referencedColumns: ["onboarding_id"]
          },
          {
            foreignKeyName: "onboarding_progresso_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "onboarding_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tarefas: {
        Row: {
          area: string
          created_at: string
          descricao: string | null
          dias_apos_admissao: number
          id: string
          link: string | null
          obrigatoria: boolean
          ordem: number
          template_id: string
          titulo: string
        }
        Insert: {
          area: string
          created_at?: string
          descricao?: string | null
          dias_apos_admissao?: number
          id?: string
          link?: string | null
          obrigatoria?: boolean
          ordem?: number
          template_id: string
          titulo: string
        }
        Update: {
          area?: string
          created_at?: string
          descricao?: string | null
          dias_apos_admissao?: number
          id?: string
          link?: string | null
          obrigatoria?: boolean
          ordem?: number
          template_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tarefas_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_templates: {
        Row: {
          area: string | null
          ativo: boolean
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      parcelas_emprestimo: {
        Row: {
          created_at: string
          emprestimo_id: string
          id: string
          numero: number
          paga_em: string | null
          status: string
          valor: number
          vencimento: string
        }
        Insert: {
          created_at?: string
          emprestimo_id: string
          id?: string
          numero: number
          paga_em?: string | null
          status?: string
          valor: number
          vencimento: string
        }
        Update: {
          created_at?: string
          emprestimo_id?: string
          id?: string
          numero?: number
          paga_em?: string | null
          status?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_emprestimo_emprestimo_id_fkey"
            columns: ["emprestimo_id"]
            isOneToOne: false
            referencedRelation: "emprestimos"
            referencedColumns: ["id"]
          },
        ]
      }
      patrimonio_ativos: {
        Row: {
          codigo: string
          created_at: string
          data_aquisicao: string | null
          descricao: string
          estado_conservacao: string
          foto_url: string | null
          id: string
          marca: string | null
          modelo: string | null
          numero_serie: string | null
          observacoes: string | null
          patrimonio_num: string | null
          status: string
          tipo: string
          updated_at: string
          valor_aquisicao: number | null
        }
        Insert: {
          codigo: string
          created_at?: string
          data_aquisicao?: string | null
          descricao: string
          estado_conservacao?: string
          foto_url?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          patrimonio_num?: string | null
          status?: string
          tipo: string
          updated_at?: string
          valor_aquisicao?: number | null
        }
        Update: {
          codigo?: string
          created_at?: string
          data_aquisicao?: string | null
          descricao?: string
          estado_conservacao?: string
          foto_url?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          patrimonio_num?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor_aquisicao?: number | null
        }
        Relationships: []
      }
      patrimonio_movimentacoes: {
        Row: {
          assinatura_em: string | null
          assinatura_hash: string | null
          assinatura_ip: string | null
          assinatura_user_agent: string | null
          ativo_id: string
          created_at: string
          data_movimentacao: string
          estado_no_ato: string
          id: string
          observacoes: string | null
          registrado_por: string | null
          tipo_movimentacao: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assinatura_em?: string | null
          assinatura_hash?: string | null
          assinatura_ip?: string | null
          assinatura_user_agent?: string | null
          ativo_id: string
          created_at?: string
          data_movimentacao?: string
          estado_no_ato: string
          id?: string
          observacoes?: string | null
          registrado_por?: string | null
          tipo_movimentacao: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assinatura_em?: string | null
          assinatura_hash?: string | null
          assinatura_ip?: string | null
          assinatura_user_agent?: string | null
          ativo_id?: string
          created_at?: string
          data_movimentacao?: string
          estado_no_ato?: string
          id?: string
          observacoes?: string | null
          registrado_por?: string | null
          tipo_movimentacao?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patrimonio_movimentacoes_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "patrimonio_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrimonio_movimentacoes_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "vw_patrimonio_em_uso"
            referencedColumns: ["ativo_id"]
          },
        ]
      }
      plano_saude_gastos: {
        Row: {
          beneficio_id: string | null
          created_at: string | null
          data_evento: string
          descricao: string
          id: string
          mes_referencia: string
          updated_at: string | null
          user_id: string
          valor_coparticipacao: number
          valor_total: number
        }
        Insert: {
          beneficio_id?: string | null
          created_at?: string | null
          data_evento: string
          descricao: string
          id?: string
          mes_referencia: string
          updated_at?: string | null
          user_id: string
          valor_coparticipacao: number
          valor_total: number
        }
        Update: {
          beneficio_id?: string | null
          created_at?: string | null
          data_evento?: string
          descricao?: string
          id?: string
          mes_referencia?: string
          updated_at?: string | null
          user_id?: string
          valor_coparticipacao?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "plano_saude_gastos_beneficio_id_fkey"
            columns: ["beneficio_id"]
            isOneToOne: false
            referencedRelation: "beneficios"
            referencedColumns: ["id"]
          },
        ]
      }
      politicas: {
        Row: {
          ativa: boolean
          categoria: Database["public"]["Enums"]["politica_categoria"]
          created_at: string
          descricao: string | null
          id: string
          obrigatoria: boolean
          titulo: string
          updated_at: string
          versao_vigente_id: string | null
        }
        Insert: {
          ativa?: boolean
          categoria?: Database["public"]["Enums"]["politica_categoria"]
          created_at?: string
          descricao?: string | null
          id?: string
          obrigatoria?: boolean
          titulo: string
          updated_at?: string
          versao_vigente_id?: string | null
        }
        Update: {
          ativa?: boolean
          categoria?: Database["public"]["Enums"]["politica_categoria"]
          created_at?: string
          descricao?: string | null
          id?: string
          obrigatoria?: boolean
          titulo?: string
          updated_at?: string
          versao_vigente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_versao_vigente"
            columns: ["versao_vigente_id"]
            isOneToOne: false
            referencedRelation: "politicas_versoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_versao_vigente"
            columns: ["versao_vigente_id"]
            isOneToOne: false
            referencedRelation: "vw_politicas_pendentes"
            referencedColumns: ["versao_vigente_id"]
          },
        ]
      }
      politicas_aceites: {
        Row: {
          aceito_em: string
          hash_integridade: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
          versao_id: string
        }
        Insert: {
          aceito_em?: string
          hash_integridade: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
          versao_id: string
        }
        Update: {
          aceito_em?: string
          hash_integridade?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
          versao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "politicas_aceites_versao_id_fkey"
            columns: ["versao_id"]
            isOneToOne: false
            referencedRelation: "politicas_versoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politicas_aceites_versao_id_fkey"
            columns: ["versao_id"]
            isOneToOne: false
            referencedRelation: "vw_politicas_pendentes"
            referencedColumns: ["versao_vigente_id"]
          },
        ]
      }
      politicas_versoes: {
        Row: {
          arquivo_url: string | null
          changelog: string | null
          conteudo: string
          created_at: string
          id: string
          politica_id: string
          publicada_em: string | null
          publicada_por: string | null
          versao: number
        }
        Insert: {
          arquivo_url?: string | null
          changelog?: string | null
          conteudo: string
          created_at?: string
          id?: string
          politica_id: string
          publicada_em?: string | null
          publicada_por?: string | null
          versao: number
        }
        Update: {
          arquivo_url?: string | null
          changelog?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          politica_id?: string
          publicada_em?: string | null
          publicada_por?: string | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "politicas_versoes_politica_id_fkey"
            columns: ["politica_id"]
            isOneToOne: false
            referencedRelation: "politicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politicas_versoes_politica_id_fkey"
            columns: ["politica_id"]
            isOneToOne: false
            referencedRelation: "vw_politicas_pendentes"
            referencedColumns: ["politica_id"]
          },
        ]
      }
      profiles: {
        Row: {
          apoio_departamento: string | null
          avatar_url: string | null
          bitrix_id: string | null
          cargo: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_nascimento: string | null
          departamento: string | null
          email: string
          gestor_id: string | null
          id: string
          matricula: string | null
          nome: string
          rh_responsavel: string | null
          salario_base: number | null
          saldo_horas: number | null
          telefone: string | null
          updated_at: string
          valor_hora_extra: number | null
        }
        Insert: {
          apoio_departamento?: string | null
          avatar_url?: string | null
          bitrix_id?: string | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          departamento?: string | null
          email: string
          gestor_id?: string | null
          id: string
          matricula?: string | null
          nome: string
          rh_responsavel?: string | null
          salario_base?: number | null
          saldo_horas?: number | null
          telefone?: string | null
          updated_at?: string
          valor_hora_extra?: number | null
        }
        Update: {
          apoio_departamento?: string | null
          avatar_url?: string | null
          bitrix_id?: string | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          departamento?: string | null
          email?: string
          gestor_id?: string | null
          id?: string
          matricula?: string | null
          nome?: string
          rh_responsavel?: string | null
          salario_base?: number | null
          saldo_horas?: number | null
          telefone?: string | null
          updated_at?: string
          valor_hora_extra?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          id: string
          key: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
        }
        Relationships: []
      }
      reembolsos: {
        Row: {
          analisado_em: string | null
          anexo_url: string | null
          aprovador_id: string | null
          categoria: Database["public"]["Enums"]["reembolso_categoria"]
          created_at: string
          data_despesa: string
          descricao: string
          id: string
          observacao_gestor: string | null
          pago_em: string | null
          status: Database["public"]["Enums"]["reembolso_status"]
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          analisado_em?: string | null
          anexo_url?: string | null
          aprovador_id?: string | null
          categoria: Database["public"]["Enums"]["reembolso_categoria"]
          created_at?: string
          data_despesa: string
          descricao: string
          id?: string
          observacao_gestor?: string | null
          pago_em?: string | null
          status?: Database["public"]["Enums"]["reembolso_status"]
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          analisado_em?: string | null
          anexo_url?: string | null
          aprovador_id?: string | null
          categoria?: Database["public"]["Enums"]["reembolso_categoria"]
          created_at?: string
          data_despesa?: string
          descricao?: string
          id?: string
          observacao_gestor?: string | null
          pago_em?: string | null
          status?: Database["public"]["Enums"]["reembolso_status"]
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      registros_ponto: {
        Row: {
          created_at: string
          data_hora: string
          endereco: string | null
          id: string
          latitude: number | null
          longitude: number | null
          observacao: string | null
          tipo: Database["public"]["Enums"]["punch_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data_hora?: string
          endereco?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacao?: string | null
          tipo: Database["public"]["Enums"]["punch_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data_hora?: string
          endereco?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacao?: string | null
          tipo?: Database["public"]["Enums"]["punch_type"]
          user_id?: string
        }
        Relationships: []
      }
      remuneracoes_variaveis: {
        Row: {
          created_at: string | null
          data_pagamento: string | null
          id: string
          mes_referencia: string
          motivo: string | null
          tipo: string
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          mes_referencia: string
          motivo?: string | null
          tipo: string
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          mes_referencia?: string
          motivo?: string | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      reservas_recursos: {
        Row: {
          cancelada_em: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          motivo_cancelamento: string | null
          participantes: number | null
          recurso_id: string
          status: Database["public"]["Enums"]["reserva_status"]
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelada_em?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          motivo_cancelamento?: string | null
          participantes?: number | null
          recurso_id: string
          status?: Database["public"]["Enums"]["reserva_status"]
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelada_em?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          motivo_cancelamento?: string | null
          participantes?: number | null
          recurso_id?: string
          status?: Database["public"]["Enums"]["reserva_status"]
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_recursos_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "salas_recursos"
            referencedColumns: ["id"]
          },
        ]
      }
      salas_recursos: {
        Row: {
          ativo: boolean
          capacidade: number | null
          created_at: string
          descricao: string | null
          id: string
          localizacao: string | null
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          capacidade?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          localizacao?: string | null
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          capacidade?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          localizacao?: string | null
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      solicitacoes: {
        Row: {
          anexo_url: string | null
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          descricao: string
          id: string
          prioridade: Database["public"]["Enums"]["prioridade_solicitacao"]
          resposta: string | null
          status: Database["public"]["Enums"]["status_solicitacao"]
          tipo: Database["public"]["Enums"]["tipo_solicitacao"]
          updated_at: string
          user_id: string
          valor: number | null
        }
        Insert: {
          anexo_url?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          descricao: string
          id?: string
          prioridade?: Database["public"]["Enums"]["prioridade_solicitacao"]
          resposta?: string | null
          status?: Database["public"]["Enums"]["status_solicitacao"]
          tipo: Database["public"]["Enums"]["tipo_solicitacao"]
          updated_at?: string
          user_id: string
          valor?: number | null
        }
        Update: {
          anexo_url?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          descricao?: string
          id?: string
          prioridade?: Database["public"]["Enums"]["prioridade_solicitacao"]
          resposta?: string | null
          status?: Database["public"]["Enums"]["status_solicitacao"]
          tipo?: Database["public"]["Enums"]["tipo_solicitacao"]
          updated_at?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: []
      }
      solicitacoes_ferias: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          dias: number
          id: string
          observacao: string | null
          status: Database["public"]["Enums"]["status_ferias"]
          tipo: Database["public"]["Enums"]["tipo_ferias"]
          updated_at: string
          user_id: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          dias: number
          id?: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_ferias"]
          tipo?: Database["public"]["Enums"]["tipo_ferias"]
          updated_at?: string
          user_id: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          dias?: number
          id?: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_ferias"]
          tipo?: Database["public"]["Enums"]["tipo_ferias"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      solicitacoes_historico: {
        Row: {
          alterado_por: string | null
          created_at: string
          id: string
          observacao: string | null
          solicitacao_id: string | null
          status_anterior: string | null
          status_novo: string | null
        }
        Insert: {
          alterado_por?: string | null
          created_at?: string
          id?: string
          observacao?: string | null
          solicitacao_id?: string | null
          status_anterior?: string | null
          status_novo?: string | null
        }
        Update: {
          alterado_por?: string | null
          created_at?: string
          id?: string
          observacao?: string | null
          solicitacao_id?: string | null
          status_anterior?: string | null
          status_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_historico_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamentos: {
        Row: {
          ativo: boolean
          carga_horaria_minutos: number
          cargos_obrigatorios: string[]
          categoria: string
          codigo: string
          created_at: string
          criado_por: string | null
          descricao: string | null
          id: string
          obrigatorio_para_todos: boolean
          titulo: string
          updated_at: string
          validade_meses: number | null
        }
        Insert: {
          ativo?: boolean
          carga_horaria_minutos?: number
          cargos_obrigatorios?: string[]
          categoria?: string
          codigo: string
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          obrigatorio_para_todos?: boolean
          titulo: string
          updated_at?: string
          validade_meses?: number | null
        }
        Update: {
          ativo?: boolean
          carga_horaria_minutos?: number
          cargos_obrigatorios?: string[]
          categoria?: string
          codigo?: string
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          obrigatorio_para_todos?: boolean
          titulo?: string
          updated_at?: string
          validade_meses?: number | null
        }
        Relationships: []
      }
      treinamentos_matriculas: {
        Row: {
          certificado_url: string | null
          created_at: string
          data_conclusao: string | null
          data_inicio: string | null
          data_matricula: string
          data_vencimento: string | null
          id: string
          instrutor: string | null
          matriculado_por: string | null
          nota: number | null
          notificado_vencimento: boolean
          observacoes: string | null
          status: string
          treinamento_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certificado_url?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          data_matricula?: string
          data_vencimento?: string | null
          id?: string
          instrutor?: string | null
          matriculado_por?: string | null
          nota?: number | null
          notificado_vencimento?: boolean
          observacoes?: string | null
          status?: string
          treinamento_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certificado_url?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          data_matricula?: string
          data_vencimento?: string | null
          id?: string
          instrutor?: string | null
          matriculado_por?: string | null
          nota?: number | null
          notificado_vencimento?: boolean
          observacoes?: string | null
          status?: string
          treinamento_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinamentos_matriculas_treinamento_id_fkey"
            columns: ["treinamento_id"]
            isOneToOne: false
            referencedRelation: "treinamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      trilhas_desenvolvimento: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          descricao: string | null
          duracao_estimada_min: number | null
          id: string
          imagem_url: string | null
          nivel: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          duracao_estimada_min?: number | null
          id?: string
          imagem_url?: string | null
          nivel?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          duracao_estimada_min?: number | null
          id?: string
          imagem_url?: string | null
          nivel?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      trilhas_etapas: {
        Row: {
          conteudo_url: string | null
          created_at: string
          descricao: string | null
          duracao_min: number | null
          id: string
          obrigatoria: boolean
          ordem: number
          tipo: string
          titulo: string
          trilha_id: string
          updated_at: string
        }
        Insert: {
          conteudo_url?: string | null
          created_at?: string
          descricao?: string | null
          duracao_min?: number | null
          id?: string
          obrigatoria?: boolean
          ordem?: number
          tipo?: string
          titulo: string
          trilha_id: string
          updated_at?: string
        }
        Update: {
          conteudo_url?: string | null
          created_at?: string
          descricao?: string | null
          duracao_min?: number | null
          id?: string
          obrigatoria?: boolean
          ordem?: number
          tipo?: string
          titulo?: string
          trilha_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trilhas_etapas_trilha_id_fkey"
            columns: ["trilha_id"]
            isOneToOne: false
            referencedRelation: "trilhas_desenvolvimento"
            referencedColumns: ["id"]
          },
        ]
      }
      trilhas_etapas_concluidas: {
        Row: {
          concluida_em: string
          etapa_id: string
          id: string
          trilha_id: string
          user_id: string
        }
        Insert: {
          concluida_em?: string
          etapa_id: string
          id?: string
          trilha_id: string
          user_id: string
        }
        Update: {
          concluida_em?: string
          etapa_id?: string
          id?: string
          trilha_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trilhas_etapas_concluidas_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "trilhas_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trilhas_etapas_concluidas_trilha_id_fkey"
            columns: ["trilha_id"]
            isOneToOne: false
            referencedRelation: "trilhas_desenvolvimento"
            referencedColumns: ["id"]
          },
        ]
      }
      user_2fa: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          enabled: boolean
          id: string
          secret: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          enabled?: boolean
          id?: string
          secret: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          enabled?: boolean
          id?: string
          secret?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vale_transportes: {
        Row: {
          cartao_numero: string | null
          created_at: string | null
          data_recarga: string
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
          valor_recarga: number
        }
        Insert: {
          cartao_numero?: string | null
          created_at?: string | null
          data_recarga: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          valor_recarga: number
        }
        Update: {
          cartao_numero?: string | null
          created_at?: string | null
          data_recarga?: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          valor_recarga?: number
        }
        Relationships: []
      }
      viagens: {
        Row: {
          adiantamento_liberado: number
          adiantamento_solicitado: number
          aprovado_em: string | null
          aprovador_id: string | null
          codigo: string
          created_at: string
          data_ida: string
          data_volta: string
          destino: string
          id: string
          meio_transporte: string
          motivo: string
          motivo_reprovacao: string | null
          observacoes: string | null
          origem: string
          saldo: number
          status: string
          total_despesas: number
          updated_at: string
          user_id: string
          valor_estimado: number
        }
        Insert: {
          adiantamento_liberado?: number
          adiantamento_solicitado?: number
          aprovado_em?: string | null
          aprovador_id?: string | null
          codigo?: string
          created_at?: string
          data_ida: string
          data_volta: string
          destino: string
          id?: string
          meio_transporte: string
          motivo: string
          motivo_reprovacao?: string | null
          observacoes?: string | null
          origem: string
          saldo?: number
          status?: string
          total_despesas?: number
          updated_at?: string
          user_id: string
          valor_estimado?: number
        }
        Update: {
          adiantamento_liberado?: number
          adiantamento_solicitado?: number
          aprovado_em?: string | null
          aprovador_id?: string | null
          codigo?: string
          created_at?: string
          data_ida?: string
          data_volta?: string
          destino?: string
          id?: string
          meio_transporte?: string
          motivo?: string
          motivo_reprovacao?: string | null
          observacoes?: string | null
          origem?: string
          saldo?: number
          status?: string
          total_despesas?: number
          updated_at?: string
          user_id?: string
          valor_estimado?: number
        }
        Relationships: []
      }
      viagens_despesas: {
        Row: {
          categoria: string
          comprovante_url: string | null
          created_at: string
          data_despesa: string
          descricao: string
          id: string
          observacoes: string | null
          reembolsavel: boolean
          updated_at: string
          user_id: string
          valor: number
          viagem_id: string
        }
        Insert: {
          categoria: string
          comprovante_url?: string | null
          created_at?: string
          data_despesa: string
          descricao: string
          id?: string
          observacoes?: string | null
          reembolsavel?: boolean
          updated_at?: string
          user_id: string
          valor: number
          viagem_id: string
        }
        Update: {
          categoria?: string
          comprovante_url?: string | null
          created_at?: string
          data_despesa?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          reembolsavel?: boolean
          updated_at?: string
          user_id?: string
          valor?: number
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viagens_despesas_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viagens_despesas_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "vw_viagens_resumo"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          purpose: string
          user_id: string | null
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at?: string
          id?: string
          purpose: string
          user_id?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          purpose?: string
          user_id?: string | null
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      bi_absenteismo_mensal: {
        Row: {
          departamento: string | null
          dias_afastados: number | null
          mes: string | null
          taxa_absenteismo_pct: number | null
          total_atestados: number | null
        }
        Relationships: []
      }
      bi_compliance: {
        Row: {
          departamento: string | null
          epis_pct: number | null
          politicas_pct: number | null
          score_geral: number | null
          treinamentos_pct: number | null
        }
        Relationships: []
      }
      bi_custo_pessoal_mensal: {
        Row: {
          departamento: string | null
          mes: string | null
          reembolsos: number | null
          salarios: number | null
          total: number | null
          vales: number | null
          viagens: number | null
        }
        Relationships: []
      }
      bi_engajamento_mensal: {
        Row: {
          clima_respostas: number | null
          departamento: string | null
          kudos: number | null
          mes: string | null
          score_engajamento: number | null
          treinamentos_concluidos: number | null
        }
        Relationships: []
      }
      bi_headcount_mensal: {
        Row: {
          ativos: number | null
          departamento: string | null
          mes: string | null
        }
        Relationships: []
      }
      bi_turnover_trimestral: {
        Row: {
          admissoes: number | null
          departamento: string | null
          desligamentos: number | null
          trimestre: string | null
          turnover_pct: number | null
        }
        Relationships: []
      }
      clima_resultados_agg: {
        Row: {
          detratores: number | null
          enps_score: number | null
          enquete_id: string | null
          media_score: number | null
          neutros: number | null
          promotores: number | null
          tipo: Database["public"]["Enums"]["clima_tipo"] | null
          titulo: string | null
          total_respostas: number | null
        }
        Relationships: []
      }
      feedback_resultados_agg: {
        Row: {
          avaliado_id: string | null
          ciclo_id: string | null
          competencia: string | null
          media: number | null
          relacao: Database["public"]["Enums"]["feedback_relacao"] | null
          respondentes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_respostas_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "feedback_ciclos"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_chamados_metrics: {
        Row: {
          categoria: Database["public"]["Enums"]["chamado_categoria"] | null
          dentro_sla: number | null
          fora_sla: number | null
          horas_medias_resolucao: number | null
          status: Database["public"]["Enums"]["chamado_status"] | null
          total: number | null
        }
        Relationships: []
      }
      vw_documentos_assinatura: {
        Row: {
          arquivo_hash: string | null
          arquivo_url: string | null
          categoria: string | null
          codigo: string | null
          created_at: string | null
          criado_por: string | null
          data_limite: string | null
          descricao: string | null
          id: string | null
          observacoes: string | null
          status: string | null
          titulo: string | null
          total_assinados: number | null
          total_pendentes: number | null
          total_signatarios: number | null
          updated_at: string | null
        }
        Insert: {
          arquivo_hash?: string | null
          arquivo_url?: string | null
          categoria?: string | null
          codigo?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_limite?: string | null
          descricao?: string | null
          id?: string | null
          observacoes?: string | null
          status?: string | null
          titulo?: string | null
          total_assinados?: never
          total_pendentes?: never
          total_signatarios?: never
          updated_at?: string | null
        }
        Update: {
          arquivo_hash?: string | null
          arquivo_url?: string | null
          categoria?: string | null
          codigo?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_limite?: string | null
          descricao?: string | null
          id?: string | null
          observacoes?: string | null
          status?: string | null
          titulo?: string | null
          total_assinados?: never
          total_pendentes?: never
          total_signatarios?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      vw_epis_ativos: {
        Row: {
          assinatura_em: string | null
          categoria: string | null
          codigo: string | null
          data_entrega: string | null
          dias_ate_troca: number | null
          entrega_id: string | null
          epi_id: string | null
          foto_url: string | null
          motivo: string | null
          nome: string | null
          numero_ca_entrega: string | null
          previsao_troca: string | null
          quantidade: number | null
          situacao: string | null
          status: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epis_entregas_epi_id_fkey"
            columns: ["epi_id"]
            isOneToOne: false
            referencedRelation: "epis_catalogo"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_exit_interviews_stats: {
        Row: {
          enps_score: number | null
          media_ambiente: number | null
          media_crescimento: number | null
          media_ferramentas: number | null
          media_lideranca: number | null
          media_recomendaria: number | null
          media_remuneracao: number | null
          total_respostas: number | null
        }
        Relationships: []
      }
      vw_onboarding_progresso: {
        Row: {
          concluidas: number | null
          concluido: boolean | null
          concluido_em: string | null
          data_inicio: string | null
          onboarding_id: string | null
          percentual: number | null
          template_id: string | null
          total_tarefas: number | null
          user_id: string | null
        }
        Insert: {
          concluidas?: never
          concluido?: boolean | null
          concluido_em?: string | null
          data_inicio?: string | null
          onboarding_id?: string | null
          percentual?: never
          template_id?: string | null
          total_tarefas?: never
          user_id?: string | null
        }
        Update: {
          concluidas?: never
          concluido?: boolean | null
          concluido_em?: string | null
          data_inicio?: string | null
          onboarding_id?: string | null
          percentual?: never
          template_id?: string | null
          total_tarefas?: never
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_colaborador_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_patrimonio_em_uso: {
        Row: {
          assinatura_em: string | null
          ativo_id: string | null
          codigo: string | null
          descricao: string | null
          entregue_em: string | null
          estado_conservacao: string | null
          estado_na_entrega: string | null
          foto_url: string | null
          marca: string | null
          modelo: string | null
          movimentacao_id: string | null
          numero_serie: string | null
          patrimonio_num: string | null
          status: string | null
          tipo: string | null
          user_id: string | null
        }
        Relationships: []
      }
      vw_politicas_pendentes: {
        Row: {
          categoria: Database["public"]["Enums"]["politica_categoria"] | null
          obrigatoria: boolean | null
          politica_id: string | null
          publicada_em: string | null
          titulo: string | null
          versao_numero: number | null
          versao_vigente_id: string | null
        }
        Relationships: []
      }
      vw_treinamentos_status: {
        Row: {
          carga_horaria_minutos: number | null
          categoria: string | null
          certificado_url: string | null
          codigo: string | null
          data_conclusao: string | null
          data_inicio: string | null
          data_matricula: string | null
          data_vencimento: string | null
          dias_ate_vencimento: number | null
          matricula_id: string | null
          nota: number | null
          obrigatorio_para_todos: boolean | null
          situacao: string | null
          status: string | null
          titulo: string | null
          treinamento_id: string | null
          user_id: string | null
          validade_meses: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treinamentos_matriculas_treinamento_id_fkey"
            columns: ["treinamento_id"]
            isOneToOne: false
            referencedRelation: "treinamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_viagens_resumo: {
        Row: {
          adiantamento_liberado: number | null
          adiantamento_solicitado: number | null
          aprovado_em: string | null
          aprovador_id: string | null
          codigo: string | null
          created_at: string | null
          data_ida: string | null
          data_volta: string | null
          destino: string | null
          duracao_dias: number | null
          id: string | null
          meio_transporte: string | null
          motivo: string | null
          motivo_reprovacao: string | null
          observacoes: string | null
          origem: string | null
          saldo: number | null
          situacao_financeira: string | null
          status: string | null
          total_despesas: number | null
          total_lancamentos: number | null
          updated_at: string | null
          user_id: string | null
          valor_estimado: number | null
        }
        Insert: {
          adiantamento_liberado?: number | null
          adiantamento_solicitado?: number | null
          aprovado_em?: string | null
          aprovador_id?: string | null
          codigo?: string | null
          created_at?: string | null
          data_ida?: string | null
          data_volta?: string | null
          destino?: string | null
          duracao_dias?: never
          id?: string | null
          meio_transporte?: string | null
          motivo?: string | null
          motivo_reprovacao?: string | null
          observacoes?: string | null
          origem?: string | null
          saldo?: number | null
          situacao_financeira?: never
          status?: string | null
          total_despesas?: number | null
          total_lancamentos?: never
          updated_at?: string | null
          user_id?: string | null
          valor_estimado?: number | null
        }
        Update: {
          adiantamento_liberado?: number | null
          adiantamento_solicitado?: number | null
          aprovado_em?: string | null
          aprovador_id?: string | null
          codigo?: string | null
          created_at?: string | null
          data_ida?: string | null
          data_volta?: string | null
          destino?: string | null
          duracao_dias?: never
          id?: string | null
          meio_transporte?: string | null
          motivo?: string | null
          motivo_reprovacao?: string | null
          observacoes?: string | null
          origem?: string | null
          saldo?: number | null
          situacao_financeira?: never
          status?: string | null
          total_despesas?: number | null
          total_lancamentos?: never
          updated_at?: string | null
          user_id?: string | null
          valor_estimado?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_2fa_enabled: { Args: { p_user_id: string }; Returns: boolean }
      check_account_locked: {
        Args: { p_email: string }
        Returns: {
          failed_attempts: number
          is_locked: boolean
          locked_until: string
        }[]
      }
      cleanup_old_login_attempts: { Args: never; Returns: number }
      cleanup_webauthn_challenges: { Args: never; Returns: number }
      fn_bi_absenteismo: {
        Args: { p_meses?: number }
        Returns: {
          departamento: string | null
          dias_afastados: number | null
          mes: string | null
          taxa_absenteismo_pct: number | null
          total_atestados: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "bi_absenteismo_mensal"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      fn_bi_compliance: {
        Args: never
        Returns: {
          departamento: string | null
          epis_pct: number | null
          politicas_pct: number | null
          score_geral: number | null
          treinamentos_pct: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "bi_compliance"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      fn_bi_criar_snapshot: { Args: { p_mes?: string }; Returns: string }
      fn_bi_custo: {
        Args: { p_meses?: number }
        Returns: {
          departamento: string | null
          mes: string | null
          reembolsos: number | null
          salarios: number | null
          total: number | null
          vales: number | null
          viagens: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "bi_custo_pessoal_mensal"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      fn_bi_engajamento: {
        Args: { p_meses?: number }
        Returns: {
          clima_respostas: number | null
          departamento: string | null
          kudos: number | null
          mes: string | null
          score_engajamento: number | null
          treinamentos_concluidos: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "bi_engajamento_mensal"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      fn_bi_headcount: {
        Args: { p_meses?: number }
        Returns: {
          ativos: number | null
          departamento: string | null
          mes: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "bi_headcount_mensal"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      fn_bi_pode_ver: { Args: never; Returns: boolean }
      fn_bi_refresh_all: {
        Args: never
        Returns: {
          refreshed_at: string
          view_name: string
        }[]
      }
      fn_bi_turnover: {
        Args: never
        Returns: {
          admissoes: number | null
          departamento: string | null
          desligamentos: number | null
          trimestre: string | null
          turnover_pct: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "bi_turnover_trimestral"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      fn_calcular_saldo_ferias: {
        Args: { p_user_id: string }
        Returns: {
          dias_direito: number
          dias_disponiveis: number
          dias_pendentes: number
          dias_usados: number
          periodo_aquisitivo_fim: string
          periodo_aquisitivo_inicio: string
          proximo_vencimento: string
        }[]
      }
      fn_calendario_mes: {
        Args: { p_ano: number; p_mes: number }
        Returns: {
          data: string
          detalhe: string
          tipo: string
          titulo: string
        }[]
      }
      fn_clima_resultados: {
        Args: { p_enquete_id: string }
        Returns: {
          detratores: number
          enps_score: number
          enquete_id: string
          media_score: number
          neutros: number
          promotores: number
          tipo: Database["public"]["Enums"]["clima_tipo"]
          titulo: string
          total_respostas: number
        }[]
      }
      fn_haversine_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      fn_integracao_enfileirar: {
        Args: {
          p_evento_tipo: string
          p_idempotency_key?: string
          p_integracao_id: string
          p_payload: Json
        }
        Returns: string
      }
      fn_integracao_estatisticas: {
        Args: { p_horas?: number }
        Returns: {
          enviados: number
          falhou: number
          integracao_id: string
          latencia_media_ms: number
          latencia_p95_ms: number
          nome: string
          pendentes: number
          taxa_sucesso_pct: number
          total_eventos: number
        }[]
      }
      fn_meus_resultados_360: {
        Args: { p_ciclo_id: string }
        Returns: {
          competencia: string
          media: number
          relacao: Database["public"]["Enums"]["feedback_relacao"]
          respondentes: number
        }[]
      }
      fn_motivo_bloqueio: {
        Args: {
          _canal: string
          _categoria: Database["public"]["Enums"]["notif_categoria"]
          _nivel?: Database["public"]["Enums"]["notif_nivel"]
          _user_id: string
        }
        Returns: string
      }
      fn_notif_prefs_reset: { Args: { _user_id: string }; Returns: number }
      fn_notif_stats_24h: { Args: { _user_id?: string }; Returns: Json }
      fn_notificar: {
        Args: {
          _categoria: Database["public"]["Enums"]["notif_categoria"]
          _link?: string
          _mensagem: string
          _nivel?: Database["public"]["Enums"]["notif_nivel"]
          _tipo: Database["public"]["Enums"]["tipo_notificacao"]
          _titulo: string
          _user_id: string
        }
        Returns: string
      }
      fn_pode_notificar: {
        Args: {
          _canal: string
          _categoria: Database["public"]["Enums"]["notif_categoria"]
          _nivel?: Database["public"]["Enums"]["notif_nivel"]
          _user_id: string
        }
        Returns: boolean
      }
      fn_processar_digest: {
        Args: {
          _categoria?: Database["public"]["Enums"]["notif_categoria"]
          _user_id: string
        }
        Returns: number
      }
      fn_processar_digests_devidos: {
        Args: { _freq?: Database["public"]["Enums"]["notif_digest_freq"] }
        Returns: number
      }
      fn_rate_limit_check: {
        Args: { _categoria: string; _user_id: string }
        Returns: boolean
      }
      fn_registrar_tentativa_entrega: {
        Args: {
          _entrega_id: string
          _erro?: string
          _integracao_id?: string
          _sucesso: boolean
        }
        Returns: string
      }
      fn_validar_ponto_no_raio: {
        Args: { p_latitude: number; p_longitude: number }
        Returns: {
          distancia_metros: number
          local_nome: string
          permitido: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      record_login_attempt: {
        Args: { p_email: string; p_ip_address?: string; p_success: boolean }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "user"
      atestado_status: "pendente" | "validado" | "recusado" | "cancelado"
      atestado_tipo:
        | "medico"
        | "odontologico"
        | "acompanhamento"
        | "maternidade"
        | "paternidade"
        | "luto"
        | "casamento"
        | "outros"
      chamado_categoria: "rh" | "ti" | "facilities" | "financeiro" | "outros"
      chamado_prioridade: "baixa" | "media" | "alta" | "urgente"
      chamado_status:
        | "aberto"
        | "em_andamento"
        | "aguardando_solicitante"
        | "resolvido"
        | "fechado"
      clima_tipo: "enps" | "pulse" | "custom"
      evento_tipo: "treinamento" | "reuniao" | "confraternizacao" | "outro"
      exit_motivo:
        | "nova_oportunidade"
        | "remuneracao"
        | "lideranca"
        | "ambiente"
        | "crescimento"
        | "pessoal"
        | "mudanca"
        | "saude"
        | "aposentadoria"
        | "outros"
      exit_status: "rascunho" | "enviada" | "arquivada"
      feedback_ciclo_status: "rascunho" | "ativo" | "encerrado" | "cancelado"
      feedback_relacao: "auto" | "gestor" | "par" | "subordinado"
      feriado_tipo: "nacional" | "estadual" | "municipal" | "facultativo"
      ideia_impacto: "baixo" | "medio" | "alto"
      ideia_status:
        | "nova"
        | "em_analise"
        | "aprovada"
        | "implementada"
        | "recusada"
      kudos_categoria:
        | "colaboracao"
        | "inovacao"
        | "excelencia"
        | "lideranca"
        | "proatividade"
        | "gratidao"
      notif_categoria:
        | "ponto"
        | "ferias"
        | "holerite"
        | "solicitacao"
        | "vale"
        | "emprestimo"
        | "treinamento"
        | "feedback"
        | "kudos"
        | "comunicado"
        | "chamado"
        | "politica"
        | "aniversario"
        | "sistema"
        | "seguranca"
      notif_digest_freq: "imediato" | "horario" | "diario" | "semanal"
      notif_nivel: "info" | "aviso" | "critico"
      politica_categoria:
        | "codigo_conduta"
        | "lgpd"
        | "seguranca"
        | "beneficios"
        | "home_office"
        | "compliance"
        | "outros"
      prioridade_solicitacao: "baixa" | "normal" | "alta"
      punch_type: "entrada" | "saida_almoco" | "retorno_almoco" | "saida"
      reembolso_categoria:
        | "viagem"
        | "alimentacao"
        | "transporte"
        | "hospedagem"
        | "material"
        | "outros"
      reembolso_status:
        | "pendente"
        | "em_analise"
        | "aprovado"
        | "pago"
        | "recusado"
        | "cancelado"
      reserva_status: "confirmada" | "cancelada" | "concluida"
      status_ferias: "pendente" | "aprovada" | "recusada" | "cancelada"
      status_justificativa: "pendente" | "aprovada" | "recusada"
      status_solicitacao:
        | "pendente"
        | "em_analise"
        | "aprovada"
        | "recusada"
        | "cancelada"
      tipo_ferias: "regular" | "abono_pecuniario" | "fracionada"
      tipo_justificativa:
        | "esquecimento"
        | "atestado_medico"
        | "problema_tecnico"
        | "transporte"
        | "folga_compensada"
        | "outros"
      tipo_notificacao: "info" | "sucesso" | "alerta" | "erro"
      tipo_solicitacao:
        | "declaracao_vinculo"
        | "alteracao_dados"
        | "adiantamento_salarial"
        | "carta_recomendacao"
        | "outros"
        | "vale_refeicao"
        | "vale_transporte"
        | "vale_combustivel"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gestor", "user"],
      atestado_status: ["pendente", "validado", "recusado", "cancelado"],
      atestado_tipo: [
        "medico",
        "odontologico",
        "acompanhamento",
        "maternidade",
        "paternidade",
        "luto",
        "casamento",
        "outros",
      ],
      chamado_categoria: ["rh", "ti", "facilities", "financeiro", "outros"],
      chamado_prioridade: ["baixa", "media", "alta", "urgente"],
      chamado_status: [
        "aberto",
        "em_andamento",
        "aguardando_solicitante",
        "resolvido",
        "fechado",
      ],
      clima_tipo: ["enps", "pulse", "custom"],
      evento_tipo: ["treinamento", "reuniao", "confraternizacao", "outro"],
      exit_motivo: [
        "nova_oportunidade",
        "remuneracao",
        "lideranca",
        "ambiente",
        "crescimento",
        "pessoal",
        "mudanca",
        "saude",
        "aposentadoria",
        "outros",
      ],
      exit_status: ["rascunho", "enviada", "arquivada"],
      feedback_ciclo_status: ["rascunho", "ativo", "encerrado", "cancelado"],
      feedback_relacao: ["auto", "gestor", "par", "subordinado"],
      feriado_tipo: ["nacional", "estadual", "municipal", "facultativo"],
      ideia_impacto: ["baixo", "medio", "alto"],
      ideia_status: [
        "nova",
        "em_analise",
        "aprovada",
        "implementada",
        "recusada",
      ],
      kudos_categoria: [
        "colaboracao",
        "inovacao",
        "excelencia",
        "lideranca",
        "proatividade",
        "gratidao",
      ],
      notif_categoria: [
        "ponto",
        "ferias",
        "holerite",
        "solicitacao",
        "vale",
        "emprestimo",
        "treinamento",
        "feedback",
        "kudos",
        "comunicado",
        "chamado",
        "politica",
        "aniversario",
        "sistema",
        "seguranca",
      ],
      notif_digest_freq: ["imediato", "horario", "diario", "semanal"],
      notif_nivel: ["info", "aviso", "critico"],
      politica_categoria: [
        "codigo_conduta",
        "lgpd",
        "seguranca",
        "beneficios",
        "home_office",
        "compliance",
        "outros",
      ],
      prioridade_solicitacao: ["baixa", "normal", "alta"],
      punch_type: ["entrada", "saida_almoco", "retorno_almoco", "saida"],
      reembolso_categoria: [
        "viagem",
        "alimentacao",
        "transporte",
        "hospedagem",
        "material",
        "outros",
      ],
      reembolso_status: [
        "pendente",
        "em_analise",
        "aprovado",
        "pago",
        "recusado",
        "cancelado",
      ],
      reserva_status: ["confirmada", "cancelada", "concluida"],
      status_ferias: ["pendente", "aprovada", "recusada", "cancelada"],
      status_justificativa: ["pendente", "aprovada", "recusada"],
      status_solicitacao: [
        "pendente",
        "em_analise",
        "aprovada",
        "recusada",
        "cancelada",
      ],
      tipo_ferias: ["regular", "abono_pecuniario", "fracionada"],
      tipo_justificativa: [
        "esquecimento",
        "atestado_medico",
        "problema_tecnico",
        "transporte",
        "folga_compensada",
        "outros",
      ],
      tipo_notificacao: ["info", "sucesso", "alerta", "erro"],
      tipo_solicitacao: [
        "declaracao_vinculo",
        "alteracao_dados",
        "adiantamento_salarial",
        "carta_recomendacao",
        "outros",
        "vale_refeicao",
        "vale_transporte",
        "vale_combustivel",
      ],
    },
  },
} as const
