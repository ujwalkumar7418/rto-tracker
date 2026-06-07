import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Bell, BellOff, Target, Plus, Trash2, LogOut,
  ChevronDown, CalendarDays, Loader2, CheckCircle2
} from 'lucide-react'
import { useStore } from '../../store'
import { requestNotificationPermission, scheduleReminderNotification, clearScheduledNotification } from '../../lib/notifications'
import * as api from '../../lib/api'

export default function SettingsView() {
  const { user, settings, saveSettings, holidays, addHoliday, removeHoliday, fetchMonthData, currentYear, currentMonth } = useStore()

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  )

  // Local state for settings form
  const [complianceMode, setComplianceMode] = useState<'weekly' | 'monthly'>('weekly')
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [daysPerMonth, setDaysPerMonth] = useState(12)
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')

  // Holiday form
  const [newHolidayDate, setNewHolidayDate] = useState('')
  const [newHolidayName, setNewHolidayName] = useState('')
  const [addingHoliday, setAddingHoliday] = useState(false)

  useEffect(() => {
    if (settings) {
      setComplianceMode(settings.compliance_mode as 'weekly' | 'monthly')
      setDaysPerWeek(settings.required_days_per_week)
      setDaysPerMonth(settings.required_days_per_month || 12)
      setReminderEnabled(settings.reminder_enabled)
      setReminderTime(settings.reminder_time)
    }
  }, [settings])

  useEffect(() => {
    fetchMonthData(currentYear, currentMonth)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSettings({
        compliance_mode: complianceMode,
        required_days_per_week: daysPerWeek,
        required_days_per_month: complianceMode === 'monthly' ? daysPerMonth : null,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderTime,
      })

      // Handle notifications
      if (reminderEnabled) {
        if (notifPerm !== 'granted') {
          const perm = await requestNotificationPermission()
          setNotifPerm(perm)
          if (perm === 'granted') {
            scheduleReminderNotification(reminderTime)
            localStorage.setItem('rto_reminder_enabled', 'true')
          }
        } else {
          scheduleReminderNotification(reminderTime)
          localStorage.setItem('rto_reminder_enabled', 'true')
        }
      } else {
        clearScheduledNotification()
        localStorage.setItem('rto_reminder_enabled', 'false')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleAddHoliday = async () => {
    if (!newHolidayDate || !newHolidayName) return
    setAddingHoliday(true)
    try {
      await addHoliday(newHolidayDate, newHolidayName)
      setNewHolidayDate('')
      setNewHolidayName('')
    } finally {
      setAddingHoliday(false)
    }
  }

  const handleSignOut = async () => {
    clearScheduledNotification()
    await api.signOut()
    window.location.reload()
  }

  const yearHolidays = holidays.sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-4 gap-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-white tracking-tight">Settings</h2>
          <p className="text-slate-400 text-sm truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {/* Compliance settings */}
      <div className="bg-surface-2 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Compliance Requirements</span>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-surface-0 rounded-xl p-1 mb-4">
          {(['weekly', 'monthly'] as const).map(m => (
            <button
              key={m}
              onClick={() => setComplianceMode(m)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                complianceMode === m ? 'bg-surface-3 text-white' : 'text-slate-400'
              }`}
            >
              {m === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>

        {complianceMode === 'weekly' ? (
          <div>
            <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Required office days per week</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setDaysPerWeek(n)}
                  className={`flex-1 py-3 rounded-xl text-sm font-mono font-bold transition-all ${
                    daysPerWeek === n
                      ? 'bg-accent-blue text-white shadow-glow-blue'
                      : 'bg-surface-3 text-slate-400 hover:text-white hover:bg-surface-4'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Required office days per month</label>
            <div className="flex items-center gap-3 bg-surface-3 rounded-xl px-4 py-3">
              <button
                onClick={() => setDaysPerMonth(Math.max(1, daysPerMonth - 1))}
                className="w-8 h-8 rounded-lg bg-surface-4 text-white flex items-center justify-center font-bold text-lg leading-none"
              >−</button>
              <span className="flex-1 text-center font-mono text-2xl text-white font-bold">{daysPerMonth}</span>
              <button
                onClick={() => setDaysPerMonth(Math.min(23, daysPerMonth + 1))}
                className="w-8 h-8 rounded-lg bg-surface-4 text-white flex items-center justify-center font-bold text-lg leading-none"
              >+</button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-surface-2 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Daily Reminder</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-white">Enable reminder</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {notifPerm === 'denied' ? '⚠ Notifications blocked in browser' :
               notifPerm === 'granted' ? '✓ Notifications allowed' :
               'Will request permission when enabled'}
            </p>
          </div>
          <button
            onClick={() => setReminderEnabled(!reminderEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              reminderEnabled ? 'bg-accent-blue' : 'bg-surface-4'
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
              reminderEnabled ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>

        {reminderEnabled && (
          <div>
            <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Reminder time</label>
            <input
              type="time"
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
              className="w-full bg-surface-3 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent-blue/40 font-mono"
            />
          </div>
        )}
      </div>

      {/* Holiday management */}
      <div className="bg-surface-2 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Holidays</span>
          <span className="ml-auto text-xs text-slate-500 font-mono">{yearHolidays.length} total</span>
        </div>

        {/* Add holiday form */}
        <div className="flex gap-2 mb-4">
          <input
            type="date"
            value={newHolidayDate}
            onChange={e => setNewHolidayDate(e.target.value)}
            className="flex-1 bg-surface-3 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent-blue/40 font-mono"
          />
          <input
            type="text"
            value={newHolidayName}
            onChange={e => setNewHolidayName(e.target.value)}
            placeholder="Holiday name"
            onKeyDown={e => e.key === 'Enter' && handleAddHoliday()}
            className="flex-1 bg-surface-3 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent-blue/40"
          />
          <button
            onClick={handleAddHoliday}
            disabled={!newHolidayDate || !newHolidayName || addingHoliday}
            className="w-10 h-10 rounded-xl bg-accent-blue disabled:opacity-40 flex items-center justify-center text-white transition-all active:scale-95 flex-shrink-0"
          >
            {addingHoliday ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {/* Holiday list */}
        {yearHolidays.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-4">No holidays added yet</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {yearHolidays.map(h => (
              <div key={h.id} className="flex items-center gap-3 py-2 px-3 bg-surface-3 rounded-xl">
                <span className="text-amber-400 font-mono text-xs flex-shrink-0">{h.date}</span>
                <span className="text-sm text-white flex-1 truncate">{h.name}</span>
                <button
                  onClick={() => removeHoliday(h.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-4 rounded-2xl font-semibold text-white transition-all active:scale-95 flex items-center justify-center gap-2 ${
          saved ? 'bg-green-500' : 'bg-accent-blue hover:bg-blue-400 shadow-glow-blue'
        }`}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
         saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> :
         'Save Settings'}
      </button>
    </div>
  )
}
