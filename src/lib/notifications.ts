export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}

export function scheduleReminderNotification(time: string) {
  // Cancel existing scheduled notification
  clearScheduledNotification()

  const [hours, minutes] = time.split(':').map(Number)
  const now = new Date()
  const scheduled = new Date()
  scheduled.setHours(hours, minutes, 0, 0)

  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1)
  }

  const delay = scheduled.getTime() - now.getTime()

  const timeoutId = window.setTimeout(() => {
    showReminderNotification()
    // Reschedule for next day
    const nextId = window.setInterval(showReminderNotification, 24 * 60 * 60 * 1000)
    localStorage.setItem('rto_notification_interval', String(nextId))
  }, delay)

  localStorage.setItem('rto_notification_timeout', String(timeoutId))
  localStorage.setItem('rto_reminder_time', time)
}

function showReminderNotification() {
  if (Notification.permission !== 'granted') return

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  new Notification('RTO Tracker Reminder', {
    body: `Don't forget to log your attendance for ${today}!`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'rto-daily-reminder',
    requireInteraction: false,
  })
}

export function clearScheduledNotification() {
  const timeoutId = localStorage.getItem('rto_notification_timeout')
  const intervalId = localStorage.getItem('rto_notification_interval')

  if (timeoutId) { window.clearTimeout(Number(timeoutId)); localStorage.removeItem('rto_notification_timeout') }
  if (intervalId) { window.clearInterval(Number(intervalId)); localStorage.removeItem('rto_notification_interval') }
}

export function initNotificationsFromStorage() {
  const enabled = localStorage.getItem('rto_reminder_enabled') === 'true'
  const time = localStorage.getItem('rto_reminder_time')
  if (enabled && time && Notification.permission === 'granted') {
    scheduleReminderNotification(time)
  }
}
