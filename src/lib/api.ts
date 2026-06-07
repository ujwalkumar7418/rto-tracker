import { supabase } from './supabase'
import type { AttendanceRecord, Holiday, UserSettings, AttendanceStatus } from '../types'

// ─── Attendance ──────────────────────────────────────────────────────────────

export async function getAttendanceForMonth(userId: string, year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date')

  if (error) throw error
  return (data || []) as AttendanceRecord[]
}

export async function getAttendanceForYear(userId: string, year: number) {
  const start = `${year}-01-01`
  const end = `${year}-12-31`

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date')

  if (error) throw error
  return (data || []) as AttendanceRecord[]
}

export async function upsertAttendance(
  userId: string,
  date: string,
  status: AttendanceStatus,
  note?: string
): Promise<AttendanceRecord> {
  const { data, error } = await supabase
    .from('attendance_records')
    .upsert({ user_id: userId, date, status, note }, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) throw error
  return data as AttendanceRecord
}

export async function deleteAttendance(userId: string, date: string) {
  const { error } = await supabase
    .from('attendance_records')
    .delete()
    .eq('user_id', userId)
    .eq('date', date)

  if (error) throw error
}

// ─── Holidays ─────────────────────────────────────────────────────────────────

export async function getHolidays(userId: string, year?: number) {
  let query = supabase
    .from('holidays')
    .select('*')
    .eq('user_id', userId)
    .order('date')

  if (year) {
    query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as Holiday[]
}

export async function addHoliday(userId: string, date: string, name: string): Promise<Holiday> {
  const { data, error } = await supabase
    .from('holidays')
    .upsert({ user_id: userId, date, name }, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) throw error
  return data as Holiday
}

export async function deleteHoliday(id: string) {
  const { error } = await supabase.from('holidays').delete().eq('id', id)
  if (error) throw error
}

// ─── User Settings ────────────────────────────────────────────────────────────

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as UserSettings | null
}

export async function upsertUserSettings(
  userId: string,
  settings: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) throw error
  return data as UserSettings
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
