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
      arbitrage_sessions: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string
          investment_id: string | null
          is_active: boolean | null
          start_time: string | null
          total_profit: number | null
          total_trades: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          investment_id?: string | null
          is_active?: boolean | null
          start_time?: string | null
          total_profit?: number | null
          total_trades?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          investment_id?: string | null
          is_active?: boolean | null
          start_time?: string | null
          total_profit?: number | null
          total_trades?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arbitrage_sessions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arbitrage_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      arbitrage_trades: {
        Row: {
          buy_exchange: string
          buy_price: number
          crypto_pair: string
          executed_at: string | null
          id: string
          profit: number
          quantity: number
          sell_exchange: string
          sell_price: number
          session_id: string
        }
        Insert: {
          buy_exchange: string
          buy_price: number
          crypto_pair: string
          executed_at?: string | null
          id?: string
          profit: number
          quantity: number
          sell_exchange: string
          sell_price: number
          session_id: string
        }
        Update: {
          buy_exchange?: string
          buy_price?: number
          crypto_pair?: string
          executed_at?: string | null
          id?: string
          profit?: number
          quantity?: number
          sell_exchange?: string
          sell_price?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arbitrage_trades_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "arbitrage_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_snapshots: {
        Row: {
          balance: number
          created_at: string
          daily_gain: number
          id: string
          snapshot_date: string
          total_earnings: number
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          daily_gain?: number
          id?: string
          snapshot_date: string
          total_earnings?: number
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          daily_gain?: number
          id?: string
          snapshot_date?: string
          total_earnings?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          crypto_type: string | null
          id: string
          status: Database["public"]["Enums"]["transaction_status"] | null
          transaction_hash: string | null
          updated_at: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          crypto_type?: string | null
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"] | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          crypto_type?: string | null
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"] | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_plans: {
        Row: {
          created_at: string | null
          daily_return_rate: number
          duration_days: number
          id: string
          is_active: boolean | null
          max_amount: number
          min_amount: number
          name: string
        }
        Insert: {
          created_at?: string | null
          daily_return_rate?: number
          duration_days?: number
          id?: string
          is_active?: boolean | null
          max_amount: number
          min_amount: number
          name: string
        }
        Update: {
          created_at?: string | null
          daily_return_rate?: number
          duration_days?: number
          id?: string
          is_active?: boolean | null
          max_amount?: number
          min_amount?: number
          name?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string | null
          daily_return: number
          end_date: string | null
          id: string
          is_active: boolean | null
          last_calculation_date: string
          plan_id: string
          start_date: string | null
          total_earned: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          daily_return: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          last_calculation_date?: string
          plan_id: string
          start_date?: string | null
          total_earned?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          daily_return?: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          last_calculation_date?: string
          plan_id?: string
          start_date?: string | null
          total_earned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "investment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_blocked: boolean | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          total_earnings: number | null
          updated_at: string | null
          user_id: string
          withdrawal_address: string | null
          withdrawal_password: string | null
          withdrawals_blocked: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id: string
          withdrawal_address?: string | null
          withdrawal_password?: string | null
          withdrawals_blocked?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string
          withdrawal_address?: string | null
          withdrawal_password?: string | null
          withdrawals_blocked?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          created_at: string | null
          id: string
          message: string
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string | null
          id?: string
          message: string
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string | null
          id?: string
          message?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          crypto_type: string | null
          id: string
          status: Database["public"]["Enums"]["transaction_status"] | null
          updated_at: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          crypto_type?: string | null
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"] | null
          updated_at?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          crypto_type?: string | null
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"] | null
          updated_at?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
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
      calculate_daily_returns: {
        Args: { _user_id: string }
        Returns: {
          amount_credited: number
          days_credited: number
          investment_id: string
        }[]
      }
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      get_my_referrals: {
        Args: Record<PropertyKey, never>
        Returns: {
          balance: number
          created_at: string
          email: string
          full_name: string
          id: string
          is_blocked: boolean
          total_earnings: number
        }[]
      }
      get_traders_ranking: {
        Args: Record<PropertyKey, never>
        Returns: {
          full_name: string
          id: string
          rank: number
          total_earnings: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      promote_to_admin: { Args: { user_email: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      transaction_status: "pending" | "approved" | "rejected" | "completed"
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
      app_role: ["admin", "user"],
      transaction_status: ["pending", "approved", "rejected", "completed"],
    },
  },
} as const
