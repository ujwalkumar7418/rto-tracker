import { format } from 'date-fns'
import type { DayData, AttendanceStatus } from '../../types'
import { STATUS_CONFIG } from '../../types'

interface DayCellProps {
  day: DayData
  onSelect: (day: DayData) => void
  selected: boolean
}

const statusDot: Record<AttendanceStatus, string> = {
  office:  'bg-blue-500',
  wfh:     'bg-green-500',
  pto:     'bg-purple-500',
  sick:    'bg-red-500',
  holiday: 'bg-amber-500',
  none:    'bg-transparent',
}

export default function DayCell({ day, onSelect, selected }: DayCellProps) {
  const { date, status, isToday, isCurrentMonth, isWeekend } = day
  const config = STATUS_CONFIG[status]
  const dayNum = format(date, 'd')
  const hasStatus = status !== 'none'

  const baseClasses = `
    relative flex flex-col items-center justify-start p-1 pt-1.5 rounded-xl cursor-pointer
    min-h-[52px] transition-all duration-150 select-none
    ${!isCurrentMonth ? 'opacity-25 pointer-events-none' : ''}
    ${isWeekend && isCurrentMonth ? 'opacity-50' : ''}
    ${selected ? 'ring-2 ring-white/40 scale-95' : 'active:scale-95'}
  `

  const bgClass = hasStatus && isCurrentMonth
    ? `bg-opacity-20`
    : 'bg-surface-3/40 hover:bg-surface-3'

  return (
    <button
      onClick={() => isCurrentMonth && !isWeekend && onSelect(day)}
      className={`${baseClasses} ${bgClass}`}
      style={hasStatus && isCurrentMonth ? { backgroundColor: `${config.color}22`, border: `1px solid ${config.color}44` } : {}}
      aria-label={`${format(date, 'MMMM d, yyyy')} - ${config.label}`}
    >
      {/* Today indicator */}
      {isToday && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
      )}

      {/* Day number */}
      <span
        className={`text-xs font-semibold font-mono leading-none ${
          isToday ? 'text-accent-blue' : hasStatus && isCurrentMonth ? 'text-white' : 'text-slate-400'
        }`}
      >
        {dayNum}
      </span>

      {/* Status indicator */}
      {hasStatus && isCurrentMonth && (
        <div className="mt-1.5 flex flex-col items-center gap-0.5">
          <span className="text-base leading-none">{config.emoji}</span>
        </div>
      )}

      {/* Holiday name */}
      {day.isHoliday && day.holidayName && (
        <span className="text-[8px] text-amber-400 font-medium mt-0.5 leading-tight text-center max-w-full truncate px-0.5">
          {day.holidayName}
        </span>
      )}

      {/* Status dot for no-emoji display on very small screens */}
      {!hasStatus && isCurrentMonth && !isWeekend && (
        <div className="mt-1.5 w-1 h-1 rounded-full bg-surface-4" />
      )}
    </button>
  )
}
