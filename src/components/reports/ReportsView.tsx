import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { Download, FileText, TableProperties, ChevronDown, BarChart3 } from 'lucide-react'
import { useStore } from '../../store'
import { calculateMonthlyCompliance } from '../../lib/compliance'
import { exportToCSV, exportYearlyToCSV, exportToPDF } from '../../lib/exports'

export default function ReportsView() {
  const {
    currentYear, attendanceRecords, holidays, settings,
    fetchYearData, loading
  } = useStore()

  const [exporting, setExporting] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    fetchYearData(currentYear)
  }, [currentYear])

  const yearlyData = useMemo(() => {
    if (!settings) return []
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const monthRecords = attendanceRecords.filter(r => r.date.startsWith(`${currentYear}-${String(m).padStart(2, '0')}`))
      const monthHolidays = holidays.filter(h => h.date.startsWith(`${currentYear}-${String(m).padStart(2, '0')}`))
      return {
        month: m,
        label: format(new Date(currentYear, i), 'MMM'),
        fullLabel: format(new Date(currentYear, i), 'MMMM'),
        ...calculateMonthlyCompliance(currentYear, m, monthRecords, monthHolidays, settings)
      }
    })
  }, [currentYear, attendanceRecords, holidays, settings])

  const selectedMonthRecords = attendanceRecords.filter(r =>
    r.date.startsWith(`${currentYear}-${String(selectedMonth).padStart(2, '0')}`)
  )
  const selectedMonthHolidays = holidays.filter(h =>
    h.date.startsWith(`${currentYear}-${String(selectedMonth).padStart(2, '0')}`)
  )

  const handleExportMonthCSV = async () => {
    setExporting('month-csv')
    try {
      exportToCSV(selectedMonthRecords, selectedMonthHolidays, `${currentYear}-${String(selectedMonth).padStart(2, '0')}`)
    } finally { setExporting(null) }
  }

  const handleExportYearCSV = async () => {
    if (!settings) return
    setExporting('year-csv')
    try {
      exportYearlyToCSV(attendanceRecords, holidays, settings, currentYear)
    } finally { setExporting(null) }
  }

  const handleExportMonthPDF = async () => {
    if (!settings) return
    setExporting('month-pdf')
    try {
      const compliance = yearlyData.find(d => d.month === selectedMonth)
      if (!compliance) return
      const period = format(new Date(currentYear, selectedMonth - 1), 'MMMM-yyyy').toLowerCase()
      await exportToPDF(selectedMonthRecords, selectedMonthHolidays, compliance, period)
    } finally { setExporting(null) }
  }

  const totalOffice = yearlyData.reduce((s, d) => s + d.officeDays, 0)
  const compliantMonths = yearlyData.filter(d => d.month <= new Date().getMonth() + 1 && d.isCompliant).length
  const maxBar = Math.max(...yearlyData.map(d => d.officeDays), 1)

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-4 gap-4 pb-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl text-white tracking-tight">Reports</h2>
        <p className="text-slate-400 text-sm">{currentYear} Overview</p>
      </div>

      {/* Year summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-2 border border-white/10 rounded-xl p-4">
          <p className="font-mono text-2xl text-white font-bold">{totalOffice}</p>
          <p className="text-xs text-slate-400 mt-1">Total Office Days</p>
        </div>
        <div className="bg-surface-2 border border-white/10 rounded-xl p-4">
          <p className="font-mono text-2xl text-white font-bold">{compliantMonths}<span className="text-slate-500 text-lg">/12</span></p>
          <p className="text-xs text-slate-400 mt-1">Compliant Months</p>
        </div>
      </div>

      {/* Yearly bar chart */}
      <div className="bg-surface-2 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Office Days by Month</span>
        </div>
        <div className="flex items-end gap-1 h-24">
          {yearlyData.map(d => {
            const height = d.officeDays > 0 ? Math.max(8, (d.officeDays / maxBar) * 88) : 4
            const isFuture = d.month > new Date().getMonth() + 1
            return (
              <div
                key={d.month}
                className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                onClick={() => setSelectedMonth(d.month)}
              >
                <div className="w-full flex items-end justify-center" style={{ height: 88 }}>
                  <div
                    className="w-full rounded-t-md transition-all duration-300"
                    style={{
                      height,
                      backgroundColor: isFuture ? 'rgba(255,255,255,0.05)' :
                        d.isCompliant ? '#22c55e' : d.officeDays > 0 ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                      opacity: selectedMonth === d.month ? 1 : 0.7,
                      outline: selectedMonth === d.month ? '2px solid rgba(255,255,255,0.3)' : 'none',
                      outlineOffset: '1px',
                    }}
                  />
                </div>
                <span className={`text-[9px] font-mono ${selectedMonth === d.month ? 'text-white' : 'text-slate-500'}`}>
                  {d.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Monthly compliance list */}
      <div className="bg-surface-2 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <span className="text-sm font-medium text-white">Monthly Breakdown</span>
        </div>
        {yearlyData.map(d => {
          const isFuture = d.month > new Date().getMonth() + 1
          return (
            <div
              key={d.month}
              className={`flex items-center px-4 py-3 border-b border-white/5 last:border-0 cursor-pointer transition-colors ${
                selectedMonth === d.month ? 'bg-surface-3' : 'hover:bg-surface-3/50'
              }`}
              onClick={() => setSelectedMonth(d.month)}
            >
              <div className="w-10 flex-shrink-0">
                <span className="text-sm font-medium text-slate-300">{d.label}</span>
              </div>
              <div className="flex-1 mx-3">
                <div className="h-1.5 bg-surface-0 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: isFuture ? '0%' : `${d.percentage}%`,
                      backgroundColor: d.isCompliant ? '#22c55e' : '#3b82f6',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono text-xs text-white">{d.officeDays}/{d.required}</span>
                {!isFuture && (
                  <span className={`text-xs ${d.isCompliant ? 'text-green-400' : d.officeDays > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {d.isCompliant ? '✓' : d.officeDays > 0 ? '~' : '–'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Export section */}
      <div className="bg-surface-2 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Export Data</span>
        </div>

        {/* Month selector */}
        <div className="relative mb-4">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="w-full bg-surface-3 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent-blue/40"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>
                {format(new Date(currentYear, i), 'MMMM yyyy')}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={handleExportMonthCSV}
            disabled={!!exporting}
            className="flex items-center justify-center gap-2 py-3 bg-surface-3 hover:bg-surface-4 border border-white/10 rounded-xl text-sm text-white transition-all active:scale-95 disabled:opacity-50"
          >
            <TableProperties className="w-4 h-4 text-green-400" />
            Monthly CSV
          </button>
          <button
            onClick={handleExportMonthPDF}
            disabled={!!exporting}
            className="flex items-center justify-center gap-2 py-3 bg-surface-3 hover:bg-surface-4 border border-white/10 rounded-xl text-sm text-white transition-all active:scale-95 disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-red-400" />
            Monthly PDF
          </button>
        </div>

        <button
          onClick={handleExportYearCSV}
          disabled={!!exporting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-surface-3 hover:bg-surface-4 border border-white/10 rounded-xl text-sm text-white transition-all active:scale-95 disabled:opacity-50"
        >
          <TableProperties className="w-4 h-4 text-blue-400" />
          Full Year CSV ({currentYear})
        </button>
      </div>
    </div>
  )
}
