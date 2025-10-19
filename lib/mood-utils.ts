import type { MoodEntry, ProgressSummary } from "./types"

export const MOOD_EMOJIS = {
  1: "😢",
  2: "😔",
  3: "😐",
  4: "🙂",
  5: "😊",
} as const

export const MOOD_LABELS = {
  1: "Very Sad",
  2: "Sad",
  3: "Neutral",
  4: "Happy",
  5: "Very Happy",
} as const

export function calculateAverageMood(entries: MoodEntry[]): number {
  if (entries.length === 0) return 0
  const sum = entries.reduce((acc, entry) => acc + entry.mood, 0)
  return sum / entries.length
}

export function getMoodTrend(entries: MoodEntry[]): "improving" | "stable" | "declining" {
  if (entries.length < 2) return "stable"

  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const halfPoint = Math.floor(sortedEntries.length / 2)

  const firstHalf = sortedEntries.slice(0, halfPoint)
  const secondHalf = sortedEntries.slice(halfPoint)

  const firstAvg = calculateAverageMood(firstHalf)
  const secondAvg = calculateAverageMood(secondHalf)

  const difference = secondAvg - firstAvg

  if (difference > 0.3) return "improving"
  if (difference < -0.3) return "declining"
  return "stable"
}

export function getEntriesForPeriod(
  entries: MoodEntry[],
  period: "daily" | "weekly" | "biweekly" | "monthly",
): MoodEntry[] {
  const now = Date.now()
  const periodMs = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    biweekly: 14 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
  }

  const cutoff = now - periodMs[period]
  return entries.filter((entry) => new Date(entry.date).getTime() >= cutoff)
}

export function calculateProgressSummary(
  entries: MoodEntry[],
  period: "daily" | "weekly" | "biweekly" | "monthly",
): ProgressSummary {
  const periodEntries = getEntriesForPeriod(entries, period)
  const uniqueDates = new Set(periodEntries.map((e) => e.date.split("T")[0]))

  const totalDays = {
    daily: 1,
    weekly: 7,
    biweekly: 14,
    monthly: 30,
  }

  return {
    period,
    averageMood: calculateAverageMood(periodEntries),
    moodTrend: getMoodTrend(periodEntries),
    participationDays: uniqueDates.size,
    totalDays: totalDays[period],
  }
}
