import { useState, useEffect, useMemo } from 'react'
import { format, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useStore } from '../../store'
import { buildDayData } from '../../lib/compliance'
import { STATUS_CONFIG } from '../../types'
import type { DayData, AttendanceStatus } from '../../types'
import DayCell from './DayCell'
import StatusPicker from './StatusPicker'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarView() {
  const {
    currentYear, currentMonth, setCurrentMonth,
    attendanceRecords, holidays, settings,
    fetchMonthData, upsertAttendance, deleteAttendance,
    loading
  } = useStore()

  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)

  useEffect(() => {
    fetchMonthData(currentYear, currentMonth)
  }, [currentYear, currentMonth])

  const days = useMemo(() =>
    buildDayData(currentYear, currentMonth, attendanceRecords, holidays),
    [currentYear, currentMonth, attendanceRecords, holidays]
  )

  const navigate = (dir: 1 | -1) => {
    const d = addMonths(new Date(currentYear, currentMonth - 1), dir)
    setCurrentMonth(d.getFullYear(), d.getMonth() + 1)
  }

  const goToday = () => {
    const now = new Date()
    setCurrentMonth(now.getFullYear(), now.getMonth() + 1)
  }

  const handleStatusSelect = async (status: AttendanceStatus) => {
    if (!selectedDay) return
    await upsertAttendance(selectedDay.dateStr, status)
    setSelectedDay(prev => prev ? { ...prev, status } : null)
    setTimeout(() => setSelectedDay(null), 200)
  }

  const handleDelete = async () => {
    if (!selectedDay) return
    await deleteAttendance(selectedDay.dateStr)
    setSelectedDay(null)
  }

  // Status legend counts
  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = { office: 0, wfh: 0, pto: 0, sick: 0, holiday: 0, none: 0 }
    days.filter(d => d.isCurrentMonth).forEach(d => { c[d.status]++ })
    return c
  }, [days])

  const monthDate = new Date(currentYear, currentMonth - 1)
  const isCurrentMonth = format(new Date(), 'yyyy-MM') === format(monthDate, 'yyyy-MM')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="font-display text-2xl text-white tracking-tight">
              {format(monthDate, 'MMMM')}
            </h2>
            <p className="text-slate-400 text-sm font-mono">{format(monthDate, 'yyyy')}</p>
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentMonth && (
              <button
                onClick={goToday}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 text-slate-300 text-xs font-medium hover:bg-surface-4 transition-colors"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Today
              </button>
            )}
            <div className="flex gap-1">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-xl bg-surface-3 flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-4 transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="w-9 h-9 rounded-xl bg-surface-3 flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-4 transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status legend bar */}
        <div className="flex gap-3 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {(['office', 'wfh', 'pto', 'sick'] as AttendanceStatus[]).map(s => {
            const config = STATUS_CONFIG[s]
            return counts[s] > 0 ? (
              <div key={s} className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-sm">{config.emoji}</span>
                <span className="text-xs text-slate-400 font-mono">{counts[s]}</span>
              </div>
            ) : null
          })}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 px-3 overflow-y-auto">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-surface-2 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {days.map(day => (
              <DayCell
                key={day.dateStr}
                day={day}
                onSelect={setSelectedDay}
                selected={selectedDay?.dateStr === day.dateStr}
              />
            ))}
          </div>
        )}

        {/* Quick tip */}
        {!loading && (
          <div className="mt-4 mb-6 text-center">
            <p className="text-xs text-slate-600">Tap any weekday to log attendance</p>
          </div>
        )}
      </div>

      {/* Quick check-in for today */}
      {isCurrentMonth && (() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const todayData = days.find(d => d.dateStr === todayStr)
        if (!todayData || todayData.isWeekend || todayData.status !== 'none') return null
        return (
          <div className="px-4 pb-4 flex-shrink-0">
            <div className="bg-surface-2 border border-white/10 rounded-2xl p-4">
              <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">Quick check-in for today</p>
              <div className="grid grid-cols-4 gap-2">
                {(['office', 'wfh', 'pto', 'sick'] as AttendanceStatus[]).map(s => {
                  const config = STATUS_CONFIG[s]
                  return (
                    <button
                      key={s}
                      onClick={async () => {
                        await upsertAttendance(todayStr, s)
                      }}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl bg-surface-3 hover:bg-surface-4 active:scale-95 transition-all"
                      style={{ border: `1px solid ${config.color}30` }}
                    >
                      <span className="text-xl">{config.emoji}</span>
                      <span className="text-[10px] text-slate-400">{config.label.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Status picker sheet */}
      {selectedDay && (
        <StatusPicker
          day={selectedDay}
          onSelect={handleStatusSelect}
          onDelete={handleDelete}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  )
}
