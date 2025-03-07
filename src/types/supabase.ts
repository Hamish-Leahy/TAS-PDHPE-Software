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
      runners: {
        Row: {
          id: number
          name: string
          house: string
          age_group: string
          finish_time: string | null
          position: number | null
          created_at: string
          date_of_birth: string
        }
        Insert: {
          id?: number
          name: string
          house: string
          age_group: string
          finish_time?: string | null
          position?: number | null
          created_at?: string
          date_of_birth: string
        }
        Update: {
          id?: number
          name?: string
          house?: string
          age_group?: string
          finish_time?: string | null
          position?: number | null
          created_at?: string
          date_of_birth?: string
        }
      }
      house_points: {
        Row: {
          id: number
          house: string
          points: number
          created_at: string
        }
        Insert: {
          id?: number
          house: string
          points: number
          created_at?: string
        }
        Update: {
          id?: number
          house?: string
          points?: number
          created_at?: string
        }
      }
      race_events: {
        Row: {
          id: number
          name: string
          date: string
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          date: string
          status: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          date?: string
          status?: string
          created_at?: string
        }
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
  }
}