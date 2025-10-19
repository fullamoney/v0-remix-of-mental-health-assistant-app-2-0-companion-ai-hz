import { getUserProfile, saveUserProfile } from "./storage"

const NOTIFICATION_STORAGE_KEY = "companion_ai_notification_permission"

export interface NotificationSettings {
  enabled: boolean
  dailyReminderTime: string // HH:MM format (24-hour)
  lastNotificationDate?: string
}

// Check if browser supports notifications
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission | null {
  if (!isNotificationSupported()) return null
  return Notification.permission
}

// Request notification permission from user
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.log("[v0] Notifications not supported in this browser")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission === "denied") {
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    const granted = permission === "granted"

    if (granted) {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, "granted")
    }

    return granted
  } catch (error) {
    console.error("[v0] Error requesting notification permission:", error)
    return false
  }
}

// Show a notification
export function showNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return null
  }

  try {
    const notification = new Notification(title, {
      icon: "/buddy-logo.png",
      badge: "/buddy-logo.png",
      ...options,
    })

    // Handle notification click
    notification.onclick = () => {
      window.focus()
      notification.close()
      if (options?.data?.url) {
        window.location.href = options.data.url
      }
    }

    return notification
  } catch (error) {
    console.error("[v0] Error showing notification:", error)
    return null
  }
}

// Show daily mood reminder notification
export function showDailyMoodReminder(): void {
  const profile = getUserProfile()
  if (!profile) return

  showNotification("Time to check in with Buddy AI! 😊", {
    body: "How are you feeling today? Log your mood and track your progress.",
    tag: "daily-mood-reminder",
    requireInteraction: false,
    data: {
      url: "/dashboard",
    },
  })

  // Update last notification date
  if (profile.notificationSettings) {
    profile.notificationSettings.lastNotificationDate = new Date().toISOString().split("T")[0]
    saveUserProfile(profile)
  }
}

// Check if we should show today's notification
export function shouldShowDailyNotification(): boolean {
  const profile = getUserProfile()
  if (!profile?.notificationSettings?.enabled) return false

  const today = new Date().toISOString().split("T")[0]
  const lastNotificationDate = profile.notificationSettings.lastNotificationDate

  // Don't show if already shown today
  if (lastNotificationDate === today) return false

  // Check if it's time to show the notification
  const now = new Date()
  const [hours, minutes] = profile.notificationSettings.dailyReminderTime.split(":").map(Number)

  const reminderTime = new Date()
  reminderTime.setHours(hours, minutes, 0, 0)

  // Show notification if current time is past reminder time
  return now >= reminderTime
}

// Set up daily notification check
export function setupDailyNotifications(): void {
  if (!isNotificationSupported()) return

  // Check every minute if we should show the notification
  const checkInterval = setInterval(() => {
    if (shouldShowDailyNotification()) {
      showDailyMoodReminder()
    }
  }, 60000) // Check every minute

  // Initial check
  if (shouldShowDailyNotification()) {
    showDailyMoodReminder()
  }

  // Clean up on page unload
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      clearInterval(checkInterval)
    })
  }
}

// Enable notifications for user
export async function enableNotifications(reminderTime = "09:00"): Promise<boolean> {
  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) return false

  const profile = getUserProfile()
  if (!profile) return false

  profile.notificationSettings = {
    enabled: true,
    dailyReminderTime: reminderTime,
  }

  saveUserProfile(profile)
  setupDailyNotifications()

  return true
}

// Disable notifications for user
export function disableNotifications(): void {
  const profile = getUserProfile()
  if (!profile) return

  if (profile.notificationSettings) {
    profile.notificationSettings.enabled = false
  }

  saveUserProfile(profile)
}

// Update notification time
export function updateNotificationTime(time: string): void {
  const profile = getUserProfile()
  if (!profile?.notificationSettings) return

  profile.notificationSettings.dailyReminderTime = time
  saveUserProfile(profile)
}
