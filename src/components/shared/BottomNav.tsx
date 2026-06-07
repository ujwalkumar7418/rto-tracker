import { CalendarDays, LayoutDashboard, BarChart3, Settings } from 'lucide-react'
import { useStore } from '../../store'

const NAV_ITEMS = [
  { id: 'calendar' as const, label: 'Calendar', Icon: CalendarDays },
  { id: 'dashboard' as const, label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'reports' as const, label: 'Reports', Icon: BarChart3 },
  { id: 'settings' as const, label: 'Settings', Icon: Settings },
]

export default function BottomNav() {
  const { activeView, setActiveView } = useStore()

  return (
    <nav className="flex-shrink-0 bg-surface-1/95 backdrop-blur-xl border-t border-white/10 px-2 pt-2 pb-safe-2">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeView === id
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all active:scale-90 ${
                isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              aria-label={label}
            >
              <div className={`relative p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-accent-blue/20' : ''
              }`}>
                <Icon
                  className={`w-5 h-5 transition-all ${isActive ? 'text-accent-blue' : ''}`}
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-blue rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${
                isActive ? 'text-accent-blue' : 'text-slate-500'
              }`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
