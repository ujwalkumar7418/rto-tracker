import { create } from 'zustand'
import type { AttendanceRecord, Holiday, UserSettings, User } from '../types'
import * as api from '../lib/api'

interface AppState {
  // Auth
  user: User | null
  setUser: (user: User | null) => void

  // UI
  currentYear: number
  currentMonth: number
  setCurrentMonth: (year: number, month: number) => void
  activeView: 'calendar' | 'dashboard' | 'reports' | 'settings'
  setActiveView: (view: AppState['activeView']) => void

  // Data
  attendanceRecords: AttendanceRecord[]
  holidays: Holiday[]
  settings: UserSettings | null
  loading: boolean
  error: string | null

  // Actions
  fetchMonthData: (year: number, month: number) => Promise<void>
  fetchYearData: (year: number) => Promise<void>
  upsertAttendance: (date: string, status: string, note?: string) => Promise<void>
  deleteAttendance: (date: string) => Promise<void>
  addHoliday: (date: string, name: string) => Promise<void>
  removeHoliday: (id: string) => Promise<void>
  loadSettings: () => Promise<void>
  saveSettings: (settings: Partial<UserSettings>) => Promise<void>
}

const today = new Date()

export const useStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),

  currentYear: today.getFullYear(),
  currentMonth: today.getMonth() + 1,
  setCurrentMonth: (year, month) => set({ currentYear: year, currentMonth: month }),

  activeView: 'calendar',
  setActiveView: (view) => set({ activeView: view }),

  attendanceRecords: [],
  holidays: [],
  settings: null,
  loading: false,
  error: null,

  fetchMonthData: async (year, month) => {
    const { user } = get()
    if (!user) return
    set({ loading: true, error: null })
    try {
      const [records, holidays] = await Promise.all([
        api.getAttendanceForMonth(user.id, year, month),
        api.getHolidays(user.id, year),
      ])
      set({ attendanceRecords: records, holidays, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  fetchYearData: async (year) => {
    const { user } = get()
    if (!user) return
    set({ loading: true, error: null })
    try {
      const [records, holidays] = await Promise.all([
        api.getAttendanceForYear(user.id, year),
        api.getHolidays(user.id, year),
      ])
      set({ attendanceRecords: records, holidays, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  upsertAttendance: async (date, status, note) => {
    const { user, attendanceRecords } = get()
    if (!user) return
    try {
      const record = await api.upsertAttendance(user.id, date, status as any, note)
      const existing = attendanceRecords.findIndex(r => r.date === date)
      if (existing >= 0) {
        const updated = [...attendanceRecords]
        updated[existing] = record
        set({ attendanceRecords: updated })
      } else {
        set({ attendanceRecords: [...attendanceRecords, record] })
      }
    } catch (e) {
      set({ error: String(e) })
    }
  },

  deleteAttendance: async (date) => {
    const { user, attendanceRecords } = get()
    if (!user) return
    try {
      await api.deleteAttendance(user.id, date)
      set({ attendanceRecords: attendanceRecords.filter(r => r.date !== date) })
    } catch (e) {
      set({ error: String(e) })
    }
  },

  addHoliday: async (date, name) => {
    const { user, holidays } = get()
    if (!user) return
    try {
      const holiday = await api.addHoliday(user.id, date, name)
      set({ holidays: [...holidays.filter(h => h.date !== date), holiday] })
    } catch (e) {
      set({ error: String(e) })
    }
  },

  removeHoliday: async (id) => {
    const { holidays } = get()
    try {
      await api.deleteHoliday(id)
      set({ holidays: holidays.filter(h => h.id !== id) })
    } catch (e) {
      set({ error: String(e) })
    }
  },

  loadSettings: async () => {
    const { user } = get()
    if (!user) return
    try {
      let settings = await api.getUserSettings(user.id)
      if (!settings) {
        settings = await api.upsertUserSettings(user.id, {
          required_days_per_week: 3,
          compliance_mode: 'weekly',
          reminder_enabled: false,
          reminder_time: '09:00',
        })
      }
      set({ settings })
    } catch (e) {
      set({ error: String(e) })
    }
  },

  saveSettings: async (partial) => {
    const { user } = get()
    if (!user) return
    try {
      const settings = await api.upsertUserSettings(user.id, partial as any)
      set({ settings })
    } catch (e) {
      set({ error: String(e) })
    }
  },
}))
