import { createClient } from "./supabase/client"
import type { UserProfile, MoodEntry, Message } from "./types"

const MOOD_TO_STRING: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "terrible",
  2: "bad",
  3: "okay",
  4: "good",
  5: "great",
}

const STRING_TO_MOOD: Record<string, 1 | 2 | 3 | 4 | 5> = {
  terrible: 1,
  bad: 2,
  okay: 3,
  good: 4,
  great: 5,
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  if (error || !data) return null

  return {
    id: user.id,
    name: data.name,
    age: data.age,
    goals: data.goals || [],
    onboardingComplete: true,
    notificationEnabled: data.notification_enabled,
    notificationTime: data.notification_time,
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("No user logged in")

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    name: profile.name,
    age: profile.age,
    goals: profile.goals,
    notification_enabled: profile.notificationEnabled,
    notification_time: profile.notificationTime,
  })

  if (error) throw error
}

export async function getMoodEntries(): Promise<MoodEntry[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("mood_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error || !data) return []

  return data.map((entry) => ({
    id: entry.id,
    userId: entry.user_id,
    date: entry.created_at,
    mood: STRING_TO_MOOD[entry.mood] || 3,
    note: entry.note,
  }))
}

export async function saveMoodEntry(entry: MoodEntry): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("No user logged in")

  const { error } = await supabase.from("mood_entries").insert({
    user_id: user.id,
    mood: MOOD_TO_STRING[entry.mood],
    note: entry.note,
    created_at: entry.date,
  })

  if (error) throw error
}

export async function getChatMessages(): Promise<Message[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error || !data) return []

  return data.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }))
}

export async function saveChatMessage(message: Message): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("No user logged in")

  const { error } = await supabase.from("chat_messages").insert({
    user_id: user.id,
    role: message.role,
    content: message.content,
  })

  if (error) throw error
}

export async function clearChatMessages(): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("No user logged in")

  const { error } = await supabase.from("chat_messages").delete().eq("user_id", user.id)

  if (error) throw error
}

export async function getCurrentUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
