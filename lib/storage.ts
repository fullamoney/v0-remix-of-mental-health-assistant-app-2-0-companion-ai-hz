import type { UserProfile, MoodEntry, ChatMessage } from "./types"

const STORAGE_KEYS = {
  USER_PROFILE: "companion_ai_user_profile",
  MOOD_ENTRIES: "companion_ai_mood_entries",
  CHAT_MESSAGES: "companion_ai_chat_messages",
  ONBOARDING_COMPLETE: "companion_ai_onboarding_complete",
}

// User Profile
export function saveUserProfile(profile: UserProfile): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile))
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, "true")
  }
}

export function getUserProfile(): UserProfile | null {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
    return data ? JSON.parse(data) : null
  }
  return null
}

export function isOnboardingComplete(): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === "true"
  }
  return false
}

// Mood Entries
export function saveMoodEntry(entry: MoodEntry): void {
  if (typeof window !== "undefined") {
    const entries = getMoodEntries()
    entries.push(entry)
    localStorage.setItem(STORAGE_KEYS.MOOD_ENTRIES, JSON.stringify(entries))
  }
}

export function getMoodEntries(): MoodEntry[] {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(STORAGE_KEYS.MOOD_ENTRIES)
    return data ? JSON.parse(data) : []
  }
  return []
}

export function getTodaysMoodEntry(userId: string): MoodEntry | null {
  const entries = getMoodEntries()
  const today = new Date().toISOString().split("T")[0]
  return entries.find((entry) => entry.userId === userId && entry.date === today) || null
}

// Chat Messages
export function saveChatMessage(message: ChatMessage): void {
  if (typeof window !== "undefined") {
    const messages = getChatMessages()
    messages.push(message)
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages))
  }
}

export function getChatMessages(): ChatMessage[] {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES)
    return data ? JSON.parse(data) : []
  }
  return []
}

export function clearAllData(): void {
  if (typeof window !== "undefined") {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
  }
}
