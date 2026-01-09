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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aniversario_parabens: {
        Row: {
          aniversariante_id: string
          ano: number
          created_at: string
          id: string
          mensagem: string
          mes: number
          user_id: string
        }
        Insert: {
          aniversariante_id: string
          ano: number
          created_at?: string
          id?: string
          mensagem?: string
          mes: number
          user_id: string
        }
        Update: {
          aniversariante_id?: string
          ano?: number
          created_at?: string
          id?: string
          mensagem?: string
          mes?: number
          user_id?: string
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          avaliado_id: string
          avaliador_id: string
          ciclo_id: string
          comentario_geral: string | null
          created_at: string
          data_envio: string | null
          id: string
          nota_geral: number | null
          pontos_fortes: string | null
          pontos_melhoria: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          avaliado_id: string
          avaliador_id: string
          ciclo_id: string
          comentario_geral?: string | null
          created_at?: string
          data_envio?: string | null
          id?: string
          nota_geral?: number | null
          pontos_fortes?: string | null
          pontos_melhoria?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          avaliado_id?: string
          avaliador_id?: string
          ciclo_id?: string
          comentario_geral?: string | null
          created_at?: string
          data_envio?: string | null
          id?: string
          nota_geral?: number | null
          pontos_fortes?: string | null
          pontos_melhoria?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclos_avaliacao"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_competencias: {
        Row: {
          avaliacao_id: string
          comentario: string | null
          competencia_id: string
          created_at: string
          id: string
          nota: number
        }
        Insert: {
          avaliacao_id: string
          comentario?: string | null
          competencia_id: string
          created_at?: string
          id?: string
          nota: number
        }
        Update: {
          avaliacao_id?: string
          comentario?: string | null
          competencia_id?: string
          created_at?: string
          id?: string
          nota?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_competencias_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_competencias_competencia_id_fkey"
            columns: ["competencia_id"]
            isOneToOne: false
            referencedRelation: "competencias"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficios: {
        Row: {
          ativo: boolean
          created_at: string
          data_adesao: string
          data_cancelamento: string | null
          descricao: string | null
          id: string
          nome: string
          numero_cartao: string | null
          operadora: string | null
          tipo: string
          updated_at: string
          user_id: string
          valor_desconto: number
          valor_mensal: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_adesao?: string
          data_cancelamento?: string | null
          descricao?: string | null
          id?: string
          nome: string
          numero_cartao?: string | null
          operadora?: string | null
          tipo: string
          updated_at?: string
          user_id: string
          valor_desconto?: number
          valor_mensal?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_adesao?: string
          data_cancelamento?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          numero_cartao?: string | null
          operadora?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor_desconto?: number
          valor_mensal?: number
        }
        Relationships: []
      }
      bonificacoes: {
        Row: {
          ano: number
          created_at: string
          data_pagamento: string | null
          descricao: string
          id: string
          mes: number
          referencia: string | null
          status: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          ano: number
          created_at?: string
          data_pagamento?: string | null
          descricao: string
          id?: string
          mes: number
          referencia?: string | null
          status?: string
          tipo?: string
          user_id: string
          valor: number
        }
        Update: {
          ano?: number
          created_at?: string
          data_pagamento?: string | null
          descricao?: string
          id?: string
          mes?: number
          referencia?: string | null
          status?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      ciclos_avaliacao: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      comissoes: {
        Row: {
          ano: number
          created_at: string
          data_pagamento: string | null
          descricao: string
          id: string
          mes: number
          percentual: number | null
          referencia: string | null
          status: string
          user_id: string
          valor: number
        }
        Insert: {
          ano: number
          created_at?: string
          data_pagamento?: string | null
          descricao: string
          id?: string
          mes: number
          percentual?: number | null
          referencia?: string | null
          status?: string
          user_id: string
          valor: number
        }
        Update: {
          ano?: number
          created_at?: string
          data_pagamento?: string | null
          descricao?: string
          id?: string
          mes?: number
          percentual?: number | null
          referencia?: string | null
          status?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      competencias: {
        Row: {
          ativa: boolean
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          peso: number
        }
        Insert: {
          ativa?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          peso?: number
        }
        Update: {
          ativa?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          peso?: number
        }
        Relationships: []
      }
      comunicados: {
        Row: {
          anexo_nome: string | null
          anexo_url: string | null
          ativo: boolean
          categoria: string
          conteudo: string
          created_at: string
          data_expiracao: string | null
          data_publicacao: string
          fixado: boolean
          id: string
          importante: boolean
          resumo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          anexo_nome?: string | null
          anexo_url?: string | null
          ativo?: boolean
          categoria?: string
          conteudo: string
          created_at?: string
          data_expiracao?: string | null
          data_publicacao?: string
          fixado?: boolean
          id?: string
          importante?: boolean
          resumo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          anexo_nome?: string | null
          anexo_url?: string | null
          ativo?: boolean
          categoria?: string
          conteudo?: string
          created_at?: string
          data_expiracao?: string | null
          data_publicacao?: string
          fixado?: boolean
          id?: string
          importante?: boolean
          resumo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      comunicados_lidos: {
        Row: {
          comunicado_id: string
          id: string
          lido_em: string
          user_id: string
        }
        Insert: {
          comunicado_id: string
          id?: string
          lido_em?: string
          user_id: string
        }
        Update: {
          comunicado_id?: string
          id?: string
          lido_em?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicados_lidos_comunicado_id_fkey"
            columns: ["comunicado_id"]
            isOneToOne: false
            referencedRelation: "comunicados"
            referencedColumns: ["id"]
          },
        ]
      }
      dependentes_beneficio: {
        Row: {
          ativo: boolean
          beneficio_id: string
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          id: string
          nome: string
          parentesco: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          beneficio_id: string
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          id?: string
          nome: string
          parentesco: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          beneficio_id?: string
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          id?: string
          nome?: string
          parentesco?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependentes_beneficio_beneficio_id_fkey"
            columns: ["beneficio_id"]
            isOneToOne: false
            referencedRelation: "beneficios"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          arquivo_url: string
          created_at: string
          data_documento: string | null
          data_validade: string | null
          descricao: string | null
          id: string
          mime_type: string | null
          nome: string
          tamanho_bytes: number | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          data_documento?: string | null
          data_validade?: string | null
          descricao?: string | null
          id?: string
          mime_type?: string | null
          nome: string
          tamanho_bytes?: number | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          data_documento?: string | null
          data_validade?: string | null
          descricao?: string | null
          id?: string
          mime_type?: string | null
          nome?: string
          tamanho_bytes?: number | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emprestimos: {
        Row: {
          created_at: string
          data_contratacao: string
          id: string
          motivo: string | null
          numero_contrato: string
          observacao: string | null
          parcelas_pagas: number
          quantidade_parcelas: number
          saldo_devedor: number
          status: string
          taxa_juros: number
          total_com_juros: number
          updated_at: string
          user_id: string
          valor_original: number
          valor_parcela: number
        }
        Insert: {
          created_at?: string
          data_contratacao?: string
          id?: string
          motivo?: string | null
          numero_contrato: string
          observacao?: string | null
          parcelas_pagas?: number
          quantidade_parcelas: number
          saldo_devedor: number
          status?: string
          taxa_juros?: number
          total_com_juros: number
          updated_at?: string
          user_id: string
          valor_original: number
          valor_parcela: number
        }
        Update: {
          created_at?: string
          data_contratacao?: string
          id?: string
          motivo?: string | null
          numero_contrato?: string
          observacao?: string | null
          parcelas_pagas?: number
          quantidade_parcelas?: number
          saldo_devedor?: number
          status?: string
          taxa_juros?: number
          total_com_juros?: number
          updated_at?: string
          user_id?: string
          valor_original?: number
          valor_parcela?: number
        }
        Relationships: []
      }
      eventos_corporativos: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string
          criado_por: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          link_reuniao: string | null
          local: string | null
          online: boolean | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string
          criado_por?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          link_reuniao?: string | null
          local?: string | null
          online?: boolean | null
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          link_reuniao?: string | null
          local?: string | null
          online?: boolean | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq: {
        Row: {
          ativo: boolean | null
          categoria: string
          created_at: string
          destaque: boolean | null
          id: string
          ordem: number | null
          pergunta: string
          resposta: string
          tags: string[] | null
          updated_at: string
          utilidade_negativa: number | null
          utilidade_positiva: number | null
          visualizacoes: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string
          created_at?: string
          destaque?: boolean | null
          id?: string
          ordem?: number | null
          pergunta: string
          resposta: string
          tags?: string[] | null
          updated_at?: string
          utilidade_negativa?: number | null
          utilidade_positiva?: number | null
          visualizacoes?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          created_at?: string
          destaque?: boolean | null
          id?: string
          ordem?: number | null
          pergunta?: string
          resposta?: string
          tags?: string[] | null
          updated_at?: string
          utilidade_negativa?: number | null
          utilidade_positiva?: number | null
          visualizacoes?: number | null
        }
        Relationships: []
      }
      ferias: {
        Row: {
          aprovado_por: string | null
          bitrix_task_id: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          dias_solicitados: number
          id: string
          observacao: string | null
          status: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aprovado_por?: string | null
          bitrix_task_id?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          dias_solicitados: number
          id?: string
          observacao?: string | null
          status?: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aprovado_por?: string | null
          bitrix_task_id?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          dias_solicitados?: number
          id?: string
          observacao?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      holerites: {
        Row: {
          ano: number
          created_at: string
          descontos: number
          detalhes: Json | null
          faltas: number | null
          horas_extras: number | null
          horas_trabalhadas: number | null
          id: string
          mes: number
          pdf_url: string | null
          salario_base: number | null
          salario_bruto: number
          salario_liquido: number
          total_descontos: number | null
          total_proventos: number | null
          user_id: string
        }
        Insert: {
          ano: number
          created_at?: string
          descontos?: number
          detalhes?: Json | null
          faltas?: number | null
          horas_extras?: number | null
          horas_trabalhadas?: number | null
          id?: string
          mes: number
          pdf_url?: string | null
          salario_base?: number | null
          salario_bruto: number
          salario_liquido: number
          total_descontos?: number | null
          total_proventos?: number | null
          user_id: string
        }
        Update: {
          ano?: number
          created_at?: string
          descontos?: number
          detalhes?: Json | null
          faltas?: number | null
          horas_extras?: number | null
          horas_trabalhadas?: number | null
          id?: string
          mes?: number
          pdf_url?: string | null
          salario_base?: number | null
          salario_bruto?: number
          salario_liquido?: number
          total_descontos?: number | null
          total_proventos?: number | null
          user_id?: string
        }
        Relationships: []
      }
      justificativas_ponto: {
        Row: {
          anexo_url: string | null
          aprovado_por: string | null
          created_at: string
          data: string
          id: string
          motivo: string
          registro_ponto_id: string | null
          resposta: string | null
          status: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anexo_url?: string | null
          aprovado_por?: string | null
          created_at?: string
          data: string
          id?: string
          motivo: string
          registro_ponto_id?: string | null
          resposta?: string | null
          status?: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anexo_url?: string | null
          aprovado_por?: string | null
          created_at?: string
          data?: string
          id?: string
          motivo?: string
          registro_ponto_id?: string | null
          resposta?: string | null
          status?: string
          tipo?: string
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
      key_results: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          meta_id: string
          peso: number | null
          titulo: string
          unidade: string | null
          updated_at: string
          valor_atual: number
          valor_meta: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          meta_id: string
          peso?: number | null
          titulo: string
          unidade?: string | null
          updated_at?: string
          valor_atual?: number
          valor_meta?: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          meta_id?: string
          peso?: number | null
          titulo?: string
          unidade?: string | null
          updated_at?: string
          valor_atual?: number
          valor_meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "key_results_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
      }
      locais_permitidos: {
        Row: {
          ativo: boolean
          created_at: string
          endereco: string | null
          id: string
          latitude: number
          longitude: number
          nome: string
          raio_metros: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          endereco?: string | null
          id?: string
          latitude: number
          longitude: number
          nome: string
          raio_metros?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          endereco?: string | null
          id?: string
          latitude?: number
          longitude?: number
          nome?: string
          raio_metros?: number
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
      metas: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          status: string
          tipo: string
          titulo: string
          unidade: string | null
          updated_at: string
          user_id: string
          valor_atual: number
          valor_meta: number
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          status?: string
          tipo?: string
          titulo: string
          unidade?: string | null
          updated_at?: string
          user_id: string
          valor_atual?: number
          valor_meta: number
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          status?: string
          tipo?: string
          titulo?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
          valor_atual?: number
          valor_meta?: number
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          arquivada: boolean
          created_at: string
          dados: Json | null
          id: string
          lida: boolean
          lida_em: string | null
          link: string | null
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          arquivada?: boolean
          created_at?: string
          dados?: Json | null
          id?: string
          lida?: boolean
          lida_em?: string | null
          link?: string | null
          mensagem: string
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          arquivada?: boolean
          created_at?: string
          dados?: Json | null
          id?: string
          lida?: boolean
          lida_em?: string | null
          link?: string | null
          mensagem?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      parcelas_emprestimo: {
        Row: {
          created_at: string
          data_pagamento: string | null
          emprestimo_id: string
          id: string
          numero: number
          status: string
          valor: number
          vencimento: string
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          emprestimo_id: string
          id?: string
          numero: number
          status?: string
          valor: number
          vencimento: string
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          emprestimo_id?: string
          id?: string
          numero?: number
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
      participacoes_clima: {
        Row: {
          concluida: boolean
          created_at: string
          data_conclusao: string | null
          data_inicio: string | null
          id: string
          pesquisa_id: string
          user_id: string
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          pesquisa_id: string
          user_id: string
        }
        Update: {
          concluida?: boolean
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          pesquisa_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participacoes_clima_pesquisa_id_fkey"
            columns: ["pesquisa_id"]
            isOneToOne: false
            referencedRelation: "pesquisas_clima"
            referencedColumns: ["id"]
          },
        ]
      }
      perguntas_clima: {
        Row: {
          categoria: string
          created_at: string
          id: string
          obrigatoria: boolean
          opcoes: Json | null
          ordem: number
          pesquisa_id: string
          texto: string
          tipo: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          id?: string
          obrigatoria?: boolean
          opcoes?: Json | null
          ordem?: number
          pesquisa_id: string
          texto: string
          tipo?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          obrigatoria?: boolean
          opcoes?: Json | null
          ordem?: number
          pesquisa_id?: string
          texto?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "perguntas_clima_pesquisa_id_fkey"
            columns: ["pesquisa_id"]
            isOneToOne: false
            referencedRelation: "pesquisas_clima"
            referencedColumns: ["id"]
          },
        ]
      }
      pesquisas_clima: {
        Row: {
          anonima: boolean
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          anonima?: boolean
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          anonima?: boolean
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
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
          updated_at: string
        }
        Insert: {
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
          updated_at?: string
        }
        Update: {
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
          updated_at?: string
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
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
          status: string
          tipo: string
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
          status?: string
          tipo: string
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
          status?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      respostas_clima: {
        Row: {
          created_at: string
          id: string
          pergunta_id: string
          pesquisa_id: string
          user_id: string
          valor_escala: number | null
          valor_texto: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          pergunta_id: string
          pesquisa_id: string
          user_id: string
          valor_escala?: number | null
          valor_texto?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          pergunta_id?: string
          pesquisa_id?: string
          user_id?: string
          valor_escala?: number | null
          valor_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "respostas_clima_pergunta_id_fkey"
            columns: ["pergunta_id"]
            isOneToOne: false
            referencedRelation: "perguntas_clima"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_clima_pesquisa_id_fkey"
            columns: ["pesquisa_id"]
            isOneToOne: false
            referencedRelation: "pesquisas_clima"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes: {
        Row: {
          anexos: Json | null
          created_at: string
          descricao: string | null
          id: string
          prioridade: string | null
          resposta: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anexos?: Json | null
          created_at?: string
          descricao?: string | null
          id?: string
          prioridade?: string | null
          resposta?: string | null
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anexos?: Json | null
          created_at?: string
          descricao?: string | null
          id?: string
          prioridade?: string | null
          resposta?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      treinamentos: {
        Row: {
          ativo: boolean
          carga_horaria: number
          categoria: string
          conteudo_url: string | null
          created_at: string
          descricao: string | null
          id: string
          instrutor: string | null
          obrigatorio: boolean
          thumbnail_url: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          carga_horaria?: number
          categoria?: string
          conteudo_url?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          instrutor?: string | null
          obrigatorio?: boolean
          thumbnail_url?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          carga_horaria?: number
          categoria?: string
          conteudo_url?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          instrutor?: string | null
          obrigatorio?: boolean
          thumbnail_url?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      treinamentos_colaborador: {
        Row: {
          certificado_url: string | null
          created_at: string
          data_conclusao: string | null
          data_inicio: string | null
          data_limite: string | null
          id: string
          nota: number | null
          progresso: number
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
          data_limite?: string | null
          id?: string
          nota?: number | null
          progresso?: number
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
          data_limite?: string | null
          id?: string
          nota?: number | null
          progresso?: number
          status?: string
          treinamento_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinamentos_colaborador_treinamento_id_fkey"
            columns: ["treinamento_id"]
            isOneToOne: false
            referencedRelation: "treinamentos"
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
    }
    Views: {
      [_ in never]: never
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
      criar_notificacao: {
        Args: {
          p_dados?: Json
          p_link?: string
          p_mensagem: string
          p_tipo?: string
          p_titulo: string
          p_user_id: string
        }
        Returns: string
      }
      fn_calcular_distancia: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      fn_esta_em_local_permitido: {
        Args: { p_latitude: number; p_longitude: number }
        Returns: boolean
      }
      fn_validar_localizacao: {
        Args: { p_latitude: number; p_longitude: number }
        Returns: {
          dentro_raio: boolean
          distancia_metros: number
          local_id: string
          local_nome: string
        }[]
      }
      get_organograma: {
        Args: never
        Returns: {
          avatar_url: string
          cargo: string
          departamento: string
          gestor_id: string
          id: string
          nivel: number
          nome: string
        }[]
      }
      get_subordinados: {
        Args: { p_gestor_id: string }
        Returns: {
          avatar_url: string
          cargo: string
          departamento: string
          gestor_id: string
          id: string
          nivel: number
          nome: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      incrementar_visualizacao_faq: {
        Args: { p_faq_id: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      record_login_attempt: {
        Args: { p_email: string; p_ip_address?: string; p_success: boolean }
        Returns: undefined
      }
      registrar_utilidade_faq: {
        Args: { p_faq_id: string; p_util: boolean }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "user"
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
    },
  },
} as const
