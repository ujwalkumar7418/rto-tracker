export type AttendanceStatus = 'office' | 'wfh' | 'pto' | 'sick' | 'holiday' | 'none'

export interface AttendanceRecord {
  id: string
  user_id: string
  date: string // ISO date YYYY-MM-DD
  status: AttendanceStatus
  note?: string
  created_at: string
  updated_at: string
}

export interface Holiday {
  id: string
  user_id: string
  date: string
  name: string
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  required_days_per_week: number
  required_days_per_month: number | null
  compliance_mode: 'weekly' | 'monthly'
  reminder_enabled: boolean
  reminder_time: string // HH:MM
  notification_permission: NotificationPermission
  created_at: string
  updated_at: string
}

export interface ComplianceData {
  period: string
  required: number
  actual: number
  percentage: number
  isCompliant: boolean
  officeDays: number
  wfhDays: number
  ptoDays: number
  sickDays: number
  holidayDays: number
  workingDays: number
}

export interface DayData {
  date: Date
  dateStr: string
  status: AttendanceStatus
  isToday: boolean
  isCurrentMonth: boolean
  isWeekend: boolean
  isHoliday: boolean
  holidayName?: string
  note?: string
}

export interface User {
  id: string
  email: string
  name?: string
}

export const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; ring: string; emoji: string }> = {
  office:  { label: 'In Office',    color: '#3b82f6', bg: 'bg-status-office',  ring: 'ring-blue-500',   emoji: '🏢' },
  wfh:     { label: 'Work From Home', color: '#22c55e', bg: 'bg-status-wfh',  ring: 'ring-green-500',  emoji: '🏠' },
  pto:     { label: 'PTO',          color: '#a855f7', bg: 'bg-status-pto',    ring: 'ring-purple-500', emoji: '🌴' },
  sick:    { label: 'Sick Leave',   color: '#ef4444', bg: 'bg-status-sick',   ring: 'ring-red-500',    emoji: '🤒' },
  holiday: { label: 'Holiday',      color: '#f59e0b', bg: 'bg-status-holiday',ring: 'ring-amber-500',  emoji: '🎉' },
  none:    { label: 'Not Set',      color: '#1a2438', bg: 'bg-status-none',   ring: 'ring-slate-600',  emoji: '·' },
}
