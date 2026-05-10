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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          book_id: string | null
          created_at: string
          error_message: string | null
          function_name: string | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string | null
          output_tokens: number | null
          step_name: string | null
          success: boolean
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string
          error_message?: string | null
          function_name?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          output_tokens?: number | null
          step_name?: string | null
          success?: boolean
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          book_id?: string | null
          created_at?: string
          error_message?: string | null
          function_name?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          output_tokens?: number | null
          step_name?: string | null
          success?: boolean
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_chunks: {
        Row: {
          book_id: string
          chapter_index: number
          created_at: string
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          book_id: string
          chapter_index: number
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          book_id?: string
          chapter_index?: number
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_chunks_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_chunks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_event_log: {
        Row: {
          action: string
          actor_email_snapshot: string | null
          actor_id: string | null
          actor_id_snapshot: string
          actor_role_snapshot: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          occurred_at: string
          request_id: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email_snapshot?: string | null
          actor_id?: string | null
          actor_id_snapshot: string
          actor_role_snapshot?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          occurred_at?: string
          request_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email_snapshot?: string | null
          actor_id?: string | null
          actor_id_snapshot?: string
          actor_role_snapshot?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          occurred_at?: string
          request_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      books: {
        Row: {
          author_name: string | null
          book_data: Json
          book_type: string | null
          cover_storage_path: string | null
          cover_url: string | null
          created_at: string
          deleted_at: string | null
          genre: string | null
          health_score: number | null
          id: string
          last_step: number
          subtitle: string | null
          title: string | null
          updated_at: string
          user_id: string
          word_count: number
        }
        Insert: {
          author_name?: string | null
          book_data?: Json
          book_type?: string | null
          cover_storage_path?: string | null
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          genre?: string | null
          health_score?: number | null
          id?: string
          last_step?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          word_count?: number
        }
        Update: {
          author_name?: string | null
          book_data?: Json
          book_type?: string | null
          cover_storage_path?: string | null
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          genre?: string | null
          health_score?: number | null
          id?: string
          last_step?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          book_id: string
          chapter_index: number
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          key_points: string | null
          purpose: string | null
          title: string | null
          updated_at: string
          user_id: string
          word_count: number
        }
        Insert: {
          book_id: string
          chapter_index: number
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          key_points?: string | null
          purpose?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          word_count?: number
        }
        Update: {
          book_id?: string
          chapter_index?: number
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          key_points?: string | null
          purpose?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_requests: {
        Row: {
          cancellation_reason: string | null
          confirm_token: string
          confirm_token_expires_at: string
          confirmed_at: string | null
          executed_at: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          refund_eligible: boolean
          requested_at: string
          scheduled_deletion_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          confirm_token: string
          confirm_token_expires_at: string
          confirmed_at?: string | null
          executed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          refund_eligible?: boolean
          requested_at?: string
          scheduled_deletion_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          confirm_token?: string
          confirm_token_expires_at?: string
          confirmed_at?: string | null
          executed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          refund_eligible?: boolean
          requested_at?: string
          scheduled_deletion_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_acceptances: {
        Row: {
          accepted_at: string
          document_version_id: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          document_version_id: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          document_version_id?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_acceptances_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_acceptances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          content_url: string
          created_at: string
          document: string
          effective_at: string
          id: string
          superseded_at: string | null
          version: string
        }
        Insert: {
          content_url: string
          created_at?: string
          document: string
          effective_at: string
          id?: string
          superseded_at?: string | null
          version: string
        }
        Update: {
          content_url?: string
          created_at?: string
          document?: string
          effective_at?: string
          id?: string
          superseded_at?: string | null
          version?: string
        }
        Relationships: []
      }
      mfa_recovery_codes: {
        Row: {
          code_hash: string
          consumed_at: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_recovery_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_calls_reset_at: string | null
          ai_calls_this_month: number
          created_at: string
          email: string
          full_name: string | null
          id: string
          onboarded_at: string | null
          role: string
          stripe_customer_id: string | null
          subscription_period_end: string | null
          subscription_status: string
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          ai_calls_reset_at?: string | null
          ai_calls_this_month?: number
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          onboarded_at?: string | null
          role?: string
          stripe_customer_id?: string | null
          subscription_period_end?: string | null
          subscription_status?: string
          subscription_tier?: string
          updated_at?: string
        }
        Update: {
          ai_calls_reset_at?: string | null
          ai_calls_this_month?: number
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          onboarded_at?: string | null
          role?: string
          stripe_customer_id?: string | null
          subscription_period_end?: string | null
          subscription_status?: string
          subscription_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          api_version: string | null
          event_id: string
          event_type: string
          failure_reason: string | null
          livemode: boolean
          payload: Json
          processed_at: string | null
          processing_status: string
          received_at: string
          retry_count: number
        }
        Insert: {
          api_version?: string | null
          event_id: string
          event_type: string
          failure_reason?: string | null
          livemode: boolean
          payload: Json
          processed_at?: string | null
          processing_status?: string
          received_at?: string
          retry_count?: number
        }
        Update: {
          api_version?: string | null
          event_id?: string
          event_type?: string
          failure_reason?: string | null
          livemode?: boolean
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          received_at?: string
          retry_count?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_session_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_session_id?: string | null
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          stripe_session_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_ai_usage: { Args: { p_user_id: string }; Returns: number }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
