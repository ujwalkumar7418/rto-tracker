import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useStore } from './store'
import { initNotificationsFromStorage } from './lib/notifications'
import AuthPage from './pages/AuthPage'
import CalendarView from './components/calendar/CalendarView'
import DashboardView from './components/dashboard/DashboardView'
import ReportsView from './components/reports/ReportsView'
import SettingsView from './components/settings/SettingsView'
import BottomNav from './components/shared/BottomNav'

export default function App() {
  const { user, setUser, loadSettings, activeView } = useStore()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email!, name: session.user.user_metadata?.name })
      }
      setAuthChecked(true)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email!, name: session.user.user_metadata?.name })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      loadSettings()
      initNotificationsFromStorage()
    }
  }, [user])

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AuthPage onAuth={() => {}} />
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-surface-0 overflow-hidden">
      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        {activeView === 'calendar' && <CalendarView />}
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'reports' && <ReportsView />}
        {activeView === 'settings' && <SettingsView />}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}
