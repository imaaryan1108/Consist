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
      activities: {
        Row: {
          actor_id: string
          circle_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          target_id: string | null
          type: string
        }
        Insert: {
          actor_id: string
          circle_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          type: string
        }
        Update: {
          actor_id?: string
          circle_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      body_profiles: {
        Row: {
          arms_cm: number | null
          chest_cm: number | null
          created_at: string | null
          current_weight_kg: number
          height_cm: number
          id: string
          unit_preference: string | null
          updated_at: string | null
          user_id: string
          waist_cm: number | null
        }
        Insert: {
          arms_cm?: number | null
          chest_cm?: number | null
          created_at?: string | null
          current_weight_kg: number
          height_cm: number
          id?: string
          unit_preference?: string | null
          updated_at?: string | null
          user_id: string
          waist_cm?: number | null
        }
        Update: {
          arms_cm?: number | null
          chest_cm?: number | null
          created_at?: string | null
          current_weight_kg?: number
          height_cm?: number
          id?: string
          unit_preference?: string | null
          updated_at?: string | null
          user_id?: string
          waist_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      consist_logs: {
        Row: {
          created_at: string | null
          date: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consist_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          created_at: string | null
          exercise_name: string
          id: string
          notes: string | null
          reps: number
          rest_seconds: number | null
          sets: number
          user_id: string
          weight_kg: number | null
          workout_log_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_name: string
          id?: string
          notes?: string | null
          reps: number
          rest_seconds?: number | null
          sets: number
          user_id: string
          weight_kg?: number | null
          workout_log_id: string
        }
        Update: {
          created_at?: string | null
          exercise_name?: string
          id?: string
          notes?: string | null
          reps?: number
          rest_seconds?: number | null
          sets?: number
          user_id?: string
          weight_kg?: number | null
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          calories: number
          created_at: string | null
          date: string
          food_name: string
          id: string
          meal_type: string
          protein_g: number | null
          user_id: string
          water_ml: number | null
        }
        Insert: {
          calories: number
          created_at?: string | null
          date: string
          food_name: string
          id?: string
          meal_type: string
          protein_g?: number | null
          user_id: string
          water_ml?: number | null
        }
        Update: {
          calories?: number
          created_at?: string | null
          date?: string
          food_name?: string
          id?: string
          meal_type?: string
          protein_g?: number | null
          user_id?: string
          water_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          bonus_points: number | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          bonus_points?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          bonus_points?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pushes: {
        Row: {
          created_at: string | null
          date: string
          from_user_id: string
          id: string
          to_user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          from_user_id: string
          id?: string
          to_user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          from_user_id?: string
          id?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pushes_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pushes_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      targets: {
        Row: {
          created_at: string | null
          custom_message: string | null
          id: string
          starting_date: string
          starting_weight_kg: number
          target_date: string
          target_weight_kg: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_message?: string | null
          id?: string
          starting_date?: string
          starting_weight_kg: number
          target_date: string
          target_weight_kg: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_message?: string | null
          id?: string
          starting_date?: string
          starting_weight_kg?: number
          target_date?: string
          target_weight_kg?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          circle_id: string | null
          created_at: string | null
          current_streak: number | null
          id: string
          last_consist_date: string | null
          longest_streak: number | null
          name: string
          score: number | null
          total_days: number | null
          updated_at: string | null
        }
        Insert: {
          circle_id?: string | null
          created_at?: string | null
          current_streak?: number | null
          id: string
          last_consist_date?: string | null
          longest_streak?: number | null
          name: string
          score?: number | null
          total_days?: number | null
          updated_at?: string | null
        }
        Update: {
          circle_id?: string | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_consist_date?: string | null
          longest_streak?: number | null
          name?: string
          score?: number | null
          total_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_checkins: {
        Row: {
          arms_cm: number | null
          chest_cm: number | null
          created_at: string | null
          id: string
          user_id: string
          waist_cm: number | null
          week_start_date: string
          weight_change_kg: number | null
          weight_kg: number
        }
        Insert: {
          arms_cm?: number | null
          chest_cm?: number | null
          created_at?: string | null
          id?: string
          user_id: string
          waist_cm?: number | null
          week_start_date: string
          weight_change_kg?: number | null
          weight_kg: number
        }
        Update: {
          arms_cm?: number | null
          chest_cm?: number | null
          created_at?: string | null
          id?: string
          user_id?: string
          waist_cm?: number | null
          week_start_date?: string
          weight_change_kg?: number | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          created_at: string | null
          date: string
          duration_minutes: number | null
          id: string
          muscle_group: string | null
          notes: string | null
          total_exercises: number | null
          user_id: string
          workout_type: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          duration_minutes?: number | null
          id?: string
          muscle_group?: string | null
          notes?: string | null
          total_exercises?: number | null
          user_id: string
          workout_type?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          id?: string
          muscle_group?: string | null
          notes?: string | null
          total_exercises?: number | null
          user_id?: string
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_circle_code: { Args: never; Returns: string }
      get_circle_by_code: {
        Args: { lookup_code: string }
        Returns: {
          code: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }[]
        SetofOptions: {
          from: "*"
          to: "circles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_circle_id: { Args: never; Returns: string }
      increment_user_score: {
        Args: { points: number; user_id: string }
        Returns: undefined
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
