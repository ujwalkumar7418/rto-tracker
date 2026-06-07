import { format } from 'date-fns'
import type { AttendanceRecord, Holiday, UserSettings, ComplianceData } from '../types'
import { STATUS_CONFIG } from '../types'
import { calculateMonthlyCompliance } from './compliance'

// ─── CSV Export ───────────────────────────────────────────────────────────────

export function exportToCSV(
  records: AttendanceRecord[],
  holidays: Holiday[],
  period: string
) {
  const holidayMap = new Map(holidays.map(h => [h.date, h.name]))
  const rows = [
    ['Date', 'Day', 'Status', 'Holiday', 'Note'],
    ...records.map(r => {
      const d = new Date(r.date)
      return [
        r.date,
        format(d, 'EEEE'),
        STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG]?.label || r.status,
        holidayMap.get(r.date) || '',
        r.note || '',
      ]
    })
  ]

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `rto-tracker-${period}.csv`)
}

export function exportYearlyToCSV(
  records: AttendanceRecord[],
  holidays: Holiday[],
  settings: UserSettings,
  year: number
) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const rows = [
    ['Month', 'Required Days', 'Office Days', 'WFH Days', 'PTO Days', 'Sick Days', 'Holiday Days', 'Compliance %', 'Status'],
    ...months.map(m => {
      const monthRecords = records.filter(r => r.date.startsWith(`${year}-${String(m).padStart(2, '0')}`))
      const monthHolidays = holidays.filter(h => h.date.startsWith(`${year}-${String(m).padStart(2, '0')}`))
      const c = calculateMonthlyCompliance(year, m, monthRecords, monthHolidays, settings)
      return [
        format(new Date(year, m - 1), 'MMMM'),
        c.required,
        c.officeDays,
        c.wfhDays,
        c.ptoDays,
        c.sickDays,
        c.holidayDays,
        `${c.percentage}%`,
        c.isCompliant ? 'Compliant' : 'Non-Compliant',
      ]
    })
  ]

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `rto-tracker-yearly-${year}.csv`)
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

export async function exportToPDF(
  records: AttendanceRecord[],
  holidays: Holiday[],
  compliance: ComplianceData,
  period: string
) {
  // Dynamic import to keep bundle small
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(8, 12, 20)
  doc.rect(0, 0, pageW, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('RTO Tracker Report', 15, 20)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(period, 15, 30)

  // Compliance Summary
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Compliance Summary', 15, 55)

  const summaryData = [
    ['Required Office Days', String(compliance.required)],
    ['Actual Office Days', String(compliance.officeDays)],
    ['WFH Days', String(compliance.wfhDays)],
    ['PTO Days', String(compliance.ptoDays)],
    ['Sick Days', String(compliance.sickDays)],
    ['Holiday Days', String(compliance.holidayDays)],
    ['Compliance Rate', `${compliance.percentage}%`],
    ['Status', compliance.isCompliant ? '✓ Compliant' : '✗ Non-Compliant'],
  ]

  autoTable(doc, {
    startY: 60,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold' } },
    margin: { left: 15 },
    tableWidth: 90,
  })

  // Attendance Records
  const lastY = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Daily Attendance', 15, lastY)

  const holidayMap = new Map(holidays.map(h => [h.date, h.name]))
  const tableData = records.map(r => [
    r.date,
    format(new Date(r.date), 'EEE'),
    STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG]?.label || r.status,
    holidayMap.get(r.date) || '',
    r.note || '',
  ])

  autoTable(doc, {
    startY: lastY + 5,
    head: [['Date', 'Day', 'Status', 'Holiday', 'Note']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    margin: { left: 15, right: 15 },
  })

  // Footer
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text(
      `RTO Tracker • Generated ${format(new Date(), 'PPP')} • Page ${i} of ${pages}`,
      pageW / 2, doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  doc.save(`rto-tracker-${period}.pdf`)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
