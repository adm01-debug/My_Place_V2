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
      configuracoes_globais: {
        Row: {
          cor_primaria: string | null
          id: string
          logo_url: string | null
          nome_empresa: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          cor_primaria?: string | null
          id?: string
          logo_url?: string | null
          nome_empresa?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          cor_primaria?: string | null
          id?: string
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
          progresso: number
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
          progresso?: number
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
          progresso?: number
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
      fn_haversine_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
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
      prioridade_solicitacao: "baixa" | "normal" | "alta"
      punch_type: "entrada" | "saida_almoco" | "retorno_almoco" | "saida"
      status_ferias: "pendente" | "aprovada" | "recusada" | "cancelada"
      status_solicitacao:
        | "pendente"
        | "em_analise"
        | "aprovada"
        | "recusada"
        | "cancelada"
      tipo_ferias: "regular" | "abono_pecuniario" | "fracionada"
      tipo_notificacao: "info" | "sucesso" | "alerta" | "erro"
      tipo_solicitacao:
        | "declaracao_vinculo"
        | "alteracao_dados"
        | "adiantamento_salarial"
        | "carta_recomendacao"
        | "outros"
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
      prioridade_solicitacao: ["baixa", "normal", "alta"],
      punch_type: ["entrada", "saida_almoco", "retorno_almoco", "saida"],
      status_ferias: ["pendente", "aprovada", "recusada", "cancelada"],
      status_solicitacao: [
        "pendente",
        "em_analise",
        "aprovada",
        "recusada",
        "cancelada",
      ],
      tipo_ferias: ["regular", "abono_pecuniario", "fracionada"],
      tipo_notificacao: ["info", "sucesso", "alerta", "erro"],
      tipo_solicitacao: [
        "declaracao_vinculo",
        "alteracao_dados",
        "adiantamento_salarial",
        "carta_recomendacao",
        "outros",
      ],
    },
  },
} as const
