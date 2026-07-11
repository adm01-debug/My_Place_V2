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
      fn_meus_resultados_360: {
        Args: { p_ciclo_id: string }
        Returns: {
          competencia: string
          media: number
          relacao: Database["public"]["Enums"]["feedback_relacao"]
          respondentes: number
        }[]
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
      clima_tipo: "enps" | "pulse" | "custom"
      feedback_ciclo_status: "rascunho" | "ativo" | "encerrado" | "cancelado"
      feedback_relacao: "auto" | "gestor" | "par" | "subordinado"
      kudos_categoria:
        | "colaboracao"
        | "inovacao"
        | "excelencia"
        | "lideranca"
        | "proatividade"
        | "gratidao"
      prioridade_solicitacao: "baixa" | "normal" | "alta"
      punch_type: "entrada" | "saida_almoco" | "retorno_almoco" | "saida"
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
      clima_tipo: ["enps", "pulse", "custom"],
      feedback_ciclo_status: ["rascunho", "ativo", "encerrado", "cancelado"],
      feedback_relacao: ["auto", "gestor", "par", "subordinado"],
      kudos_categoria: [
        "colaboracao",
        "inovacao",
        "excelencia",
        "lideranca",
        "proatividade",
        "gratidao",
      ],
      prioridade_solicitacao: ["baixa", "normal", "alta"],
      punch_type: ["entrada", "saida_almoco", "retorno_almoco", "saida"],
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
