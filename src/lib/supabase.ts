import { createClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (import.meta as any).env || {}
const supabaseUrl = env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      attendance_records: {
        Row: {
          id: string
          user_id: string
          date: string
          status: string
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['attendance_records']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['attendance_records']['Insert']>
      }
      holidays: {
        Row: {
          id: string
          user_id: string
          date: string
          name: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['holidays']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['holidays']['Insert']>
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          required_days_per_week: number
          required_days_per_month: number | null
          compliance_mode: string
          reminder_enabled: boolean
          reminder_time: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_settings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_settings']['Insert']>
      }
    }
  }
}
