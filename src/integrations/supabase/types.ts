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
      bonos: {
        Row: {
          catalogo_id: string | null
          cliente_id: string
          created_at: string
          estado: string
          fecha_compra: string
          id: string
          nombre: string
          precio: number
          sesiones_restantes: number
          total_sesiones: number
        }
        Insert: {
          catalogo_id?: string | null
          cliente_id: string
          created_at?: string
          estado?: string
          fecha_compra?: string
          id?: string
          nombre?: string
          precio?: number
          sesiones_restantes?: number
          total_sesiones?: number
        }
        Update: {
          catalogo_id?: string | null
          cliente_id?: string
          created_at?: string
          estado?: string
          fecha_compra?: string
          id?: string
          nombre?: string
          precio?: number
          sesiones_restantes?: number
          total_sesiones?: number
        }
        Relationships: [
          {
            foreignKeyName: "bonos_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "bonos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      bonos_catalogo: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          precio: number
          sesiones: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
          precio: number
          sesiones: number
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          precio?: number
          sesiones?: number
        }
        Relationships: []
      }
      citas: {
        Row: {
          bono_id: string | null
          cliente_id: string | null
          cobrada: boolean
          created_at: string
          email: string | null
          estado: string
          fecha: string
          fecha_cobro: string | null
          hora: string
          id: string
          nombre: string
          observaciones: string | null
          precio_cobrado: number | null
          profesional: string
          recordatorio_enviado: boolean
          sala: number | null
          servicios: string[]
          tarjeta_regalo_id: string | null
          telefono: string
          total: number
        }
        Insert: {
          bono_id?: string | null
          cliente_id?: string | null
          cobrada?: boolean
          created_at?: string
          email?: string | null
          estado?: string
          fecha: string
          fecha_cobro?: string | null
          hora: string
          id?: string
          nombre: string
          observaciones?: string | null
          precio_cobrado?: number | null
          profesional?: string
          recordatorio_enviado?: boolean
          sala?: number | null
          servicios?: string[]
          tarjeta_regalo_id?: string | null
          telefono: string
          total?: number
        }
        Update: {
          bono_id?: string | null
          cliente_id?: string | null
          cobrada?: boolean
          created_at?: string
          email?: string | null
          estado?: string
          fecha?: string
          fecha_cobro?: string | null
          hora?: string
          id?: string
          nombre?: string
          observaciones?: string | null
          precio_cobrado?: number | null
          profesional?: string
          recordatorio_enviado?: boolean
          sala?: number | null
          servicios?: string[]
          tarjeta_regalo_id?: string | null
          telefono?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "citas_bono_id_fkey"
            columns: ["bono_id"]
            isOneToOne: false
            referencedRelation: "bonos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_fotos: {
        Row: {
          cliente_id: string
          created_at: string
          descripcion: string | null
          id: string
          storage_path: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descripcion?: string | null
          id?: string
          storage_path: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_fotos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          alias: string | null
          apellido_1: string | null
          apellido_2: string | null
          created_at: string
          email: string | null
          id: string
          nombre: string
          observaciones: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          alias?: string | null
          apellido_1?: string | null
          apellido_2?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nombre: string
          observaciones?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string | null
          apellido_1?: string | null
          apellido_2?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string
          observaciones?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      servicios: {
        Row: {
          activo: boolean
          agenda: string
          categoria: string
          created_at: string
          duracion_min: number
          id: string
          nombre: string
          precio: number
          requiere_maquina: boolean
          sala_requerida: number | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          agenda?: string
          categoria: string
          created_at?: string
          duracion_min?: number
          id?: string
          nombre: string
          precio?: number
          requiere_maquina?: boolean
          sala_requerida?: number | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          agenda?: string
          categoria?: string
          created_at?: string
          duracion_min?: number
          id?: string
          nombre?: string
          precio?: number
          requiere_maquina?: boolean
          sala_requerida?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tarjetas_regalo: {
        Row: {
          codigo: string
          comprador_cliente_id: string
          created_at: string
          estado: string
          fecha_canje: string | null
          fecha_compra: string
          id: string
          observaciones: string | null
          precio: number
          servicios_ids: string[]
          servicios_nombres: string[]
        }
        Insert: {
          codigo: string
          comprador_cliente_id: string
          created_at?: string
          estado?: string
          fecha_canje?: string | null
          fecha_compra?: string
          id?: string
          observaciones?: string | null
          precio?: number
          servicios_ids?: string[]
          servicios_nombres?: string[]
        }
        Update: {
          codigo?: string
          comprador_cliente_id?: string
          created_at?: string
          estado?: string
          fecha_canje?: string | null
          fecha_compra?: string
          id?: string
          observaciones?: string | null
          precio?: number
          servicios_ids?: string[]
          servicios_nombres?: string[]
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
