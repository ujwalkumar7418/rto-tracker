import {
  startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval,
  startOfWeek, endOfWeek, isWeekend, format, getWeek, isSameMonth
} from 'date-fns'
import type { AttendanceRecord, Holiday, UserSettings, ComplianceData, DayData, AttendanceStatus } from '../types'

export function isWorkday(date: Date, holidays: Holiday[]): boolean {
  if (isWeekend(date)) return false
  const dateStr = format(date, 'yyyy-MM-dd')
  return !holidays.some(h => h.date === dateStr)
}

export function buildDayData(
  year: number,
  month: number,
  records: AttendanceRecord[],
  holidays: Holiday[]
): DayData[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthDate = new Date(year, month - 1, 1)
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)

  // Pad to full weeks
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const recordMap = new Map(records.map(r => [r.date, r]))
  const holidayMap = new Map(holidays.map(h => [h.date, h]))

  return eachDayOfInterval({ start: calStart, end: calEnd }).map(date => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const record = recordMap.get(dateStr)
    const holiday = holidayMap.get(dateStr)
    const todayNorm = new Date(today)

    return {
      date,
      dateStr,
      status: (record?.status || (holiday ? 'holiday' : 'none')) as AttendanceStatus,
      isToday: date.getTime() === todayNorm.getTime(),
      isCurrentMonth: isSameMonth(date, monthDate),
      isWeekend: isWeekend(date),
      isHoliday: !!holiday,
      holidayName: holiday?.name,
      note: record?.note || undefined,
    }
  })
}

export function calculateMonthlyCompliance(
  year: number,
  month: number,
  records: AttendanceRecord[],
  holidays: Holiday[],
  settings: UserSettings
): ComplianceData {
  const monthDate = new Date(year, month - 1, 1)
  const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) })
  const recordMap = new Map(records.map(r => [r.date, r]))
  const holidayMap = new Map(holidays.map(h => [h.date, h]))

  let officeDays = 0, wfhDays = 0, ptoDays = 0, sickDays = 0, holidayDays = 0, workingDays = 0

  for (const day of days) {
    if (isWeekend(day)) continue
    const dateStr = format(day, 'yyyy-MM-dd')
    const isHoliday = holidayMap.has(dateStr)
    if (isHoliday) { holidayDays++; continue }
    workingDays++
    const status = recordMap.get(dateStr)?.status
    if (status === 'office') officeDays++
    else if (status === 'wfh') wfhDays++
    else if (status === 'pto') ptoDays++
    else if (status === 'sick') sickDays++
  }

  let required: number
  if (settings.compliance_mode === 'monthly' && settings.required_days_per_month != null) {
    required = settings.required_days_per_month
  } else {
    // Count workable weeks in month and multiply by weekly requirement
    const weeks = eachWeekOfInterval(
      { start: startOfMonth(monthDate), end: endOfMonth(monthDate) },
      { weekStartsOn: 1 }
    )
    required = weeks.length * settings.required_days_per_week
  }

  const percentage = required > 0 ? Math.min(100, Math.round((officeDays / required) * 100)) : 100

  return {
    period: format(monthDate, 'MMMM yyyy'),
    required,
    actual: officeDays,
    percentage,
    isCompliant: officeDays >= required,
    officeDays,
    wfhDays,
    ptoDays,
    sickDays,
    holidayDays,
    workingDays,
  }
}

export function calculateWeeklyCompliance(
  year: number,
  month: number,
  records: AttendanceRecord[],
  holidays: Holiday[],
  settings: UserSettings
): Array<ComplianceData & { weekLabel: string; weekNumber: number }> {
  const monthDate = new Date(year, month - 1, 1)
  const weeks = eachWeekOfInterval(
    { start: startOfMonth(monthDate), end: endOfMonth(monthDate) },
    { weekStartsOn: 1 }
  )
  const recordMap = new Map(records.map(r => [r.date, r]))
  const holidayMap = new Map(holidays.map(h => [h.date, h]))

  return weeks.map(weekStart => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    let officeDays = 0, wfhDays = 0, ptoDays = 0, sickDays = 0, holidayDays = 0, workingDays = 0

    for (const day of days) {
      if (isWeekend(day)) continue
      const dateStr = format(day, 'yyyy-MM-dd')
      if (holidayMap.has(dateStr)) { holidayDays++; continue }
      workingDays++
      const status = recordMap.get(dateStr)?.status
      if (status === 'office') officeDays++
      else if (status === 'wfh') wfhDays++
      else if (status === 'pto') ptoDays++
      else if (status === 'sick') sickDays++
    }

    const required = settings.required_days_per_week
    const percentage = required > 0 ? Math.min(100, Math.round((officeDays / required) * 100)) : 100

    return {
      period: `Week of ${format(weekStart, 'MMM d')}`,
      weekLabel: `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`,
      weekNumber: getWeek(weekStart),
      required,
      actual: officeDays,
      percentage,
      isCompliant: officeDays >= required,
      officeDays,
      wfhDays,
      ptoDays,
      sickDays,
      holidayDays,
      workingDays,
    }
  })
}

export function getStreakData(records: AttendanceRecord[]): { currentStreak: number; longestStreak: number } {
  const sorted = records
    .filter(r => r.status === 'office')
    .sort((a, b) => a.date.localeCompare(b.date))

  if (!sorted.length) return { currentStreak: 0, longestStreak: 0 }

  let currentStreak = 0, longestStreak = 0, streak = 0
  const today = format(new Date(), 'yyyy-MM-dd')

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) { streak = 1 } else {
      const prev = new Date(sorted[i - 1].date)
      const curr = new Date(sorted[i].date)
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      streak = diff <= 7 ? streak + 1 : 1 // allow weekends
    }
    longestStreak = Math.max(longestStreak, streak)
    if (sorted[i].date <= today) currentStreak = streak
  }

  return { currentStreak, longestStreak }
}
