export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      circles: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string
          created_at?: string
          created_by?: string | null
        }
      }
      users: {
        Row: {
          id: string
          name: string
          circle_id: string | null
          current_streak: number
          longest_streak: number
          total_days: number
          score: number
          last_consist_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          circle_id?: string | null
          current_streak?: number
          longest_streak?: number
          total_days?: number
          score?: number
          last_consist_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          circle_id?: string | null
          current_streak?: number
          longest_streak?: number
          total_days?: number
          score?: number
          last_consist_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      consist_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          created_at?: string
        }
      }
      pushes: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          date?: string
          created_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          type: string
          actor_id: string
          target_id: string | null
          circle_id: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          actor_id: string
          target_id?: string | null
          circle_id: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          actor_id?: string
          target_id?: string | null
          circle_id?: string
          metadata?: Json | null
          created_at?: string
        }
      }
    }
  }
}
