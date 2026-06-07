import { useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { TrendingUp, Target, Calendar, Award, Flame } from 'lucide-react'
import { useStore } from '../../store'
import { calculateMonthlyCompliance, calculateWeeklyCompliance, getStreakData } from '../../lib/compliance'
import { STATUS_CONFIG } from '../../types'
import ComplianceRing from './ComplianceRing'

export default function DashboardView() {
  const {
    currentYear, currentMonth,
    attendanceRecords, holidays, settings,
    fetchMonthData, loading
  } = useStore()

  useEffect(() => {
    fetchMonthData(currentYear, currentMonth)
  }, [currentYear, currentMonth])

  const monthlyCompliance = useMemo(() => {
    if (!settings) return null
    return calculateMonthlyCompliance(currentYear, currentMonth, attendanceRecords, holidays, settings)
  }, [currentYear, currentMonth, attendanceRecords, holidays, settings])

  const weeklyBreakdown = useMemo(() => {
    if (!settings) return []
    return calculateWeeklyCompliance(currentYear, currentMonth, attendanceRecords, holidays, settings)
  }, [currentYear, currentMonth, attendanceRecords, holidays, settings])

  const streaks = useMemo(() => getStreakData(attendanceRecords), [attendanceRecords])

  if (!settings || !monthlyCompliance) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const c = monthlyCompliance
  const monthDate = new Date(currentYear, currentMonth - 1)

  const statCards = [
    { label: 'Office Days', value: c.officeDays, emoji: STATUS_CONFIG.office.emoji, color: '#3b82f6' },
    { label: 'WFH Days', value: c.wfhDays, emoji: STATUS_CONFIG.wfh.emoji, color: '#22c55e' },
    { label: 'PTO Days', value: c.ptoDays, emoji: STATUS_CONFIG.pto.emoji, color: '#a855f7' },
    { label: 'Sick Days', value: c.sickDays, emoji: STATUS_CONFIG.sick.emoji, color: '#ef4444' },
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-4 gap-4 pb-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl text-white tracking-tight">Dashboard</h2>
        <p className="text-slate-400 text-sm">{format(monthDate, 'MMMM yyyy')}</p>
      </div>

      {/* Compliance card */}
      <div className="bg-surface-2 border border-white/10 rounded-2xl p-5 flex items-center gap-5 animate-fade-in">
        <ComplianceRing percentage={c.percentage} isCompliant={c.isCompliant} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Monthly Compliance</span>
          </div>
          <p className="font-display text-lg text-white mb-0.5">
            {c.officeDays} of {c.required} days
          </p>
          <p className="text-xs text-slate-500">
            {c.required - c.officeDays > 0
              ? `${c.required - c.officeDays} more office day${c.required - c.officeDays !== 1 ? 's' : ''} needed`
              : 'Goal achieved! 🎉'
            }
          </p>
          <div className="mt-2 bg-surface-0 rounded-lg h-1.5 overflow-hidden">
            <div
              className="h-full rounded-lg transition-all duration-700"
              style={{
                width: `${c.percentage}%`,
                backgroundColor: c.isCompliant ? '#22c55e' : c.percentage >= 75 ? '#3b82f6' : '#f59e0b'
              }}
            />
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-surface-2 border border-white/10 rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{s.emoji}</span>
              <span className="font-mono text-2xl font-bold text-white">{s.value}</span>
            </div>
            <p className="text-xs text-slate-400">{s.label}</p>
            <div className="mt-2 h-1 bg-surface-0 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${c.workingDays > 0 ? (s.value / c.workingDays) * 100 : 0}%`,
                  backgroundColor: s.color
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Streak card */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Flame className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl text-white">{streaks.currentStreak}</span>
            <span className="text-slate-400 text-sm">day streak</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Longest: {streaks.longestStreak} days</p>
        </div>
      </div>

      {/* Weekly breakdown */}
      {settings.compliance_mode === 'weekly' && (
        <div className="bg-surface-2 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-white">Weekly Breakdown</span>
          </div>
          <div className="space-y-3">
            {weeklyBreakdown.map((w, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">{w.weekLabel}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-white">{w.officeDays}/{w.required}</span>
                    <span className={`text-xs font-medium ${w.isCompliant ? 'text-green-400' : 'text-red-400'}`}>
                      {w.isCompliant ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-surface-0 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${w.percentage}%`,
                      backgroundColor: w.isCompliant ? '#22c55e' : '#3b82f6'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Working days summary */}
      <div className="bg-surface-2 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Month Summary</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-mono text-lg text-white">{c.workingDays}</p>
            <p className="text-xs text-slate-500">Working Days</p>
          </div>
          <div>
            <p className="font-mono text-lg text-white">{c.holidayDays}</p>
            <p className="text-xs text-slate-500">Holidays</p>
          </div>
          <div>
            <p className="font-mono text-lg text-white">{c.officeDays + c.wfhDays + c.ptoDays + c.sickDays}</p>
            <p className="text-xs text-slate-500">Days Logged</p>
          </div>
        </div>
      </div>
    </div>
  )
}
