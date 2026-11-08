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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      favorites: {
        Row: {
          store_id: string
          user_id: string
        }
        Insert: {
          store_id: string
          user_id: string
        }
        Update: {
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_schedule_events: {
        Row: {
          created_at: string
          end_minute: number | null
          id: string
          memo: string
          service_date: string
          start_minute: number | null
          store_id: string
          title: string
        }
        Insert: {
          created_at?: string
          end_minute?: number | null
          id?: string
          memo?: string
          service_date: string
          start_minute?: number | null
          store_id: string
          title: string
        }
        Update: {
          created_at?: string
          end_minute?: number | null
          id?: string
          memo?: string
          service_date?: string
          start_minute?: number | null
          store_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_schedule_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department_name: string
          id: string
          position: string
          real_name: string
          role: string
          school_name: string
        }
        Insert: {
          created_at?: string
          department_name?: string
          id: string
          position?: string
          real_name: string
          role: string
          school_name?: string
        }
        Update: {
          created_at?: string
          department_name?: string
          id?: string
          position?: string
          real_name?: string
          role?: string
          school_name?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          booker_affiliation: string
          booker_id: string | null
          booker_name: string
          budget_per_person: number | null
          created_at: string
          created_by: string
          ends_at: string
          event_purpose: string
          id: string
          is_manual: boolean
          people: number
          request_id: string
          request_message: string
          service_date: string
          slot_count: number
          start_minute: number
          starts_at: string
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          booker_affiliation?: string
          booker_id?: string | null
          booker_name: string
          budget_per_person?: number | null
          created_at?: string
          created_by: string
          ends_at: string
          event_purpose?: string
          id?: string
          is_manual?: boolean
          people: number
          request_id: string
          request_message?: string
          service_date: string
          slot_count: number
          start_minute: number
          starts_at: string
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          booker_affiliation?: string
          booker_id?: string | null
          booker_name?: string
          budget_per_person?: number | null
          created_at?: string
          created_by?: string
          ends_at?: string
          event_purpose?: string
          id?: string
          is_manual?: boolean
          people?: number
          request_id?: string
          request_message?: string
          service_date?: string
          slot_count?: number
          start_minute?: number
          starts_at?: string
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_booker_id_fkey"
            columns: ["booker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          allow_shared: boolean
          approved: boolean
          capacity: number
          category: string
          closing_minute: number
          created_at: string
          description: string
          id: string
          name: string
          opening_minute: number
          owner_id: string
          region: string
        }
        Insert: {
          allow_shared?: boolean
          approved?: boolean
          capacity: number
          category: string
          closing_minute?: number
          created_at?: string
          description?: string
          id?: string
          name: string
          opening_minute?: number
          owner_id: string
          region: string
        }
        Update: {
          allow_shared?: boolean
          approved?: boolean
          capacity?: number
          category?: string
          closing_minute?: number
          created_at?: string
          description?: string
          id?: string
          name?: string
          opening_minute?: number
          owner_id?: string
          region?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_verification_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: number
          reason: string
          request_id: string
          status: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: never
          reason?: string
          request_id: string
          status: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: never
          reason?: string
          request_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_verification_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_verifications: {
        Row: {
          created_at: string
          document_path: string
          real_name: string
          rejection_reason: string
          request_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          school_name: string
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_path: string
          real_name: string
          rejection_reason?: string
          request_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_name: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_path?: string
          real_name?: string
          rejection_reason?: string
          request_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_name?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_blocks: {
        Row: {
          ends_at: string
          service_date: string
          start_minute: number
          starts_at: string
          store_id: string
        }
        Insert: {
          ends_at: string
          service_date: string
          start_minute: number
          starts_at: string
          store_id: string
        }
        Update: {
          ends_at?: string
          service_date?: string
          start_minute?: number
          starts_at?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_blocks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_admin_invitation: { Args: never; Returns: boolean }
      approve_store: {
        Args: { p_approved: boolean; p_store_id: string }
        Returns: {
          allow_shared: boolean
          approved: boolean
          capacity: number
          category: string
          closing_minute: number
          created_at: string
          description: string
          id: string
          name: string
          opening_minute: number
          owner_id: string
          region: string
        }
        SetofOptions: {
          from: "*"
          to: "stores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      begin_student_verification: {
        Args: { p_extension: string }
        Returns: {
          created_at: string
          document_path: string
          real_name: string
          rejection_reason: string
          request_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          school_name: string
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "student_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_reservation: {
        Args: { p_reservation_id: string }
        Returns: {
          booker_affiliation: string
          booker_id: string | null
          booker_name: string
          budget_per_person: number | null
          created_at: string
          created_by: string
          ends_at: string
          event_purpose: string
          id: string
          is_manual: boolean
          people: number
          request_id: string
          request_message: string
          service_date: string
          slot_count: number
          start_minute: number
          starts_at: string
          status: string
          store_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_profile: {
        Args: {
          p_department_name?: string
          p_position?: string
          p_real_name: string
          p_role: string
          p_school_name?: string
        }
        Returns: {
          created_at: string
          department_name: string
          id: string
          position: string
          real_name: string
          role: string
          school_name: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_reservation: {
        Args: { p_reservation_id: string }
        Returns: {
          booker_affiliation: string
          booker_id: string | null
          booker_name: string
          budget_per_person: number | null
          created_at: string
          created_by: string
          ends_at: string
          event_purpose: string
          id: string
          is_manual: boolean
          people: number
          request_id: string
          request_message: string
          service_date: string
          slot_count: number
          start_minute: number
          starts_at: string
          status: string
          store_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_manual_reservation: {
        Args: {
          p_booker_affiliation?: string
          p_booker_name: string
          p_event_purpose?: string
          p_people: number
          p_request_id: string
          p_service_date: string
          p_slot_count: number
          p_start_minute: number
          p_store_id: string
        }
        Returns: {
          booker_affiliation: string
          booker_id: string | null
          booker_name: string
          budget_per_person: number | null
          created_at: string
          created_by: string
          ends_at: string
          event_purpose: string
          id: string
          is_manual: boolean
          people: number
          request_id: string
          request_message: string
          service_date: string
          slot_count: number
          start_minute: number
          starts_at: string
          status: string
          store_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_is_admin: { Args: never; Returns: boolean }
      decide_reservation: {
        Args: { p_accept: boolean; p_reservation_id: string }
        Returns: {
          booker_affiliation: string
          booker_id: string | null
          booker_name: string
          budget_per_person: number | null
          created_at: string
          created_by: string
          ends_at: string
          event_purpose: string
          id: string
          is_manual: boolean
          people: number
          request_id: string
          request_message: string
          service_date: string
          slot_count: number
          start_minute: number
          starts_at: string
          status: string
          store_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      edit_reservation: {
        Args: {
          p_budget_per_person?: number
          p_event_purpose?: string
          p_people: number
          p_request_message?: string
          p_reservation_id: string
          p_service_date: string
          p_slot_count: number
          p_start_minute: number
        }
        Returns: {
          booker_affiliation: string
          booker_id: string | null
          booker_name: string
          budget_per_person: number | null
          created_at: string
          created_by: string
          ends_at: string
          event_purpose: string
          id: string
          is_manual: boolean
          people: number
          request_id: string
          request_message: string
          service_date: string
          slot_count: number
          start_minute: number
          starts_at: string
          status: string
          store_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_availability: {
        Args: { p_service_date: string; p_store_id: string }
        Returns: {
          blocked: boolean
          remaining_seats: number
          start_minute: number
        }[]
      }
      register_store: {
        Args: {
          p_capacity: number
          p_category: string
          p_name: string
          p_region: string
        }
        Returns: {
          allow_shared: boolean
          approved: boolean
          capacity: number
          category: string
          closing_minute: number
          created_at: string
          description: string
          id: string
          name: string
          opening_minute: number
          owner_id: string
          region: string
        }
        SetofOptions: {
          from: "*"
          to: "stores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      replace_time_blocks: {
        Args: {
          p_service_date: string
          p_start_minutes: number[]
          p_store_id: string
        }
        Returns: undefined
      }
      request_reservation: {
        Args: {
          p_budget_per_person?: number
          p_event_purpose?: string
          p_people: number
          p_request_id: string
          p_request_message?: string
          p_service_date: string
          p_slot_count: number
          p_start_minute: number
          p_store_id: string
        }
        Returns: {
          booker_affiliation: string
          booker_id: string | null
          booker_name: string
          budget_per_person: number | null
          created_at: string
          created_by: string
          ends_at: string
          event_purpose: string
          id: string
          is_manual: boolean
          people: number
          request_id: string
          request_message: string
          service_date: string
          slot_count: number
          start_minute: number
          starts_at: string
          status: string
          store_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_student_verification: {
        Args: {
          p_approve: boolean
          p_reason?: string
          p_request_id: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          document_path: string
          real_name: string
          rejection_reason: string
          request_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          school_name: string
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "student_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      search_stores: {
        Args: {
          p_category?: string
          p_people?: number
          p_region?: string
          p_service_date?: string
          p_slot_count?: number
          p_start_minute?: number
        }
        Returns: {
          allow_shared: boolean
          approved: boolean
          capacity: number
          category: string
          closing_minute: number
          created_at: string
          description: string
          id: string
          name: string
          opening_minute: number
          owner_id: string
          region: string
        }[]
        SetofOptions: {
          from: "*"
          to: "stores"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      submit_student_verification: {
        Args: { p_request_id: string }
        Returns: {
          created_at: string
          document_path: string
          real_name: string
          rejection_reason: string
          request_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          school_name: string
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "student_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_store_capacity: {
        Args: {
          p_allow_shared: boolean
          p_capacity: number
          p_closing_minute: number
          p_opening_minute: number
          p_store_id: string
        }
        Returns: {
          allow_shared: boolean
          approved: boolean
          capacity: number
          category: string
          closing_minute: number
          created_at: string
          description: string
          id: string
          name: string
          opening_minute: number
          owner_id: string
          region: string
        }
        SetofOptions: {
          from: "*"
          to: "stores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
