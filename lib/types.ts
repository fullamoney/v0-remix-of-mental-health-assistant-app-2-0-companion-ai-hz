export interface UserProfile {
  id: string
  name: string
  age: number
  gender: string
  mentalIllness?: {
    condition: string
    duration: string
    feelings: string
  }
  physicalIllness?: {
    condition: string
    duration: string
    feelings: string
  }
  trauma?: {
    description: string
    timeAgo: string
    feelings: string
  }
  createdAt: string
  notificationSettings?: {
    enabled: boolean
    dailyReminderTime: string // HH:MM format (24-hour)
    lastNotificationDate?: string
  }
}

export interface MoodEntry {
  id: string
  userId: string
  mood: 1 | 2 | 3 | 4 | 5
  date: string
  timestamp: number
}

export interface ChatMessage {
  id: string
  userId: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export interface ProgressSummary {
  userId: string
  period: "daily" | "weekly" | "biweekly" | "monthly"
  averageMood: number
  moodTrend: "improving" | "stable" | "declining"
  participationDays: number
  totalDays: number
}
