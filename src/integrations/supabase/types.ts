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
      ferias: {
        Row: {
          aprovado_por: string | null
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
          id: string
          mes: number
          pdf_url: string | null
          salario_bruto: number
          salario_liquido: number
          user_id: string
        }
        Insert: {
          ano: number
          created_at?: string
          descontos?: number
          detalhes?: Json | null
          id?: string
          mes: number
          pdf_url?: string | null
          salario_bruto: number
          salario_liquido: number
          user_id: string
        }
        Update: {
          ano?: number
          created_at?: string
          descontos?: number
          detalhes?: Json | null
          id?: string
          mes?: number
          pdf_url?: string | null
          salario_bruto?: number
          salario_liquido?: number
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
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          data_admissao: string | null
          departamento: string | null
          email: string
          id: string
          matricula: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          data_admissao?: string | null
          departamento?: string | null
          email: string
          id: string
          matricula?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          data_admissao?: string | null
          departamento?: string | null
          email?: string
          id?: string
          matricula?: string | null
          nome?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
