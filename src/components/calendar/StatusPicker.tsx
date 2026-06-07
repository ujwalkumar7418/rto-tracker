import { format } from 'date-fns'
import { X, Trash2 } from 'lucide-react'
import type { DayData, AttendanceStatus } from '../../types'
import { STATUS_CONFIG } from '../../types'

interface StatusPickerProps {
  day: DayData
  onSelect: (status: AttendanceStatus) => void
  onDelete: () => void
  onClose: () => void
}

const STATUSES: AttendanceStatus[] = ['office', 'wfh', 'pto', 'sick', 'holiday']

export default function StatusPicker({ day, onSelect, onDelete, onClose }: StatusPickerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-surface-1 border-t border-white/10 rounded-t-3xl px-4 pt-4 pb-safe-8 max-w-lg mx-auto">
          {/* Handle */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                {format(day.date, 'EEEE')}
              </p>
              <h3 className="font-display text-xl text-white">
                {format(day.date, 'MMMM d, yyyy')}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status options */}
          <div className="grid grid-cols-5 gap-2 mb-5">
            {STATUSES.map(status => {
              const config = STATUS_CONFIG[status]
              const isActive = day.status === status

              return (
                <button
                  key={status}
                  onClick={() => onSelect(status)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95 ${
                    isActive
                      ? 'ring-2 ring-offset-2 ring-offset-surface-1 scale-105'
                      : 'bg-surface-2 hover:bg-surface-3'
                  }`}
                  style={isActive ? {
                    backgroundColor: `${config.color}25`,
                    border: `1px solid ${config.color}60`,
                  } : {}}
                >
                  <span className="text-2xl">{config.emoji}</span>
                  <span className="text-[10px] font-medium text-center leading-tight" style={{ color: isActive ? config.color : '#94a3b8' }}>
                    {config.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Clear button */}
          {day.status !== 'none' && (
            <button
              onClick={onDelete}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium border border-white/5"
            >
              <Trash2 className="w-4 h-4" />
              Clear attendance
            </button>
          )}

          {/* Safe area padding for iOS */}
          <div className="h-2" />
        </div>
      </div>
    </>
  )
}
