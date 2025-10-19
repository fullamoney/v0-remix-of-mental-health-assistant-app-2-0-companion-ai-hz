"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MOOD_EMOJIS, MOOD_LABELS } from "@/lib/mood-utils"
import { saveMoodEntry, getUserProfile } from "@/lib/storage"
import type { MoodEntry } from "@/lib/types"

interface MoodSelectorProps {
  onMoodSaved?: () => void
  todaysMood?: MoodEntry | null
}

export function MoodSelector({ onMoodSaved, todaysMood }: MoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<1 | 2 | 3 | 4 | 5 | null>(todaysMood?.mood || null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveMood = () => {
    if (!selectedMood) return

    setIsSaving(true)
    const profile = getUserProfile()

    if (!profile) {
      setIsSaving(false)
      return
    }

    const entry: MoodEntry = {
      id: crypto.randomUUID(),
      userId: profile.id,
      mood: selectedMood,
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
    }

    saveMoodEntry(entry)
    setIsSaving(false)
    onMoodSaved?.()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>How are you feeling today?</CardTitle>
        <CardDescription>Select the emoji that best represents your current mood</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between gap-2">
          {([1, 2, 3, 4, 5] as const).map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                selectedMood === mood
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/50"
              }`}
              type="button"
            >
              <span className="text-4xl">{MOOD_EMOJIS[mood]}</span>
              <span className="text-xs font-medium text-center">{MOOD_LABELS[mood]}</span>
            </button>
          ))}
        </div>

        {selectedMood && (
          <div className="animate-in fade-in duration-300">
            <Button onClick={handleSaveMood} disabled={isSaving || !!todaysMood} className="w-full">
              {todaysMood ? "Mood Already Recorded Today" : isSaving ? "Saving..." : "Save Mood"}
            </Button>
            {todaysMood && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                You've already recorded your mood today. Come back tomorrow!
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
