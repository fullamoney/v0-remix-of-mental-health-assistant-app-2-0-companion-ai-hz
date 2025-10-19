import type { UserProfile, MoodEntry, ChatMessage } from "./types"
import { createClient } from "./supabase/client"

const STORAGE_KEYS = {
  USER_PROFILE: "companion_ai_user_profile",
  MOOD_ENTRIES: "companion_ai_mood_entries",
  CHAT_MESSAGES: "companion_ai_chat_messages",
  ONBOARDING_COMPLETE: "companion_ai_onboarding_complete",
}

// User Profile
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (typeof window !== "undefined") {
    // Save to localStorage as fallback
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile))
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, "true")

    // Save to Supabase
    const supabase = createClient()
    const { error } = await supabase.from("profiles").upsert({
      id: profile.id,
      name: profile.name,
      created_at: profile.createdAt,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Error saving profile to Supabase:", error)
    }
  }
}

export function getUserProfile(): UserProfile | null {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
    return data ? JSON.parse(data) : null
  }
  return null
}

export async function loadUserProfileFromSupabase(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error || !data) {
    console.error("[v0] Error loading profile from Supabase:", error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    age: 0, // Not stored in Supabase for privacy
    gender: "", // Not stored in Supabase for privacy
    createdAt: data.created_at,
  }
}

export function isOnboardingComplete(): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === "true"
  }
  return false
}

// Mood Entries
export async function saveMoodEntry(entry: MoodEntry): Promise<void> {
  if (typeof window !== "undefined") {
    // Save to localStorage as fallback
    const entries = getMoodEntries()
    entries.push(entry)
    localStorage.setItem(STORAGE_KEYS.MOOD_ENTRIES, JSON.stringify(entries))

    // Save to Supabase
    const supabase = createClient()
    const { error } = await supabase.from("mood_entries").insert({
      id: entry.id,
      user_id: entry.userId,
      mood: entry.mood.toString(),
      note: entry.note || null,
      created_at: new Date(entry.timestamp).toISOString(),
    })

    if (error) {
      console.error("[v0] Error saving mood entry to Supabase:", error)
    }
  }
}

export function getMoodEntries(): MoodEntry[] {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(STORAGE_KEYS.MOOD_ENTRIES)
    return data ? JSON.parse(data) : []
  }
  return []
}

export async function loadMoodEntriesFromSupabase(userId: string): Promise<MoodEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("mood_entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error loading mood entries from Supabase:", error)
    return []
  }

  return (
    data?.map((entry) => ({
      id: entry.id,
      userId: entry.user_id,
      mood: Number.parseInt(entry.mood),
      note: entry.note || undefined,
      date: new Date(entry.created_at).toISOString().split("T")[0],
      timestamp: new Date(entry.created_at).getTime(),
    })) || []
  )
}

export function getTodaysMoodEntry(userId: string): MoodEntry | null {
  const entries = getMoodEntries()
  const today = new Date().toISOString().split("T")[0]
  return entries.find((entry) => entry.userId === userId && entry.date === today) || null
}

// Chat Messages
export async function saveChatMessage(message: ChatMessage): Promise<void> {
  if (typeof window !== "undefined") {
    // Save to localStorage as fallback
    const messages = getChatMessages()
    messages.push(message)
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages))

    // Save to Supabase
    const supabase = createClient()
    const { error } = await supabase.from("messages").insert({
      id: message.id,
      user_id: message.userId,
      role: message.role,
      content: message.content,
      created_at: new Date(message.timestamp).toISOString(),
    })

    if (error) {
      console.error("[v0] Error saving message to Supabase:", error)
    }
  }
}

export function getChatMessages(): ChatMessage[] {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES)
    return data ? JSON.parse(data) : []
  }
  return []
}

export async function loadChatMessagesFromSupabase(userId: string): Promise<ChatMessage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error loading messages from Supabase:", error)
    return []
  }

  return (
    data?.map((msg) => ({
      id: msg.id,
      userId: msg.user_id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.created_at).getTime(),
    })) || []
  )
}

export function clearAllData(): void {
  if (typeof window !== "undefined") {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
  }
}
